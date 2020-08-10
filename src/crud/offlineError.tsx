import React from 'react';
import { ISharedStrings } from '../model';

interface IStateProps {
  ts: ISharedStrings;
}

interface IProps extends IStateProps {
  online: boolean;
  err: {
    message: string;
  };
  setMessage: React.Dispatch<React.SetStateAction<JSX.Element>>;
}

export const offlineError = (props: IProps) => {
  const { online, err, setMessage, ts } = props;

  if (!online) {
    setMessage(<span>{ts.NoSaveOffline}</span>);
  } else {
    setMessage(<span>{err.message}</span>);
  }
};
