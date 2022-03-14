export declare type Listener = (...args: any[]) => any;
/**
 *  The `Notifier` class can emit messages to an array of subscribed listeners.
 * Here's a simple example:
 *
 * ```ts
 * import { Notifier } from '@orbit/core';
 *
 * let notifier = new Notifier();
 * notifier.addListener((message: string) => {
 *   console.log("I heard " + message);
 * });
 * notifier.addListener((message: string) => {
 *   console.log("I also heard " + message);
 * });
 *
 * notifier.emit('hello'); // logs "I heard hello" and "I also heard hello"
 * ```
 *
 * Calls to `emit` will send along all of their arguments.
 */
export default class Notifier {
    listeners: Listener[];
    constructor();
    /**
     * Add a callback as a listener, which will be triggered when sending
     * notifications.
     */
    addListener(listener: Listener): void;
    /**
     * Remove a listener so that it will no longer receive notifications.
     */
    removeListener(listener: Listener): void;
    /**
     * Notify registered listeners.
     */
    emit(...args: any[]): void;
}
