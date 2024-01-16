import { type TimerState, type Mode } from 'Timer'
import * as utils from 'utils'
import PomodoroTimerPlugin from 'main'
import { TFile, Notice, moment } from 'obsidian'
import { type TaskItem } from 'Tasks'

export type TimerLog = {
    duration: number
    begin: number
    end: number
    mode: Mode
    session: number
    task: TaskItem
    finished: boolean
}

export type LogContext = TimerState & { task: TaskItem }

export default class Logger {
    private plugin: PomodoroTimerPlugin

    constructor(plugin: PomodoroTimerPlugin) {
        this.plugin = plugin
    }

    public async log(ctx: LogContext): Promise<TFile | void> {
        const logFile = await this.resolveLogFile(ctx)
        const log = this.createLog(ctx)
        if (logFile) {
            const logText = await this.toText(log, logFile)
            if (logText) {
                await this.plugin.app.vault.append(logFile, `\n${logText}`)
            }
        }

        return logFile
    }

    private async resolveLogFile(ctx: LogContext): Promise<TFile | void> {
        const settings = this.plugin!.getSettings()

        // filter log level
        if (settings.logLevel !== 'ALL' && settings.logLevel !== ctx.mode) {
            return
        }

        // focused file has the highest priority
        if (
            settings.logFocused &&
            ctx.task.path &&
            ctx.task.path.endsWith('md')
        ) {
            const file = this.plugin.app.vault.getAbstractFileByPath(
                ctx.task.path,
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

    private createLog(ctx: LogContext): TimerLog {
        return {
            mode: ctx.mode,
            duration: Math.floor(ctx.elapsed / 60000),
            begin: ctx.startTime!,
            end: new Date().getTime(),
            session: ctx.duration,
            task: ctx.task,
            finished: ctx.count == ctx.elapsed,
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

            let begin = moment(log.begin)
            let end = moment(log.end)
            if (settings.logFormat === 'SIMPLE') {
                return `**${log.mode}(${log.duration}m)**: ${begin.format(
                    'HH:mm',
                )} - ${end.format('HH:mm')}`
            }

            if (settings.logFormat === 'VERBOSE') {
                const emoji = log.mode == 'WORK' ? '🍅' : '🥤'
                return `- ${emoji} (pomodoro::${log.mode}) (duration:: ${
                    log.duration
                }m) (begin:: ${begin.format(
                    'YYYY-MM-DD HH:mm',
                )}) - (end:: ${end.format('YYYY-MM-DD HH:mm')})`
            }

            return ''
        }
    }
}
