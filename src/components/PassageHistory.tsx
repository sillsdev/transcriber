import { QueryBuilder, TransformBuilder } from '@orbit/data';
import React, { useState } from 'react';
import { useEffect } from 'react';
import Auth from '../auth/Auth';
import { related, remoteIdGuid } from '../crud';
import { ActivityStates, PassageStateChange, User } from '../model';
import withData from '../mods/react-orbitjs/components/withData';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Confirm from './AlertDialog';
import {
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@material-ui/core';
import UserAvatar from './UserAvatar';
import { useGlobal } from 'reactn';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import useTodo from '../context/useTodo';
import TranscribeAddNote from './TranscribeAddNote';
import { UpdateRecord } from '../model/baseModel';
import { dateOrTime } from '../utils';
import { useUser } from '../crud';

interface IStateProps {}
interface IDispatchProps {}
interface IRecordProps {
  passagestatechanges: Array<PassageStateChange>;
}

interface IProps extends IStateProps, IDispatchProps, IRecordProps {
  passageId: string;
  auth: Auth;
  boxHeight: number;
}
const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    paper: {
      padding: theme.spacing(2),
      margin: 'auto',
    },
    history: {
      overflow: 'auto',
      backgroundColor: theme.palette.background.paper,
    },
    actionIcon: {},
  })
);
export function PassageHistory(props: IProps) {
  const { passageId, boxHeight, passagestatechanges } = props;
  const [memory] = useGlobal('memory');
  const [historyContent, setHistoryContent] = useState<any[]>();
  const [curStateChanges, setCurStateChanges] = useState<PassageStateChange[]>(
    []
  );
  const [user] = useGlobal('user');
  const [locale] = useGlobal('lang');
  const { getUserRec } = useUser();
  const [editNoteVisible, setEditNoteVisible] = useState(false);
  const historyStyle = { height: boxHeight };
  const [selectedId, setSelectedId] = React.useState('');
  const [hoveredId, setHoveredId] = React.useState('');
  const { activityStateStr } = useTodo();
  const [confirmItem, setConfirmItem] = React.useState<string | null>(null);

  const classes = useStyles();
  useEffect(() => {
    if (passageId) {
      const curStateChanges = passagestatechanges
        .filter((r) => related(r, 'passage') === passageId)
        .sort((i, j) =>
          i.attributes.dateCreated <= j.attributes.dateCreated ? -1 : 1
        );
      setCurStateChanges(curStateChanges);
    } else {
      setCurStateChanges([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passageId, passagestatechanges]);

  useEffect(() => {
    const historyItem = (
      psc: PassageStateChange,
      comment: JSX.Element | string,
      type: string,
      editable: boolean
    ) => {
      const userFromId = (psc: PassageStateChange): User => {
        var id = related(psc, 'lastModifiedByUser');
        if (!id) {
          id = remoteIdGuid(
            'user',
            psc.attributes.lastModifiedBy.toString(),
            memory.keyMap
          );
        }
        return getUserRec(id);
      };

      const nameFromId = (psc: PassageStateChange) => {
        const user = userFromId(psc);
        return user ? user.attributes.name : '';
      };
      return (
        <ListItem
          id={`hist-${psc.id}-${type}`}
          key={psc.id + type}
          button
          selected={selectedId === psc.id && editable}
          onClick={(event: any) => handleListItemClick(psc.id, editable)}
          onMouseEnter={() => handleMouseEnter(psc.id, editable)}
          onMouseLeave={() => handleMouseLeave(psc.id)}
        >
          <ListItemIcon>
            <UserAvatar {...props} userRec={userFromId(psc)} />
          </ListItemIcon>
          <ListItemText
            primary={
              <>
                <Typography variant="h6" component="span">
                  {nameFromId(psc)}
                </Typography>
                {'\u00A0\u00A0 '}
                <Typography component="span">
                  {dateOrTime(psc.attributes.dateCreated, locale)}
                </Typography>
              </>
            }
            secondary={comment}
          />
          {selectedId === psc.id && editable && (
            <div>
              <IconButton
                id={'edit-' + psc.id}
                key={'edit-' + psc.id}
                aria-label={'edit-' + psc.id}
                color="default"
                className={classes.actionIcon}
                onClick={handleEdit(psc.id)}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                id={'del-' + psc.id}
                key={'del-' + psc.id}
                aria-label={'del-' + psc.id}
                color="default"
                className={classes.actionIcon}
                onClick={handleDelete(psc.id)}
              >
                <DeleteIcon />
              </IconButton>
            </div>
          )}
        </ListItem>
      );
    };
    const historyList = () => {
      const results: Array<JSX.Element> = [];
      let curState: ActivityStates = ActivityStates.Done;
      let curComment = '';
      curStateChanges.forEach((psc) => {
        const comment = psc.attributes.comments || '';
        if (comment !== '' && comment !== curComment) {
          curComment = comment;
          results.push(
            historyItem(
              psc,
              <span style={{ color: 'black' }}>{comment}</span>,
              'c',
              related(psc, 'lastModifiedByUser') === user
            )
          );
        }
        if (psc.attributes.state && psc.attributes.state !== curState) {
          curState = psc.attributes.state;
          results.push(
            historyItem(psc, activityStateStr.getString(curState), 's', false)
          );
        }
      });
      return results;
    };
    setHistoryContent(historyList());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curStateChanges, selectedId]);

  useEffect(() => {
    if (!editNoteVisible && !confirmItem) {
      setSelectedId(hoveredId);
    }
  }, [hoveredId, editNoteVisible, confirmItem]);

  const handleMouseEnter = (id: string, editable: boolean) => {
    if (editable) setHoveredId(id);
    else setHoveredId('');
  };
  const handleMouseLeave = (id: string) => {
    if (hoveredId === id) setHoveredId('');
  };

  const handleListItemClick = (id: string, editable: boolean) => {
    if (editable) setSelectedId(id);
  };
  const handleEditNote = async (psc: PassageStateChange) => {
    setEditNoteVisible(false);
    memory.update((t: TransformBuilder) => UpdateRecord(t, psc, user));
  };
  const handleEditNoteCancel = () => setEditNoteVisible(false);

  const handleEdit = (id: string) => () => {
    setEditNoteVisible(true);
  };
  const handleDeleteConfirmed = () => {
    setConfirmItem(null);
    const psc = curStateChanges.find((psc) => psc.id === selectedId);
    //this may be a comment on a state change, so just hide the comment but leave the record
    if (psc) {
      psc.attributes.comments = '';
      handleEditNote(psc);
    }
  };
  const handleDeleteRefused = () => setConfirmItem(null);

  const handleDelete = (id: string) => () => {
    const psc = curStateChanges.find((psc) => psc.id === selectedId);
    setConfirmItem(psc?.attributes.comments || '');
  };

  return (
    <>
      <List style={historyStyle} className={classes.history}>
        {historyContent}
      </List>
      <TranscribeAddNote
        visible={editNoteVisible}
        pscIn={curStateChanges.find((psc) => psc.id === selectedId)}
        editMethod={handleEditNote}
        cancelMethod={handleEditNoteCancel}
      />
      {confirmItem !== null ? (
        <Confirm
          isDelete={true}
          text={confirmItem}
          yesResponse={handleDeleteConfirmed}
          noResponse={handleDeleteRefused}
        />
      ) : (
        <></>
      )}
    </>
  );
}

const mapRecordsToProps = {
  passagestatechanges: (q: QueryBuilder) => q.findRecords('passagestatechange'),
};
export default withData(mapRecordsToProps)(PassageHistory as any) as any;
