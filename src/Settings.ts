import type PomodoroTimerPlugin from 'main'
import { DropdownComponent } from 'obsidian'
import { PluginSettingTab, Setting, moment } from 'obsidian'
import type { Unsubscriber } from 'svelte/motion'
import { writable, type Writable } from 'svelte/store'
import { getTemplater } from 'utils'

type LogFileType = 'DAILY' | 'FILE' | 'NONE'
type LogLevel = 'ALL' | 'WORK' | 'BREAK'
type LogFormat = 'SIMPLE' | 'VERBOSE' | 'CUSTOM'
export type TaskFormat = 'TASKS' | 'DATAVIEW'

export interface Settings {
    workLen: number
    breakLen: number
    autostart: boolean
    useStatusBarTimer: boolean
    notificationSound: boolean
    customSound: string
    logFile: LogFileType
    logFocused: boolean
    logPath: string
    logLevel: LogLevel
    logTemplate: string
    logFormat: LogFormat
    useSystemNotification: boolean
    taskFormat: TaskFormat
}

export default class PomodoroSettings extends PluginSettingTab {
    static readonly DEFAULT_SETTINGS: Settings = {
        workLen: 25,
        breakLen: 5,
        autostart: false,
        useStatusBarTimer: false,
        notificationSound: true,
        customSound: '',
        logFile: 'NONE',
        logFocused: false,
        logPath: '',
        logLevel: 'ALL',
        logTemplate: '',
        logFormat: 'VERBOSE',
        useSystemNotification: false,
        taskFormat: 'TASKS',
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
            this.plugin.timer?.setupTimer()
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

        new Setting(containerEl).setHeading().setName('Notification')

        new Setting(containerEl)
            .setName('Use system notification')
            .addToggle((toggle) => {
                toggle.setValue(this._settings.useSystemNotification)
                toggle.onChange((value) => {
                    this.updateSettings({ useSystemNotification: value })
                })
            })
        new Setting(containerEl)
            .setName('Notification sound')
            .addToggle((toggle) => {
                toggle.setValue(this._settings.notificationSound)
                toggle.onChange((value) => {
                    this.updateSettings({ notificationSound: value }, true)
                })
            })

        if (this._settings.notificationSound) {
            new Setting(containerEl)
                .setName('Custom sound')
                .addText((text) => {
                    text.inputEl.style.width = '100%'
                    text.setPlaceholder('path/to/sound.mp3')
                    text.setValue(this._settings.customSound)
                    text.onChange((value) => {
                        this.updateSettings({ customSound: value })
                    })
                })
                .addExtraButton((button) => {
                    button.setIcon('play')
                    button.setTooltip('play')
                    button.onClick(() => {
                        this.plugin.timer?.playAudio()
                    })
                })
        }

        new Setting(containerEl).setHeading().setName('Task')
        new Setting(containerEl)
            .setName('Task format')
            .addDropdown((dropdown) => {
                dropdown.selectEl.style.width = '160px'
                dropdown.addOptions({
                    TASKS: 'Tasks Emoji Format',
                    DATAVIEW: 'Dataview',
                })
                dropdown.setValue(this._settings.taskFormat)
                dropdown.onChange((value: string) => {
                    this.updateSettings(
                        { taskFormat: value as TaskFormat },
                        true,
                    )
                })
            })

        new Setting(containerEl).setHeading().setName('Log')
        new Setting(containerEl).setName('Log file').addDropdown((dropdown) => {
            dropdown.selectEl.style.width = '160px'
            dropdown.addOptions({
                NONE: 'None',
                DAILY: 'Daily note',
                FILE: 'File',
            })
            dropdown.setValue(this._settings.logFile)
            dropdown.onChange((value: string) => {
                this.updateSettings({ logFile: value as LogFileType }, true)
            })
        })

        if (this._settings.logFile != 'NONE') {
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

            new Setting(containerEl)
                .setName('Log level')
                .addDropdown((dropdown) => {
                    dropdown.selectEl.style.width = '160px'
                    dropdown.addOptions({
                        ALL: 'All',
                        WORK: 'Work',
                        BREAK: 'Break',
                    })
                    dropdown.setValue(this._settings.logLevel)
                    dropdown.onChange((value: string) => {
                        this.updateSettings({ logLevel: value as LogLevel })
                    })
                })

            const hasTemplater = !!getTemplater(this.app)

            let example = ''
            if (this._settings.logFormat == 'SIMPLE') {
                example = `**WORK(25m)**: from ${moment()
                    .subtract(25, 'minutes')
                    .format('HH:mm')} - ${moment().format('HH:mm')}`
            }
            if (this._settings.logFormat == 'VERBOSE') {
                example = `- 🍅 (pomodoro::WORK) (duration:: 25m) (begin:: ${moment()
                    .subtract(25, 'minutes')
                    .format('YYYY-MM-DD HH:mm')}) - (end:: ${moment().format(
                    'YYYY-MM-DD HH:mm',
                )})`
            }
            new Setting(containerEl)
                .setName('Log format')
                .setDesc(example)
                .addDropdown((dropdown) => {
                    dropdown.selectEl.style.width = '160px'
                    dropdown.addOptions({
                        SIMPLE: 'Simple',
                        VERBOSE: 'Verbose',
                        CUSTOM: 'Custom',
                    })
                    dropdown.setValue(this._settings.logFormat)

                    dropdown.onChange((value: string) => {
                        this.updateSettings(
                            { logFormat: value as LogFormat },
                            true,
                        )
                    })
                })

            if (this._settings.logFormat == 'CUSTOM') {
                const logTemplate = new Setting(containerEl).setName(
                    'Log template',
                )
                if (hasTemplater) {
                    logTemplate.addTextArea((text) => {
                        text.inputEl.style.width = '100%'
                        text.inputEl.style.resize = 'vertical'
                        text.setPlaceholder('<% templater script goes here %>')
                        text.setValue(this._settings.logTemplate)
                        text.onChange((value) => {
                            this.updateSettings({ logTemplate: value })
                        })
                    })
                } else {
                    logTemplate
                        .setDesc(
                            createFragment((fragment) => {
                                const text1 = document.createElement('span')
                                text1.setText('Requires ')
                                text1.style.color = 'var(--text-error)'
                                const a = document.createElement('a')
                                a.setText('Templater')
                                a.href =
                                    'obsidian://show-plugin?id=templater-obsidian'
                                const text2 = document.createElement('span')
                                text2.setText(
                                    ' plugin to be enabled, then click the refresh button',
                                )
                                text2.style.color = 'var(--text-error)'
                                fragment.append(text1, a, text2)
                            }),
                        )
                        .addButton((button) => {
                            button.setIcon('refresh-ccw')
                            button.onClick(() => {
                                this.display()
                            })
                        })
                }
            }
        }

        new Setting(containerEl).addButton((button) => {
            button.setButtonText('Restore settings')
            button.onClick(() => {
                this.updateSettings(PomodoroSettings.DEFAULT_SETTINGS, true)
            })
        })
    }
}
