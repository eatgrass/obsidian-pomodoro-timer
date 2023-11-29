import { writable } from 'svelte/store'
import type PomodoroTimerPlugin from './main'
import PomodoroSettings from 'Settings'

export const plugin = writable<PomodoroTimerPlugin>()
export const settings = PomodoroSettings.settings

export default {
    plugin,
    settings,
}
