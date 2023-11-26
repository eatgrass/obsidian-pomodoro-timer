<script lang="ts">
import type { PomodoroLog } from 'Pomodoro'
export let logs: PomodoroLog[] = []
</script>

<ul class="timeline">
    {#each logs as log}
        <li class="event" data-date={log.to} data-mode={log.mode}>
            <div class="content">
                <div class="content-header">
                    <p style="color:var(--text-muted)">
                        {#if log.mode === 'WORK'}
                            <span>🍅 </span>
                        {:else}
                            <span>🥤 </span>
                        {/if}
                        {log.to.format('HH:mm')} <span class="duration">{log.duration} min</span>
                    </p>
                    
                </div>
                <div class="content-body">
                    <p>{log.note}</p>
                    <p>
                        
                    </p>
                </div>
            </div>
        </li>
    {/each}
</ul>

<style>
.timeline {
    width: 100%;
    padding-left: 0;
}

.timeline p {
    margin: 0;
}

.event {
    list-style: none;
    /* border-left: 4px solid #6fdb6f; */
    padding: 0 1em;
    /* background-color: var(--background-secondary-alt); */
}

.content {
    border-bottom: 1px dashed var(--background-modifier-border-hover);
    padding: 1em 0;
    display: flex;
    align-items: center;
}

.duration {
    font-size: 0.7rem;
    background-color: var(--background-secondary-alt);
    border-radius: 9px;
    padding: 3px 8px;
    color: var(--text-faint);
}
.content-header {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 135px;
}

.content-body {
    flex: 1;
}
</style>
