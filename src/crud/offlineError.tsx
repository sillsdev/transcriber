import { ISharedStrings } from '../model';

interface IStateProps {
  ts: ISharedStrings;
}

interface IProps extends IStateProps {
  online: boolean;
  err: {
    message: string;
  };
  showMessage: (msg: string) => void;
}

export const offlineError = (props: IProps) => {
  const { online, err, showMessage, ts } = props;

  if (!online) {
    showMessage(ts.NoSaveOffline);
  } else {
    showMessage(err.message);
  }
};
