import React, { useState, useEffect } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../actions';
import {
  IState,
  MediaFile,
  Passage,
  PassageSection,
  Section,
  IMediaTabStrings,
  Plan,
} from '../model';
import localStrings from '../selector/localize';
import { withData, WithDataProps } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Button, Menu, MenuItem } from '@material-ui/core';
import DropDownIcon from '@material-ui/icons/ArrowDropDown';
import AddIcon from '@material-ui/icons/Add';
import FilterIcon from '@material-ui/icons/FilterList';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import MediaUpload from './MediaUpload';
import PassageMedia from './PassageMedia';
import SnackBar from './SnackBar';
import Confirm from './AlertDialog';
import ShapingTable from './ShapingTable';
import related from '../utils/related';
import Auth from '../auth/Auth';
import moment from 'moment';
import 'moment/locale/fr';
import { remoteIdNum } from '../utils';
import { useGlobal } from 'reactn';
import { keyMap } from '../schema';
import { dateCompare, numCompare } from '../utils/sort';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
      marginLeft: theme.spacing(4),
      marginRight: theme.spacing(4),
      marginBottom: theme.spacing(4),
    },
    paper: {},
    actions: theme.mixins.gutters({
      paddingBottom: 16,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    }),
    grow: {
      flexGrow: 1,
    },
    button: {
      margin: theme.spacing(1),
    },
    icon: {
      marginLeft: theme.spacing(1),
    },
  })
);

interface IRow {
  planid: string;
  id: string;
  planName: string;
  fileName: string;
  section: string;
  reference: string;
  duration: string;
  size: number;
  version: string;
  date: string;
}
const getSection = (section: Section[]) => {
  const sectionId =
    section.length > 0 && section[0].attributes.sequencenum
      ? section[0].attributes.sequencenum.toString()
      : '';
  const sectionName = section.length > 0 ? section[0].attributes.name : '';
  return sectionId + ' ' + sectionName;
};

const getReference = (passage: Passage[]) => {
  const book = passage.length > 0 ? passage[0].attributes.book : '';
  const reference = passage.length > 0 ? passage[0].attributes.reference : '';
  return book + ' ' + reference;
};

interface ILatest {
  [planName: string]: number;
}

const getMedia = (
  projectplans: Array<Plan>,
  mediaFiles: Array<MediaFile>,
  passages: Array<Passage>,
  passageSections: Array<PassageSection>,
  sections: Array<Section>
) => {
  const latest: ILatest = {};
  mediaFiles.forEach(f => {
    const name = related(f, 'plan') + f.attributes.originalFile;
    latest[name] = latest[name]
      ? Math.max(latest[name], f.attributes.versionNumber)
      : f.attributes.versionNumber;
  });
  var media: MediaFile[];
  if (projectplans && projectplans.length > 0) {
    //all plans in current project
    media = mediaFiles.filter(
      f =>
        projectplans.filter(p => p.id === related(f, 'plan')).length > 0 &&
        latest[related(f, 'plan') + f.attributes.originalFile] ===
          f.attributes.versionNumber
    );
  } else media = [];

  const rowData = media.map(f => {
    const passageId = related(f, 'passage');
    const passage = passageId ? passages.filter(p => p.id === passageId) : [];
    const passageSection = passageId
      ? passageSections.filter(ps => related(ps, 'passage') === passageId)
      : [];
    const sectionId =
      passageSection.length > 0 ? related(passageSection[0], 'section') : '';
    const section = sections.filter(s => s.id === sectionId);
    const updated =
      f.attributes.dateUpdated && moment(f.attributes.dateUpdated + 'Z');
    const date = updated ? updated.format('YYYY-MM-DD') : '';
    const displayDate = updated
      ? updated.locale(navigator.language.split('-')[0]).format('L')
      : '';
    const displayTime = updated
      ? updated.locale(navigator.language.split('-')[0]).format('LT')
      : '';
    const today = moment().format('YYYY-MM-DD');
    return {
      planid: related(f, 'plan'),
      planName: projectplans.filter(p => p.id === related(f, 'plan'))[0]
        .attributes.name,
      id: f.id,
      fileName: f.attributes.originalFile,
      section: getSection(section),
      reference: getReference(passage),
      duration: f.attributes.duration ? f.attributes.duration.toString() : '',
      size: f.attributes.filesize,
      version: f.attributes.versionNumber
        ? f.attributes.versionNumber.toString()
        : '',
      date: date === today ? displayTime : displayDate,
    } as IRow;
  });
  return rowData as Array<IRow>;
};

interface IStateProps {
  t: IMediaTabStrings;
  uploadList: FileList;
  loaded: boolean;
  currentlyLoading: number;
}

interface IDispatchProps {
  uploadFiles: typeof actions.uploadFiles;
  nextUpload: typeof actions.nextUpload;
  uploadComplete: typeof actions.uploadComplete;
}

