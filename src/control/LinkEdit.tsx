import { useState, useRef } from 'react';
import { IconButton, Stack, TextField } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import { isElectron } from '../api-variable';
import { launch } from '../utils';
import { useGlobal } from 'reactn';
import { shallowEqual, useSelector } from 'react-redux';
import { mediaUploadSelector } from '../selector';
import { IMediaUploadStrings } from '../model';

interface LinkEditProps {
  inValue?: string;
  onValue?: (value: string) => void;
}

export const LinkEdit = ({ inValue, onValue }: LinkEditProps) => {
  const [value, setValue] = useState<string>(inValue || '');
  const [isOffline] = useGlobal('offline');
  const linkRef = useRef<HTMLAnchorElement>(null);
  const t: IMediaUploadStrings = useSelector(mediaUploadSelector, shallowEqual);

  const handleValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onValue && onValue(newValue);
  };

  const doLink = (link: string | undefined) => {
    if (!link) return;
    if (isElectron) {
      launch(link, !isOffline);
    } else {
      linkRef.current?.setAttribute('href', link);
      linkRef.current?.click();
    }
  };

  return (
    <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
      <TextField
        id="link"
        label={t.linkTitle}
        value={value}
        onChange={handleValue}
        sx={{ flexGrow: 1, my: 2 }}
      />
      {value && (
        <IconButton id="launchLink" onClick={() => doLink(value)}>
          <LinkIcon />
        </IconButton>
      )}
      {/* eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid */}
      <a ref={linkRef} href="#" target="_blank" rel="noopener noreferrer"></a>
    </Stack>
  );
};
