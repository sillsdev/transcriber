import React from 'react';
import { Passage, Section, OptionType } from '../../model';
import { useGlobal } from 'reactn';
import { makeStyles, createStyles } from '@material-ui/core';
import {
  Grid,
  FormControl,
  InputLabel,
  Input,
  Button,
} from '@material-ui/core';
import Confirmation from '../AlertDialog';
import AudacityConfigure from './AudacityConfigure';
import BookSelect from '../BookSelect';
import { useSnackBar } from '../../hoc/SnackBar';
import { QueryBuilder } from '@orbit/data';
import { related } from '../../crud';

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      display: 'flex',
      justifyContent: 'flex-end',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      '& > *': {
        paddingBottom: '10px',
      },
    },
  })
);

interface IDoIt {
  text: string;
  act: () => void;
}

function DoIt(props: IDoIt) {
  const { text, act } = props;
  const classes = useStyles();

  const handleClick = () => {
    act();
  };

  return (
    <div className={classes.root}>
      <Button onClick={handleClick}>{text}</Button>
    </div>
  );
}

interface IProps {
  id: string;
  row: number;
  onTranscribe: (i: number) => void;
  onAssign: (where: number[]) => () => void;
  onUpload: (i: number) => () => void;
  onRecord: (i: number) => void;
  bookSuggestions: OptionType[];
}

export function PassageDetail(props: IProps) {
  const { id, row, bookSuggestions } = props;
  const { onTranscribe, onAssign, onUpload, onRecord } = props;
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const [passRec, setPassRec] = React.useState<Passage>();
  const [secRec, setSecRec] = React.useState<Section>();
  const [bookChoice, setBookChoice] = React.useState<OptionType>();
  const [deleteAlert, setDeleteAlert] = React.useState(false);
  const { showMessage } = useSnackBar();

  const handleSecSeq = () => {};
  const handleSecName = () => {};
  const handlePassSeq = () => {};
  const handleBookCommit = () => {};
  const handleBookRevert = () => {};
  const handleBookNoSave = () => {};
  const handleRef = () => {};
  const handleDesc = () => {};

  const noop = () => {
    showMessage('Not Implemented');
  };

  const handleRecord = () => {
    onRecord(row);
  };

  const handleTranscribe = () => {
    onTranscribe(row);
  };

  const handleDelete = () => {
    setDeleteAlert(!deleteAlert);
  };

  const handleNoDelete = () => {
    setDeleteAlert(false);
  };

  React.useEffect(() => {
    const rec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'passage', id })
    ) as Passage;
    setPassRec(rec);
    const choice = bookSuggestions.filter(
      (s) => s.value === rec?.attributes?.book
    );
    if (choice.length > 0) setBookChoice(choice[0]);
    const secId = related(rec, 'section');
    const sRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecord({ type: 'section', id: secId })
    ) as Section;
    setSecRec(sRec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, bookSuggestions]);

  return (
    <div>
      <Grid container justify="space-between">
        <Grid item xs={6}>
          <div className={classes.form}>
            <FormControl>
              <InputLabel htmlFor="section-seq">
                {'Section Sequence Number'}
              </InputLabel>
              <Input
                id="section-seq"
                value={secRec?.attributes?.sequencenum}
                onChange={handleSecSeq}
              />
            </FormControl>
            <FormControl>
              <InputLabel htmlFor="section-name">{'Section Name'}</InputLabel>
              <Input
                id="section-name"
                value={secRec?.attributes?.name}
                onChange={handleSecName}
              />
            </FormControl>
            <FormControl>
              <InputLabel htmlFor="passage-seq">{'Sequence number'}</InputLabel>
              <Input
                id="passage-seq"
                value={passRec?.attributes?.sequencenum}
                onChange={handlePassSeq}
              />
            </FormControl>
            <FormControl>
              <BookSelect
                value={bookChoice || bookSuggestions[0]}
                suggestions={bookSuggestions}
                placeHolder={'Book select'} //planSheetStrings.bookSelect
                onCommit={handleBookCommit}
                onRevert={handleBookRevert}
                setPreventSave={handleBookNoSave}
              />
            </FormControl>
            <FormControl>
              <InputLabel htmlFor="passage-ref">{'Reference'}</InputLabel>
              <Input
                id="passage-ref"
                value={passRec?.attributes?.reference}
                onChange={handleRef}
              />
            </FormControl>
            <FormControl>
              <InputLabel htmlFor="passage-desc">{'Description'}</InputLabel>
              <Input
                id="passage-desc"
                value={passRec?.attributes?.title}
                onChange={handleDesc}
              />
            </FormControl>
          </div>
        </Grid>
        <Grid item xs={6}>
          <DoIt text={'Resources'} act={noop} />
          <DoIt text={'Upload'} act={onUpload(row)} />
          <DoIt text={'Record'} act={handleRecord} />
          <DoIt text={'Assign'} act={onAssign([row])} />
          <DoIt text={'Transcribe'} act={handleTranscribe} />
          <DoIt text={'Back Translations'} act={noop} />
          <DoIt text={'Comments'} act={noop} />
          <DoIt text={'Versions'} act={noop} />
          <DoIt text={'Results'} act={noop} />
          <AudacityConfigure />
          <DoIt text={'Delete'} act={handleDelete} />
        </Grid>
      </Grid>
      {deleteAlert && (
        <Confirmation
          open={deleteAlert}
          handleClose={handleNoDelete}
          noResponse={handleNoDelete}
          yesResponse={handleNoDelete}
        />
      )}
    </div>
  );
}

export default PassageDetail;
