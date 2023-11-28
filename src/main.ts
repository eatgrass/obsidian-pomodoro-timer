import { TimerView, VIEW_TYPE_TIMER } from 'TimerView'
import type moment from 'moment'
import { Plugin, WorkspaceLeaf } from 'obsidian'
import PomodoroSettings, { type Settings } from 'Settings'
import stores from 'stores'

export default class PomodoroTimerPlugin extends Plugin {
    private settingTab?: PomodoroSettings

    async onload() {
        const settings = await this.loadData()

        // init svelte stores
        stores.plugin.set(this)

        this.settingTab = new PomodoroSettings(this, settings)
        this.addSettingTab(this.settingTab)
        this.registerView(VIEW_TYPE_TIMER, (leaf) => new TimerView(leaf, this))
        this.addRibbonIcon('clock', 'Toggle timer panel', () => {
            this.activateView()
        })
    }

    public getSettings(): Settings {
        return (
            this.settingTab?.getSettings() || PomodoroSettings.DEFAULT_SETTINGS
        )
    }

    onunload() {
    }

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
