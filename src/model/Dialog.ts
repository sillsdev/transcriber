import { DialogMode } from '.';

export interface IDialog<T> {
  mode: DialogMode;
  values?: T;
  isOpen: boolean;
  onOpen?: (val: boolean) => void;
  onCommit: (values: T) => void;
  onCancel?: () => void;
}
