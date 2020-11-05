import 'reactn';
import Coordinator from '@orbit/coordinator';
import Memory from '@orbit/memory';
import { Bucket } from '@orbit/core';
import JSONAPISource from '@orbit/jsonapi';
import IndexedDBSource from '@orbit/indexeddb';

declare module 'reactn/default' {
  export interface State {
    organization: string;
    orgRole: string;
    project: string;
    projRole: string;
    plan: string;
    tab: number;
    group: string;
    user: string;
    lang: string;
    coordinator: Coordinator;
    memory: Memory;
    backup: IndexedDBSource;
    bucket: Bucket;
    remote: JSONAPISource;
    remoteBusy: boolean;
    doSave: boolean;
    saveResult: string | undefined;
    snackMessage: JSX.Element;
    changed: boolean;
    projectsLoaded: string[];
    importexportBusy: boolean;
    autoOpenAddMedia: boolean; // open a dialog
    editUserId: string | null;
    developer: boolean;
    offline: boolean;
    errorReporter: any; // bugsnagClient
    alertOpen: boolean;
    coordinatorActivated: boolean;
    fingerprint: string;
    orbitRetries: number;
    enableOffsite: boolean;
  }
}
