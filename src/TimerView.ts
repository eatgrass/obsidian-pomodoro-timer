import { ItemView, WorkspaceLeaf } from 'obsidian'
import TimerComponent from './TimerComponent.svelte'
import type PomodoroTimerPlugin from 'main'
import { store, type TimerStore } from 'TimerStore'

export const VIEW_TYPE_TIMER = 'timer-view'

export class TimerView extends ItemView {
    private plugin: PomodoroTimerPlugin

    static timer: TimerStore = store

    static component: TimerComponent | null

    constructor(leaf: WorkspaceLeaf, plugin: PomodoroTimerPlugin) {
        super(leaf)
        this.plugin = plugin
    }

    getViewType(): string {
        return VIEW_TYPE_TIMER
    }

    getDisplayText(): string {
        return 'Timer'
    }

    async onOpen() {
        if (!TimerView.component) {
            TimerView.component = new TimerComponent({
                target: this.contentEl,
                props: {
                    timer: TimerView.timer,
                },
            })
        }
    }

    async onClose() {
        if (TimerView.component) {
            TimerView.component.$destroy()
            this.containerEl.empty()
            TimerView.component = null
        }
    }

    destroy() {}
}
