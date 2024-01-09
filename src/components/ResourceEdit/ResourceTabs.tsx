import * as React from 'react';
import { Tabs, Tab, Typography, Box } from '@mui/material';
import VersionDlg from '../AudioTab/VersionDlg';
import ResourceOverview, { IResourceDialog } from './ResourceOverview';
import ResourceRefs from './ResourceRefs';
import {
  ArtifactCategoryD,
  DialogMode,
  GraphicD,
  IResourceStrings,
  ISheet,
  Passage,
  PassageD,
  SharedResource,
  SharedResourceD,
} from '../../model';
import { useSelector, shallowEqual } from 'react-redux';
import { sharedResourceSelector } from '../../selector';
import {
  related,
  useSharedResCreate,
  useSharedResRead,
  useSharedResUpdate,
  useSharedResDelete,
  useRole,
  findRecord,
  useArtifactCategory,
  remoteIdNum,
  useGraphicUpdate,
  useGraphicCreate,
} from '../../crud';
import { useMemo } from 'react';
import { useGlobal } from 'reactn';
import { useSnackBar } from '../../hoc/SnackBar';
import { passageTypeFromRef } from '../../control/RefRender';
import { PassageTypeEnum } from '../../model/passageType';
import { useOrbitData } from '../../hoc/useOrbitData';
import { RecordIdentity, RecordKeyMap } from '@orbit/records';
import { usePassageUpdate } from '../../crud/usePassageUpdate';

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
          <Typography component={'div'}>{children}</Typography>
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
  ws: ISheet | undefined;
  onOpen: () => void;
  onUpdRef?: (id: string, val: string) => void;
}

