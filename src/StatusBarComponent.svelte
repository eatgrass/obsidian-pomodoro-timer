<script lang="ts">
import { store, remained } from 'Timer'

const toggleTimer = () => {
    store.toggleTimer()
}
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<span on:click={toggleTimer} class="st-timer">
    <span style="margin-right:3px">
        {#if $store.running}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-timer"
                ><line x1="10" x2="14" y1="2" y2="2" /><line
                    x1="12"
                    x2="15"
                    y1="14"
                    y2="11" /><circle cx="12" cy="14" r="8" /></svg>
        {:else}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="lucide lucide-timer-off"
                ><path d="M10 2h4" /><path
                    d="M4.6 11a8 8 0 0 0 1.7 8.7 8 8 0 0 0 8.7 1.7" /><path
                    d="M7.4 7.4a8 8 0 0 1 10.3 1 8 8 0 0 1 .9 10.2" /><path
                    d="m2 2 20 20" /><path d="M12 12v-2" /></svg>
        {/if}
    </span>
    {$remained.human}</span>

<style>
.st-timer {
    cursor: pointer;
    line-height: 1;
    display: flex;
    align-items: center;
}
</style>
