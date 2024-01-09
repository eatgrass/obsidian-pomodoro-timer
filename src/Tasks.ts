import type PomodoroTimerPlugin from 'main'
import { MarkdownView, type CachedMetadata, type TFile } from 'obsidian'
import { extractTaskComponents } from 'utils'
import { writable, type Readable, type Writable } from 'svelte/store'

const LIST_ITEM_REGEX = /^[\s>]*(\d+\.|\d+\)|\*|-|\+)\s*(\[.{0,1}\])?\s*(.*)$/mu
import {
    DataviewTaskSerializer,
    DefaultTaskSerializer,
    type TaskDeserializer,
    DEFAULT_SYMBOLS,
} from 'serializer'
import type { TaskFormat } from 'Settings'
import type { TaskDetails } from 'serializer'

const serializers: Record<TaskFormat, TaskDeserializer> = {
    TASKS: new DefaultTaskSerializer(DEFAULT_SYMBOLS),
    DATAVIEW: new DataviewTaskSerializer(),
}

export type TaskItem = {
    path: string
    text: string
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
    tags: string[]
}

export type TaskStore = {
    file?: TFile
    pinned: boolean
    list: TaskItem[]
}

export default class Tasks implements Readable<TaskStore> {
    private plugin: PomodoroTimerPlugin

    private _store: Writable<TaskStore>

    public subscribe

    private unsubscribe

    private state: TaskStore = {
        file: undefined,
        pinned: false,
        list: [],
    }

    constructor(plugin: PomodoroTimerPlugin) {
        this.plugin = plugin

        this._store = writable(this.state)
        this.unsubscribe = this._store.subscribe((state) => {
            this.state = state
        })

        this.subscribe = this._store.subscribe

        this.plugin.registerEvent(
            plugin.app.workspace.on('active-leaf-change', () => {
                if (!this.state.pinned) {
                    const file = this.getCurrentFile() || this.state.file
                    if (this.state.file != file) {
                        this.getFileTasks(file)
                    }
                }
            }),
        )
        this.plugin.registerEvent(
            plugin.app.metadataCache.on(
                'changed',
                (file: TFile, content: string, cache: CachedMetadata) => {
                    if (file.extension === 'md' && file == this.state.file) {
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

    private getFileTasks(file?: TFile) {
        if (file) {
            this.plugin.app.vault.cachedRead(file).then((c) => {
                let serializer =
                    serializers[this.plugin.getSettings().taskFormat]
                let tasks = resolveTasks(
                    serializer,
                    file,
                    c,
                    this.plugin.app.metadataCache.getFileCache(file),
                )
                this._store.update((state) => ({
                    file,
                    list: tasks,
                    pinned: state.pinned,
                    active: undefined,
                }))
            })
        } else {
            this._store.update((state) => ({
                file,
                list: [],
                pinned: state.pinned,
                active: undefined,
            }))
        }
    }

    private getCurrentFile(): TFile | undefined {
        const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView)
        if (view) {
            let file = view.file
            if (file?.extension == 'md') {
                return file
            }
        }
    }

    public togglePin() {
        this._store.update((state) => {
            state.pinned = !state.pinned
            return state
        })
    }

    public destroy() {
        this.unsubscribe()
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
            const dateformat = 'YYYY-MM-DD'
            let item: TaskItem = {
                text: line,
                path: file.path,
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
                tags: detail.tags,
            }

            cache[lineNr] = item
        }
    }

    return Object.values(cache)
}
