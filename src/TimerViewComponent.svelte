<script lang="ts">
import { settings } from 'stores'
import { type TimerStore, remained } from 'Timer'
export let timer: TimerStore

let extra: 'settings' | 'logs' | 'close' = 'close'
const offset = 600

const strokeColor = '#6fdb6f'
$: strokeOffset = ($remained.millis * offset) / $timer.count

const start = () => {
    if (!$timer.running) {
        timer.start()
    }
}

const reset = () => {
    timer.reset()
}

const pause = () => {
    if ($timer.running) {
        timer.pause()
    }
}

const toggleTimer = () => {
    timer.toggleTimer()
}

const toggleMode = () => {
    timer.toggleMode()
}

const toggleExtra = (value: 'settings' | 'logs' | 'close') => {
    if (extra === value) {
        extra = 'close'
        return
    }
    extra = value
}

const updateWorkLen = (e: Event) => {
    const target = e.target as HTMLInputElement
    const value = parseInt(target.value)
    settings.update((s) => {
        if (value >= 1) {
            s.workLen = value
        }
        target.value = s.workLen.toString()
        return s
    })
}

const updateBreakLen = (e: Event) => {
    const target = e.target as HTMLInputElement
    const value = parseInt(target.value)
    settings.update((s) => {
        if (value >= 0) {
            s.breakLen = value
        }
        target.value = s.workLen.toString()
        return s
    })
}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="container">
    <div class="main">
        <div class="timer">
            <div class="timer-display">
                <div class="status control" on:click={toggleMode}>
                    {#if $timer.running}<span class="breath"></span>{/if}
                    {#if $timer.mode === 'WORK'}
                        <span class="control mode">Work</span>
                    {:else}
                        <span class="control mode">Break</span>
                    {/if}
                    <span></span>
                </div>
                <div on:click={toggleTimer} class="control">
                    <h2>
                        {$remained.human}
                    </h2>
                </div>
            </div>
            <svg
                class="timer"
                width="160"
                height="160"
                xmlns="http://www.w3.org/2000/svg"
            >
                <g>
                    <circle
                        r="69.85699"
                        cy="81"
                        cx="81"
                        stroke-width="2"
                        stroke="#333"
                        fill="none"
                    />
                    <circle
                        class="circle_animation"
                        r="69.85699"
                        cy="81"
                        cx="81"
                        stroke-width="8"
                        stroke={strokeColor}
                        fill="none"
                        style="stroke-dashoffset: {strokeOffset}"
                    />
                </g>
            </svg>
        </div>
        <div class="btn-group">
            <span
                on:click={() => {
                    toggleExtra('settings')
                }}
                class="control"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
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
                        r="3"
                    /><circle cx="7" cy="7" r="3" /></svg
                >
            </span>
            {#if !$timer.running}
                <span on:click={start} class="control">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="lucide lucide-play"
                        ><polygon points="5 3 19 12 5 21 5 3" /></svg
                    >
                </span>
            {:else}
                <span on:click={pause} class="control">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
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
                            y="4"
                        /></svg
                    >
                </span>
            {/if}
            <span on:click={reset} class="control">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="lucide lucide-rotate-ccw"
                    ><path
                        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                    /><path d="M3 3v5h5" /></svg
                >
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
                        value={$settings.workLen}
                        on:change={updateWorkLen}
                        min="1"
                        type="number"
                    />
                </div>
                <div class="input">
                    <label for="pomodoro-break-len">Break</label>
                    <input
                        id="pomodoro-break-len"
                        value={$settings.breakLen}
                        on:change={updateBreakLen}
                        min="0"
                        type="number"
                    />
                </div>
                <div class="input">
                    <label for="pomodoro-break-len">Auto start</label>
                    <input
                        id="pomodoro-auto-start"
                        type="checkbox"
                        bind:checked={$settings.autostart}
                    />
                </div>
            </div>
        {/if}
    </div>
</div>

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
    stroke-dasharray: 600; /* this value is the pixel circumference of the circle */
    stroke-dashoffset: 600;
    /* transition: all 0.2s linear; */
}

.btn-group {
    margin-top: 1rem;
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
    margin-top: 2.5rem;
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
