import { ItemView, WorkspaceLeaf } from 'obsidian'
import Timer from './Timer.svelte'
import type PomodoroSettings from 'Settings'

export const VIEW_TYPE_TIMER = 'timer-view'

export class TimerView extends ItemView {
    private settings: PomodoroSettings

    timer: Timer | null = null

    constructor(leaf: WorkspaceLeaf, settings: PomodoroSettings) {
        super(leaf)
        this.settings = settings
    }

    getViewType(): string {
        return VIEW_TYPE_TIMER
    }

    getDisplayText(): string {
        return 'Timer'
    }

    async onOpen() {
        this.timer = new Timer({
            target: this.contentEl,
            props: {
                store: this.settings.store(),
            },
        })
    }

    async onClose() {}
}
