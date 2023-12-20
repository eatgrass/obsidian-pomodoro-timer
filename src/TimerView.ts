import { ItemView, WorkspaceLeaf } from 'obsidian'
import TimerComponent from './TimerViewComponent.svelte'
import { store } from 'Timer'

export const VIEW_TYPE_TIMER = 'timer-view'

export class TimerView extends ItemView {
    private component?: TimerComponent

    constructor(leaf: WorkspaceLeaf) {
        super(leaf)
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
                timer: store,
            },
        })
    }

    async onClose() {
        this.component?.$destroy()
    }
}
