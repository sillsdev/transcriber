import {
  Box,
  FormControl,
  FormLabel,
  IconButton,
  Stack,
  TextField,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { LightTooltip } from './LightTooltip';
import MarkDown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { isElectron } from '../api-variable';
import { useRef, useState } from 'react';
import { launch } from '../utils';
import { useGlobal } from 'reactn';
import { IMediaUploadStrings } from '../model';
import { shallowEqual, useSelector } from 'react-redux';
import { mediaUploadSelector } from '../selector';

const gfmSyntax =
  'https://docs.github.com/{0}/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax';

interface MarkDownEditProps {
  inValue?: string;
  onValue?: (value: string) => void;
}

export const MarkDownEdit = ({ inValue, onValue }: MarkDownEditProps) => {
  const [value, setValue] = useState<string>(inValue || '');
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [isOffline] = useGlobal('offline');
  const [lang] = useGlobal('lang');
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
    <Stack direction="row" spacing={2} sx={{ py: 1 }}>
      <TextField
        id="markdown"
        multiline
        label={t.markdownTitle}
        value={value}
        onChange={handleValue}
        sx={{ flexGrow: 1, mr: 1 }}
      />
      {value && (
        <FormControl
          component={'fieldset'}
          sx={{ border: '1px solid grey', flexGrow: 1 }}
        >
          <FormLabel component={'legend'}>Preview</FormLabel>
          <Box sx={{ mx: 1 }}>
            <MarkDown remarkPlugins={[remarkGfm]}>{value}</MarkDown>
          </Box>
        </FormControl>
      )}
      <LightTooltip title="Github markdown syntax supported">
        <IconButton
          onClick={() => doLink(gfmSyntax.replace('{0}', lang))}
          sx={{ alignSelf: 'flex-start', p: '2px' }}
        >
          <InfoIcon fontSize="small" color="secondary" />
        </IconButton>
      </LightTooltip>
      {/* eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid */}
      <a ref={linkRef} href="#" target="_blank" rel="noopener noreferrer"></a>
    </Stack>
  );
};
