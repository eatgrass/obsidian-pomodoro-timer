import { type TaskItem } from 'Tasks'
import type PomodoroTimerPlugin from 'main'
import { TFile, Keymap, MarkdownView } from 'obsidian'
import { DESERIALIZERS, POMODORO_REGEX } from 'serializer'
import {
    writable,
    type Readable,
    type Writable,
    type Unsubscriber,
} from 'svelte/store'
import { extractTaskComponents } from 'utils'

export type TaskTrackerState = {
    task?: TaskItem
    file?: TFile
    pinned: boolean
}

type TaskTrackerStore = Readable<TaskTrackerState>

const DEFAULT_TRACKER_STATE: TaskTrackerState = {
    pinned: false,
}

export default class TaskTracker implements TaskTrackerStore {
    private plugin

    private state: TaskTrackerState

    private store: Writable<TaskTrackerState>

    public subscribe

    private unsubscribers: Unsubscriber[] = []

    constructor(plugin: PomodoroTimerPlugin) {
        this.plugin = plugin
        this.state = DEFAULT_TRACKER_STATE
        this.store = writable(this.state)
        this.subscribe = this.store.subscribe
        this.unsubscribers.push(
            this.store.subscribe((state) => {
                this.state = state
            }),
        )

        plugin.registerEvent(
            //loadtasks on file change
            plugin.app.workspace.on('active-leaf-change', () => {
                let file = this.plugin.app.workspace.getActiveFile()
                if (!this.state.pinned) {
                    this.store.update((state) => {
                        if (state.file?.path !== file?.path) {
                            state.task = undefined
                        }
                        state.file = file ?? state.file
                        return state
                    })
                }
            }),
        )

        plugin.app.workspace.onLayoutReady(() => {
            let file = this.plugin.app.workspace.getActiveFile()
            this.store.update((state) => {
                state.file = file ?? state.file
                return state
            })
        })
    }

    get task() {
        return this.state.task
    }

    get file() {
        return this.state.file
    }

    public togglePinned() {
        this.store.update((state) => {
            state.pinned = !state.pinned
            return state
        })
    }

    public async active(task: TaskItem) {
        await this.ensureBlockId(task)
        this.store.update((state) => {
            state.task = task
            return state
        })
    }

    public setTaskName(name: string) {
        this.store.update((state) => {
            if (state.task) {
                state.task.name = name
            }
            return state
        })
    }

    private async ensureBlockId(task: TaskItem) {
        let file = this.plugin.app.vault.getAbstractFileByPath(task.path)
        if (file && file instanceof TFile) {
            const f = file as TFile
            if (f.extension === 'md') {
                let content = await this.plugin.app.vault.read(f)
                let lines = content.split('\n')
                if (lines.length > task.line) {
                    let line = lines[task.line]
                    if (task.blockLink) {
                        if (!line.endsWith(task.blockLink)) {
                            // block id mismatch?
                            lines[task.line] += `${task.blockLink}`
                            this.plugin.app.vault.modify(f, lines.join('\n'))
                            return
                        }
                    } else {
                        // generate block id
                        let blockId = this.createBlockId()
                        task.blockLink = blockId
                        lines[task.line] += `${blockId}`
                        this.plugin.app.vault.modify(f, lines.join('\n'))
                    }
                }
            }
        }
    }

    private createBlockId() {
        return ` ^${Math.random().toString(36).substring(2, 6)}`
    }

    public clear() {
        this.store.update((state) => {
            state.task = undefined
            return state
        })
    }

    public openFile(event: MouseEvent) {
        if (this.state.file) {
            const leaf = this.plugin.app.workspace.getLeaf(
                Keymap.isModEvent(event),
            )
            leaf.openFile(this.state.file)
        }
    }

    public openTask = (event: MouseEvent, task: TaskItem) => {
        let file = this.plugin.app.vault.getAbstractFileByPath(task.path)
        if (file && file instanceof TFile && task.line >= 0) {
            const leaf = this.plugin.app.workspace.getLeaf(
                Keymap.isModEvent(event),
            )
            leaf.openFile(file, { eState: { line: task.line } })
        }
    }

    get pinned() {
        return this.state.pinned
    }

    public finish() {}

    public destory() {
        for (let unsub of this.unsubscribers) {
            unsub()
        }
    }

    public sync(task: TaskItem) {
        if (
            this.state.task?.blockLink &&
            this.state.task.blockLink === task.blockLink
        ) {
            this.store.update((state) => {
                if (state.task) {
                    let name = state.task.name
                    state.task = { ...task, name }
                }
                return state
            })
        }
    }

    public async updateActual() {
        // update task item
        if (
            this.plugin.getSettings().enableTaskTracking &&
            this.task &&
            this.task.blockLink
        ) {
            let file = this.plugin.app.vault.getAbstractFileByPath(
                this.task.path,
            )
            if (file && file instanceof TFile) {
                let f = file as TFile
                this.store.update((state) => {
                    if (state.task) {
                        if (state.task.actual >= 0) {
                            state.task.actual += 1
                        } else {
                            state.task.actual = 1
                        }
                    }
                    return state
                })
                await this.incrTaskActual(this.task.blockLink, f)
            }
        }
    }

    private async incrTaskActual(blockLink: string, file: TFile) {
        const format = this.plugin.getSettings().taskFormat

        if (file.extension !== 'md') {
            return
        }

        let metadata = this.plugin.app.metadataCache.getFileCache(file)
        let content = await this.plugin.app.vault.read(file)

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
                        let [actual, expected] = pomodoros.split('/')
                        actual = actual || '0'
                        let text = `🍅:: ${parseInt(actual) + 1}`
                        if (expected !== undefined) {
                            text += `/${expected.trim()}`
                        }
                        line = line
                            .replace(/🍅:: *(\d* *\/? *\d* *)/, text)
                            .trim()
                    } else {
                        let detail = DESERIALIZERS[format].deserialize(
                            components.body,
                        )
                        line = line.replace(
                            detail.description,
                            `${detail.description} [🍅:: 1]`,
                        )
                    }

                    lines[lineNr] = line

                    await this.plugin.app.vault.modify(file, lines.join('\n'))

                    this.plugin.app.metadataCache.trigger(
                        'changed',
                        file,
                        content,
                        metadata,
                    )

                    this.plugin.app.workspace
                        .getActiveViewOfType(MarkdownView)
                        ?.load()
                    break
                }
            }
        }
    }
}
