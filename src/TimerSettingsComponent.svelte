<script lang="ts">
import { settings } from 'stores'

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

<div class="pomodoro-settings-wrapper">
    <div class="pomodoro-settings-list">
        <div class="pomodoro-settings-item">
            <div class="pomodoro-settings-label">Work</div>
            <div class="pomodoro-settings-control">
                <input
                    value={$settings.workLen}
                    on:change={updateWorkLen}
                    min="1"
                    type="number"
                />
            </div>
        </div>
        <div class="pomodoro-settings-item">
            <div class="pomodoro-settings-label">Break</div>
            <div class="pomodoro-settings-control">
                <input
                    value={$settings.breakLen}
                    on:change={updateBreakLen}
                    min="0"
                    type="number"
                />
            </div>
        </div>
        <div class="pomodoro-settings-item">
            <div class="pomodoro-settings-label">Auto-start</div>
            <div class="pomodoro-settings-control">
                <input type="checkbox" bind:checked={$settings.autostart} />
            </div>
        </div>
        <div class="pomodoro-settings-item">
            <div class="pomodoro-settings-label">Notification Sound</div>
            <div class="pomodoro-settings-control">
                <input
                    type="checkbox"
                    bind:checked={$settings.notificationSound}
                />
            </div>
        </div>
        <div class="pomodoro-settings-item">
            <div class="pomodoro-settings-label">
                Prefer Saving to Task File
            </div>
            <div class="pomodoro-settings-control">
                <input type="checkbox" bind:checked={$settings.logFocused} />
            </div>
        </div>
    </div>
</div>

<style>
.pomodoro-settings-wrapper,
.pomodoro-settings-list,
.pomodoro-settings-item {
    width: 100%;
}

.pomodoro-settings-wrapper {
    border: 1px solid var(--background-modifier-border);
    border-radius: 5px;
}

.pomodoro-settings-item {
    display: flex;
    font-size: 0.8rem;
    align-items: center;
    justify-content: space-between;
    height: 2rem;
    padding: 0.5rem 1rem;
}

.pomodoro-settings-item + .pomodoro-settings-item {
    border-top: 1px solid var(--background-modifier-border);
}

.pomodoro-settings-item input[type='number'] {
    /* width: 100%; */
    font-size: 0.8rem;
    border: none;
    border-radius: 0;
    height: 0.8rem;
    text-align: end;
    background: transparent;
}

.pomodoro-settings-item input[type='number']:active {
    border: none;
    box-shadow: none;
}

.pomodoro-settings-item input[type='number']:focus {
    border: none;
    box-shadow: none;
}
</style>
