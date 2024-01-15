import type { TaskFormat } from 'Settings'
import { DataviewTaskSerializer } from './DataviewTaskSerializer'
import { DefaultTaskSerializer, DEFAULT_SYMBOLS } from './DefaultTaskSerializer'
import type { Moment } from 'moment'
/**
 * A subset of fields of {@link Task} that can be parsed from the textual
 * description of that Task.
 *
 * All fields are writeable for convenience.
 */
export type TaskDetails = {
    description: string
    priority: string
    startDate: Moment | null
    createdDate: Moment | null
    scheduledDate: Moment | null
    dueDate: Moment | null
    doneDate: Moment | null
    cancelledDate: Moment | null
    recurrenceRule: string
    pomodoros: string
    tags: string[]
}

/**
 * An abstraction that manages how a {@link Task} is read from and written
 * to a file.
 *
 * A {@link TaskDeserializer} is only responsible for the single line of text that follows
 * after the checkbox:
 *
 *        - [ ] This is a task description
 *              ~~~~~~~~~~~~~~~~~~~~~~~~~~
 *
 * {@link TaskDeserializer} is not responsible for:
 *
 *        - Retrieving and setting a fallback scheduled date (done in {@link Task.fromLine})
 *
 * @exports
 * @interface TaskSerializer
 */
export interface TaskDeserializer {
    /**
     * Parses task details from the string representation of a task
     *
     * @param line The single line of text to parse
     * @returns {TaskDetails} Details parsed from {@link line}
     */
    deserialize(line: string): TaskDetails
}

export { DefaultTaskSerializer, DEFAULT_SYMBOLS } from './DefaultTaskSerializer'
export { DataviewTaskSerializer } from './DataviewTaskSerializer'

export const POMODORO_REGEX = new RegExp(
    '(?:(?=[^\\]]+\\])\\[|(?=[^)]+\\))\\() *🍅:: *(\\d* *\\/? *\\d*) *[)\\]](?: *,)?',
)

export const DESERIALIZERS: Record<TaskFormat, TaskDeserializer> = {
    TASKS: new DefaultTaskSerializer(DEFAULT_SYMBOLS),
    DATAVIEW: new DataviewTaskSerializer(),
}
