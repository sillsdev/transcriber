import { Task, Performer } from './task';
/**
 * A `TaskProcessor` performs a `Task` by calling `perform()` on its target.
 * This is triggered by calling `process()` on the processor.
 *
 * A processor maintains a promise that represents the eventual state (resolved
 * or rejected) of the task. This promise is created upon construction, and
 * will be returned by calling `settle()`.
 *
 * A task can be re-tried by first calling `reset()` on the processor. This
 * will clear the processor's state and allow `process()` to be invoked again.
 */
export default class TaskProcessor {
    target: Performer;
    task: Task;
    private _started;
    private _settled;
    private _settlement;
    private _success;
    private _fail;
    /**
     * Creates an instance of TaskProcessor.
     */
    constructor(target: Performer, task: Task);
    /**
     * Clears the processor state, allowing for a fresh call to `process()`.
     */
    reset(): void;
    /**
     * Has `process` been invoked?
     */
    readonly started: boolean;
    /**
     * Has promise settled, either via `process` or `reject`?
     */
    readonly settled: boolean;
    /**
     * The eventual result of processing.
     */
    settle(): Promise<any>;
    /**
     * Invokes `perform` on the target.
     */
    process(): Promise<any>;
    /**
     * Reject the current promise with a specific error.
     *
     * @param e Error associated with rejection
     */
    reject(e: Error): void;
}
