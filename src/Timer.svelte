<script lang="ts">
import moment from 'moment'
import { Notice } from 'obsidian'
import { type PomodoroLog, type Mode, POMO_EMOJI } from 'Pomodoro'
import Timeline from 'Timeline.svelte'
import Bell from 'Bell.svelte'
import type { Writable } from 'svelte/store'
import type { Settings } from 'Settings'
const electron = require('electron')

export let store: Writable<Settings>

let mode: Mode = 'WORK'

let note: string | null = null
let ring: () => void

let elapsed: number = 0

let inSession: boolean = false

let running: boolean = false

let extra: 'settings' | 'logs' | 'close' = 'close'

const offset = 440
let startTime: number | null = null
let logs: PomodoroLog[] = []
let lastTick: number | null = startTime

$: duration = mode === 'WORK' ? $store.workLen : $store.breakLen
$: autostart = $store.autostart
$: strokeColor = '#6fdb6f'
$: count = duration * 60 * 1000
$: remaining = moment.duration(count - elapsed)
$: strokeOffset = (remaining.asMilliseconds() * offset) / count
$: useSystemNotification = $store.useSystemNotification

const tick = () => {
    if (!lastTick || !running) {
        return
    }
    let now = new Date().getTime()
    let diff = now - lastTick
    lastTick = now
    if (elapsed + diff >= count) {
        elapsed = count
        timeUp()
        return
    }
    elapsed += diff
    requestAnimationFrame(tick)
}

const timeUp = () => {
    const log = {
        from: moment(startTime),
        to: moment(),
        mode,
        duration: duration,
        note:
            note ||
            `<strong>${mode}</strong>(${duration}min) from ${moment(
                startTime,
            ).format('HH:mm')} to ${moment().format('HH:mm')}`,
    }
    notify(log)
    addLog(log)
    inSession = false
    running = false

    if (autostart) {
        toggleMode()
        start()
    }
}

const notify = (log: PomodoroLog) => {
    const text = `${POMO_EMOJI[mode]} You have been ${
        mode === 'WORK' ? 'working' : 'breaking'
    } for ${duration} minutes.`
    ring()
    if (useSystemNotification) {
        const Notification = (electron as any).remote.Notification
        const sysNotification = new Notification({
            title: `Pomodoro Timer ${log.to.format('hh:mm A')}`,
            body: text,
            silent: true,
        })
        sysNotification.on('click', () => {
            sysNotification.close()
        })
        sysNotification.show()
    } else {
        new Notice(`${text}`)
    }
}

const addLog = (log: PomodoroLog) => {
    logs = [...logs, log]
}

const reset = () => {
    pause()
    inSession = false
    elapsed = 0
    startTime = null
}

const start = () => {
    if (running) {
        return
    }
    if (!inSession) {
        reset()
        startTime = new Date().getTime()
    }
    lastTick = new Date().getTime()
    inSession = true
    running = true
    tick()
}

const pause = () => {
    if (!running) {
        return
    }
    running = false
}

const toggleStart = () => {
    running ? pause() : start()
}

const toggleMode = () => {
    if (mode === 'WORK') {
        mode = 'BREAK'
    } else {
        mode = 'WORK'
    }
    reset()
}

