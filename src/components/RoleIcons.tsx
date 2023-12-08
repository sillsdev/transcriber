import Transcriber from '@mui/icons-material/ReceiptOutlined';
import Editor from '@mui/icons-material/RateReviewOutlined';
import { Tooltip } from '@mui/material';
import { useSelector } from 'react-redux';
import { ISharedStrings } from '../model';
import { sharedSelector } from '../selector';

export const TranscriberIcon = () => {
  const ts: ISharedStrings = useSelector(sharedSelector);

  return (
    <Tooltip title={ts.transcriber}>
      <>
        <Transcriber />
        {'\u00A0'}
      </>
    </Tooltip>
  );
};

export const EditorIcon = () => {
  const ts: ISharedStrings = useSelector(sharedSelector);

  return (
    <Tooltip title={ts.editor}>
      <>
        <Editor />
        {'\u00A0'}
      </>
    </Tooltip>
  );
};
