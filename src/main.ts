import { TimerView, VIEW_TYPE_TIMER } from 'TimerView'
import { Notice, Plugin, WorkspaceLeaf } from 'obsidian'
import PomodoroSettings, { type Settings } from 'Settings'
import stores from 'stores'
import StatusBar from 'StatusBarComponent.svelte'
import { store as timer, clock, clean } from 'Timer'

export default class PomodoroTimerPlugin extends Plugin {
    private settingTab?: PomodoroSettings

    async onload() {
        const settings = await this.loadData()

        // init svelte stores
        stores.plugin.set(this)

        this.settingTab = new PomodoroSettings(this, settings)
        this.addSettingTab(this.settingTab)
        this.registerView(VIEW_TYPE_TIMER, (leaf) => new TimerView(leaf))

        // ribbon
        this.addRibbonIcon('timer', 'Toggle timer panel', () => {
            this.activateView()
        })

        // status bar
        const status = this.addStatusBarItem()
        status.className = `${status.className} mod-clickable`
        new StatusBar({ target: status })

        // commands
        this.addCommand({
            id: 'toggle-timer',
            name: 'Toggle timer',
            callback: () => {
                timer.toggleTimer()
            },
        })

        this.addCommand({
            id: 'toggle-timer-panel',
            name: 'Toggle timer panel',
            callback: () => {
                let { workspace } = this.app
                let leaves = workspace.getLeavesOfType(VIEW_TYPE_TIMER)
                if (leaves.length > 0) {
                    workspace.detachLeavesOfType(VIEW_TYPE_TIMER)
                } else {
                    this.activateView()
                }
            },
        })

        this.addCommand({
            id: 'reset-timer',
            name: 'Reset timer',
            callback: () => {
                timer.reset()
                new Notice('Timer reset')
            },
        })

        this.addCommand({
            id: 'toggle-mode',
            name: 'Toggle timer mode',
            callback: () => {
                timer.toggleMode((t) => {
                    new Notice(`Timer mode: ${t.mode}`)
                })
            },
        })
    }

    public getSettings(): Settings {
        return (
            this.settingTab?.getSettings() || PomodoroSettings.DEFAULT_SETTINGS
        )
    }

    onunload() {
        this.settingTab?.unload()
        clean()
        clock.terminate()
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
