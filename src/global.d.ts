import 'reactn';
import { Store, Schema, KeyMap } from '@orbit/data';

declare module 'reactn/default' {
  export interface State {
    organization: string;
    project: string;
    plan: string;
    tab: number,
    group: string;
    user: string;
    lang: string;
    dataStore: Store;
    schema: Schema;
    keyMap: KeyMap;
  }
}
