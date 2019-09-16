import 'reactn';
import { Store, Schema, KeyMap } from '@orbit/data';
import { Bucket } from '@orbit/core';

declare module 'reactn/default' {
  export interface State {
    organization: string;
    project: string;
    plan: string;
    tab: number;
    group: string;
    user: string;
    lang: string;
    memory: Store;
    schema: Schema;
    keyMap: KeyMap;
    bucket: Bucket;
  }
}
