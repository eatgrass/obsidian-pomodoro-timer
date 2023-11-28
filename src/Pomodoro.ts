import type { Moment } from 'moment'
import moment from 'moment'
import { settings } from 'stores'

export class PomodoroLog {
    duration: number
    begin: Moment
    end: Moment
    mode: Mode
    workTemplate: string = ''
    breakTemplate: string = ''


    constructor(duration: number, start: Moment, end: Moment, mode: Mode) {
        this.duration = duration
        this.begin = start
        this.end = end
        this.mode = mode
        settings.subscribe((settings) => {
            this.workTemplate = settings.workLogTemplate
            this.breakTemplate = settings.breakLogTemplate
        })
    }

    logText():string {
        let template = this.mode === 'WORK' ? this.workTemplate : this.breakTemplate
        return template
            ? template.replace(/\{(.*?)}/g, (_, expression: string): string => {
                  let [key, format]: string[] = expression
                      .split('|')
                      .map((part: string) => part.trim())
                  let value = this[key as keyof PomodoroLog]
    
                  // Check if the value is a moment object and a format is provided
                  if (moment.isMoment(value) && format) {
                      return value.format(format)
                  }
                  return (value as string) || ''
              })
            : ''
    }
}

export type Mode = 'WORK' | 'BREAK'

export const POMO_EMOJI: Record<Mode, string> = {
    WORK: '🍅',
    BREAK: '🥤',
}
