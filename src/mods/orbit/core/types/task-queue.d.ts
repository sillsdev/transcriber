import { Task, Performer } from './task';
import TaskProcessor from './task-processor';
import { Bucket } from './bucket';
import { Evented } from './evented';
import { Listener } from './notifier';
/**
 * Settings for a `TaskQueue`.
 */
export interface TaskQueueSettings {
    /**
     * Name used for tracking and debugging a task queue.
     */
    name?: string;
    /**
     * A bucket in which to persist queue state.
     */
    bucket?: Bucket;
    /**
     * A flag indicating whether tasks should be processed as soon as they are
     * pushed into a queue. Set to `false` to override the default `true`
     * behavior.
     */
    autoProcess?: boolean;
}
/**
 * `TaskQueue` is a FIFO queue of asynchronous tasks that should be
 * performed sequentially.
 *
 * Tasks are added to the queue with `push`. Each task will be processed by
 * calling its `process` method.
 *
 * By default, task queues will be processed automatically, as soon as tasks
 * are pushed to them. This can be overridden by setting the `autoProcess`
 * setting to `false` and calling `process` when you'd like to start
 * processing.
 */
export default class TaskQueue implements Evented {
    autoProcess: boolean;
    private _name;
    private _performer;
    private _bucket;
    private _tasks;
    private _processors;
    private _error;
    private _resolution;
    private _resolve;
    private _reject;
    private _reified;
    on: (event: string, listener: Listener) => void;
    off: (event: string, listener?: Listener) => void;
    one: (event: string, listener: Listener) => void;
    emit: (event: string, ...args: any[]) => void;
    listeners: (event: string) => Listener[];
    /**
     * Creates an instance of `TaskQueue`.
     */
    constructor(target: Performer, settings?: TaskQueueSettings);
    /**
     * Name used for tracking / debugging this queue.
     */
    readonly name: string;
    /**
     * The object which will `perform` the tasks in this queue.
     */
    readonly performer: Performer;
    /**
     * A bucket used to persist the state of this queue.
     */
    readonly bucket: Bucket;
    /**
     * The number of tasks in the queue.
     */
    readonly length: number;
    /**
     * The tasks in the queue.
     */
    readonly entries: Task[];
    /**
     * The current task being processed (if actively processing), or the next
     * task to be processed (if not actively processing).
     */
    readonly current: Task;
    /**
     * The processor wrapper that is processing the current task (or next task,
     * if none are being processed).
     */
    readonly currentProcessor: TaskProcessor;
    /**
     * If an error occurs while processing a task, processing will be halted, the
     * `fail` event will be emitted, and this property will reflect the error
     * encountered.
     */
    readonly error: Error;
    /**
     * Is the queue empty?
     */
    readonly empty: boolean;
    /**
     * Is the queue actively processing a task?
     */
    readonly processing: boolean;
    /**
     * Resolves when the queue has been fully reified from its associated bucket,
     * if applicable.
     */
    readonly reified: Promise<void>;
    /**
     * Push a new task onto the end of the queue.
     *
     * If `autoProcess` is enabled, this will automatically trigger processing of
     * the queue.
     *
     * Returns a promise that resolves when the pushed task has been processed.
     */
    push(task: Task): Promise<void>;
    /**
     * Cancels and re-tries processing the current task.
     *
     * Returns a promise that resolves when the pushed task has been processed.
     */
    retry(): Promise<void>;
    /**
     * Cancels and discards the current task.
     *
     * If `autoProcess` is enabled, this will automatically trigger processing of
     * the queue.
     */
    skip(e?: Error): Promise<void>;
    /**
     * Cancels the current task and completely clears the queue.
     */
    clear(e?: Error): Promise<void>;
    /**
     * Cancels the current task and removes it, but does not continue processing.
     *
     * Returns the canceled and removed task.
     */
    shift(e?: Error): Promise<Task>;
    /**
     * Cancels processing the current task and inserts a new task at the beginning
     * of the queue. This new task will be processed next.
     *
     * Returns a promise that resolves when the new task has been processed.
     */
    unshift(task: Task): Promise<void>;
    /**
     * Processes all the tasks in the queue. Resolves when the queue is empty.
     */
    process(): Promise<any>;
    private _settle;
    private _complete;
    private _fail;
    private _cancel;
    private _settleEach;
    private _reify;
    private _persist;
}
