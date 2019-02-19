import * as React from 'react';
import {createDevTools} from 'redux-devtools';
import DockMonitor from 'redux-devtools-dock-monitor';
import LogMonitor from 'redux-devtools-log-monitor';
/**
 * Create the DevTools component and export it.
 */
export default createDevTools(
<DockMonitor
/**
 * Hide or show the dock with "ctrl-h".
 */
toggleVisibilityKey='ctrl-h'
/**
 * Change the position of the dock with "ctrl-q".
 */
changePositionKey='ctrl-q'
defaultIsVisible={false}
>
<LogMonitor theme='tomorrow' />
</DockMonitor>
);