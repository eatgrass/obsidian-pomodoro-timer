import PomodoroTimerPlugin from 'main'
import { type CachedMetadata, type TFile, type App } from 'obsidian'
import { extractTaskComponents } from 'utils'
import { writable, derived, type Readable, type Writable } from 'svelte/store'

import {
    DataviewTaskSerializer,
    DefaultTaskSerializer,
    type TaskDeserializer,
    DEFAULT_SYMBOLS,
} from 'serializer'
import type { TaskFormat } from 'Settings'
import type { Unsubscriber } from 'svelte/motion'
import { MarkdownView } from 'obsidian'

const DESERIALIZERS: Record<TaskFormat, TaskDeserializer> = {
    TASKS: new DefaultTaskSerializer(DEFAULT_SYMBOLS),
    DATAVIEW: new DataviewTaskSerializer(),
}

export type TaskItem = {
    path: string
    text: string
    fileName: string
    name: string
    status: string
    blockLink: string
    checked: boolean
    done?: string
    due?: string
    created?: string
    cancelled?: string
    scheduled?: string
    start?: string
    description: string
    priority: string
    recurrence: string
    expected: number
    actual: number
    tags: string[]
    line: number
}

export type TaskStore = {
    list: TaskItem[]
}

export default class Tasks implements Readable<TaskStore> {
    private plugin: PomodoroTimerPlugin

    private _store: Writable<TaskStore>

    public subscribe

    private unsubscribers: Unsubscriber[] = []

    private state: TaskStore = {
        list: [],
    }

    public static getDeserializer(format: TaskFormat) {
        return DESERIALIZERS[format]
    }

    constructor(plugin: PomodoroTimerPlugin) {
        this.plugin = plugin

        this._store = writable(this.state)

        this.unsubscribers.push(
            this._store.subscribe((state) => {
                this.state = state
            }),
        )

        this.unsubscribers.push(
            derived(this.plugin.tracker!, ($tracker) => {
                return $tracker.file?.path
            }).subscribe(() => {
                let file = this.plugin.tracker?.file
                if (file) {
                    this.loadFileTasks(file)
                } else {
                    this.clearTasks()
                }
            }),
        )

        this.subscribe = this._store.subscribe

        this.plugin.registerEvent(
            plugin.app.metadataCache.on(
                'changed',
                (file: TFile, content: string, cache: CachedMetadata) => {
                    if (
                        file.extension === 'md' &&
                        file == this.plugin.tracker!.file
                    ) {
                        let tasks = resolveTasks(
                            this.plugin.getSettings().taskFormat,
                            file,
                            content,
                            cache,
                        )
                        this._store.update((state) => {
                            state.list = tasks
                            return state
                        })
                    }
                },
            ),
        )
    }

    public loadFileTasks(file: TFile) {
        if (file.extension == 'md') {
            this.plugin.app.vault.cachedRead(file).then((c) => {
                let tasks = resolveTasks(
                    this.plugin.getSettings().taskFormat,
                    file,
                    c,
                    this.plugin.app.metadataCache.getFileCache(file),
                )
                this._store.update(() => ({
                    list: tasks,
                }))
            })
        } else {
            this._store.update(() => ({
                file,
                list: [],
            }))
        }
    }

    public clearTasks() {
        this._store.update(() => ({
            list: [],
        }))
    }

    public destroy() {
        for (let unsub of this.unsubscribers) {
            unsub()
        }
    }
}

const POMODORO_REGEX = new RegExp(
    '(?:(?=[^\\]]+\\])\\[|(?=[^)]+\\))\\() *🍅:: *(\\d* *\\/? *\\d*) *[)\\]](?: *,)?',
)

export async function incrTaskActual(
    format: TaskFormat,
    app: App,
    blockLink: string,
    file: TFile,
) {
    if (file.extension !== 'md') {
        return
    }

    let metadata = app.metadataCache.getFileCache(file)
    let content = await app.vault.read(file)

    if (!content || !metadata) {
        return
    }

    const lines = content.split('\n')

    for (let rawElement of metadata.listItems || []) {
        if (rawElement.task) {
            let lineNr = rawElement.position.start.line
            let line = lines[lineNr]

            const components = extractTaskComponents(line)
            if (!components) {
                continue
            }

            if (components.blockLink === blockLink) {
                const match = components.body.match(POMODORO_REGEX)
                if (match !== null) {
                    let pomodoros = match[1]
                    let [actual = '0', expected] = pomodoros.split('/')
                    let text = `🍅:: ${parseInt(actual) + 1}`
                    if (expected !== undefined) {
                        text += `/${expected.trim()}`
                    }
                    console.log(text)
                    line = line.replace(/🍅:: *(\d* *\/? *\d* *)/, text).trim()
                    console.log(line)
                    lines[lineNr] = line
                } else {
                    let detail = DESERIALIZERS[format].deserialize(
                        components.body,
                    )
                    line = line.replace(
                        detail.description,
                        `${detail.description} [🍅:: 1]`,
                    )

                    lines[lineNr] = line
                }

                app.vault.modify(file, lines.join('\n'))
                app.metadataCache.trigger('changed', file, content, metadata)

                // refresh view
                app.workspace.getActiveViewOfType(MarkdownView)?.load()
                break
            }
        }
    }
}

export function resolveTasks(
    format: TaskFormat,
    file: TFile,
    content: string,
    metadata: CachedMetadata | null,
): TaskItem[] {
    if (!content || !metadata) {
        return []
    }

    let cache: Record<number, TaskItem> = {}
    const lines = content.split('\n')
    for (let rawElement of metadata.listItems || []) {
        if (rawElement.task) {
            let lineNr = rawElement.position.start.line
            let line = lines[lineNr]

            const components = extractTaskComponents(line)
            if (!components) {
                continue
            }
            let detail = DESERIALIZERS[format].deserialize(components.body)

            let [actual = '0', expected = '0'] = detail.pomodoros.split('/')

            const dateformat = 'YYYY-MM-DD'
            let item: TaskItem = {
                text: line,
                path: file.path,
                fileName: file.name,
                name: detail.description,
                status: components.status,
                blockLink: components.blockLink,
                checked: rawElement.task != '' && rawElement.task != ' ',
                description: detail.description,
                done: detail.doneDate?.format(dateformat),
                due: detail.dueDate?.format(dateformat),
                created: detail.createdDate?.format(dateformat),
                cancelled: detail.cancelledDate?.format(dateformat),
                scheduled: detail.scheduledDate?.format(dateformat),
                start: detail.startDate?.format(dateformat),
                priority: detail.priority,
                recurrence: detail.recurrenceRule,
                expected: parseInt(expected),
                actual: parseInt(actual),
                tags: detail.tags,
                line: lineNr,
            }

            cache[lineNr] = item
        }
    }

    return Object.values(cache)
}
