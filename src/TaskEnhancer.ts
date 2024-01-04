import type PomodoroTimerPlugin from 'main'
import type { MarkdownPostProcessorContext } from 'obsidian'

export const enhancer = (plugin: PomodoroTimerPlugin) => {
    return async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
        if (plugin.getSettings().enableTaskTimer) {
            const tasks = el.querySelectorAll('li.task-list-item')
            tasks.forEach((task) => {
                task.createSpan('pomodoro-focus', (focusEl) => {
                    if (task instanceof HTMLElement) {
                        focusEl.setText('\u23F1\uFE0F')
                        focusEl.dataset.taskPomodoroFocus = ''
                    }
                })
            })
            ctx.sourcePath

            el.addEventListener('click', (event) => {
                let target = event.target
                if (target && target instanceof HTMLElement) {
                    let isFocus = (target as HTMLElement).hasAttribute(
                        'data-task-pomodoro-focus',
                    )
                    if (isFocus) {
                        let info = ctx.getSectionInfo(target)
                        let text = info?.text || ''
                        text = text.replace(/^\S*- \[.{1}\] /, '')
                        plugin.focusTask(ctx.sourcePath, text)
                    }
                }
            })
        }
    }
}
