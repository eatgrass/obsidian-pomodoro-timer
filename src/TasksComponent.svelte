<script lang="ts">
import TaskItemComponent from 'TaskItemComponent.svelte'
import type TaskTracker from 'TaskTracker'
import Tasks, { type TaskItem } from 'Tasks'
import { settings } from 'stores'
import { Menu } from 'obsidian'

export let tasks: Tasks
export let tracker: TaskTracker
export let render: (content: string, el: HTMLElement) => void
const r = (content: string, el: HTMLElement) => {
    render(content, el)
}

let status = ''
let query = ''

$: filtered = $tasks
    ? $tasks.list.filter((item) => {
          let statusMatch = true
          let textMatch = true
          if (query) {
              textMatch = item.name.toLowerCase().includes(query.toLowerCase())
          }
          if (status) {
              if (status === 'todo') statusMatch = !item.checked
              if (status === 'completed') statusMatch = item.checked
          }

          return statusMatch && textMatch
      })
    : []

const activeTask = (task: TaskItem) => {
    tracker.active(task)
}

const togglePinned = () => {
    tracker.togglePinned()
}

const changeTaskName = (e: Event) => {
    let target = e.target as HTMLInputElement
    tracker.setTaskName(target.value)
}

const removeTask = () => {
    tracker.clear()
}

const progress = (item: TaskItem) => {
    if (!$settings.showTaskProgress) {
        return 0
    }
    if (item.expected > 0 && item.actual >= 0) {
        return ((item.actual / item.expected) * 100).toFixed(2)
    }
    return 0
}

const progressText = (item: TaskItem) => {
    let { actual, expected } = item
    if (expected > 0) {
        let unfinished = expected - actual
        let max = Math.max(expected, actual)
        if (max > 10) {
            if (unfinished > 0) {
                return `◌ x ${unfinished} 🍅 x ${actual}`
            } else {
                return `🍅 x ${expected}  🥫 x ${Math.abs(unfinished)}`
            }
        } else {
            if (unfinished > 0) {
                return `${'🍅'.repeat(actual)}${'◌'.repeat(unfinished)}`
            } else {
                return `${'🍅'.repeat(expected)}${'🥫'.repeat(
                    Math.abs(unfinished),
                )}`
            }
        }
    } else {
        return actual > 10
            ? `🍅 x ${actual}`
            : actual > 0
              ? `${'🍅'.repeat(actual)}`
              : `- -`
    }
}

const openFile = (e: MouseEvent) => {
    tracker.openFile(e)
}

const showTaskMenu = (task: TaskItem) => (e: MouseEvent) => {
    const menu = new Menu()
    menu.addItem((item) => {
        item.setTitle('Open').onClick(() => {
            tracker.openTask(e, task)
        })
    })
    menu.showAtMouseEvent(e)
}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->

