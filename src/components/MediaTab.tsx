import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as actions from '../actions';
import { IState, IUploadFile, MediaFile, Passage, PassageSection,
  Section, IMediaTabStrings } from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { KeyMap, QueryBuilder } from '@orbit/data';
import { withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import { Button, Menu, MenuItem, IconButton } from '@material-ui/core'
import DropDownIcon from '@material-ui/icons/ArrowDropDown';
import AddIcon from '@material-ui/icons/Add';
import FilterIcon from '@material-ui/icons/FilterList';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import MediaUpload from './MediaUpload';
import SnackBar from './SnackBar';
import Confirm from './AlertDialog';
import ShapingTable from './ShapingTable';
import related from '../utils/related';
import Auth from '../auth/Auth';
import moment from 'moment';
import 'moment/locale/fr';

const styles = (theme: Theme) => ({
  container: {
      display: 'flex',
      marginLeft: theme.spacing.unit * 4,
      marginRight: theme.spacing.unit * 4,
      marginBottom: theme.spacing.unit * 4,
  },
  paper: {
  },
  actions: theme.mixins.gutters({
    paddingBottom: 16,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'right'
  }),
  button: {
    margin: theme.spacing.unit
  },
  icon: {
    marginLeft: theme.spacing.unit
  },
});

interface IRow {
  fileName: string;
  section: string;
  reference: string;
  duration: string;
  size: number;
  version: string;
  date: string;
};

const getSection = (section: Section[]) => {
  const sectionId = (section.length > 0 && section[0].attributes.sequencenum)? section[0].attributes.sequencenum.toString(): '';
  const sectionName = section.length > 0? section[0].attributes.name: '';
  return sectionId + " " + sectionName;
}

const getReference = (passage: Passage[]) => {
  const book = passage.length > 0? passage[0].attributes.book: '';
  const reference = passage.length > 0? passage[0].attributes.reference: '';
  return book + " " + reference;
}

interface ILatest {
  [name: string]: number;
}

const getMedia = (plan: string, mediaFiles: Array<MediaFile>, passages: Array<Passage>, passageSections: Array<PassageSection>, sections: Array<Section>) => {
  const latest: ILatest = {};
  mediaFiles.forEach(f => {
    const name = f.attributes.originalFile;
    latest[name] = latest[name]? Math.max(latest[name], f.attributes.versionNumber):
      f.attributes.versionNumber;
  })
  const media = mediaFiles.filter(f => related(f, 'plan') === plan &&
    latest[f.attributes.originalFile] === f.attributes.versionNumber);
  const rowData = media.map(f => {
    const passageId = related(f, 'passage');
    const passage = passages.filter(p => p.id === passageId);
    const passageSection = passageSections.filter(ps => related(ps, 'passage') === passageId);
    const sectionId = passageSection.length > 0? related(passageSection[0], 'section'): '';
    const section = sections.filter(s => s.id === sectionId);
    const updated = f.attributes.dateUpdated && moment(f.attributes.dateUpdated + 'Z');
    const date = updated? updated.format('YYYY-MM-DD'): ''
    const displayDate = updated? updated.locale(navigator.language.split('-')[0]).format('L'):'';
    const displayTime = updated? updated.locale(navigator.language.split('-')[0]).format('LT'):'';
    const today = moment().format('YYYY-MM-DD')
    return {
      fileName: f.attributes.originalFile,
      section: getSection(section),
      reference: getReference(passage),
      duration: f.attributes.duration? f.attributes.duration.toString(): '',
      size: f.attributes.filesize,
      version: f.attributes.versionNumber? f.attributes.versionNumber.toString(): '',
      date: date === today? displayTime: displayDate,
    } as IRow
  });
  return(rowData as Array<IRow>);
};

interface IStateProps {
  t: IMediaTabStrings;
  uploadList: Array<IUploadFile>;
  loaded: boolean;
  currentlyLoading: number;
};

interface IDispatchProps {
  uploadFiles: typeof actions.uploadFiles;
  nextUpload: typeof actions.nextUpload;
}

interface IRecordProps {
  mediaFiles: Array<MediaFile>;
  passages: Array<Passage>;
  passageSections: Array<PassageSection>;
  sections: Array<Section>;
}

interface IProps extends IStateProps, IDispatchProps, IRecordProps, WithStyles<typeof styles>{
  action?: (what: string, where: number[]) => boolean;
  auth: Auth;
};
  
export function MediaTab(props: IProps) {
  const { classes, t, uploadList, loaded, currentlyLoading,
    action, uploadFiles, nextUpload,
    mediaFiles, passages, passageSections, sections, auth } = props;
  const [plan] = useGlobal('plan');
  const [keyMap] = useGlobal('keyMap');
  const [message, setMessage] = useState(<></>);
  const [data, setData] = useState(Array<IRow>());
    // [
    //   {fileName: 'GEN-001-001025.mp3', sectionId: '1', sectionName: 'Creation Story', book: 'Genesis', reference: '1:1-25a', duration: '30 seconds', size: 250, version: '1' },
    //   {fileName: 'GEN-001-002631.mp3', sectionId: '', sectionName: '', book: '', reference: '', duration: '45 seconds', size: 445, version: '1' },
    // ]);
  const [actionMenuItem, setActionMenuItem] = useState(null);
  const [check, setCheck] = useState(Array<number>());
  const [confirmAction, setConfirmAction] = useState('');
  const columnDefs=[
    { name: 'fileName', title: t.fileName },
    { name: 'section', title: t.section },
    { name: 'reference', title: t.reference },
    { name: 'duration', title: t.duration },
    { name: 'size', title: t.size },
    { name: 'version', title: t.version },
    { name: 'date', title: t.date }
  ];
  const columnWidths=[
    { columnName: "fileName", width: 150 },
    { columnName: "section", width: 150 },
    { columnName: "reference", width: 150 },
    { columnName: "duration", width: 100 },
    { columnName: "size", width: 100 },
    { columnName: "version", width: 100 },
    { columnName: "date", width: 100 }
  ];
  const numCompare = (a:number, b:number) => {return a-b};
  const dateCompare = (a:string, b:string) => {
    const aDate = moment(a).isValid()? moment(a): moment(a, 'LT');
    const bDate = moment(b).isValid()? moment(b): moment(b, 'LT');
    const aIso = aDate.toISOString();
    const bIso = bDate.toISOString();
    return aIso > bIso? 1:
      aIso < bIso? -1: 0
  }
  const columnSorting=[
    { columnName: 'duration', compare: numCompare },
    { columnName: 'size',     compare: numCompare },
    { columnName: 'version',  compare: numCompare },
    { columnName: 'date',     compare: dateCompare },
  ];
  const numCols= ['duration','size','version'];
  const [filter, setFilter] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);


  const handleMessageReset = () => { setMessage(<></>) }
  const handleUpload = () => { setUploadVisible(true) }
  const uploadMedia = (files: Array<IUploadFile>) => {
    uploadFiles(files);
    setUploadVisible(false);
  }
  const uploadCancel = () => { setUploadVisible(false) }
  const handleMenu = (e:any) => setActionMenuItem(e.currentTarget);
  const handleConfirmAction = (what: string) => (e:any) => {
    setActionMenuItem(null)
    if (check.length === 0) {
      setMessage(<span>Please select row(s) to {what}.</span>)
    } else if (!/Close/i.test(what)) {
      setConfirmAction(what);
    }
  };
  const handleActionConfirmed = () => {
    if (action != null) {
      if (action(confirmAction, check)) {
        setCheck(Array<number>());
      }
    }
    setConfirmAction('');
  };
  const handleActionRefused = () => {
    setConfirmAction('');
  };
  const handleCheck = (checks: Array<number>) => {
    setCheck(checks);
  };
  const handleFilter = () => setFilter(!filter);

  useEffect(() => {
    setData(
      getMedia(plan as string, mediaFiles, passages, passageSections, sections)
    );
  }, [plan, mediaFiles, passages, passageSections, sections])

  useEffect(() => {
    if (loaded || currentlyLoading < 0) {
      if (uploadList.length > 0 && currentlyLoading + 1 < uploadList.length) {
        const planId = parseInt((keyMap as KeyMap).idToKey('plan', 'remoteId', (plan as string)));
        const mediaFile = {
            PlanId: planId,
          } as any;
        nextUpload(JSON.stringify(mediaFile), uploadList, currentlyLoading + 1, auth)
      }
    }
  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [uploadList, loaded, currentlyLoading, plan, auth])

  return (
    <div className={classes.container}>
      <div className={classes.paper}>
        <div className={classes.actions}>
        <Button
            key="action"
            aria-owns={actionMenuItem !== ''? 'action-menu': undefined}
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
            id='action-menu'
            anchorEl={actionMenuItem}
            open={Boolean(actionMenuItem)}
            onClose={handleConfirmAction('Close')}
          >
            <MenuItem onClick={handleConfirmAction('Delete')}>{t.delete}</MenuItem>
            <MenuItem onClick={handleConfirmAction('Download')}>{t.download}</MenuItem>
            <MenuItem onClick={handleConfirmAction('Change Version')}>{t.changeVersion}</MenuItem>
            <MenuItem onClick={handleConfirmAction('Assign Passage')}>{t.assignPassage}</MenuItem>
          </Menu>
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
          <IconButton onClick={handleFilter} title={"Show/Hide filter rows"}>
            {filter? <SelectAllIcon/>: <FilterIcon/>}
          </IconButton>
        </div>
        <ShapingTable
          columns={columnDefs}
          columnWidths={columnWidths}
          columnSorting={columnSorting}
          numCols={numCols}
          rows={data}
          select={handleCheck}
          shaping={filter}
        />
      </div>
      <MediaUpload
        visible={uploadVisible}
        uploadMethod={uploadMedia}
        cancelMethod={uploadCancel}
      />
      {confirmAction !== ''
      ? <Confirm
          text={confirmAction + ' ' + check.length + ' Item(s). Are you sure?'}
          yesResponse={handleActionConfirmed}
          noResponse={handleActionRefused}
        />
      : <></>}
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, {layout: "mediaTab"}),
  uploadList: state.upload.files,
  currentlyLoading: state.upload.current,
  loaded: state.upload.loaded,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators({
    uploadFiles: actions.uploadFiles,
    nextUpload: actions.nextUpload,
  }, dispatch),
});

const mapRecordsToProps = {
  mediaFiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  passageSections: (q: QueryBuilder) => q.findRecords('passagesection'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
}

export default withStyles(styles, { withTheme: true })(
    withData(mapRecordsToProps)(
        connect(mapStateToProps, mapDispatchToProps)(MediaTab) as any
        ) as any
    ) as any;
      