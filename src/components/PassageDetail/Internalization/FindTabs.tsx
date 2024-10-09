import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { Badge } from '@mui/material';
import FindBibleBrain from './FindBibleBrain';
import FindOther from './FindOther';
import CreateAiRes from './CreateAiRes';
import usePassageDetailContext from '../../../context/usePassageDetailContext';
import { ReactNode, SyntheticEvent, useEffect, useState } from 'react';
import { LaunchLink } from '../../../control/LaunchLink';
import { BibleResource } from '../../../model/bible-resource';
import { IFindResourceStrings } from '../../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { findResourceSelector } from '../../../selector';
import FindAquifer from './FindAquifer';

export enum scopeI {
  passage,
  section,
  book,
  chapter,
  movement
}
export namespace scopeI {
  export function asString(scope: scopeI): string {
    return scopeI[scope];
  }

  export function fromString(scope: string): scopeI {
    return (scopeI as any)[scope];
  }
}
interface Tpl {
  [key: string]: string | undefined;
}

const hrefTpls: Tpl = {
  bibleBrain: 'https://live.bible.is/bible/{0}/{1}/{2}',
};

export interface OptionProps {
  label: string;
  value: string;
}

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

interface FindTabsProps {
  onClose?: () => void;
}

export default function FindTabs({ onClose }: FindTabsProps) {
  const [value, setValue] = useState(0);
  const { passage } = usePassageDetailContext();
  const [resources, setResources] = useState<BibleResource[]>([]);
  const [links, setLinks] = useState<Tpl>({});
  const [link, setLink] = useState<string>();
  const t: IFindResourceStrings = useSelector(
    findResourceSelector,
    shallowEqual
  );

  useEffect(() => {
    import('../../../assets/bible-resource.js').then((module) => {
      setResources(module.default);
    });
  }, []);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleLink =
    (kind: string) =>
      (_event: SyntheticEvent, newValue: OptionProps | null) => {
        const book = passage?.attributes?.book;
        let link = newValue?.value ?? '';
        if (hrefTpls[kind]) {
          const chapter = parseInt(passage?.attributes?.reference ?? '1');
          link = newValue?.value
            ? hrefTpls[kind]
              ?.replace('{0}', newValue?.value ?? '')
              ?.replace('{1}', book ?? 'MAT')
              ?.replace('{2}', chapter.toString()) ?? ''
            : '';
          setLinks({ ...links, [kind]: link });
        }
        setLink(link);
      };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
        >
          <Tab label={t.findBibleBrain} {...a11yProps(0)} />
          <Tab label={'Find: Aquifer'} {...a11yProps(1)} />
          <Tab label={t.findOther} {...a11yProps(2)} />
          <Tab
            label={<Badge badgeContent="AI">{t.create}</Badge>}
            {...a11yProps(3)}
          />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        <FindBibleBrain handleLink={handleLink} onClose={onClose} />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <FindAquifer onClose={onClose} />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        <FindOther handleLink={handleLink} resources={resources} />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={3}>
        <CreateAiRes resources={resources} />
      </CustomTabPanel>
      <LaunchLink url={link} reset={() => setLink('')} />
    </Box>
  );
}
