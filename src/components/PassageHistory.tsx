import React, { useState } from 'react';
import { useEffect } from 'react';
import { related, remoteIdGuid } from '../crud';
import {
  ActivityStates,
  PassageStateChange,
  PassageStateChangeD,
  UserD,
} from '../model';
import Confirm from './AlertDialog';
import {
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import UserAvatar from './UserAvatar';
import { useGlobal } from '../context/GlobalContext';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import useTodo from '../context/useTodo';
import TranscribeAddNote from './TranscribeAddNote';
import { UpdateRecord } from '../model/baseModel';
import { dateOrTime } from '../utils';
import { useUser } from '../crud';
import { useOrbitData } from '../hoc/useOrbitData';
import { RecordKeyMap } from '@orbit/records';

interface IProps {
  passageId: string;
  boxHeight: number;
}

export function PassageHistory(props: IProps) {
  const { passageId, boxHeight } = props;
  const passagestatechanges =
    useOrbitData<PassageStateChangeD[]>('passagestatechange');
  const [memory] = useGlobal('memory');
  const [historyContent, setHistoryContent] = useState<any[]>();
  const [curStateChanges, setCurStateChanges] = useState<PassageStateChangeD[]>(
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
      psc: PassageStateChangeD,
      comment: JSX.Element | string,
      type: string,
      editable: boolean
    ) => {
      const userFromId = (psc: PassageStateChange): UserD => {
        var id = related(psc, 'lastModifiedByUser');
        if (!id && psc.attributes?.lastModifiedBy) {
          id = remoteIdGuid(
            'user',
            psc.attributes.lastModifiedBy.toString(),
            memory?.keyMap as RecordKeyMap
          );
        }
        return getUserRec(id);
      };

      const nameFromId = (psc: PassageStateChange) => {
        const user = userFromId(psc);
        return user?.attributes?.name || '';
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
                onClick={handleEdit(psc.id)}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                id={'del-' + psc.id}
                key={'del-' + psc.id}
                aria-label={'del-' + psc.id}
                color="default"
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
        const comment = psc?.attributes?.comments || '';
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
        if (psc?.attributes?.state && psc.attributes.state !== curState) {
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
  const handleEditNote = async (psc: PassageStateChangeD) => {
    setEditNoteVisible(false);
    memory.update((t) => UpdateRecord(t, psc, user));
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
      <List
        style={historyStyle}
        sx={{ overflow: 'auto', bgColor: 'background.paper' }}
      >
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

export default PassageHistory;
