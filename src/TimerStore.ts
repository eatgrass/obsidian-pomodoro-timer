import { writable, type Writable, derived, type Readable } from 'svelte/store'
import { settings } from 'stores'
import type { Mode } from 'Pomodoro'
interface TimerState {
    running: boolean
    lastTick: number
    mode: Mode
    elapsed: number
    startTime: number | null
    inSession: boolean
    workLen: number
    breakLen: number
    count: number
    duration: number
}

const state: Writable<TimerState> = writable({
    running: false,
    lastTick: 0,
    mode: 'WORK',
    elapsed: 0,
    startTime: null,
    inSession: false,
    workLen: 25,
    breakLen: 5,
    count: 25 * 60 * 1000,
    duration: 25,
})

interface TimerControl {
    start: () => void
    tick: () => void
    endSession: () => void
    reset: ()=> void
    pause: ()=> void
}

export type TimerStore = Writable<TimerState> & TimerControl

const { update } = state

settings.subscribe(($settings) => {
    update((state) => {
        state.workLen = $settings.workLen
        state.breakLen = $settings.breakLen
        return state
    })
})

const methods: TimerControl = {
    start() {
        update((s) => {
            let now = new Date().getTime()
            if (!s.inSession) {
                // new session
                s.elapsed = 0
                s.startTime = null
                s.duration = s.mode === 'WORK' ? s.workLen : s.breakLen
                s.count = s.duration * 60 * 1000
                s.startTime = now
            }
            s.lastTick = now
            s.inSession = true
            s.running = true
            return s
        })
    },
    pause() {
        update((s)=> {
            s.running = false
            return s
        })
    },
    reset() {
        update((s) => {
            s.duration = s.mode == 'WORK' ? s.workLen : s.breakLen
            s.count = s.duration * 60 * 1000
            s.inSession = false
            s.running = false
            s.startTime = null
            s.elapsed = 0
            return s
        })
    },
    tick() {
        update((s) => {
            let now = new Date().getTime()
            let diff = Date.now() - s.lastTick
            s.lastTick = now
            s.elapsed += diff
            if (s.elapsed >= s.count) {
                s.elapsed = s.count
            }
            return s
        })
    },
    endSession() {
        update((s) => {
            s.mode = s.mode == 'WORK' ? 'BREAK' : 'WORK'
            s.duration = s.mode == 'WORK' ? s.workLen : s.breakLen
            s.count = s.duration * 60 * 1000
            s.inSession = false
            s.running = false
            s.startTime = null
            s.elapsed = 0
            return s
        })
    },
}

export const store: TimerStore = {
    ...state,
    ...methods,
}
