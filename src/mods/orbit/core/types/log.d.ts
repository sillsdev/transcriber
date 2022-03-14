import { Evented } from './evented';
import { Listener } from './notifier';
import { Bucket } from './bucket';
export interface LogOptions {
    name?: string;
    data?: string[];
    bucket?: Bucket;
}
/**
 * Logs track a series of unique events that have occurred. Each event is
 * tracked based on its unique id. The log only tracks the ids but currently
 * does not track any details.
 *
 * Logs can automatically be persisted by assigning them a bucket.
 */
export default class Log implements Evented {
    private _name;
    private _bucket;
    private _data;
    reified: Promise<void>;
    on: (event: string, listener: Listener) => void;
    off: (event: string, listener?: Listener) => void;
    one: (event: string, listener: Listener) => void;
    emit: (event: string, ...args: any[]) => void;
    listeners: (event: string) => Listener[];
    constructor(options?: LogOptions);
    readonly name: string;
    readonly bucket: Bucket;
    readonly head: string;
    readonly entries: string[];
    readonly length: number;
    append(...ids: string[]): Promise<void>;
    before(id: string, relativePosition?: number): string[];
    after(id: string, relativePosition?: number): string[];
    truncate(id: string, relativePosition?: number): Promise<void>;
    rollback(id: string, relativePosition?: number): Promise<void>;
    clear(): Promise<void>;
    contains(id: string): boolean;
    _persist(): Promise<void>;
    _reify(data: string[]): void;
    _initData(data: string[]): void;
}
