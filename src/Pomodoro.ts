import type { Moment } from 'moment'

export interface PomodoroLog {
    duration: number
    from: Moment
    to: Moment
    mode: Mode
    note: string | null
}

export type Mode = 'WORK' | 'BREAK'
