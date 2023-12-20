import type PomodoroTimerPlugin from 'main'
import { PluginSettingTab, Setting } from 'obsidian'
import type { Unsubscriber } from 'svelte/motion'
import { writable, type Writable } from 'svelte/store'
import { getTemplater } from 'utils'

export interface Settings {
    workLen: number
    breakLen: number
    autostart: boolean
    useStatusBarTimer: boolean
    logFile: 'DAILY' | 'FILE' | 'NONE'
    logPath: string
    logLevel: 'ALL' | 'WORK' | 'BREAK'
    logTemplate: string
    useSystemNotification: boolean
}

export default class PomodoroSettings extends PluginSettingTab {
    static readonly DEFAULT_SETTINGS: Settings = {
        workLen: 25,
        breakLen: 5,
        autostart: false,
        useStatusBarTimer: false,
        logFile: 'NONE',
        logPath: '',
        logLevel: 'ALL',
        logTemplate: '',
        useSystemNotification: false,
    }

    static settings: Writable<Settings> = writable(
        PomodoroSettings.DEFAULT_SETTINGS,
    )

    private _settings: Settings

    private plugin: PomodoroTimerPlugin

    private unsubscribe: Unsubscriber

    constructor(plugin: PomodoroTimerPlugin, settings: Settings) {
        super(plugin.app, plugin)
        this.plugin = plugin
        this._settings = { ...PomodoroSettings.DEFAULT_SETTINGS, ...settings }
        PomodoroSettings.settings.set(this._settings)
        this.unsubscribe = PomodoroSettings.settings.subscribe((settings) => {
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

    public unload() {
        this.unsubscribe()
    }

    public display() {
        const { containerEl } = this
        containerEl.empty()

        new Setting(containerEl)
            .setName('Enable status bar timer')
            .addToggle((toggle) => {
                toggle.setValue(this._settings.useStatusBarTimer)
                toggle.onChange((value) => {
                    this.updateSettings({ useStatusBarTimer: value })
                })
            })

        new Setting(containerEl)
            .setName('Use system notification')
            .addToggle((toggle) => {
                toggle.setValue(this._settings.useSystemNotification)
                toggle.onChange((value) => {
                    this.updateSettings({ useSystemNotification: value })
                })
            })

        new Setting(containerEl)
            .setName('Log file')
            .setDesc('The file to log pomodoro sessions to')
            .addDropdown((dropdown) => {
                dropdown.selectEl.style.width = '120px'
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
                        dropdown.setValue(value)
                        this.updateSettings({ logFile: value }, true)
                    }
                })
            })

        if (this._settings.logFile != 'NONE') {
            new Setting(containerEl)
                .setName('Log level')
                .addDropdown((dropdown) => {
                    dropdown.selectEl.style.width = '120px'
                    dropdown.addOptions({
                        ALL: 'All',
                        WORK: 'Work',
                        BREAK: 'Break',
                    })
                    dropdown.setValue(this._settings.logLevel)
                    dropdown.onChange((value: string) => {
                        if (
                            value === 'ALL' ||
                            value === 'WORK' ||
                            value === 'BREAK'
                        ) {
                            dropdown.setValue(value)
                            this.updateSettings({ logLevel: value })
                        }
                    })
                })

            const logTemplate = new Setting(containerEl).setName('Log template')

            if (getTemplater(this.app)) {
                logTemplate.addTextArea((text) => {
                    text.inputEl.style.width = '100%'
                    text.setValue(this._settings.logTemplate)

                    text.onChange((value) => {
                        this.updateSettings({ logTemplate: value })
                    })
                })
            } else {
                logTemplate.setDesc('Requires Templater plugin to be enabled.')
            }
        }

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
                this.updateSettings(PomodoroSettings.DEFAULT_SETTINGS, true)
            })
        })
    }
}
