import PomodoroTimerPlugin from 'main'
import { type CachedMetadata, type TFile } from 'obsidian'
import { extractTaskComponents } from 'utils'
import { writable, derived, type Readable, type Writable } from 'svelte/store'

const LIST_ITEM_REGEX = /^[\s>]*(\d+\.|\d+\)|\*|-|\+)\s*(\[.{0,1}\])?\s*(.*)$/mu
import {
    DataviewTaskSerializer,
    DefaultTaskSerializer,
    type TaskDeserializer,
    DEFAULT_SYMBOLS,
} from 'serializer'
import type { TaskFormat } from 'Settings'
import type { Unsubscriber } from 'svelte/motion'
import * as exp from 'constants'

const serializers: Record<TaskFormat, TaskDeserializer> = {
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
    expected: string
    actual: string
    tags: string[]
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
                        let serializer =
                            serializers[this.plugin.getSettings().taskFormat]
                        let tasks = resolveTasks(
                            serializer,
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
                let serializer =
                    serializers[this.plugin.getSettings().taskFormat]
                let tasks = resolveTasks(
                    serializer,
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

function resolveTasks(
    deserializer: TaskDeserializer,
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
            let rawMatch = LIST_ITEM_REGEX.exec(line)
            if (!rawMatch) continue

            const components = extractTaskComponents(line)
            if (!components) {
                continue
            }
            let detail = deserializer.deserialize(components.body)

            let [actual = '', expected = ''] = detail.pomodoros.split('/')
            console.log(actual, expected)

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
                expected: expected,
                actual: actual,
                tags: detail.tags,
            }

            cache[lineNr] = item
        }
    }

    return Object.values(cache)
}
