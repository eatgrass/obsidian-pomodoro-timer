import type { TaskItem } from 'Tasks'
import type PomodoroTimerPlugin from 'main'
import { TFile } from 'obsidian'
import {
    writable,
    type Readable,
    type Writable,
    type Unsubscriber,
} from 'svelte/store'

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
                            lines[task.line] += ` ${task.blockLink}`
                            this.plugin.app.vault.modify(f, lines.join('\n'))
                            return
                        }
                    } else {
                        // generate block id
                        let blockId = this.createBlockId()
                        task.blockLink = blockId
                        lines[task.line] += ` ${blockId}`
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

    public openFile() {
        if (this.state.file) {
            this.plugin.app.workspace.openLinkText(this.state.file.path, '')
        }
    }

    public openTask = (task: TaskItem) => {
        let link = task.path
        if (task.blockLink) {
            link += `#${task.blockLink}`
        }
        console.log(link)
        this.plugin.app.workspace.openLinkText(`${link}`, '')
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
}
