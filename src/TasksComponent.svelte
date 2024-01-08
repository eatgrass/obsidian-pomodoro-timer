<script lang="ts">
import Tasks, { type TaskItem } from 'Tasks'
export let tasks: Tasks

let status = ''
let query = ''

$: active = $tasks.active

$: filtered = $tasks
    ? $tasks.list.filter((item) => {
          let statusMatch = true
          let textMatch = true
          if (query) {
              textMatch = item.text.includes(query)
          }
          if (status) {
              if (status === 'todo') statusMatch = !item.checked
              if (status === 'completed') statusMatch = item.checked
          }

          return statusMatch && textMatch
      })
    : []

const select = (item: TaskItem) => {
    tasks.setActive(item)
}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="pomodoro-task-wrapper">
    {#if $tasks.file}
        <div class="pomodoro-tasks-header">
            <div class="pomodoro-tasks-header-title">
                <span>{$tasks.file.name}</span>
                <span class="pomodoro-tasks-count">
                    {filtered.length} tasks
                </span>
            </div>
            {#if $tasks.list.length > 0}
                <div class="pomodoro-tasks-list">
                    {#if active}
                        <div
                            class="pomodoro-tasks-item {active.checked
                                ? 'pomodoro-tasks-checked'
                                : ''}"
                        >
                            <div class="pomodoro-tasks-name">
                                {#if active.checked}
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
                                <div>{active.text}</div>
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
        <div class="pomodoro-tasks-list">
            {#each filtered as item}
                <div
                    on:click={() => {
                        select(item)
                    }}
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
                        <div>{item.text}</div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
.pomodoro-task-wrapper {
    width: 100%;
    border: 1px solid var(--background-modifier-border);
}

.pomodoro-tasks-header-title {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}

.pomodoro-tasks-list {
    border-top: 1px solid var(--background-modifier-border);
    width: 100%;
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

.pomodoro-tasks-text-filter input {
    width: 100%;
    font-size: 0.8rem;
    height: 0.8rem;
    border: none;
    border-radius: 0;
}

.pomodoro-tasks-text-filter input:active {
    border: none;
    box-shadow: none;
}

.pomodoro-tasks-text-filter input:focus {
    border: none;
    box-shadow: none;
}

.pomodoro-tasks-filter {
    font-size: 0.8rem;
    padding: 1px 7px;
    border-radius: 10px;
    cursor: pointer;
    color: var(--text-muted);
}

.pomodoro-tasks-item {
    width: 100%;
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    cursor: pointer;
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
    align-items: center;
}

.pomodoro-tasks-name div {
    overflow: hidden;
    text-wrap: nowrap;
    flex: 1;
    text-overflow: ellipsis;
}

.filter-active {
    background-color: var(--interactive-accent);
    color: var(--text-on-accent-inverted);
}

.pomodoro-tasks-item + .pomodoro-tasks-item {
    border-top: 1px solid var(--background-modifier-border);
}

.pomodoro-tasks-checked {
    text-decoration: line-through;
    color: var(--text-muted);
}
.pomodoro-tasks-header .pomodoro-tasks-item {
    background-color: rgba(var(--color-green-rgb), 0.2);
}
</style>
