import { type TimerState, type Mode, type Task } from 'Timer'
import * as utils from 'utils'
import PomodoroTimerPlugin from 'main'
import { TFile, Notice, moment } from 'obsidian'

export type TimerLog = {
    duration: number
    begin: moment.Moment
    end: moment.Moment
    mode: Mode
    session: number
    task?: Task
    finished: boolean
}

export default class Logger {
    private plugin: PomodoroTimerPlugin

    constructor(plugin: PomodoroTimerPlugin) {
        this.plugin = plugin
    }

    public async log(state: TimerState) {
        const logFile = await this.resolveLogFile(state)
        if (logFile) {
            const logText = await this.toText(state, logFile)
            if (logText) {
                await this.plugin.app.vault.append(logFile, `\n${logText}`)
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
            return await utils.getDailyNoteFile()
        }

        // log to file
        if (settings.logFile === 'FILE') {
            if (settings.logPath) {
                try {
                    return await utils.ensureFileExists(
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

    private createLog(state: TimerState): TimerLog {
        return {
            mode: state.mode,
            duration: Math.floor(state.elapsed / 60000),
            begin: moment(state.startTime),
            end: moment(),
            session: state.duration,
            task: state.task,
            finished: state.count == state.elapsed,
        }
    }

    private async toText(state: TimerState, file: TFile): Promise<string> {
        const settings = this.plugin.getSettings()
        const log = this.createLog(state)
        if (
            settings.logFormat === 'CUSTOM' &&
            utils.getTemplater(this.plugin.app)
        ) {
            // use templater
            return await utils.parseWithTemplater(
                this.plugin.app,
                file,
                settings.logTemplate,
                this.createLog(state),
            )
        } else {
            // Built-in log: ignore unfinished session
            if (!log.finished) {
                return ''
            }

            if (settings.logFormat === 'SIMPLE') {
                return `**${state.mode}(${
                    state.duration
                }m)**: ${log.begin.format('HH:mm')} - ${log.end.format(
                    'HH:mm',
                )}`
            }

            if (settings.logFormat === 'VERBOSE') {
                const emoji = log.mode == 'WORK' ? '🍅' : '🥤'
                return `- ${emoji} (pomodoro::${log.mode}) (duration:: ${
                    log.duration
                }m) (begin:: ${log.begin.format(
                    'YYYY-MM-DD HH:mm',
                )}) - (end:: ${log.end.format('YYYY-MM-DD HH:mm')})`
            }

            return ''
        }
    }
}
