import { type Mode, type Task, type TimerState } from 'TimerN'
import {
    parseWithTemplater,
    getTemplater,
    getDailyNoteFile,
    appendFile,
    ensureFileExists,
} from 'utils'
import PomodoroTimerPlugin from 'main'
import { TFile } from 'obsidian'
import { Notice } from 'obsidian'

export default class Logger {

    private plugin: PomodoroTimerPlugin

    constructor(plugin: PomodoroTimerPlugin) {
        this.plugin = plugin
    }

    public async log(state: TimerState) {
        const logFile = await this.resolveLogFile(state)
        if (logFile) {
            const logText = await this.toText(state, logFile.path)
            if (logText) {
                await this.plugin.app.vault.append(logFile, logText)
            }
        }
    }

    private async resolveLogFile(state: TimerState): Promise<TFile | void> {
        const settings = this.plugin!.getSettings()

        // filter log level
        if (settings.logLevel !== 'ALL' && settings.logLevel !== state.mode) {
            return
        }

        // focused file has highest priority
        if (
            settings.logFocused &&
            state.task?.path &&
            state.task.path.endsWith('md')
        ) {
            // return this.app.get state.task.path
            // this.plugin.app.vault
            const file = this.plugin.app.vault.getAbstractFileByPath(
                state.task.path,
            )
            if (file && file instanceof TFile) {
                return file
            }
            // fall-through
        }

        if (settings.logFile === 'NONE') {
            return
        }

        // use daily note
        if (settings.logFile === 'DAILY') {
            return await getDailyNoteFile()
        }

        // log to file
        if (settings.logFile === 'FILE') {
            if (settings.logPath) {
                try {
                    return await ensureFileExists(
                        this.plugin.app,
                        settings.logPath,
                    )
                } catch (error) {
                    if (error instanceof Error) {
                        new Notice(error.message)
                    }
                    return
                }
            }
        }
    }

    private async toText(state: TimerState, path: string): Promise<string> {
        return ''
    }

    // private text(state: TimerState) {
    //     const settings = this.plugin.getSettings()
    //     if (settings.logFormat === 'CUSTOM' && getTemplater(this.plugin.app)) {
    //         // use templater
    //         return await parseWithTemplater(
    //             this.plugin.app,
    //             path,
    //             settings.logTemplate,
    //             this,
    //         )
    //     } else {
    //         // default use a simple log
    //
    //         if (this.duration != this.session) {
    //             return ''
    //         }
    //
    //         if (settings.logFormat === 'SIMPLE') {
    //             return `**${this.mode}(${
    //                 this.duration
    //             }m)**: ${this.begin.format('HH:mm')} - ${this.end.format(
    //                 'HH:mm',
    //             )}`
    //         }
    //
    //         if (settings.logFormat === 'VERBOSE') {
    //             let emoji = TimerLog.EMOJI[this.mode]
    //             return `- ${emoji} (pomodoro::${this.mode}) (duration:: ${
    //                 this.duration
    //             }m) (begin:: ${this.begin.format(
    //                 'YYYY-MM-DD HH:mm',
    //             )}) - (end:: ${this.end.format('YYYY-MM-DD HH:mm')})`
    //         }
    //
    //         return ''
    //     }
    // }
}

export class TimerLog {
    static EMOJI: Record<Mode, string> = {
        WORK: '🍅',
        BREAK: '🥤',
    }

    duration: number
    begin: moment.Moment
    end: moment.Moment
    mode: Mode
    session: number
    task?: Task

    constructor(
        mode: Mode,
        duration: number,
        begin: moment.Moment,
        end: moment.Moment,
        session: number,
        task?: Task,
    ) {
        this.duration = duration
        this.begin = begin
        this.end = end
        this.mode = mode
        this.session = session
        this.task = task
    }

    // async text(path: string): Promise<string> {
    // }
}
