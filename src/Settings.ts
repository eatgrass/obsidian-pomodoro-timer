import type PomodoroTimerPlugin from 'main'
import { PluginSettingTab, Setting } from 'obsidian'
import { writable, type Writable } from 'svelte/store'

export interface Settings {
    workLen: number
    breakLen: number
    autostart: boolean
    useSystemNotification: boolean
    useStatusBarTimer: boolean
    logFile: 'DAILY' | 'FILE' | 'NONE'
    logPath: string
}

export const DEFAULT_SETTINGS: Settings = {
    workLen: 25,
    breakLen: 5,
    autostart: false,
    useSystemNotification: false,
    useStatusBarTimer: false,
    logFile: 'NONE',
    logPath: '',
}

export default class PomodoroSettings extends PluginSettingTab {
    private _settings: Settings

    private plugin: PomodoroTimerPlugin

    static settings: Writable<Settings> = writable<Settings>(DEFAULT_SETTINGS)

    static DEFAULT_SETTINGS = DEFAULT_SETTINGS

    constructor(plugin: PomodoroTimerPlugin, settings: Settings) {
        super(plugin.app, plugin)
        this.plugin = plugin
        this._settings = { ...DEFAULT_SETTINGS, ...settings }
        PomodoroSettings.settings.set(this._settings)
        PomodoroSettings.settings.subscribe((settings) => {
            this.plugin.saveData(settings)
            this._settings = settings
        })
    }

    public getSettings(): Settings {
        return this._settings
    }

    public updateSettings = (
        newSettings: Partial<Settings>,
        refreshUI: boolean = false,
    ) => {
        PomodoroSettings.settings.update((settings) => {
            this._settings = { ...settings, ...newSettings }
            if (refreshUI) {
                this.display()
            }
            return this._settings
        })
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

        new Setting(containerEl)
            .setName('Enable status bar timer')
            .addToggle((toggle) => {
                toggle.setValue(this._settings.useStatusBarTimer)
                toggle.onChange((value) => {
                    this.updateSettings({ useStatusBarTimer: value })
                })
            })

        new Setting(containerEl)
            .setName('Log file')
            .setDesc('The file to log pomodoro sessions to')
            .addDropdown((dropdown) => {
                dropdown.addOptions({
                    NONE: 'None',
                    DAILY: 'Daily note',
                    FILE: 'File',
                })
                dropdown.setValue(this._settings.logFile)
                dropdown.onChange((value: string) => {
                    if (
                        value === 'NONE' ||
                        value === 'DAILY' ||
                        value === 'FILE'
                    ) {
                        dropdown.setValue(this._settings.logFile)
                        this.updateSettings({ logFile: value }, true)
                    }
                })
            })

        if (this._settings.logFile === 'FILE') {
            new Setting(containerEl)
                .setName('Log file path')
                .setDesc('The file to log pomodoro sessions to')
                .addText((text) => {
                    text.inputEl.style.width = '300px'
                    text.setValue(this._settings.logPath)
                    text.onChange((value) => {
                        this.updateSettings({ logPath: value })
                    })
                })
        }

        new Setting(containerEl).addButton((button) => {
            button.setButtonText('Restore settings')
            button.onClick(() => {
                this.updateSettings(DEFAULT_SETTINGS, true)
            })
        })
    }
}
