import React, { FC, forwardRef, memo } from 'react';
import {
  ISharedStrings,
  IPlanActionsStrings,
  IPlanSheetStrings,
  IPassageTypeStrings,
} from '../../model';
import { MenuItem, MenuList } from '@mui/material';
import AssignIcon from '@mui/icons-material/PeopleAltOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/LibraryAddOutlined';
import MicIcon from '@mui/icons-material/Mic';
import { isElectron } from '../../api-variable';
import { AudacityLogo } from '../../control';
import {
  AddNoteIcon,
  InsertMovementIcon,
  InsertSectionIcon,
  PassageBelowIcon,
  PassageDownIcon,
  PassageToNextIcon,
  PassageToPrevIcon,
  PassageUpIcon,
  PublishIcon,
  UnPublishIcon,
} from '../../control/PlanIcons';

interface IProps {
  open: boolean;
  onKey: (event: React.KeyboardEvent) => void;
  rowIndex: number;
  isSection: boolean;
  isPassage: boolean;
  published: boolean;
  psgType: string;
  readonly: boolean;
  canAssign: boolean;
  canDelete: boolean;
  active: boolean;
  organizedBy: string;
  sectionSequenceNumber: string;
  passageSequenceNumber: string;
  onPlayStatus: (mediaId: string) => void;
  onRecord: (i: number) => void;
  onUpload: (i: number) => () => void;
  onAudacity: (i: number) => () => void;
  onAssign: (where: number[]) => () => void;
  onDelete: (i: number) => () => void;
  onDisableFilter?: () => void;
  onPassageBelow?: () => void;
  onPassageToPrev?: () => void;
  onPassageToNext?: () => void;
  onMovementAbove?: () => void;
  onSectionAbove?: () => void;
  onPassageUp?: () => void;
  onPassageDown?: () => void;
  onNote?: () => void;
  onPublish?: () => void;
  t: IPlanActionsStrings;
  p: IPlanSheetStrings;
  ts: ISharedStrings;
  ty: IPassageTypeStrings;
}
export const PlanMoreMenuItems: FC<
  IProps & React.RefAttributes<HTMLUListElement>
