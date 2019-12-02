import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  IState,
  User,
  ITaskItemStrings,
  BookName,
  MediaDescription,
  MediaFile,
} from '../model';
import * as actions from '../store';
import localStrings from '../selector/localize';
import { createStyles, Theme, makeStyles } from '@material-ui/core/styles';
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
} from '@material-ui/core';
import TaskFlag, { NextState } from './TaskFlag';
import UserAvatar from './UserAvatar';
import Duration from './Duration';
import { related, sectionNumber, passageNumber } from '../utils';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      maxWidth: 360,
    },
    detail: {
      display: 'flex',
      flexDirection: 'column',
    },
    detailAlign: {
      display: 'flex',
      flexDirection: 'row-reverse',
    },
  })
);

interface IStateProps {
  t: ITaskItemStrings;
  lang: string;
  allBookData: BookName[];
}

interface IDispatchProps {
  fetchBooks: typeof actions.fetchBooks;
}

interface IRecordProps {
  users: Array<User>;
}

interface IProps extends IStateProps, IDispatchProps {
  mediaDesc: MediaDescription;
  mediaRec: MediaFile;
  select: (media: MediaDescription) => (e: any) => void;
}

export function TaskItem(props: IProps) {
  const { allBookData, fetchBooks, lang, t, mediaRec, select } = props;
  const { passage, section } = props.mediaDesc;
  const classes = useStyles();

  React.useEffect(() => {
    fetchBooks(lang);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  let book = '';
  let ref = '';
  const attr = passage.attributes;
  if (attr) {
    book = attr.book;
    ref = attr.reference;
    const bookItem = allBookData.filter(b => b.code === book);
    if (bookItem.length > 0) book = bookItem[0].long;
  }

  const next = NextState({ ...props, state: attr.state });
  let assigned = undefined;
  if (next === t.transcribe) assigned = related(section, 'transcriber');
  if (next === t.review) assigned = related(section, 'reviewer');

  return (
    <List className={classes.root}>
      <ListItem alignItems="flex-start" onClick={select(props.mediaDesc)}>
        <ListItemAvatar>
          {assigned && <UserAvatar {...props} userRec={assigned} />}
        </ListItemAvatar>
        <ListItemText
          primary={book + ' ' + ref}
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
  lang: state.strings.lang,
  allBookData: state.books.bookData,
});

const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      fetchBooks: actions.fetchBooks,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(TaskItem) as any;
