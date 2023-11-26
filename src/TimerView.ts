import { ItemView, WorkspaceLeaf } from 'obsidian'
import Timer from './Timer.svelte'

export const VIEW_TYPE_TIMER = 'timer-view'

export class TimerView extends ItemView {
    timer: Timer | null = null

    constructor(leaf: WorkspaceLeaf) {
        super(leaf)
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
            props: {},
        })
    }

    async onClose() {}
}
