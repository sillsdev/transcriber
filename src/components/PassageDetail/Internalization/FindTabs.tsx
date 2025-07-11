import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { Badge } from '@mui/material';
import FindOther from './FindOther';
import CreateAiRes from './CreateAiRes';
import usePassageDetailContext from '../../../context/usePassageDetailContext';
import { ReactNode, useEffect, useState } from 'react';
import { LaunchLink } from '../../../control/LaunchLink';
import { BibleResource } from '../../../model/bible-resource';
import { IFindResourceStrings, ISharedStrings } from '../../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { findResourceSelector, sharedSelector } from '../../../selector';
import FindAquifer from './FindAquifer';
import FaithbridgeIframe from './FaithbridgeIframe';
import { Aquifer, FaithBridge } from '../../../assets/brands';
import { useHandleLink } from './addLinkKind';

export enum scopeI {
  passage,
  section,
  chapter,
  book,
  movement,
}
export namespace scopeI {
  export function asString(scope: scopeI): string {
    return scopeI[scope];
  }

  export function fromString(scope: string): scopeI {
    return (scopeI as any)[scope];
  }
}

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
  canAdd: boolean;
  onMarkdown: (query: string, audioUrl: string, transcript: string) => void;
}

export default function FindTabs({
  onClose,
  canAdd,
  onMarkdown,
}: FindTabsProps) {
  const [value, setValue] = useState(0);
  const { passage } = usePassageDetailContext();
  const [aquifer, setAquifer] = useState(true);
  const [resources, setResources] = useState<BibleResource[]>([]);
  const [link, setLink] = useState<string>();
  const handleLink = useHandleLink({ passage, setLink });
  const t: IFindResourceStrings = useSelector(
    findResourceSelector,
    shallowEqual
  );
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  useEffect(() => {
    import('../../../assets/bible-resource').then((module) => {
      setResources(module.default);
    });
  }, []);

  useEffect(() => {
    setAquifer(canAdd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAdd]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
        >
          <Tab
            label={<Badge badgeContent={ts.ai}>{FaithBridge}</Badge>}
            {...a11yProps(0)}
          />
          <Tab
            label={<Badge badgeContent={ts.ai}>{t.create}</Badge>}
            {...a11yProps(1)}
          />
          {aquifer && (
            <Tab
              label={t.findBrandedContent.replace('{0}', Aquifer)}
              {...a11yProps(2)}
            />
          )}
          <Tab
            label={aquifer ? t.findOther : t.findResource}
            {...a11yProps(aquifer ? 3 : 2)}
          />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        <FaithbridgeIframe onMarkdown={onMarkdown} onClose={onClose} />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <CreateAiRes resources={resources} onTab={() => setValue(0)} />
      </CustomTabPanel>
      {aquifer && (
        <CustomTabPanel value={value} index={2}>
          <FindAquifer onClose={onClose} />
        </CustomTabPanel>
      )}
      <CustomTabPanel value={value} index={aquifer ? 3 : 2}>
        <FindOther handleLink={handleLink} resources={resources} />
      </CustomTabPanel>
      <LaunchLink url={link} reset={() => setLink('')} />
    </Box>
  );
}
