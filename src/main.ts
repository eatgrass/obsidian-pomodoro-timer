import { TimerView, VIEW_TYPE_TIMER } from 'TimerView'
import type moment from 'moment'
import {
    App,
    Editor,
    MarkdownView,
    Modal,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting,
    WorkspaceLeaf,
} from 'obsidian'

declare global {
    interface Window {
        moment: typeof moment
    }
}
export default class PomodoroTimerPlugin extends Plugin {
    async onload() {
        await this.loadSettings()
        this.registerView(VIEW_TYPE_TIMER, (leaf) => new TimerView(leaf))
        this.addRibbonIcon('clock', 'Toggle timer panel', () => {
            this.activateView()
        })
    }

    onunload() {}

    async loadSettings() {}

    async saveSettings() {}

    async activateView() {
        let { workspace } = this.app

        let leaf: WorkspaceLeaf | null = null
        let leaves = workspace.getLeavesOfType(VIEW_TYPE_TIMER)

        if (leaves.length > 0) {
            leaf = leaves[0]
        } else {
            leaf = workspace.getRightLeaf(false)
            await leaf.setViewState({
                type: VIEW_TYPE_TIMER,
                active: true,
            })
        }

        workspace.revealLeaf(leaf)
    }
}
