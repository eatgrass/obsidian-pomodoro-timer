<script lang="ts">
import moment, { type Moment } from 'moment'
import { Notice } from 'obsidian'

interface PomodoroLog {
    duration: number
    from: Moment
    to: Moment
    mode: Mode
    note: string | null
}

enum Mode {
    'WORK',
    'BREAK',
}

export let workLen: number = 1
export let breakLen: number = 2
export let autostart: boolean = true
let mode = Mode.WORK

let elapsed: number = 0

let inSession: boolean = false

let running: boolean = false

const offset = 440
let startTime: number | null = null
let logs: PomodoroLog[] = []
let lastTick: number | null = startTime

$: duration = mode === Mode.WORK ? workLen : breakLen
$: strokeColor = '#6fdb6f'
$: count = duration * 60 * 1000
$: remaining = moment.duration(count - elapsed)
$: strokeOffset = (remaining.asMilliseconds() * offset) / count

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
    addLog()
    inSession = false
    running = false
    new Notice(
        `You have been ${
            mode === Mode.WORK ? 'working' : 'breaking'
        } for ${duration} minutes. Time to take a break.`,
    )

    if (autostart) {
        toggleMode()
        start()
    }
}

const addLog = () => {
    logs = [
        ...logs,
        {
            from: moment(startTime),
            to: moment(),
            mode,
            duration: duration,
            note: '',
        },
    ]
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
    if (mode === Mode.WORK) {
        mode = Mode.BREAK
    } else {
        mode = Mode.WORK
    }
    reset()
}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="container">
    <div class="timer">
        <div class="timer-display">
            <div class="status control" on:click={toggleMode}>
                {#if running}<span class="breath"></span>{/if}
                {#if mode === Mode.WORK}
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
    </div>
    <div class="input-group">
        <div class="input">
            <label for="pomodoro-wrok-len">Work</label>
            <input
                id="pomodoro-work-len"
                bind:value={workLen}
                min="1"
                type="number"
                disabled={running} />
        </div>
        <div class="input">
            <label for="pomodoro-break-len">Break</label>
            <input
                id="pomodoro-break-len"
                bind:value={breakLen}
                min="0"
                type="number"
                disabled={running} />
        </div>
        <div class="input">
            <label for="pomodoro-break-len">Auto start</label>
            <input
                id="pomodoro-auto-start"
                type="checkbox"
                bind:checked={autostart} />
        </div>
    </div>

    <!-- data table-->
    <div class="logs">
        {#each logs as log}
            <div
                data-callout-metadata=""
                data-callout-fold=""
                data-callout="tip"
                class="callout">
                <div class="callout-title">
                    <div class="callout-icon">
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
                            class="svg-icon lucide-flame"
                            ><path
                                d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
                            ></path
                            ></svg>
                        <span class="callout-duration">{log.duration}m</span>
                    </div>
                    <div class="callout-title-inner">
                        {log.from.format('HH:mm')} - {log.to.format('HH:mm')}
                    </div>
                </div>
            </div>
        {/each}
    </div>
</div>

<style>
.container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.timer {
    position: relative;
    width: 160px;
    height: 160px;
}

.timer svg {
    -webkit-transform: rotate(-90deg);
    transform: rotate(-90deg);
    z-index: 1;
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
    z-index: 2;
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
}

.input {
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
}

.input label {
    display: inline-block;
    width: 80px;
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

@keyframes blink {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0;
    }
}

.logs {
    width: 100%;
}
</style>