> = memo(
  forwardRef((props: IProps, ref: React.Ref<HTMLUListElement>) => {
    const {
      open,
      onKey,
      rowIndex,
      isSection,
      isPassage,
      psgType,
      readonly,
      published,
      onUpload,
      onAudacity,
      onAssign,
      onDelete,
      canAssign,
      canDelete,
      organizedBy,
      sectionSequenceNumber,
      passageSequenceNumber,
      onPlayStatus,
      onRecord,
      onDisableFilter,
      onPassageBelow,
      onPassageToPrev,
      onPassageToNext,
      onPassageUp,
      onPassageDown,
      onSectionAbove,
      onMovementAbove,
      onNote,
      onPublish,
      t,
      p,
      ts,
      ty,
    } = props;

    const handleRecord = (index: number) => () => {
      onPlayStatus('');
      onRecord(index);
    };

    function handleListKeyDown(event: React.KeyboardEvent) {
      onKey(event);
    }

    return (
      <MenuList
        ref={ref}
        autoFocusItem={open}
        id="menu-list-grow"
        onKeyDown={handleListKeyDown}
        sx={{ display: 'flex' }}
      >
        {onPublish &&
          (published ? (
            <MenuItem
              id="unpublish"
              onClick={onPublish}
              title={p.unpublish
                .replace('{0}', organizedBy)
                .replace('{1}', sectionSequenceNumber)}
            >
              <UnPublishIcon />
            </MenuItem>
          ) : (
            <MenuItem
              id="publish"
              onClick={onPublish}
              title={p.publish
                .replace('{0}', organizedBy)
                .replace('{1}', sectionSequenceNumber)}
            >
              <PublishIcon />
            </MenuItem>
          ))}
        {isSection && canAssign && !readonly && (
          <MenuItem
            id="planActAssign"
            title={t.assign}
            onClick={onAssign([rowIndex])}
          >
            <AssignIcon sx={{ color: 'primary.light' }} />
          </MenuItem>
        )}
        {onDisableFilter && (
          <MenuItem id="filtered" onClick={onDisableFilter}>
            {p.filtered}
          </MenuItem>
        )}
        {onMovementAbove && (
          <MenuItem
            id="movementAbove"
            onClick={onMovementAbove}
            title={p.movementAbove
              .replace('{0}', organizedBy)
              .replace('{1}', sectionSequenceNumber)}
          >
            <InsertMovementIcon />
          </MenuItem>
        )}
        {onSectionAbove && (
          <MenuItem
            id="secAbove"
            onClick={onSectionAbove}
            title={p.sectionAbove
              .replace('{0}', organizedBy)
              .replace('{1}', organizedBy)
              .replace('{2}', sectionSequenceNumber)}
          >
            <InsertSectionIcon />
          </MenuItem>
        )}
        {onPassageBelow && isSection && (
          <MenuItem
            id="psgAsFirst"
            onClick={onPassageBelow}
            title={p.insertFirstPassage
              .replace('{0}', organizedBy)
              .replace('{1}', sectionSequenceNumber)}
          >
            <PassageBelowIcon />
          </MenuItem>
        )}
        {onPassageBelow && isPassage && (
          <MenuItem
            id="passBelow"
            onClick={onPassageBelow}
            title={p.passageBelow.replace('{0}', passageSequenceNumber)}
          >
            <PassageBelowIcon />
          </MenuItem>
        )}
        {onPassageUp && (
          <MenuItem
            id="passUp"
            onClick={onPassageUp}
            title={p.moveUp
              .replace('{pt}', ty.getString(psgType))
              .replace('{0}', passageSequenceNumber)}
          >
            <PassageUpIcon />
          </MenuItem>
        )}
        {onPassageToPrev && (
          <MenuItem
            id="passToPrev"
            onClick={onPassageToPrev}
            title={p.passageToPrevSection.replace('{0}', passageSequenceNumber)}
          >
            <PassageToPrevIcon />
          </MenuItem>
        )}

        {onPassageDown && (
          <MenuItem
            id="passDown"
            onClick={onPassageDown}
            title={p.moveDown
              .replace('{pt}', ty.getString(psgType))
              .replace('{0}', passageSequenceNumber)}
          >
            <PassageDownIcon />
          </MenuItem>
        )}
        {onPassageToNext && (
          <MenuItem
            id="passToNext"
            onClick={onPassageToNext}
            title={p.passageToNextSection.replace('{0}', passageSequenceNumber)}
          >
            <PassageToNextIcon />
          </MenuItem>
        )}
        {isPassage && onNote && (
          <MenuItem id="addnote" onClick={onNote} title={t.addNote}>
            <AddNoteIcon />
          </MenuItem>
        )}
        {isPassage && (
          <MenuItem
            id="planActUpload"
            onClick={onUpload(rowIndex)}
            title={ts.uploadMediaSingular}
          >
            <AddIcon sx={{ color: 'primary.light' }} />
          </MenuItem>
        )}
        {isPassage && (
          <MenuItem
            id="planActRec"
            onClick={handleRecord(rowIndex)}
            title={t.recordAudio}
          >
            <MicIcon sx={{ color: 'primary.light' }} />
          </MenuItem>
        )}
        {isElectron && isPassage && (
          <MenuItem
            id="planActAud"
            title={ts.launchAudacity}
            onClick={onAudacity(rowIndex)}
          >
            <AudacityLogo />
          </MenuItem>
        )}
        {canDelete && !readonly && (
          <MenuItem
            id="planActDel"
            title={t.delete}
            onClick={onDelete(rowIndex)}
          >
            <DeleteIcon sx={{ color: 'primary.light' }} />
          </MenuItem>
        )}
      </MenuList>
    );
  })
);
