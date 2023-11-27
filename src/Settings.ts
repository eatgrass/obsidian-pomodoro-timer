import type PomodoroTimerPlugin from 'main'
import { PluginSettingTab, Setting } from 'obsidian'

export interface Settings {
    workLen: number
    breakLen: number
    autostart: boolean
    useSystemNotification: boolean
}

export const DEFAULT_SETTINGS: Settings = {
    workLen: 25,
    breakLen: 5,
    autostart: false,
    useSystemNotification: false,
}

export default class PomodoroSettings extends PluginSettingTab {
    private settings: Settings = { ...DEFAULT_SETTINGS }

    private plugin: PomodoroTimerPlugin

    constructor(plugin: PomodoroTimerPlugin, settings: Settings) {
        super(plugin.app, plugin)
        this.plugin = plugin
        this.settings = { ...DEFAULT_SETTINGS, ...settings }
    }

    public updateSettings = (newSettings: Partial<Settings>) => {
        this.settings = { ...this.settings, ...newSettings }
        this.plugin.saveData(this.settings)
        return this.settings
    }

    public getSettings = () => {
        return this.settings
    }

    public display() {
        const { containerEl } = this
        containerEl.empty()

        new Setting(containerEl).setName('Enable system notification')
        .setDesc('Enable system notification when timer ends')
        .addToggle((toggle) => {
            toggle.setValue(this.settings.useSystemNotification)
            toggle.onChange((value) => {
                this.updateSettings({useSystemNotification: value })
            })
        })

        new Setting(containerEl).setName('Auto start')
        .setDesc('Automatically start next timer after session ends')
        .addToggle((toggle) => {
            toggle.setValue(this.settings.autostart)
            toggle.onChange((value) => {
                this.updateSettings({ autostart: value })
            })
        })

        new Setting(containerEl)
            .setName('Work length')
            .setDesc('Length of work period in minutes')
            .addText((text) => {
                text.setValue(this.settings.breakLen.toString())
                text.onChange((value) => {
                    const workLen = parseInt(value)
                    if (workLen > 0) {
                        this.updateSettings({ workLen })
                    } else {
                        text.setValue(this.settings.workLen.toString())
                    }
                })
            })

        new Setting(containerEl)
            .setName('Break length')
            .setDesc(
                'Length of break period in minutes; set to 0 to disable breaks',
            )
            .addText((text) => {
                text.setValue(this.settings.breakLen.toString())
                text.onChange((value) => {
                    const breakLen = parseInt(value)
                    if (breakLen >= 0) {
                        this.updateSettings({ breakLen })
                    } else {
                        text.setValue(this.settings.breakLen.toString())
                    }
                })
            })
    }
}
