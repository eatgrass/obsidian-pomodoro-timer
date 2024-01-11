import { DefaultTaskSerializer } from './DefaultTaskSerializer'
import { Priority } from './TaskModels'
import { toInlineFieldRegex } from 'utils'

/**
 * A symbol map that corresponds to a task format that strives to be compatible with
 *   [Dataview]{@link https://github.com/blacksmithgu/obsidian-dataview}
 */
export const DATAVIEW_SYMBOLS = {
    // NEW_TASK_FIELD_EDIT_REQUIRED
    prioritySymbols: {
        Highest: 'priority:: highest',
        High: 'priority:: high',
        Medium: 'priority:: medium',
        Low: 'priority:: low',
        Lowest: 'priority:: lowest',
        None: '',
    },
    startDateSymbol: 'start::',
    createdDateSymbol: 'created::',
    scheduledDateSymbol: 'scheduled::',
    dueDateSymbol: 'due::',
    doneDateSymbol: 'completion::',
    cancelledDateSymbol: 'cancelled::',
    recurrenceSymbol: 'repeat::',
    pomodorosSymbol: '🍅::',
    TaskFormatRegularExpressions: {
        priorityRegex: toInlineFieldRegex(
            /priority:: *(highest|high|medium|low|lowest)/,
        ),
        startDateRegex: toInlineFieldRegex(/start:: *(\d{4}-\d{2}-\d{2})/),
        createdDateRegex: toInlineFieldRegex(/created:: *(\d{4}-\d{2}-\d{2})/),
        scheduledDateRegex: toInlineFieldRegex(
            /scheduled:: *(\d{4}-\d{2}-\d{2})/,
        ),
        dueDateRegex: toInlineFieldRegex(/due:: *(\d{4}-\d{2}-\d{2})/),
        doneDateRegex: toInlineFieldRegex(/completion:: *(\d{4}-\d{2}-\d{2})/),
        cancelledDateRegex: toInlineFieldRegex(
            /cancelled:: *(\d{4}-\d{2}-\d{2})/,
        ),
        recurrenceRegex: toInlineFieldRegex(/repeat:: *([a-zA-Z0-9, !]+)/),
        pomodorosRegex: toInlineFieldRegex(/🍅:: *(\d* *\/? *\d*)/),
    },
} as const

/**
 * A {@link TaskSerializer} that that reads and writes tasks compatible with
 *   [Dataview]{@link https://github.com/blacksmithgu/obsidian-dataview}
 */
export class DataviewTaskSerializer extends DefaultTaskSerializer {
    constructor() {
        super(DATAVIEW_SYMBOLS)
    }

    protected parsePriority(p: string): Priority {
        switch (p) {
            case 'highest':
                return Priority.Highest
            case 'high':
                return Priority.High
            case 'medium':
                return Priority.Medium
            case 'low':
                return Priority.Low
            case 'lowest':
                return Priority.Lowest
            default:
                return Priority.None
        }
    }
}
