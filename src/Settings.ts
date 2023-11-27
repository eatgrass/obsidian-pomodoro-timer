import type PomodoroTimerPlugin from 'main'
import { PluginSettingTab, Setting } from 'obsidian'
import { writable, type Writable } from 'svelte/store'

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
    private settings: Writable<Settings>

    private _settings: Settings

    private plugin: PomodoroTimerPlugin

    constructor(plugin: PomodoroTimerPlugin, settings: Settings) {
        super(plugin.app, plugin)
        this.plugin = plugin
        this._settings = { ...DEFAULT_SETTINGS, ...settings }
        this.settings = writable<Settings>(this._settings)
    }

    public updateSettings = (newSettings: Partial<Settings>) => {
        this.settings.update((settings) => {
            this._settings = { ...settings, ...newSettings }
            this.plugin.saveData(this._settings)
            return this._settings
        })
    }

    public store = () => {
        return this.settings
    }

    public display() {
        const { containerEl } = this
        containerEl.empty()

        new Setting(containerEl)
            .setName('Enable system notification')
            .setDesc('Enable system notification when timer ends')
            .addToggle((toggle) => {
                toggle.setValue(this._settings.useSystemNotification)
                toggle.onChange((value) => {
                    this.updateSettings({ useSystemNotification: value })
                })
            })
    }
}
