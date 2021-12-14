import { DialogMode } from '.';

export interface IDialog<T> {
  mode: DialogMode;
  values?: T;
  isOpen: boolean;
  onOpen?: (val: boolean) => void;
  onCommit: (values: T, cb?: (id: string) => Promise<void>) => void;
  onCancel?: () => void;
}
