<script lang="ts">
import { afterUpdate } from 'svelte'

export let render: (content: string, el: HTMLElement) => void
export let content: string
let el: HTMLDivElement
afterUpdate(() => {
    el.empty()
    render(content, el)
})
</script>

<div bind:this={el} class="pomodoro-tasks-item-desc"></div>

<style>
.pomodoro-tasks-item-desc {
    flex: 1;
    overflow: hidden;
    width: 100%;
    pointer-events: none;
    cursor: pointer;
}
</style>
