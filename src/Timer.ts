import { derived, writable, type Readable, type Writable } from 'svelte/store'
import { settings, plugin } from 'stores'
import { bell } from 'Bell'
// @ts-ignore
import Worker from 'clock.worker'
import {
    getDailyNote,
    createDailyNote,
    getAllDailyNotes,
} from 'obsidian-daily-notes-interface'
import { Notice, type TFile, moment } from 'obsidian'
import type PomodoroTimerPlugin from 'main'
import { parseWithTemplater, getTemplater } from 'utils'

// background worker
const clock: any = Worker()
clock.onmessage = ({ data }: any) => {
    store.tick(data as number)
}

let $plugin: PomodoroTimerPlugin

const pluginUnsubribe = plugin.subscribe((p) => ($plugin = p))

const audio = new Audio(bell)

let running = false

interface TimerState {
    autostart: boolean
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

interface TimerControl {
    start: () => void
    tick: (t: number) => void
    endSession: (state: TimerState) => TimerState
    reset: () => void
    pause: () => void
    timeup: () => void
    toggleMode: (callback?: (state: TimerState) => void) => void
    toggleTimer: () => void
}

export type TimerStore = Writable<TimerState> & TimerControl

export type TimerRemained = {
    millis: number
    human: string
}

const state: Writable<TimerState> | TimerStore = writable({
    autostart: false,
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

const stateUnsubribe = state.subscribe((s) => (running = s.running))

const { update } = state

const settingsUnsubsribe = settings.subscribe(($settings) => {
    update((state) => {
        state.workLen = $settings.workLen
        state.breakLen = $settings.breakLen
        state.autostart = $settings.autostart
        if (!state.running && !state.inSession) {
            state.duration =
                state.mode == 'WORK' ? state.workLen : state.breakLen
            state.count = state.duration * 60 * 1000
        }
        return state
    })
})

const methods: TimerControl = {
    toggleTimer() {
        running ? this.pause() : this.start()
    },
    start() {
        update((s) => {
            let now = new Date().getTime()
            if (!s.inSession) {
                // new session
                s.elapsed = 0
                s.duration = s.mode === 'WORK' ? s.workLen : s.breakLen
                s.count = s.duration * 60 * 1000
                s.startTime = now
            }
            s.lastTick = now
            s.inSession = true
            s.running = true
            clock.postMessage(true)
            return s
        })
    },
    pause() {
        update((s) => {
            s.running = false
            clock.postMessage(false)
            return s
        })
    },
    reset() {
        update((s) => {
            if (s.elapsed > 0) {
                const log = new TimerLog(
                    s.mode,
                    Math.floor(s.elapsed / 60000),
                    moment(s.startTime),
                    moment(),
                    s.duration,
                )
                saveLog(log)
            }

            s.duration = s.mode == 'WORK' ? s.workLen : s.breakLen
            s.count = s.duration * 60 * 1000
            s.inSession = false
            s.running = false
            clock.postMessage(false)
            s.startTime = null
            s.elapsed = 0
            return s
        })
    },
    toggleMode(callback?: (state: TimerState) => void) {
        update((s) => {
            let updated = this.endSession(s)
            if (callback) {
                callback(updated)
            }
            return updated
        })
    },
    tick(t: number) {
        let timeup: boolean = false
        let pause: boolean = false
        update((s) => {
            if (s.running && s.lastTick) {
                let diff = t - s.lastTick
                s.lastTick = t
                s.elapsed += diff
                if (s.elapsed >= s.count) {
                    s.elapsed = s.count
                }
                timeup = s.elapsed >= s.count
            } else {
                pause = true
            }
            return s
        })
        if (!pause && timeup) {
            this.timeup()
        }
    },
    timeup() {
        let autostart = false
        update((s) => {
            const log = new TimerLog(
                s.mode,
                Math.floor(s.elapsed / 60000),
                moment(s.startTime),
                moment(),
                s.duration,
            )
            saveLog(log)
            notify(log)
            autostart = s.autostart
            return this.endSession(s)
        })
        if (autostart) {
            this.start()
        }
    },
    endSession(s: TimerState) {
        // setup new session
        if (s.breakLen == 0) {
            s.mode = 'WORK'
        } else {
            s.mode = s.mode == 'WORK' ? 'BREAK' : 'WORK'
        }
        s.duration = s.mode == 'WORK' ? s.workLen : s.breakLen
        s.count = s.duration * 60 * 1000
        s.inSession = false
        s.running = false
        clock.postMessage(false)
        s.startTime = null
        s.elapsed = 0
        return s
    },
}

Object.keys(methods).forEach((key) => {
    let method = key as keyof TimerControl
    ;(state as any)[method] = methods[method].bind(state)
})

export type Log = {
    duration: number
    session: number
    begin: moment.Moment
    end: moment.Moment
    mode: Mode
}

// session log
export class TimerLog {
    static EMOJI: Record<Mode, string> = {
        WORK: '🍅',
        BREAK: '🥤',
    }

    duration: number
    begin: moment.Moment
    end: moment.Moment
    mode: Mode
    session: number

    constructor(
        mode: Mode,
        duration: number,
        begin: moment.Moment,
        end: moment.Moment,
        session: number,
    ) {
        this.duration = duration
        this.begin = begin
        this.end = end
        this.mode = mode
        this.session = session
    }

    async text(path: string): Promise<string> {
        const settings = $plugin!.getSettings()

        if (settings.logFormat === 'CUSTOM' && getTemplater($plugin.app)) {
            // use templater
            return await parseWithTemplater(
                $plugin.app,
                path,
                settings.logTemplate,
                this,
            )
        } else {
            // default use a simple log
            console.log(this.duration)

            if (this.duration != this.session) {
                return ''
            }

            if (settings.logFormat === 'SIMPLE') {
                return `**${this.mode}(${
                    this.duration
                } m)**: from ${this.begin.format('HH:mm')} - ${this.end.format(
                    'HH:mm',
                )}`
            }

            if (settings.logFormat === 'VERBOSE') {
                let emoji = TimerLog.EMOJI[this.mode]
                return `- ${emoji}(pomodoro::${this.mode}) (duration:: ${
                    this.duration
                }m) (begin:: ${this.begin.format(
                    'YYYY-MM-DD HH:mm',
                )}) - (end:: ${this.end.format('YYYY-MM-DD HH:mm')})`
            }

            return ''
        }
    }
}

/* Util Functions */

const saveLog = async (log: TimerLog): Promise<void> => {
    const settings = $plugin!.getSettings()

    // filter log
    if (
        settings.logFile == 'NONE' ||
        (settings.logLevel !== 'ALL' && settings.logLevel !== log.mode)
    ) {
        return
    }

    // log to DailyNote
    if (settings.logFile === 'DAILY') {
        let path = (await getDailyNoteFile()).path
        let text = await log.text(path)
        if (text) {
            await appendFile(path, `\n${text}`)
        }
    }

    // log to file
    if (settings.logFile === 'FILE') {
        let path = settings.logPath || settings.logPath.trim()
        if (path) {
            if (!path.endsWith('.md')) {
                path += '.md'
            }
            await ensureFolderExists(path)
            let text = await log.text(path)
            if (text) {
                if (!(await $plugin!.app.vault.adapter.exists(path))) {
                    await $plugin!.app.vault.create(path, text)
                } else {
                    await appendFile(path, `\n${text}`)
                }
            }
        }
    }
}

const ensureFolderExists = async (path: string): Promise<void> => {
    const dirs = path.replace(/\\/g, '/').split('/')
    dirs.pop() // remove basename

    if (dirs.length) {
        const dir = join(...dirs)
        if (!$plugin.app.vault.getAbstractFileByPath(dir)) {
            await $plugin.app.vault.createFolder(dir)
        }
    }
}

const join = (...partSegments: string[]): string => {
    // Split the inputs into a list of path commands.
    let parts: string[] = []
    for (let i = 0, l = partSegments.length; i < l; i++) {
        parts = parts.concat(partSegments[i].split('/'))
    }
    // Interpret the path commands to get the new resolved path.
    const newParts = []
    for (let i = 0, l = parts.length; i < l; i++) {
        const part = parts[i]
        // Remove leading and trailing slashes
        // Also remove "." segments
        if (!part || part === '.') continue
        // Push new path segments.
        else newParts.push(part)
    }
    // Preserve the initial slash if there was one.
    if (parts[0] === '') newParts.unshift('')
    // Turn back into a single string path.
    return newParts.join('/')
}

const getDailyNoteFile = async (): Promise<TFile> => {
    const file = getDailyNote(moment() as any, getAllDailyNotes())
    if (!file) {
        return await createDailyNote(moment() as any)
    }
    return file
}

const appendFile = async (filePath: string, logText: string): Promise<void> => {
    await $plugin!.app.vault.adapter.append(filePath, logText)
}

const notify = (log: TimerLog) => {
    const text = `${TimerLog.EMOJI[log.mode]} You have been ${
        log.mode === 'WORK' ? 'working' : 'breaking'
    } for ${log.duration} minutes.`

    if ($plugin.getSettings().useSystemNotification) {
        const Notification = (require('electron') as any).remote.Notification
        const n = new Notification({
            title: 'Pomodoro Timer',
            body: text,
            silent: true,
        })
        n.on('click', () => {
            n.close()
        })
        n.show()
    } else {
        new Notice(`${text}`)
    }
    ring()
}

const ring = () => {
    audio.play()
}

export const remained: Readable<TimerRemained> = derived(
    state as Writable<TimerState>,
    ($state) => {
        let remained = $state.count - $state.elapsed
        let min = Math.floor(remained / 60000)
        let sec = Math.floor((remained % 60000) / 1000)
        let minStr = min < 10 ? `0${min}` : min.toString()
        let secStr = sec < 10 ? `0${sec}` : sec.toString()

        return {
            millis: remained,
            human: `${minStr} : ${secStr}`,
        } as TimerRemained
    },
)

export const store = state as TimerStore

export type Mode = 'WORK' | 'BREAK'

export const clean = () => {
    store.pause()
    settingsUnsubsribe()
    pluginUnsubribe()
    stateUnsubribe()
    clock.terminate()
}
