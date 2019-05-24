import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, MediaFile, Passage, PassageSection,
  Section, IMediaTabStrings } from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import { Button, Menu, MenuItem, IconButton } from '@material-ui/core'
import DropDownIcon from '@material-ui/icons/ArrowDropDown';
import AddIcon from '@material-ui/icons/Add';
import FilterIcon from '@material-ui/icons/FilterList';
import SelectAllIcon from '@material-ui/icons/SelectAll';
import SnackBar from './SnackBar';
import Confirm from './AlertDialog';
import ShapingTable from './ShapingTable';
import related from '../utils/related';

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

const getMedia = (plan: string, mediaFiles: Array<MediaFile>, passages: Array<Passage>, passageSections: Array<PassageSection>, sections: Array<Section>) => {
  const media = mediaFiles.filter(f => related(f, 'plan') === plan);
  const rowData = media.map(f => {
    const passageId = related(f, 'passage');
    const passage = passages.filter(p => p.id === passageId);
    const passageSection = passageSections.filter(ps => related(ps, 'passage') === passageId);
    const sectionId = passageSection.length > 0? related(passageSection[0], 'section'): '';
    const section = sections.filter(s => s.id === sectionId);
    return {
      fileName: f.attributes.originalFile,
      section: getSection(section),
      reference: getReference(passage),
      duration: f.attributes.duration? f.attributes.duration.toString(): '',
      size: f.attributes.filesize,
      version: f.attributes.versionNumber? f.attributes.versionNumber.toString(): '',
    } as IRow
  });
  return(rowData as Array<IRow>);
};

interface IStateProps {
  t: IMediaTabStrings;
};

interface IRecordProps {
  mediaFiles: Array<MediaFile>;
  passages: Array<Passage>;
  passageSections: Array<PassageSection>;
  sections: Array<Section>;
}

interface IProps extends IStateProps, IRecordProps, WithStyles<typeof styles>{
  action?: (what: string, where: number[]) => boolean;
  upload?: () => void;
};
  
export function MediaTab(props: IProps) {
  const { classes, t,
    action, upload,
    mediaFiles, passages, passageSections, sections } = props;
  const [plan] = useGlobal('plan');
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
  ];
  const columnWidths=[
    { columnName: "fileName", width: 150 },
    { columnName: "section", width: 200 },
    { columnName: "reference", width: 150 },
    { columnName: "duration", width: 100 },
    { columnName: "size", width: 100 },
    { columnName: "version", width: 100 },
  ];
  const sizeCols= ['size'];
  const [filter, setFilter] = useState(false);

  const handleMessageReset = () => { setMessage(<></>) }
  const handleUpload = () => {
    if (upload != null) {
      upload();
    }
  }
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
          <IconButton onClick={handleFilter}>
            {filter? <SelectAllIcon/>: <FilterIcon/>}
          </IconButton>
        </div>
        <ShapingTable
          columns={columnDefs}
          columnWidths={columnWidths}
          sizeCols={sizeCols}
          rows={data}
          select={handleCheck}
          shaping={filter}
        />
      </div>
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
  t: localStrings(state, {layout: "mediaTab"})
});

const mapRecordsToProps = {
  mediaFiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  passageSections: (q: QueryBuilder) => q.findRecords('passagesection'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
}

export default withStyles(styles, { withTheme: true })(
    withData(mapRecordsToProps)(
        connect(mapStateToProps)(MediaTab) as any
        ) as any
    ) as any;
      