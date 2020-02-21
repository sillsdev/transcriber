import 'reactn';
import Memory from '@orbit/memory';
import { Schema, KeyMap } from '@orbit/data';
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
    memory: Memory;
    backup: IndexedDBSource;
    schema: Schema;
    keyMap: KeyMap;
    bucket: Bucket;
    remote: JSONAPISource;
    remoteBusy: boolean;
    autoOpenAddMedia: boolean; // open a dialog
    editUserId: string | null;
    developer: boolean;
    offline: boolean;
  }
}
