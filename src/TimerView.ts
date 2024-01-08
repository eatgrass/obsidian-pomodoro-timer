import { ItemView, WorkspaceLeaf } from 'obsidian'
import TimerComponent from './TimerViewComponent.svelte'
import PomodoroTimerPlugin from 'main'

export const VIEW_TYPE_TIMER = 'timer-view'

export class TimerView extends ItemView {
    private component?: TimerComponent
    private plugin

    constructor(plugin: PomodoroTimerPlugin, leaf: WorkspaceLeaf) {
        super(leaf)
        this.plugin = plugin
        this.icon = 'timer'
    }

    getViewType(): string {
        return VIEW_TYPE_TIMER
    }

    getDisplayText(): string {
        return 'Timer'
    }

    async onOpen() {
        this.component = new TimerComponent({
            target: this.contentEl,
            props: {
                timer: this.plugin.timer,
				tasks: this.plugin.tasks
            },
        })
    }

    async onClose() {
        this.component?.$destroy()
    }
}