const toggleExtra = (value: 'settings' | 'logs' | 'close') => {
    if (extra === value) {
        extra = 'close'
        return
    }
    extra = value
}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="container">
    <div class="main">
        <div class="timer">
            <div class="timer-display">
                <div class="status control" on:click={toggleMode}>
                    {#if running}<span class="breath"></span>{/if}
                    {#if mode === 'WORK'}
                        <span class="control mode">Work</span>
                    {:else}
                        <span class="control mode">Break</span>
                    {/if}
                    <span></span>
                </div>
                <div on:click={toggleStart} class="control">
                    <h2>
                        {String(remaining.minutes()).padStart(2, '0')} : {String(
                            remaining.seconds(),
                        ).padStart(2, '0')}
                    </h2>
                </div>
            </div>
            <svg
                class="timer"
                width="160"
                height="160"
                xmlns="http://www.w3.org/2000/svg">
                <g>
                    <circle
                        r="69.85699"
                        cy="81"
                        cx="81"
                        stroke-width="2"
                        stroke="#333"
                        fill="none" />
                    <circle
                        class="circle_animation"
                        r="69.85699"
                        cy="81"
                        cx="81"
                        stroke-width="8"
                        stroke={strokeColor}
                        fill="none"
                        style="stroke-dashoffset: {strokeOffset}" />
                </g>
            </svg>
        </div>
        <div class="btn-group">
            <span
                on:click={() => {
                    toggleExtra('settings')
                }}
                class="control">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-settings-2"
                    ><path d="M20 7h-9" /><path d="M14 17H5" /><circle
                        cx="17"
                        cy="17"
                        r="3" /><circle cx="7" cy="7" r="3" /></svg>
            </span>
            <span on:click={reset} class="control">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-rotate-ccw"
                    ><path
                        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path
                        d="M3 3v5h5" /></svg>
            </span>
            {#if !running}
                <span on:click={start} class="control">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-play"
                        ><polygon points="5 3 19 12 5 21 5 3" /></svg>
                </span>
            {:else}
                <span on:click={pause} class="control">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-pause"
                        ><rect width="4" height="16" x="6" y="4" /><rect
                            width="4"
                            height="16"
                            x="14"
                            y="4" /></svg>
                </span>
            {/if}
            <span
                class="control"
                on:click={() => {
                    toggleExtra('logs')
                }}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-list"
                    ><line x1="8" x2="21" y1="6" y2="6" /><line
                        x1="8"
                        x2="21"
                        y1="12"
                        y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line
                        x1="3"
                        x2="3.01"
                        y1="6"
                        y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line
                        x1="3"
                        x2="3.01"
                        y1="18"
                        y2="18" /></svg>
            </span>
        </div>
    </div>
    <div class="extra">
        {#if extra === 'settings'}
            <div class="input-group">
                <div class="input">
                    <label for="pomodoro-wrok-len">Work</label>
                    <input
                        id="pomodoro-work-len"
                        bind:value={$store.workLen}
                        min="1"
                        type="number"
                        disabled={running} />
                </div>
                <div class="input">
                    <label for="pomodoro-break-len">Break</label>
                    <input
                        id="pomodoro-break-len"
                        bind:value={$store.breakLen}
                        min="0"
                        type="number"
                        disabled={running} />
                </div>
                <div class="input">
                    <label for="pomodoro-note">Note</label>
                    <textarea id="pomodoro-note" rows="4" bind:value={note} />
                </div>
                <div class="input">
                    <label for="pomodoro-break-len">Auto start</label>
                    <input
                        id="pomodoro-auto-start"
                        type="checkbox"
                        bind:checked={$store.autostart} />
                </div>
            </div>
        {/if}
        {#if extra === 'logs'}
            <div>
                <Timeline {logs} />
            </div>
        {/if}
    </div>
</div>
<Bell bind:ring />

<style>
.container {
    width: 100%;
    min-width: 200px;
    display: flex;
    flex-direction: column;
    height: 100%;
}
.main {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 2;
    background: var(--background-secondary);
}
.timer {
    position: relative;
    width: 160px;
    height: 160px;
}

.timer svg {
    -webkit-transform: rotate(-90deg);
    transform: rotate(-90deg);
    z-index: 3;
}
.timer-display {
    position: absolute;
    width: 100%;
    height: 160px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    z-index: 4;
    padding: 30px;
}
.status {
    font-size: 0.7rem;
    display: flex;
    align-items: center;
}
.status span {
    display: inline-block;
}
.circle_animation {
    stroke-dasharray: 440; /* this value is the pixel circumference of the circle */
    stroke-dashoffset: 440;
    transition: all 0.25s linear;
}

.btn-group {
    display: flex;
    justify-content: space-between;
    width: 160px;
}

.control {
    cursor: pointer;
}

.control:hover {
    opacity: 0.7;
}

.control svg:active {
    opacity: 0.5;
}
.input-group {
    margin-top: 1.5rem;
    align-self: center;
    width: 100%;
}

.input {
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    width: 100%;
}

.input label {
    display: inline-block;
    width: 80px;
}

.input textarea,
.input input[type='number'] {
    flex: 1;
}

.breath {
    width: 5px;
    height: 5px;
    display: inline-block;
    position: absolute;
    left: 55px;
    background-color: #ff4500;
    border-radius: 5px;
    transform: translate(-50%, -50%);
    animation: blink 2s linear infinite;
}
.extra {
    width: 100%;
    margin-top: 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
}

@keyframes blink {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0;
    }
}
</style>