interface IRecordProps {
  mediaFiles: Array<MediaFile>;
  passages: Array<Passage>;
  passageSections: Array<PassageSection>;
  sections: Array<Section>;
}

interface IProps
  extends IStateProps,
    IDispatchProps,
    IRecordProps,
    WithDataProps {
  action?: (what: string, where: number[]) => boolean;
  auth: Auth;
  projectplans: Plan[];
}

export function MediaTab(props: IProps) {
  const {
    t,
    uploadList,
    loaded,
    currentlyLoading,
    action,
    uploadFiles,
    nextUpload,
    uploadComplete,
    mediaFiles,
    passages,
    passageSections,
    sections,
    queryStore,
    updateStore,
    auth,
    projectplans,
  } = props;
  const classes = useStyles();
  const [plan, setPlan] = useGlobal('plan');
  const [message, setMessage] = useState(<></>);
  const [data, setData] = useState(Array<IRow>());
  // [
  //   {fileName: 'GEN-001-001025.mp3', sectionId: '1', sectionName: 'Creation Story', book: 'Genesis', reference: '1:1-25a', duration: '30 seconds', size: 250, version: '1' },
  //   {fileName: 'GEN-001-002631.mp3', sectionId: '', sectionName: '', book: '', reference: '', duration: '45 seconds', size: 445, version: '1' },
  // ]);
  const [actionMenuItem, setActionMenuItem] = useState(null);
  const [check, setCheck] = useState(Array<number>());
  const [confirmAction, setConfirmAction] = useState('');
  const columnDefs = [
    { name: 'planName', title: t.planName },
    { name: 'fileName', title: t.fileName },
    { name: 'section', title: t.section },
    { name: 'reference', title: t.reference },
    { name: 'duration', title: t.duration },
    { name: 'size', title: t.size },
    { name: 'version', title: t.version },
    { name: 'date', title: t.date },
  ];
  const columnWidths = [
    { columnName: 'planName', width: 150 },
    { columnName: 'fileName', width: 150 },
    { columnName: 'section', width: 150 },
    { columnName: 'reference', width: 150 },
    { columnName: 'duration', width: 100 },
    { columnName: 'size', width: 100 },
    { columnName: 'version', width: 100 },
    { columnName: 'date', width: 100 },
  ];
  const defaultHiddenColumnNames: string[] = [];

  const columnSorting = [
    { columnName: 'duration', compare: numCompare },
    { columnName: 'size', compare: numCompare },
    { columnName: 'version', compare: numCompare },
    { columnName: 'date', compare: dateCompare },
  ];

  const numCols = ['duration', 'size', 'version'];
  const [filter, setFilter] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [passageMediaVisible, setPassageMediaVisible] = useState(false);

  const handleMessageReset = () => {
    setMessage(<></>);
  };
  const handleUpload = () => {
    setUploadVisible(true);
  };
  const uploadMedia = (files: FileList) => {
    if (!files) {
      setMessage(<span>Please select files to be uploaded.</span>);
      return;
    }
    uploadFiles(files);
    setUploadVisible(false);
  };
  const uploadCancel = () => {
    setUploadVisible(false);
  };
  const handleMenu = (e: any) => setActionMenuItem(e.currentTarget);
  const handleConfirmAction = (what: string) => (e: any) => {
    setActionMenuItem(null);
    if (!/Close/i.test(what)) {
      if (check.length === 0) {
        setMessage(<span>Please select row(s) to {what}.</span>);
      } else {
        setConfirmAction(what);
      }
    }
  };
  const handleActionConfirmed = () => {
    if (action != null) {
      if (action(confirmAction, check)) {
        setCheck(Array<number>());
      }
    }
    if (confirmAction === 'Delete') {
      check.forEach(i => {
        var versions = mediaFiles.filter(
          f =>
            related(f, 'plan') === data[i].planid &&
            f.attributes.originalFile === data[i].fileName
        );
        versions.forEach(v => {
          //console.log('Delete media ' + v.id);
          updateStore(t =>
            t.removeRecord({
              type: 'mediafile',
              id: v.id,
            })
          );
        });
      });
      setCheck(Array<number>());
    }
    setConfirmAction('');
  };
  const handleActionRefused = () => {
    setConfirmAction('');
  };
  const handlePassageMedia = (status: boolean) => (e: any) => {
    setActionMenuItem(null);
    setPassageMediaVisible(status);
  };
  const handleCheck = (checks: Array<number>) => {
    setCheck(checks);
  };
  const handleFilter = () => setFilter(!filter);

  useEffect(() => {
    if (projectplans.length > 1) {
      if (defaultHiddenColumnNames.length > 0)
        //assume planName is only one
        defaultHiddenColumnNames.pop();
    } else if (projectplans.length === 1) {
      if (plan === '') {
        setPlan(projectplans[0].id); //set the global plan
      }
      defaultHiddenColumnNames.push('planName');
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [projectplans, plan]);

  useEffect(() => {
    setData(
      getMedia(projectplans, mediaFiles, passages, passageSections, sections)
    );
  }, [projectplans, mediaFiles, passages, passageSections, sections]);

  useEffect(() => {
    if (loaded && currentlyLoading + 1 === uploadList.length) {
      // wait to do this to give time for duration calc
      setTimeout(() => {
        setMessage(<span>{t.uploadComplete}</span>);
        uploadComplete();
      }, 10000);
    } else if (loaded || currentlyLoading < 0) {
      if (uploadList.length > 0 && currentlyLoading + 1 < uploadList.length) {
        const planId = remoteIdNum('plan', plan, keyMap);
        const mediaFile = {
          planId: planId,
          originalFile: uploadList[currentlyLoading + 1].name,
          contentType: uploadList[currentlyLoading + 1].type,
        } as any;
        nextUpload(mediaFile, uploadList, currentlyLoading + 1, auth);
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [uploadList, loaded, currentlyLoading, projectplans, auth]);

  useEffect(() => {
    if (
      loaded /* new item done */ ||
      currentlyLoading === 0 /* all are done */
    ) {
      //console.log(
      //  'Requery mediafiles ' + currentlyLoading + ' Loaded: ' + loaded
      //);
      queryStore(q => q.findRecords('mediafile'), {
        sources: {
          remote: {
            timeout: 100000,
          },
        },
      });
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [loaded]);

  return (
    <div className={classes.container}>
      <div className={classes.paper}>
        <div className={classes.actions}>
          {projectplans.length === 1 && (
            <Button
              key="upload"
              aria-label={t.uploadMedia}
              variant="outlined"
              color="primary"
              className={classes.button}
              onClick={handleUpload}
            >
              {t.uploadMedia}
              <AddIcon className={classes.icon} />
            </Button>
          )}
          {projectplans.length === 1 && (
            <Button
              key="Attach"
              aria-label={t.attachPassage}
              variant="outlined"
              color="primary"
              className={classes.button}
              onClick={handlePassageMedia(true)}
            >
              {t.attachPassage}
              <AddIcon className={classes.icon} />
            </Button>
          )}
          <Button
            key="action"
            aria-owns={actionMenuItem !== '' ? 'action-menu' : undefined}
            aria-label={t.action}
            variant="outlined"
            color="primary"
            className={classes.button}
            onClick={handleMenu}
          >
            {t.action}
            <DropDownIcon className={classes.icon} />
          </Button>
          <Menu
            id="action-menu"
            anchorEl={actionMenuItem}
            open={Boolean(actionMenuItem)}
            onClose={handleConfirmAction('Close')}
          >
            <MenuItem onClick={handleConfirmAction('Delete')}>
              {t.delete}
            </MenuItem>
            <MenuItem onClick={handleConfirmAction('Download')}>
              {t.download}
            </MenuItem>
            <MenuItem onClick={handleConfirmAction('Change Version')}>
              {t.changeVersion}
            </MenuItem>
          </Menu>
          <div className={classes.grow}>{'\u00A0'}</div>
          <Button
            key="filter"
            aria-label={t.filter}
            variant="outlined"
            color="primary"
            className={classes.button}
            onClick={handleFilter}
            title={'Show/Hide filter rows'}
          >
            {t.filter}
            {filter ? (
              <SelectAllIcon className={classes.icon} />
            ) : (
              <FilterIcon className={classes.icon} />
            )}
          </Button>
        </div>
        <ShapingTable
          columns={columnDefs}
          columnWidths={columnWidths}
          columnSorting={columnSorting}
          sorting={[
            { columnName: 'planName', direction: 'asc' },
            { columnName: 'fileName', direction: 'asc' },
          ]}
          numCols={numCols}
          rows={data}
          select={handleCheck}
          shaping={filter}
          defaultHiddenColumnNames={defaultHiddenColumnNames}
        />
      </div>
      <MediaUpload
        visible={uploadVisible}
        uploadMethod={uploadMedia}
        cancelMethod={uploadCancel}
      />
      <PassageMedia
        visible={passageMediaVisible}
        closeMethod={handlePassageMedia(false)}
      />
      {confirmAction !== '' ? (
        <Confirm
          text={confirmAction + ' ' + check.length + ' Item(s). Are you sure?'}
          yesResponse={handleActionConfirmed}
          noResponse={handleActionRefused}
        />
      ) : (
        <></>
      )}
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'mediaTab' }),
  uploadList: state.upload.files,
  currentlyLoading: state.upload.current,
  loaded: state.upload.loaded,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      uploadFiles: actions.uploadFiles,
      nextUpload: actions.nextUpload,
      uploadComplete: actions.uploadComplete,
    },
    dispatch
  ),
});

const mapRecordsToProps = {
  mediaFiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  passageSections: (q: QueryBuilder) => q.findRecords('passagesection'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
};

export default withData(mapRecordsToProps)(connect(
  mapStateToProps,
  mapDispatchToProps
)(MediaTab) as any) as any;
