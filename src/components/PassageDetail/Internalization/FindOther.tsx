import { SyntheticEvent, useEffect, useState } from 'react';
import { BibleResource } from '../../../model/bible-resource';
import { Autocomplete, Divider, Grid, Stack, TextField } from '@mui/material';
import ResourceItem from './ResourceItem';
import { LaunchLink } from '../../../control/LaunchLink';
import { BibleProjectLang } from '../../../model/bible-project-lang';
import { IFindResourceStrings } from '../../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { findResourceSelector } from '../../../selector';
import { OptionProps } from './FindTabs';

interface FindOtherProps {
  resources: BibleResource[];
  handleLink: (
    kind: string
  ) => (_event: SyntheticEvent, newValue: OptionProps | null) => void;
}

export default function FindOther({ resources, handleLink }: FindOtherProps) {
  const [link, setLink] = useState<string>();
  const [bibleProjectLangs, setBibleProjectLangs] = useState<OptionProps[]>([]);
  const t: IFindResourceStrings = useSelector(
    findResourceSelector,
    shallowEqual
  );

  useEffect(() => {
    import('../../../assets/bibleprojectlang_2024-08-23.js').then((module) => {
      setBibleProjectLangs(
        module.default.map((item: BibleProjectLang) => ({
          label: `${item.item} - [${item.local}]`,
          value: item.href,
        }))
      );
    });
  }, []);

  return (
    <>
      <Grid
        container
        spacing={2}
        sx={{ alignItems: 'center', justifyContent: 'center' }}
      >
        {resources
          .filter((r) => r.featured)
          .map((resource) => (
            <ResourceItem
              key={resource.name}
              resource={resource}
              onLink={setLink}
            />
          ))}

        <Grid item>
          <Stack direction={'row'} sx={{ m: 1 }}>
            <Autocomplete
              disablePortal
              id="bible-project-lang"
              options={bibleProjectLangs}
              onChange={handleLink('bibleProject')}
              sx={{ width: 300 }}
              renderInput={(params) => (
                <TextField {...params} label={t.bibleProjectLang} />
              )}
            />
          </Stack>
        </Grid>
      </Grid>
      <Divider />
      <Grid container spacing={2} sx={{ justifyContent: 'center' }}>
        {resources
          .filter((r) => !r.featured && !r.ai)
          .map((resource) => (
            <ResourceItem
              key={resource.name}
              resource={resource}
              onLink={setLink}
            />
          ))}
      </Grid>
      <LaunchLink url={link} reset={() => setLink('')} />
    </>
  );
}
