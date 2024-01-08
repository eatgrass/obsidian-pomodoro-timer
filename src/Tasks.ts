import type PomodoroTimerPlugin from 'main'
import {
    MarkdownView,
    type CachedMetadata,
    type Pos,
    type TFile,
} from 'obsidian'
import { extractTags } from 'utils'
import { writable, type Readable, type Writable } from 'svelte/store'

const LIST_ITEM_REGEX = /^[\s>]*(\d+\.|\d+\)|\*|-|\+)\s*(\[.{0,1}\])?\s*(.*)$/mu

export type TaskItem = {
    file: string
    symbol: string
    name: string
    tags: string[]
    line: number
    lineCount: number
    list: number
    position: Pos
    blockId?: string
    parent?: number
    status: string
    checked: boolean
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
                        let tasks = resolveTasks(file, content, cache)
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
                let tasks = resolveTasks(
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
    file: TFile,
    content: string,
    metadata: CachedMetadata | null,
): TaskItem[] {
    if (!content || !metadata) {
        return []
    }

    let cache: Record<number, TaskItem> = {}
    const lines = content.split('\n')
    // Place all of the values in the cache before resolving children & metadata relationships.
    for (let rawElement of metadata.listItems || []) {
        if (rawElement.task) {
            // Match on the first line to get the symbol and first line of text.
            let rawMatch = LIST_ITEM_REGEX.exec(
                lines[rawElement.position.start.line],
            )
            if (!rawMatch) continue

            // And then strip unnecessary spacing from the remaining lines.
            let textParts = [rawMatch[3]]
                .concat(
                    lines.slice(
                        rawElement.position.start.line + 1,
                        rawElement.position.end.line + 1,
                    ),
                )
                .map((t) => t.trim())
            // let textWithNewline = textParts.join('\n')
            let textNoNewline = textParts.join(' ')

            // Find the list that we are a part of by line.
            let containingListId = (metadata.sections || []).findIndex(
                (s) =>
                    s.type == 'list' &&
                    s.position.start.line <= rawElement.position.start.line &&
                    s.position.end.line >= rawElement.position.start.line,
            )

            // Construct universal information about this element (before tasks).
            let item: TaskItem = {
                file: file.path,
                symbol: rawMatch[1],
                name: textNoNewline,
                tags: extractTags(textNoNewline),
                line: rawElement.position.start.line,
                lineCount:
                    rawElement.position.end.line -
                    rawElement.position.start.line +
                    1,
                list:
                    containingListId == -1
                        ? -1
                        : (metadata.sections || [])[containingListId].position
                              .start.line,
                position: rawElement.position,
                blockId: rawElement.id,
                status: rawElement.task,
                checked: rawElement.task != '' && rawElement.task != ' ',
            }

            if (rawElement.parent >= 0 && rawElement.parent != item.line)
                item.parent = rawElement.parent

            cache[item.line] = item
        }
    }

    return Object.values(cache)
}
