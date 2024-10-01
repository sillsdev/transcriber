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
import { useState } from 'react';
import { useGlobal } from 'reactn';
import { IMediaUploadStrings } from '../model';
import { shallowEqual, useSelector } from 'react-redux';
import { mediaUploadSelector } from '../selector';
import { LaunchLink } from './LaunchLink';

const gfmSyntax =
  'https://docs.github.com/{0}/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax';

interface MarkDownEditProps {
  inValue?: string;
  onValue?: (value: string) => void;
}

export const MarkDownEdit = ({ inValue, onValue }: MarkDownEditProps) => {
  const [value, setValue] = useState<string>(inValue || '');
  const [link, setLink] = useState<string>();
  const [lang] = useGlobal('lang');
  const t: IMediaUploadStrings = useSelector(mediaUploadSelector, shallowEqual);

  const handleValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onValue && onValue(newValue);
  };

  return (
    <Stack direction="row" spacing={2} sx={{ py: 1 }}>
      <TextField
        id="markdown"
        multiline
        label={t.markdownTitle}
        value={value}
        onChange={handleValue}
        sx={{ flexGrow: 1, mr: 1, minWidth: '40%' }}
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
          onClick={() => setLink(gfmSyntax.replace('{0}', lang))}
          sx={{ alignSelf: 'flex-start', p: '2px' }}
        >
          <InfoIcon fontSize="small" color="secondary" />
        </IconButton>
      </LightTooltip>
      <LaunchLink url={link} reset={() => setLink('')} />
    </Stack>
  );
};
