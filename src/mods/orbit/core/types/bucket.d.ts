import { Evented } from './evented';
import { Listener } from './notifier';
/**
 * Settings used to instantiate and/or upgrade a `Bucket`.
 */
export interface BucketSettings {
    /**
     * Name used for tracking and debugging a bucket instance.
     */
    name?: string;
    /**
     * The namespace used by the bucket when accessing any items.
     *
     * This is used to distinguish one bucket's contents from another.
     */
    namespace?: string;
    /**
     * The current version of the bucket.
     *
     * Used to identify the version of the bucket's schema and thus migrate it
     * as needed.
     */
    version?: number;
}
/**
 * Buckets can persist state. The base `Bucket` class is abstract and should be
 * extended to create buckets with different persistence strategies.
 *
 * Buckets have a simple map-like interface with methods like `getItem`,
 * `setItem`, and `removeItem`. All methods return promises to enable usage with
 * asynchronous stores like IndexedDB.
 *
 * Buckets can be assigned a unique `namespace` in order to avoid collisions.
 *
 * Buckets can be assigned a version, and can be "upgraded" to a new version.
 * The upgrade process allows buckets to migrate their data between versions.
 */
export declare abstract class Bucket implements Evented {
    private _name;
    private _namespace;
    private _version;
    on: (event: string, listener: Listener) => void;
    off: (event: string, listener?: Listener) => void;
    one: (event: string, listener: Listener) => void;
    emit: (event: string, ...args: any[]) => void;
    listeners: (event: string) => Listener[];
    constructor(settings?: BucketSettings);
    /**
     * Retrieves an item from the bucket.
     */
    abstract getItem(key: string): Promise<any>;
    /**
     * Stores an item in the bucket.
     */
    abstract setItem(key: string, value: any): Promise<void>;
    /**
     * Removes an item from the bucket.
     */
    abstract removeItem(key: string): Promise<void>;
    /**
     * Name used for tracking and debugging a bucket instance.
     */
    readonly name: string;
    /**
     * The namespace used by the bucket when accessing any items.
     *
     * This is used to distinguish one bucket's contents from another.
     */
    readonly namespace: string;
    /**
     * The current version of the bucket.
     *
     * This is read-only. To change versions, `upgrade` should be invoked.
     */
    readonly version: number;
    /**
     * Upgrades Bucket to a new version with new settings.
     *
     * Settings, beyond `version`, are bucket-specific.
     */
    upgrade(settings?: BucketSettings): Promise<void>;
    /**
     * Applies settings passed from a `constructor` or `upgrade`.
     */
    protected _applySettings(settings: BucketSettings): Promise<void>;
}