{#if $tracker.file}
    <div class="pomodoro-tasks-wrapper">
        <div class="pomodoro-tasks-header">
            <div class="pomodoro-tasks-header-title">
                <span class="pomodoro-tasks-pin" on:click={togglePinned}>
                    {#if !$tracker.pinned}
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
                            class="lucide lucide-pin"
                            ><line x1="12" x2="12" y1="17" y2="22" /><path
                                d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"
                            /></svg
                        >
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
                            class="lucide lucide-pin-off"
                            ><line x1="2" x2="22" y1="2" y2="22" /><line
                                x1="12"
                                x2="12"
                                y1="17"
                                y2="22"
                            /><path
                                d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h12"
                            /><path d="M15 9.34V6h1a2 2 0 0 0 0-4H7.89" /></svg
                        >
                    {/if}
                </span>
                <span class="pomodoro-tasks-file-name" on:click={openFile}>
                    {$tracker.file.name}
                </span>
                <span class="pomodoro-tasks-count">
                    {filtered.length} tasks
                </span>
            </div>
            {#if $tasks.list.length > 0}
                <div class="pomodoro-tasks-active">
                    {#if $tracker.task}
                        <div class="pomodoro-tasks-item">
                            <div class="pomodoro-tasks-name">
                                <input
                                    type="text"
                                    value={$tracker.task?.name}
                                    on:input={changeTaskName}
                                />
                                <span
                                    class="pomodoro-tasks-remove"
                                    on:click={removeTask}
                                >
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
                                        class="lucide lucide-x"
                                        ><path d="M18 6 6 18" /><path
                                            d="m6 6 12 12"
                                        /></svg
                                    >
                                </span>
                            </div>
                        </div>
                    {/if}
                </div>
                <div class="pomodoro-tasks-toolbar">
                    <div class="pomodoro-tasks-filters">
                        <span
                            on:click={() => (status = '')}
                            class="pomodoro-tasks-filter {status === ''
                                ? 'filter-active'
                                : ''}">All</span
                        >
                        <span
                            on:click={() => (status = 'todo')}
                            class="pomodoro-tasks-filter {status === 'todo'
                                ? 'filter-active'
                                : ''}">Todo</span
                        >
                        <span
                            on:click={() => (status = 'completed')}
                            class="pomodoro-tasks-filter {status === 'completed'
                                ? 'filter-active'
                                : ''}">Completed</span
                        >
                    </div>
                </div>
                <div class="pomodoro-tasks-text-filter">
                    <input
                        type="text"
                        bind:value={query}
                        placeholder="Search..."
                    />
                </div>
            {/if}
        </div>
        {#if filtered.length > 0}
            <div class="pomodoro-tasks-list">
                {#each filtered as item}
                    <div
                        on:click={() => {
                            activeTask(item)
                        }}
                        on:contextmenu={showTaskMenu(item)}
                        style="background: linear-gradient(to right, rgba(var(--color-green-rgb),0.25) {progress(
                            item,
                        )}%, transparent 0%)"
                        class="pomodoro-tasks-item {item.checked
                            ? 'pomodoro-tasks-checked'
                            : ''}"
                    >
                        <div class="pomodoro-tasks-name">
                            {#if item.checked}
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
                                    class="lucide lucide-check"
                                    ><path d="M20 6 9 17l-5-5" /></svg
                                >
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
                                    class="lucide lucide-circle"
                                    ><circle cx="12" cy="12" r="10" /></svg
                                >
                            {/if}
                            <TaskItemComponent
                                render={r}
                                content={item.description}
                            />
                        </div>
                        <div class="pomodoro-tasks-progress">
                            {progressText(item)}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
{/if}

<style>
.pomodoro-tasks-wrapper {
    width: 100%;
    border: 1px solid var(--background-modifier-border);
    border-radius: 5px;
}

.pomodoro-tasks-header-title {
    width: 100%;
    background-color: var(--background-modifier-active-hover);
    padding: 0.5rem 1rem;
    font-size: 1rem;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}

.pomodoro-tasks-header-title .pomodoro-tasks-file-name {
    flex: 1;
    text-wrap: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 5px;
}

.pomodoro-tasks-file-name {
    cursor: pointer;
}

.pomodoro-tasks-header-title .pomodoro-tasks-count {
    width: 50px;
}

.pomodoro-tasks-list,
.pomodoro-tasks-active {
    border-top: 1px solid var(--background-modifier-border);
    width: 100%;
}

.pomodoro-tasks-item {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 0.5rem 1rem;
    display: flex;
}

.pomodoro-tasks-list .pomodoro-tasks-item {
    cursor: pointer;
}

.pomodoro-tasks-toolbar {
    width: 100%;
}

.pomodoro-tasks-count {
    color: var(--text-faint);
    font-size: 0.8rem;
    text-wrap: nowrap;
}
.pomodoro-tasks-filters {
    padding: 0.5rem 1rem;
}

.pomodoro-tasks-text-filter {
    border-top: 1px solid var(--background-modifier-border);
    padding: 0.5rem 0rem;
}

.pomodoro-tasks-wrapper input {
    width: 100%;
    font-size: 0.8rem;
    border: none;
    border-radius: 0;
    background: transparent;
}

.pomodoro-tasks-wrapper input:active {
    border: none;
    box-shadow: none;
}

.pomodoro-tasks-wrapper input:focus {
    border: none;
    box-shadow: none;
}

.pomodoro-tasks-text-filter input {
    height: 0.8rem;
}

.pomodoro-tasks-filter {
    font-size: 0.8rem;
    padding: 1px 7px;
    border-radius: 10px;
    cursor: pointer;
    color: var(--text-muted);
}

.pomodoro-tasks-name svg {
    margin-right: 5px;
}

.pomodoro-tasks-name svg {
    color: var(--color-blue);
}

.pomodoro-tasks-checked .pomodoro-tasks-name svg {
    color: var(--color-green);
}

.pomodoro-tasks-name {
    width: 100%;
    display: flex;
    align-items: baseline;
}

.filter-active {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent-inverted);
}

.pomodoro-tasks-item + .pomodoro-tasks-item {
    border-top: 1px solid var(--background-modifier-border);
}

.pomodoro-tasks-checked .pomodoro-tasks-name {
    text-decoration: line-through;
    color: var(--text-muted);
}

.pomodoro-tasks-pin {
    cursor: pointer;
    padding-right: 3px;
}

.pomodoro-tasks-remove {
    cursor: pointer;
}
.pomodoro-tasks-progress {
    font-size: 0.7rem;
    color: var(--text-muted);
    text-align: end;
    text-wrap: nowrap;
    overflow: hidden;
}
</style>
