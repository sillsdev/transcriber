import React from 'react';
import { connect } from 'react-redux';
import {
  IState,
  User,
  ITaskItemStrings,
  BookName,
  MediaDescription,
  MediaFile,
} from '../model';
import localStrings from '../selector/localize';
import { createStyles, Theme, makeStyles } from '@material-ui/core/styles';
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
} from '@material-ui/core';
import TaskFlag from './TaskFlag';
import Duration from './Duration';
import { related, sectionNumber, passageNumber } from '../utils';
import { NextAction } from './TaskFlag';
import TaskAvatar from './TaskAvatar';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      minWidth: 360,
    },
    detail: {
      display: 'flex',
      flexDirection: 'column',
    },
    detailAlign: {
      display: 'flex',
      flexDirection: 'row-reverse',
    },
    listAvatar: {
      minWidth: theme.spacing(4),
    },
  })
);

interface IStateProps {
  t: ITaskItemStrings;
  allBookData: BookName[];
}

interface IRecordProps {
  users: Array<User>;
}

interface IProps extends IStateProps {
  mediaDesc: MediaDescription;
  mediaRec: MediaFile;
  select: (media: MediaDescription) => (e: any) => void;
}

export function TaskItem(props: IProps) {
  const { allBookData, t, mediaRec, select } = props;
  const { passage, section } = props.mediaDesc;
  const classes = useStyles();

  let book = '';
  let ref = '';
  let assigned: string | null = null;
  const attr = passage.attributes;
  if (attr) {
    ref = attr.reference;
    book = attr.book;
    if (book) {
      const bookItem = allBookData.filter(b => b.code === book);
      if (bookItem.length > 0) book = bookItem[0].long;
      book = book + ' ';
    } else book = '';
    const next = NextAction({ ...props, state: attr.state });
    if (next === t.transcribe) assigned = related(section, 'transcriber');
    if (next === t.review) assigned = related(section, 'editor');
  }

  return (
    <List className={classes.root}>
      <ListItem alignItems="flex-start" onClick={select(props.mediaDesc)}>
        <ListItemAvatar className={classes.listAvatar}>
          <TaskAvatar assigned={assigned} />
        </ListItemAvatar>
        <ListItemText
          primary={book + ref}
          secondary={<TaskFlag {...props} state={attr.state} />}
        />
        <ListItemSecondaryAction>
          <div className={classes.detail}>
            <div className={classes.detailAlign}>
              <Duration seconds={mediaRec.attributes.duration} />
            </div>
            <div className={classes.detailAlign}>
              {t.section
                .replace('{0}', sectionNumber(section))
                .replace('{1}', passageNumber(passage).trim())}
            </div>
          </div>
        </ListItemSecondaryAction>
      </ListItem>
      {/* <Divider variant="inset" component="li" /> */}
    </List>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'taskItem' }),
  allBookData: state.books.bookData,
});

export default connect(mapStateToProps)(TaskItem) as any;
