import { useState } from 'react';
import { IconButton, Stack, TextField } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import { shallowEqual, useSelector } from 'react-redux';
import { mediaUploadSelector } from '../selector';
import { IMediaUploadStrings } from '../model';
import { LaunchLink } from './LaunchLink';
import { isUrl } from '../utils';

interface LinkEditProps {
  inValue?: string;
  onValue?: (value: string) => void;
}

export const LinkEdit = ({ inValue, onValue }: LinkEditProps) => {
  const [value, setValue] = useState<string>(inValue || '');
  const [link, setLink] = useState<string>();
  const t: IMediaUploadStrings = useSelector(mediaUploadSelector, shallowEqual);

  const handleValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onValue && onValue(newValue);
  };

  return (
    <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
      <TextField
        id="link"
        label={t.linkTitle}
        value={value}
        color={!value || isUrl(value) ? 'primary' : 'error'}
        onChange={handleValue}
        sx={{ flexGrow: 1, my: 2, minWidth: 400 }}
      />
      {isUrl(value) && (
        <IconButton id="launchLink" onClick={() => setLink(value)}>
          <LinkIcon />
        </IconButton>
      )}
      <LaunchLink url={link} reset={() => setLink('')} />
    </Stack>
  );
};
