import PomodoroSettings from 'Settings'
import { writable } from 'svelte/store'

export const settings = PomodoroSettings.settings
export const pinned = writable<boolean>(false)

export default {
    settings,
    pinned,
}
