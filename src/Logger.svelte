<script lang="ts">
import type { PomodoroLog } from 'Pomodoro'
import { Menu, Notice, TFile } from 'obsidian'
import type { Writable } from 'svelte/store'
import type { Settings } from 'Settings'
import { settings, plugin } from 'stores'

import {
    getDailyNote,
    createDailyNote,
    getAllDailyNotes,
} from 'obsidian-daily-notes-interface'

import moment from 'moment'

let logs: PomodoroLog[] = []

export let show: boolean = false

const getDailyNoteFile = async (): Promise<TFile> => {
    const file = getDailyNote(moment() as any, getAllDailyNotes())
    if (!file) {
        return await createDailyNote(moment() as any)
    }
    return file
}

const appendFile = async (filePath: string, logText: string): Promise<void> => {
    await $plugin.app.vault.adapter.append(filePath, logText)
}

export const addLog = async (log: PomodoroLog): Promise<void> => {
    logs = [...logs, log]
    if ($settings.logFile === 'DAILY') {
        let file = (await getDailyNoteFile()).path
        await appendFile(file, `\n${log.logText()}`)
    }
    if ($settings.logFile === 'FILE') {
        let path = $settings.logPath || $settings.logPath.trim()
        if (path !== '') {
            if (!(await $plugin.app.vault.adapter.exists(path))) {
                await $plugin.app.vault.create(path, log.logText())
            } else {
                await appendFile(path, `\n${log.logText()}`)
            }
        }
    }
}

const showMenu = (e: MouseEvent) => {
    const menu = new Menu()

    menu.addItem((item) =>
        item.setTitle('Copy').onClick(() => {
            new Notice('Copied')
        }),
    )

    menu.addItem((item) =>
        item.setTitle('Copy all').onClick(() => {
            new Notice('Copied')
        }),
    )

    menu.addSeparator()

    menu.addItem((item) =>
        item.setTitle('Remove').onClick(() => {
            new Notice('Pasted')
        }),
    )

    menu.addItem((item) =>
        item.setTitle('Remove all').onClick(() => {
            new Notice('Pasted')
        }),
    )
    menu.showAtMouseEvent(e)
}
</script>

{#if show}
    <ul class="timeline">
        {#each logs as log}
            <li class="event" data-date={log.end} data-mode={log.mode}>
                <div class="content">
                    <div class="content-header">
                        <p style="color:var(--text-muted)">
                            {#if log.mode === 'WORK'}
                                <span>🍅 </span>
                            {:else}
                                <span>🥤 </span>
                            {/if}
                            {log.end.format('HH:mm')}
                            <span class="duration"> {log.duration} min</span>
                        </p>
                    </div>
                    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                    <div class="content-body">
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <p on:contextmenu={showMenu}>
                            <!-- {renderLog(
                                log.mode === 'WORK'
                                    ? $settings.workTemplate
                                    : $settings.breakTemplate,
                                log,
                            )} -->
                        </p>
                    </div>
                </div>
            </li>
        {/each}
    </ul>
{/if}

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
    font-size: 0.65rem;
    background-color: var(--background-secondary-alt);
    border-radius: 9px;
    padding: 2px 6px;
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