export function ResourceTabs({ passId, ws, onOpen, onUpdRef }: IProps) {
  const sharedResources = useOrbitData<SharedResource[]>('sharedresource');
  const graphics = useOrbitData<GraphicD[]>('graphic');
  const [value, setValue] = React.useState(0);
  const t: IResourceStrings = useSelector(sharedResourceSelector, shallowEqual);
  const readSharedResource = useSharedResRead();
  const updateSharedResource = useSharedResUpdate({ onUpdRef });
  const createSharedResource = useSharedResCreate({
    passage: { type: 'passage', id: passId },
    onUpdRef,
  });
  const deleteSharedResource = useSharedResDelete();
  const updatePassage = usePassageUpdate();
  const graphicUpdate = useGraphicUpdate();
  const graphicCreate = useGraphicCreate();
  const { userIsAdmin } = useRole();
  const [memory] = useGlobal('memory');
  const [offline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const { showMessage } = useSnackBar();
  const { localizedArtifactCategory } = useArtifactCategory();

  const readOnly = useMemo(
    () => !userIsAdmin || (offline && !offlineOnly),
    [userIsAdmin, offline, offlineOnly]
  );

  const sharedResRec = React.useMemo(
    () => {
      let res = readSharedResource(passId);
      const linkedRes = related(ws?.passage, 'sharedResource');
      if (!res && linkedRes) {
        res = findRecord(
          memory,
          'sharedresource',
          linkedRes
        ) as SharedResourceD;
      }
      return res;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [passId, value]
  );

  const isNote = React.useMemo(
    () => {
      const passRec = findRecord(memory, 'passage', passId) as
        | Passage
        | undefined;
      return (
        passageTypeFromRef(passRec?.attributes?.reference) ===
        PassageTypeEnum.NOTE
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [passId]
  );

  const values = React.useMemo(() => {
    if (sharedResRec) {
      const {
        title,
        description,
        languagebcp47,
        termsOfUse,
        keywords,
        linkurl,
      } = sharedResRec.attributes;
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
        linkurl,
        note: isNote,
        category: related(sharedResRec, 'artifactCategory'),
        mediaId: related(sharedResRec, 'titleMediafile'),
      } as IResourceDialog;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedResources, passId, isNote]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleCommit = async (values: IResourceDialog) => {
    showMessage(t.saving);
    const {
      title,
      description,
      bcp47,
      languageName,
      terms,
      keywords,
      linkurl,
      category,
      mediaId,
    } = values;
    if (sharedResRec) {
      const rec = sharedResRec;
      await updateSharedResource(
        {
          ...rec,
          attributes: {
            ...rec.attributes,
            title,
            description,
            languagebcp47: `${languageName}|${bcp47}`,
            termsOfUse: terms,
            keywords,
            linkurl,
            note: isNote,
          },
        } as SharedResourceD,
        category,
        mediaId
      );
    } else {
      await createSharedResource({
        title,
        description,
        languagebcp47: `${languageName}|${bcp47}`,
        termsOfUse: terms,
        keywords,
        linkurl,
        note: isNote,
        category,
        mediaId,
      });
    }
    setValue(1);
  };

  const handleDelete = () => {
    if (sharedResRec) {
      deleteSharedResource({
        type: 'sharedresource',
        id: sharedResRec.id,
      } as RecordIdentity);
    }
  };

  const handleOverOpen = () => {
    onOpen && onOpen();
  };

  const updateLinkedPassage = async (
    sr: SharedResourceD,
    passage: PassageD
  ) => {
    const catRec = findRecord(
      memory,
      'artifactcategory',
      related(sr, 'artifactCategory')
    ) as ArtifactCategoryD;
    if (catRec?.attributes) {
      const catSlug = catRec.attributes.categoryname;
      const category = catSlug
        ? (localizedArtifactCategory(catSlug) as string) || catSlug
        : catSlug || '';
      passage.attributes.reference = `NOTE|${category}`;
    }
    await updatePassage(passage, undefined, undefined, sr.id);
  };

  const copyGraphic = async (sr: SharedResourceD, passage: PassageD) => {
    const resourceType = 'passage';
    const sourceId = remoteIdNum(
      'passage',
      related(sr, 'passage'),
      memory.keyMap as RecordKeyMap
    );
    const resourceId = remoteIdNum(
      'passage',
      passage.id,
      memory.keyMap as RecordKeyMap
    );
    const sourceGraphicRec = graphics.find(
      (g) =>
        g.attributes.resourceType === resourceType &&
        g.attributes.resourceId === sourceId
    );
    const graphicRec = graphics.find(
      (g) =>
        g.attributes.resourceType === resourceType &&
        g.attributes.resourceId === resourceId
    );
    const info =
      sourceGraphicRec?.attributes?.info || graphicRec?.attributes.info || '{}';
    if (graphicRec) {
      await graphicUpdate({
        ...graphicRec,
        attributes: { ...graphicRec.attributes, info },
      });
    } else {
      await graphicCreate({ resourceType, resourceId, info });
    }
  };

  const handleLink = async (sr: SharedResourceD) => {
    const passage = ws?.passage;
    if (passage) {
      updateLinkedPassage(sr, passage);
      copyGraphic(sr, passage);
      onOpen && onOpen();
    }
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
          <Tab
            label={t.references}
            {...a11yProps(1)}
            disabled={!sharedResRec?.id}
          />
          <Tab label={t.versions} {...a11yProps(2)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <ResourceOverview
          mode={
            readOnly
              ? DialogMode.view
              : values
              ? DialogMode.edit
              : DialogMode.add
          }
          values={values}
          isOpen={true}
          isNote={isNote}
          ws={ws}
          onOpen={handleOverOpen}
          onCommit={handleCommit}
          onDelete={handleDelete}
          onLink={handleLink}
        />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <ResourceRefs
          mode={
            readOnly
              ? DialogMode.view
              : values
              ? DialogMode.edit
              : DialogMode.add
          }
          res={sharedResRec}
          onOpen={handleOverOpen}
        />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <VersionDlg passId={passId} />
      </TabPanel>
    </Box>
  );
}

export default ResourceTabs;
