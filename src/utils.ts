import type { Log } from 'Timer'
import { type App, TFile, moment, Notice } from 'obsidian'
import {
    getDailyNote,
    createDailyNote,
    getAllDailyNotes,
} from 'obsidian-daily-notes-interface'

export function getTemplater(app: App) {
    return app.plugins.plugins['templater-obsidian']
}

export async function parseWithTemplater(
    app: App,
    tfile: TFile,
    templateContent: string,
    log: Log,
) {
    const templater = getTemplater(app)

    if (!templater) return templateContent

    const preamble = `<%* const log = ${JSON.stringify(
        log,
    )}; log.begin = moment(log.begin); log.end = moment(log.end); log.finished = log.duration == log.session %>`

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
}

export const ensureFileExists = async (
    app: App,
    path: string,
): Promise<TFile> => {
    const dirs = path.replace(/\\/g, '/').split('/')
    dirs.pop() // remove basename

    if (dirs.length) {
        const dir = join(...dirs)
        if (app.vault.getAbstractFileByPath(dir)) {
            await app.vault.createFolder(dir)
        }
    }

    const file = app.vault.getAbstractFileByPath(path)
    if (file) {
        if (file instanceof TFile) {
            const md = file as TFile
            if (md.extension == 'md') {
                return md
            } else {
                throw new Error(`invalid file extension: ${md.extension}`)
            }
        } else {
            throw new Error(`invalid file path: ${path}`)
        }
    } else {
        return await app.vault.create(path, '')
    }
}

export const join = (...partSegments: string[]): string => {
    // Split the inputs into a list of path commands.
    let parts: string[] = []
    for (let i = 0, l = partSegments.length; i < l; i++) {
        parts = parts.concat(partSegments[i].split('/'))
    }
    // Interpret the path commands to get the new resolved path.
    const newParts = []
    for (let i = 0, l = parts.length; i < l; i++) {
        const part = parts[i]
        // Remove leading and trailing slashes
        // Also remove "." segments
        if (!part || part === '.') continue
        // Push new path segments.
        else newParts.push(part)
    }
    // Preserve the initial slash if there was one.
    if (parts[0] === '') newParts.unshift('')
    // Turn back into a single string path.
    return newParts.join('/')
}

export const getDailyNoteFile = async (): Promise<TFile> => {
    const file = getDailyNote(moment() as any, getAllDailyNotes())
    if (!file) {
        return await createDailyNote(moment() as any)
    }
    return file
}

export const appendFile = async (
    app: App,
    file: TFile,
    logText: string,
): Promise<void> => {
    await app.vault.append(file, logText)
}
