import { writable } from 'svelte/store'
import type PomodoroTimerPlugin from './main'
import PomodoroSettings from 'Settings'
import type { PomodoroLog,Mode } from 'Pomodoro'

export const plugin = writable<PomodoroTimerPlugin>()
export const settings = PomodoroSettings.settings
export const logs = writable<PomodoroLog[]>([])

interface TimerState {
    running: boolean
    lastTick: number
    mode: Mode
    elapsed: number
    inSession: boolean
}

export const timer = writable<TimerState>({
    running: false,
    lastTick: 0,
    mode: 'WORK',
    elapsed: 0,
    inSession: false,
})

export default {
    plugin,
    settings,
    timer,
}
