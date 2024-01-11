import type { TaskItem } from 'Tasks'
import type PomodoroTimerPlugin from 'main'
import type { TFile } from 'obsidian'
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

    public active(task: TaskItem) {
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

    public clear() {
        this.store.update((state) => {
            state.task = undefined
            return state
        })
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
}
