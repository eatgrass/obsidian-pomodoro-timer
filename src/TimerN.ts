import PomodoroTimerPlugin from 'main'
// @ts-ignore
import Worker from 'clock.worker'
import type { Writable } from 'svelte/store'
import { writable } from 'svelte/store'
import type { Readable } from 'svelte/store'
import { Notice, moment } from 'obsidian'
import Logger, { TimerLog } from 'Logger'

export type Mode = 'WORK' | 'BREAK'

export type Task = {
    path: string
    name: string
}

export type TimerState = {
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
    task?: Task
    pinTask: boolean
}

class Timer implements Readable<TimerState> {
    private plugin: PomodoroTimerPlugin

    private logger: Logger

    private state: TimerState

    private store: Writable<TimerState>

    private clock: any

    public subscribe

    constructor(plugin: PomodoroTimerPlugin) {
        this.plugin = plugin
        this.logger = new Logger(plugin)
        this.state = {
            autostart: false,
            running: false,
            lastTick: 0,
            mode: 'WORK',
            elapsed: 0,
            startTime: null,
            inSession: false,
            workLen: plugin.getSettings().workLen,
            breakLen: plugin.getSettings().breakLen,
            count: this.toMillis(plugin.getSettings().workLen),
            duration: plugin.getSettings().workLen,
            task: undefined,
            pinTask: false,
        }
        this.store = writable(this.state)
        this.subscribe = this.store.subscribe
        this.store.subscribe((state) => {
            this.state = state
        })

        this.clock = Worker()
        this.clock.onmessage = ({ data }: any) => {
            this.tick(data as number)
        }
    }

    private toMillis(minutes: number) {
        return minutes * 60 * 1000
    }

    private tick(t: number) {
        let timeup: boolean = false
        let pause: boolean = false
        this.store.update((s) => {
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
    }

    private timeup() {
        let autostart = false
        this.store.update((s) => {
            const log = new TimerLog(
                s.mode,
                Math.floor(s.elapsed / 60000),
                moment(s.startTime),
                moment(),
                s.duration,
                s.task,
            )
            this.logger.log(s)
            notify(log)
            autostart = s.autostart
            return this.endSession(s)
        })
        if (autostart) {
            this.start()
        }
    }

    private notify(state: TimerState) {
        const emoji = state.mode == 'WORK' ? '🍅' : '🥤'
        const text = `${emoji} You have been ${
            state.mode === 'WORK' ? 'working' : 'breaking'
        } for ${state.duration} minutes.`

        if (this.plugin.getSettings().useSystemNotification) {
            const Notification = (require('electron') as any).remote
                .Notification
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

        if ($plugin.getSettings().notificationSound) {
            playSound()
        }
    }
}
