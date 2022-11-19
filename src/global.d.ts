import 'reactn';
import Coordinator from '@orbit/coordinator';
import Memory from '@orbit/memory';
import { AlertSeverity } from './hoc/SnackBar';
import { RoleNames } from './model';
import 'redux-thunk/extend-redux';

declare module 'reactn/default' {
  export interface State {
    organization: string;
    orgRole: RoleNames | undefined;
    project: string;
    projType: string;
    plan: string;
    tab: number;
    user: string;
    lang: string;
    coordinator: Coordinator;
    memory: Memory;
    remoteBusy: boolean;
    dataChangeCount: int;
    saveResult: string | undefined;
    snackMessage: JSX.Element;
    snackAlert: AlertSeverity | undefined;
    changed: boolean;
    projectsLoaded: string[];
    loadComplete: boolean;
    importexportBusy: boolean;
    autoOpenAddMedia: boolean; // open a dialog
    editUserId: string | null;
    developer: boolean;
    offline: boolean;
    errorReporter: any; // bugsnagClient
    alertOpen: boolean;
    fingerprint: string;
    orbitRetries: number;
    enableOffsite: boolean;
    connected: boolean;
    offlineOnly: boolean;
    latestVersion: string;
    releaseDate: string;
    progress: number;
    trackedTask: string;
  }
}
