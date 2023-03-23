import * as React from 'react';
import { Tabs, Tab, Typography, Box } from '@mui/material';
import VersionDlg from '../AudioTab/VersionDlg';
import ResourceOverview, { IResourceDialog } from './ResourceOverview';
import ResourceRefs from './ResourceRefs';
import { DialogMode, IResourceStrings, SharedResource } from '../../model';
import { useSelector, shallowEqual } from 'react-redux';
import { sharedResourceSelector } from '../../selector';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import {
  related,
  useSharedResCreate,
  useSharedResRead,
  useSharedResUpdate,
  useSharedResDelete,
} from '../../crud';

interface IRecordProps {
  sharedResources: SharedResource[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`res-edit-tabpanel-${index}`}
      aria-labelledby={`res-edit-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `res-edit-tab-${index}`,
    'aria-controls': `res-edit-tabpanel-${index}`,
  };
}

interface IProps {
  passId: string;
  onOpen: () => void;
}

export function ResourceTabs({
  passId,
  onOpen,
  sharedResources,
}: IProps & IRecordProps) {
  const [value, setValue] = React.useState(0);
  const sharedResRec = React.useRef<SharedResource>();
  const t: IResourceStrings = useSelector(sharedResourceSelector, shallowEqual);
  const readSharedResource = useSharedResRead();
  const updateSharedResource = useSharedResUpdate();
  const createSharedResource = useSharedResCreate({
    passage: { type: 'passage', id: passId },
  });
  const deleteSharedResource = useSharedResDelete();

  const values = React.useMemo(() => {
    sharedResRec.current = readSharedResource(passId);
    if (sharedResRec.current) {
      const { title, description, languagebcp47, termsOfUse, keywords } =
        sharedResRec.current.attributes;
      const lgParts = languagebcp47.split('|');
      const bcp47 = lgParts.length === 1 ? languagebcp47 : lgParts[1];
      const languageName = lgParts.length === 1 ? '' : lgParts[0];
      return {
        title,
        description,
        bcp47,
        languageName,
        terms: termsOfUse,
        keywords,
        category: related(sharedResRec.current, 'artifactCategory'),
      } as IResourceDialog;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedResources, passId]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleCommit = (values: IResourceDialog) => {
    const {
      title,
      description,
      bcp47,
      languageName,
      terms,
      keywords,
      category,
    } = values;
    if (sharedResRec.current) {
      const rec = sharedResRec.current;
      updateSharedResource(
        {
          ...rec,
          attributes: {
            ...rec.attributes,
            title,
            description,
            languagebcp47: `${languageName}|${bcp47}`,
            termsOfUse: terms,
            keywords,
          },
        } as SharedResource,
        category
      );
    } else {
      createSharedResource({
        title,
        description,
        languagebcp47: `${languageName}|${bcp47}`,
        termsOfUse: terms,
        keywords,
        category,
      });
    }
    setValue(1);
  };

  const handleDelete = () => {
    if (sharedResRec.current) {
      deleteSharedResource({
        type: 'sharedresource',
        id: sharedResRec.current.id,
      } as SharedResource);
    }
  };

  const handleOverOpen = () => {
    onOpen && onOpen();
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="resource edit tabs"
        >
          <Tab label={t.overview} {...a11yProps(0)} />
          <Tab label={t.references} {...a11yProps(1)} />
          <Tab label={t.versions} {...a11yProps(2)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <ResourceOverview
          mode={values ? DialogMode.edit : DialogMode.add}
          values={values}
          isOpen={true}
          onOpen={handleOverOpen}
          onCommit={handleCommit}
          onDelete={handleDelete}
        />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <ResourceRefs onOpen={handleOverOpen} />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <VersionDlg passId={passId} />
      </TabPanel>
    </Box>
  );
}

const mapRecordsToProps = {
  sharedResources: (q: QueryBuilder) => q.findRecords('sharedresource'),
};

export default withData(mapRecordsToProps)(ResourceTabs as any) as any as (
  props: IProps
) => JSX.Element;
