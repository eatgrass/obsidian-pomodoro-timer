import { TimerView, VIEW_TYPE_TIMER } from 'TimerView'
import { Notice, Plugin, WorkspaceLeaf } from 'obsidian'
import PomodoroSettings, { type Settings } from 'Settings'
import StatusBar from 'StatusBarComponent.svelte'
import Timer from 'Timer'
import Tasks from 'Tasks'
import TaskTracker from 'TaskTracker'

export default class PomodoroTimerPlugin extends Plugin {
    private settingTab?: PomodoroSettings

    public timer?: Timer

    public tasks?: Tasks

    public tracker?: TaskTracker

    async onload() {
        const settings = await this.loadData()
        this.settingTab = new PomodoroSettings(this, settings)
        this.addSettingTab(this.settingTab)
        this.tracker = new TaskTracker(this)
        this.timer = new Timer(this)
        this.tasks = new Tasks(this)

        this.registerView(VIEW_TYPE_TIMER, (leaf) => new TimerView(this, leaf))

        // ribbon
        this.addRibbonIcon('timer', 'Toggle timer panel', () => {
            let { workspace } = this.app
            let leaves = workspace.getLeavesOfType(VIEW_TYPE_TIMER)
            if (leaves.length > 0) {
                workspace.detachLeavesOfType(VIEW_TYPE_TIMER)
            } else {
                this.activateView()
            }
        })

        // status bar
        const status = this.addStatusBarItem()
        status.className = `${status.className} mod-clickable`
        new StatusBar({ target: status, props: { store: this.timer } })

        // commands
        this.addCommand({
            id: 'toggle-timer',
            name: 'Toggle timer',
            callback: () => {
                this.timer?.toggleTimer()
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
                this.timer?.reset()
                new Notice('Timer reset')
            },
        })

        this.addCommand({
            id: 'toggle-mode',
            name: 'Toggle timer mode',
            callback: () => {
                this.timer?.toggleMode((t) => {
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
        this.timer?.destroy()
        this.tasks?.destroy()
        this.tracker?.destory()
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
