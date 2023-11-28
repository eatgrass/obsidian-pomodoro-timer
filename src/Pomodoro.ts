import moment, { type Moment } from 'moment'
import stores from 'stores'
import type { TFile } from 'obsidian'

import {
    getDailyNote,
    createDailyNote,
    getAllDailyNotes,
} from 'obsidian-daily-notes-interface'
import type PomodoroTimerPlugin from 'main'

let plugin: PomodoroTimerPlugin | undefined

stores.plugin.subscribe((p) => {
    plugin = p
})

const getDailyNoteFile = async (): Promise<TFile> => {
    const file = getDailyNote(moment() as any, getAllDailyNotes())
    if (!file) {
        return await createDailyNote(moment() as any)
    }
    return file
}

const appendFile = async (filePath: string, logText: string): Promise<void> => {
    await plugin!.app.vault.adapter.append(filePath, logText)
}

export const saveLog = async (log: PomodoroLog): Promise<void> => {
    const settings = plugin!.getSettings()
    if (settings.logFile === 'DAILY') {
        let file = (await getDailyNoteFile()).path
        await appendFile(file, `\n${log.logText()}`)
    }
    if (settings.logFile === 'FILE') {
        let path = settings.logPath || settings.logPath.trim()
        if (path !== '') {
            if (!(await plugin!.app.vault.adapter.exists(path))) {
                await plugin!.app.vault.create(path, log.logText())
            } else {
                await appendFile(path, `\n${log.logText()}`)
            }
        }
    }
}

export class PomodoroLog {
    static template: string =
        '(pomodoro::{mode}) (duration:: {duration}m) (begin:: {begin|YYYY-MM-DD HH:mm}) - (end:: {end|YYYY-MM-DD HH:mm})'

    duration: number
    begin: Moment
    end: Moment
    mode: Mode

    constructor(mode: Mode, duration: number, begin: Moment, end: Moment) {
        this.duration = duration
        this.begin = begin
        this.end = end
        this.mode = mode
    }

    logText(): string {
        let template = PomodoroLog.template
        let emoji = POMO_EMOJI[this.mode]
        let line = template
            ? template.replace(/\{(.*?)}/g, (_, expression: string): string => {
                  let [key, format]: string[] = expression
                      .split('|')
                      .map((part: string) => part.trim())
                  let value = this[key as keyof PomodoroLog] || ''

                  // Check if the value is a moment object and a format is provided
                  if (moment.isMoment(value) && format) {
                      return value.format(format)
                  }
                  return (value as string) || ''
              })
            : ''
        return `- ${emoji} ${line}`
    }
}

export type Mode = 'WORK' | 'BREAK'

export const POMO_EMOJI: Record<Mode, string> = {
    WORK: '🍅',
    BREAK: '🥤',
}
