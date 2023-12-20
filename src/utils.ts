import type { Log } from 'Timer'
import { type App, TFile } from 'obsidian'

export function getTemplater(app: App) {
    return app.plugins.plugins['templater-obsidian']
}

export async function parseWithTemplater(
    app: App,
    path: string,
    templateContent: string,
    log: Log,
) {
    const templater = getTemplater(app)

    if (!templater) return templateContent

    const tfile = app.vault.getAbstractFileByPath(path)
    const preamble = `<%* const log = ${JSON.stringify(
        log,
    )}; log.begin = moment(log.begin); log.end = moment(log.end); log.finished = log.duration == log.session %>`

    if (tfile instanceof TFile) {
        return await (
            templater.templater as {
                parse_template: (
                    opt: { target_file: TFile; run_mode: number },
                    content: string,
                ) => Promise<string>
            }
        ).parse_template(
            { target_file: tfile, run_mode: 4 },
            `${preamble}${templateContent}`,
        )
    } else {
        return templateContent
    }
}
