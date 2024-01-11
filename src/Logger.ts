import { type TimerState, type Mode } from 'Timer'
import * as utils from 'utils'
import PomodoroTimerPlugin from 'main'
import { TFile, Notice, moment } from 'obsidian'
import { incrTaskActual, resolveTasks, type TaskItem } from 'Tasks'

export type TimerLog = {
    duration: number
    begin: moment.Moment
    end: moment.Moment
    mode: Mode
    session: number
    task: TaskItem
    finished: boolean
}

const DEFAULT_LOG_TASK: TaskItem = {
    actual: 0,
    expected: 0,
    path: '',
    fileName: '',
    text: '',
    name: '',
    status: '',
    blockLink: '',
    checked: false,
    done: '',
    due: '',
    created: '',
    cancelled: '',
    scheduled: '',
    start: '',
    description: '',
    priority: '',
    recurrence: '',
    tags: [],
    line: -1,
}

type LogState = TimerState & { task?: TaskItem }

export default class Logger {
    private plugin: PomodoroTimerPlugin

    constructor(plugin: PomodoroTimerPlugin) {
        this.plugin = plugin
    }

    public async log(state: LogState): Promise<TFile | void> {
        const logFile = await this.resolveLogFile(state)
        const log = this.createLog(state)
        if (logFile) {
            const logText = await this.toText(log, logFile)
            if (logText) {
                await this.plugin.app.vault.append(logFile, `\n${logText}`)
            }
        }

        // update task item
        if (this.plugin.getSettings().enableTaskTracking) {
            if (
                state.mode === 'WORK' &&
                log.finished &&
                state.task?.path &&
                state.task?.blockLink
            ) {
                let file = this.plugin.app.vault.getAbstractFileByPath(
                    state.task.path,
                )
                if (file && file instanceof TFile) {
                    let f = file as TFile
                    incrTaskActual(
                        this.plugin.getSettings().taskFormat,
                        this.plugin.app,
                        state.task.blockLink,
                        f,
                    )
                }
            }
        }

        return logFile
    }

    private async resolveLogFile(state: LogState): Promise<TFile | void> {
        const settings = this.plugin!.getSettings()

        // filter log level
        if (settings.logLevel !== 'ALL' && settings.logLevel !== state.mode) {
            return
        }

        // focused file has the highest priority
        if (
            settings.logFocused &&
            state.task?.path &&
            state.task.path.endsWith('md')
        ) {
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
                let path = settings.logPath
                if (!path.endsWith('md')) {
                    path += '.md'
                }
                try {
                    return await utils.ensureFileExists(this.plugin.app, path)
                } catch (error) {
                    if (error instanceof Error) {
                        new Notice(error.message)
                    }
                    return
                }
            }
        }
    }

    private createLog(state: LogState): TimerLog {
        return {
            mode: state.mode,
            duration: Math.floor(state.elapsed / 60000),
            begin: moment(state.startTime),
            end: moment(),
            session: state.duration,
            task: state.task
                ? { ...DEFAULT_LOG_TASK, ...state.task }
                : DEFAULT_LOG_TASK,
            finished: state.count == state.elapsed,
        }
    }

    private async toText(log: TimerLog, file: TFile): Promise<string> {
        const settings = this.plugin.getSettings()
        if (
            settings.logFormat === 'CUSTOM' &&
            utils.getTemplater(this.plugin.app)
        ) {
            // use templater
            return await utils.parseWithTemplater(
                this.plugin.app,
                file,
                settings.logTemplate,
                log,
            )
        } else {
            // Built-in log: ignore unfinished session
            if (!log.finished) {
                return ''
            }

            if (settings.logFormat === 'SIMPLE') {
                return `**${log.mode}(${log.duration}m)**: ${log.begin.format(
                    'HH:mm',
                )} - ${log.end.format('HH:mm')}`
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
