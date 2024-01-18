import React, { FC, forwardRef, memo } from 'react';
import {
  ISharedStrings,
  IPlanActionsStrings,
  IPlanSheetStrings,
  IPassageTypeStrings,
} from '../../model';
import { MenuItem, MenuList, TextField } from '@mui/material';
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
  MoveDownIcon,
  MoveUpIcon,
  PublishIcon,
  UnPublishIcon,
} from '../../control/PlanIcons';
import { ExtraIcon } from '.';
import { PassageTypeEnum } from '../../model/passageType';

interface IProps {
  open: boolean;
  onKey: (event: React.KeyboardEvent) => void;
  rowIndex: number;
  isSection: boolean;
  isPassage: boolean;
  firstMovement: number;
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
  onFirstMovement: (i: number) => void;
  onDisableFilter?: () => void;
  showIcon: (icon: ExtraIcon) => boolean;
  onAction: (i: number, what: ExtraIcon) => void;
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
      firstMovement,
      psgType,
      readonly,
      published,
      onUpload,
      onAudacity,
      onAssign,
      onDelete,
      onFirstMovement,
      canAssign,
      canDelete,
      organizedBy,
      sectionSequenceNumber,
      passageSequenceNumber,
      onPlayStatus,
      onRecord,
      onDisableFilter,
      showIcon,
      onAction,
      t,
      p,
      ts,
      ty,
    } = props;
    const [fm, setFM] = React.useState(firstMovement);
    React.useEffect(() => {
      setFM(firstMovement);
    }, [firstMovement]);

    const handleRecord = (index: number) => () => {
      onPlayStatus('');
      onRecord(index);
    };

    function handleListKeyDown(event: React.KeyboardEvent) {
      onKey(event);
    }

    const handleChangeFirstMovement = (e: any) => {
      e.persist();
      setFM(e.target.value);
      onFirstMovement(e.target.value);
    };
    return (
      <MenuList
        ref={ref}
        autoFocusItem={open}
        id="menu-list-grow"
        onKeyDown={handleListKeyDown}
        sx={{ display: 'flex' }}
      >
        {showIcon(ExtraIcon.Publish) &&
          (published ? (
            <MenuItem
              id="unpublish"
              onClick={() => onAction(rowIndex, ExtraIcon.Publish)}
              title={p.unpublish
                .replace('{0}', organizedBy)
                .replace('{1}', sectionSequenceNumber)}
            >
              <UnPublishIcon />
            </MenuItem>
          ) : (
            <MenuItem
              id="publish"
              onClick={() => onAction(rowIndex, ExtraIcon.Publish)}
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
        {showIcon(ExtraIcon.MovementAbove) && (
          <MenuItem
            id="movementAbove"
            onClick={() => onAction(rowIndex, ExtraIcon.MovementAbove)}
            title={p.movementAbove
              .replace('{0}', organizedBy)
              .replace('{1}', sectionSequenceNumber)}
          >
            <InsertMovementIcon />
          </MenuItem>
        )}
        {showIcon(ExtraIcon.SectionAbove) && (
          <MenuItem
            id="secAbove"
            onClick={() => onAction(rowIndex, ExtraIcon.SectionAbove)}
            title={p.sectionAbove
              .replace('{0}', organizedBy)
              .replace('{1}', organizedBy)
              .replace('{2}', sectionSequenceNumber)}
          >
            <InsertSectionIcon />
          </MenuItem>
        )}
        {showIcon(ExtraIcon.PassageBelow) && isSection && (
          <MenuItem
            id="psgAsFirst"
            onClick={() => onAction(rowIndex, ExtraIcon.PassageBelow)}
            title={p.insertFirstPassage
              .replace('{0}', organizedBy)
              .replace('{1}', sectionSequenceNumber)}
          >
            <PassageBelowIcon />
          </MenuItem>
        )}
        {showIcon(ExtraIcon.PassageBelow) && isPassage && (
          <MenuItem
            id="passBelow"
            onClick={() => onAction(rowIndex, ExtraIcon.PassageBelow)}
            title={p.passageBelow.replace('{0}', passageSequenceNumber)}
          >
            <PassageBelowIcon />
          </MenuItem>
        )}
        {showIcon(ExtraIcon.Note) && (
          <MenuItem
            id="addnote"
            onClick={() => onAction(rowIndex, ExtraIcon.Note)}
            title={t.addNote}
          >
            <AddNoteIcon />
          </MenuItem>
        )}
        {showIcon(ExtraIcon.SectionUp) && (
          <MenuItem
            id="sectionUp"
            onClick={() => onAction(rowIndex, ExtraIcon.SectionUp)}
            title={p.moveUp}
          >
            <MoveUpIcon />
          </MenuItem>
        )}
        {showIcon(ExtraIcon.SectionDown) && (
          <MenuItem
            id="sectionDown"
            onClick={() => onAction(rowIndex, ExtraIcon.SectionDown)}
            title={p.moveDown}
          >
            <MoveDownIcon />
          </MenuItem>
        )}
        {showIcon(ExtraIcon.PassageToPrev) && (
          <MenuItem
            id="passToPrev"
            onClick={() => onAction(rowIndex, ExtraIcon.PassageToPrev)}
            title={p.passageToPrevSection
              .replace('{pt}', ty.getString(psgType))
              .replace('{0}', passageSequenceNumber)}
          >
            <MoveUpIcon />
          </MenuItem>
        )}
        {showIcon(ExtraIcon.PassageUp) && (
          <MenuItem
            id="passUp"
            onClick={() => onAction(rowIndex, ExtraIcon.PassageUp)}
            title={p.moveUp}
          >
            <MoveUpIcon />
          </MenuItem>
        )}
        {showIcon(ExtraIcon.PassageDown) && (
          <MenuItem
            id="passDown"
            onClick={() => onAction(rowIndex, ExtraIcon.PassageDown)}
            title={p.moveDown}
          >
            <MoveDownIcon />
          </MenuItem>
        )}
        {showIcon(ExtraIcon.PassageToNext) && (
          <MenuItem
            id="passToNext"
            onClick={() => onAction(rowIndex, ExtraIcon.PassageToNext)}
            title={p.passageToNextSection
              .replace('{pt}', ty.getString(psgType))
              .replace('{0}', passageSequenceNumber)}
          >
            <MoveDownIcon />
          </MenuItem>
        )}
        {showIcon(ExtraIcon.FirstMovement) && (
          <TextField
            sx={{ m: 1, maxWidth: 80 }}
            id="firstmovement"
            label={p.firstMovement}
            type="number"
            value={fm}
            size="small"
            InputProps={{ inputProps: { min: 0 } }}
            onChange={handleChangeFirstMovement}
            onKeyDown={(e) => e.stopPropagation()}
          />
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
        {isPassage && psgType !== PassageTypeEnum.CHAPTERNUMBER && (
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
