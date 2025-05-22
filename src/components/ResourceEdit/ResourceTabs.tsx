import * as React from 'react';
import { Tabs, Tab, Typography, Box } from '@mui/material';
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
  findRecord,
  useArtifactCategory,
  remoteIdNum,
  useGraphicUpdate,
  useGraphicCreate,
  getVernacularMediaRec,
} from '../../crud';
import { useMemo } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { useSnackBar } from '../../hoc/SnackBar';
import { passageTypeFromRef } from '../../control/RefRender';
import { PassageTypeEnum } from '../../model/passageType';
import { useOrbitData } from '../../hoc/useOrbitData';
import { RecordIdentity, RecordKeyMap } from '@orbit/records';
import { usePassageUpdate } from '../../crud/usePassageUpdate';
import { remotePullAll } from '../../crud/syncToMemory';
import JSONAPISource from '@orbit/jsonapi';
import IndexedDBSource from '@orbit/indexeddb';
import { usePassageType } from '../../crud/usePassageType';
import { useProjectPermissions } from '../../utils/useProjectPermissions';

export enum DialogModePartial {
  'titleOnly' = 4,
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
  hasPublishing: boolean;
  onOpen: () => void;
  onUpdRef?: (id: string, val: string, sr: SharedResourceD) => void;
}

export function ResourceTabs({
  passId,
  ws,
  hasPublishing,
  onOpen,
  onUpdRef,
}: IProps) {
  const sharedResources = useOrbitData<SharedResource[]>('sharedresource');
  const graphics = useOrbitData<GraphicD[]>('graphic');
  const [value, setValue] = React.useState(0);
  const t: IResourceStrings = useSelector(sharedResourceSelector, shallowEqual);
  const { getSharedResource, readSharedResource } = useSharedResRead();
  const updateSharedResource = useSharedResUpdate({ onUpdRef });
  const createSharedResource = useSharedResCreate({
    passage: { type: 'passage', id: passId },
    onUpdRef,
  });
  const deleteSharedResource = useSharedResDelete();
  const updatePassage = usePassageUpdate();
  const graphicUpdate = useGraphicUpdate();
  const graphicCreate = useGraphicCreate();
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator?.getSource('remote') as JSONAPISource;
  const backup = coordinator?.getSource('backup') as IndexedDBSource;
  const [memory] = useGlobal('memory');
  const [offline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const [offlineOnly] = useGlobal('offlineOnly'); //will be constant here
  const { showMessage } = useSnackBar();
  const { localizedArtifactCategory } = useArtifactCategory();
  const { getPassageTypeRec } = usePassageType();
  const { canEditSheet, canPublish } = useProjectPermissions();

  const readOnly = useMemo(
    () => !canEditSheet || (offline && !offlineOnly),
    [canEditSheet, offline, offlineOnly]
  );

  const sharedResRec = React.useMemo(
    () => {
      if (ws?.passage) return getSharedResource(ws?.passage);
      else return readSharedResource(passId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [passId, value, ws?.passage]
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
  }, [sharedResources, passId, isNote, sharedResRec]);

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
    var psg = findRecord(memory, 'passage', related(sr, 'passage')) as PassageD;
    if (psg) {
      const mediaRec = getVernacularMediaRec(psg.id, memory);
      if (!mediaRec) {
        var psgId = remoteIdNum(
          'passage',
          related(sr, 'passage'),
          memory?.keyMap as RecordKeyMap
        );
        const filter = [{ attribute: 'passage-id', value: psgId }];
        await remotePullAll({
          remote,
          backup,
          table: 'mediafile',
          memory,
          filter,
        });
      }
    }
    const typeRec = getPassageTypeRec(PassageTypeEnum.NOTE);
    await updatePassage(passage, undefined, typeRec?.id, sr.id);
    if (onUpdRef) onUpdRef(passage.id, passage.attributes.reference, sr);
  };

  const copyGraphic = async (sr: SharedResourceD, passage: PassageD) => {
    const resourceType = 'passage';
    const sourceId = remoteIdNum(
      'passage',
      related(sr, 'passage'),
      memory?.keyMap as RecordKeyMap
    );
    const resourceId = remoteIdNum(
      'passage',
      passage.id,
      memory?.keyMap as RecordKeyMap
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
      sourceGraphicRec?.attributes?.info || graphicRec?.attributes.info;
    if (info) {
      if (graphicRec) {
        await graphicUpdate({
          ...graphicRec,
          attributes: { ...graphicRec.attributes, info },
        });
      } else {
        await graphicCreate({ resourceType, resourceId, info });
      }
    }
  };

  const handleLink = async (sr: SharedResourceD) => {
    const passage = ws?.passage;
    if (passage) {
      await updateLinkedPassage(sr, passage);
      await copyGraphic(sr, passage);
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
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <ResourceOverview
          mode={DialogMode.add} //ignored
          dialogmode={
            readOnly
              ? canPublish
                ? DialogModePartial.titleOnly
                : DialogMode.view
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
    </Box>
  );
}

export default ResourceTabs;
