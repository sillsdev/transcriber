import { shallowEqual, useSelector } from 'react-redux';
import {
  IPlanSheetStrings,
  ISheet,
  IViewModeStrings,
  OptionType,
} from '../../model';
import { ICell } from './PlanSheet';
import { planSheetSelector, viewModeSelector } from '../../selector';
import { useOrganizedBy, useRole } from '../../crud';
import { rowTypes } from './rowTypes';
import { StageReport } from '../../control';
import { Badge } from '@mui/material';
import PlanAudioActions from './PlanAudioActions';
import {
  RefRender,
  isPublishingTitle,
  passageTypeFromRef,
} from '../../control/RefRender';
import { memo, useContext, useCallback, useMemo } from 'react';
import TaskAvatar from '../TaskAvatar';
import { PassageTypeEnum } from '../../model/passageType';
import PlanActionMenu from './PlanActionMenu';
import { PlanContext } from '../../context/PlanContext';
import BookSelect from '../BookSelect';
import { useRefErrTest } from './useRefErrTest';
import { SectionSeqCol, PassageSeqCol } from './PlanSheet';
import { useGlobal } from 'reactn';
import { useShowIcon } from './useShowIcon';
import { ExtraIcon } from '.';

type ICellEditor = (props: any) => JSX.Element;
type IRow = (string | number)[];

interface IProps {
  columns: ICell[];
  rowData: IRow[];
  rowInfo: ISheet[];
  inlinePassages: boolean;
  bookCol: number;
  bookSuggestions?: OptionType[];
  onPassageDetail: (rowIndex: number) => void;
  onPlayStatus: (mediaId: string) => void;
  onHistory: (rowIndex: number) => () => void;
  onSetPreventSave: (val: boolean) => void;
  onDelete: (rowIndex: number) => () => void;
  onAudacity: (rowIndex: number) => () => void;
  onRecord: (rowIndex: number) => void;
  onUpload: (rowIndex: number) => () => void;
  onAssign: (where: number[]) => () => void;
  disableFilter: () => void;
  onAction: (what: ExtraIcon) => void;
  doSetActive: () => void;
}

/**
 * Custom hook that generates the data for filling a plan sheet based on the provided props.
 *
 * @param {Object} props - The props object containing various configuration options.
 * @param {Array} props.columns - An array of column definitions for the plan sheet.
 * @param {Array} props.rowData - An array of row data for the plan sheet.
 * @param {Array} props.rowInfo - An array of additional information for each row in the plan sheet.
 * @param {Array} props.inlinePassages - True if section and passage on the same line.
 * @param {number} props.bookCol - The index of the column that represents the book name.
 * @param {Array} props.bookSuggestions - An array of book suggestions for the book select input.
 * @param {Function} props.onPassageDetail - A callback function for handling passage detail.
 * @param {Function} props.onPlayStatus - A callback function for handling play status.
 * @param {Function} props.onHistory - A callback function for handling history.
 * @param {Function} props.onSetPreventSave - A callback function for setting prevent save.
 * @param {Function} props.onDelete - A callback function for handling delete.
 * @param {Function} props.onAudacity - A callback function for launching audacity.
 * @param {Function} props.onRecord - A callback function for handling record.
 * @param {Function} props.onUpload - A callback function for handling upload.
 * @param {Function} props.onAssign - A callback function for handling assign.
 * @param {boolean} props.disableFilter - A callback function to disable the filtering.
 * @param {Function} props.onAction - A callback function for handling action.
 * @param {Function} props.doSetActive - A callback function for setting the active row.
 * @returns {Function} - A function that generates the data for filling a plan sheet based on the provided props.
 */
export const usePlanSheetFill = ({
  columns,
  rowData,
  rowInfo,
  inlinePassages,
  bookCol,
  bookSuggestions,
  onPassageDetail,
  onPlayStatus,
  onHistory,
  onSetPreventSave,
  onDelete,
  onAudacity,
  onRecord,
  onUpload,
  onAssign,
  disableFilter,
  onAction,
  doSetActive,
}: IProps) => {
  const ctx = useContext(PlanContext);
  const { readonly } = ctx.state;
  const LastCol = bookCol > 0 ? 6 : 5;
  const [planId] = useGlobal('plan');
  const { userIsAdmin } = useRole();
  const refErrTest = useRefErrTest();
  const { getOrganizedBy } = useOrganizedBy();
  const showIcon = useShowIcon({ readonly, rowInfo, inlinePassages });
  const { isPassage, isSection, isMovement, isBook } = rowTypes(rowInfo);
  const t: IPlanSheetStrings = useSelector(planSheetSelector, shallowEqual);
  const tv: IViewModeStrings = useSelector(viewModeSelector, shallowEqual);

  const handlePassageDetail = (i: number) => () => {
    onPassageDetail && onPassageDetail(i);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const organizedBy = useMemo(() => getOrganizedBy(true), [planId]);

  const bookEditor: ICellEditor = useCallback(
    (props: any) => {
      if (readonly) return <></>;
      return (
        <BookSelect
          id="book"
          suggestions={bookSuggestions ? bookSuggestions : []}
          placeHolder={t.bookSelect}
          setPreventSave={onSetPreventSave}
          {...props}
        />
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookSuggestions, readonly, t.bookSelect]
  );

  const ActivateCell: ICellEditor = (props: any) => {
    doSetActive();
    props.onRevert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return <></>;
  };

  const MemoizedTaskAvatar = memo(TaskAvatar);

  const titleRow = (columns: ICell[]) => [
    [
      {
        value: t.step,
        readOnly: true,
      } as ICell,
      {
        value: t.assigned,
        readOnly: true,
      } as ICell,
      {
        value: t.action,
        readOnly: true,
        width: userIsAdmin ? 50 : 20,
      } as ICell,
    ].concat(
      columns.map((col) => {
        return { ...col, readOnly: true };
      })
    ),
  ];

  const stepCell = (
    passage: boolean,
    row: IRow,
    refCol: number,
    rowIndex: number,
    calcClassName: string
  ) =>
    ({
      value: passage &&
        !isPublishingTitle(row[refCol].toString(), inlinePassages) && (
          <Badge
            badgeContent={rowInfo[rowIndex].discussionCount}
            color="secondary"
          >
            <StageReport
              onClick={handlePassageDetail(rowIndex)}
              step={rowInfo[rowIndex].step || ''}
              tip={tv.gotowork}
            />
          </Badge>
        ),
      readOnly: true,
      className: calcClassName,
    } as ICell);

  const assignmentCell = (rowIndex: number, calcClassName: string) =>
    ({
      value: (
        <MemoizedTaskAvatar
          assigned={rowInfo[rowIndex].transcriber?.id || ''}
        />
      ),
      readOnly: true,
      className: calcClassName,
    } as ICell);

  const actionValue = (
    passage: boolean,
    rowIndex: number,
    srcMediaId: string,
    mediaPlaying: boolean
  ) => {
    if (!passage) return <></>;
    return (
      <PlanAudioActions
        rowIndex={rowIndex}
        isPassage={passage}
        isNote={rowInfo[rowIndex].passageType === PassageTypeEnum.NOTE}
        mediaId={rowInfo[rowIndex].mediaId?.id || ''}
        mediaShared={rowInfo[rowIndex].mediaShared}
        onPlayStatus={onPlayStatus}
        onHistory={onHistory}
        isPlaying={srcMediaId === rowInfo[rowIndex].mediaId?.id && mediaPlaying}
      />
    );
  };

  const actionCell = (
    passage: boolean,
    rowIndex: number,
    calcClassName: string,
    srcMediaId: string,
    mediaPlaying: boolean
  ) =>
    ({
      value: actionValue(passage, rowIndex, srcMediaId, mediaPlaying),
      readOnly: true,
      className: calcClassName,
    } as ICell);

  const refValue = (e: string | number) => {
    if (
      passageTypeFromRef(e as string, inlinePassages) !==
      PassageTypeEnum.PASSAGE
    )
      return <RefRender value={e as string} flat={inlinePassages} />;
    return e;
  };

  const rowCells =
    (
      section: boolean,
      passage: boolean,
      refCol: number,
      calcClassName: string
    ) =>
    (e: string | number, cellIndex: number) => {
      if (cellIndex === bookCol && passage)
        return {
          value: e,
          readOnly: readonly,
          className: 'book ' + calcClassName,
          dataEditor: bookEditor,
        };
      if (cellIndex === refCol)
        return {
          value: refValue(e),
          readOnly:
            readonly ||
            section ||
            passageTypeFromRef(e as string, inlinePassages) !==
              PassageTypeEnum.PASSAGE,
          className:
            calcClassName +
            (passage ? ' ref' + (refErrTest(e) ? 'Err' : '') : ''),
        };
      return {
        value: e,
        readOnly:
          readonly ||
          (cellIndex === SectionSeqCol && (e as number) < 0) ||
          cellIndex === PassageSeqCol ||
          section
            ? passage
              ? false
              : cellIndex > 1
            : cellIndex <= 1,
        className:
          (cellIndex === SectionSeqCol || cellIndex === PassageSeqCol
            ? 'num '
            : '') + calcClassName,
      };
    };

  const extrasCell = (
    section: boolean,
    passage: boolean,
    rowIndex: number,
    calcClassName: string,
    row: IRow,
    check: number[],
    movement: boolean,
    book: boolean,
    active: number,
    filtered: boolean
  ) =>
    ({
      value: (
        <PlanActionMenu
          rowIndex={rowIndex}
          isSection={section}
          isPassage={passage}
          psgType={rowInfo[rowIndex].passageType}
          published={rowInfo[rowIndex].published}
          organizedBy={organizedBy}
          sectionSequenceNumber={row[SectionSeqCol].toString()}
          passageSequenceNumber={row[PassageSeqCol].toString()}
          readonly={readonly || check.length > 0}
          onDelete={onDelete}
          onPlayStatus={onPlayStatus}
          onAudacity={onAudacity}
          onRecord={onRecord}
          onUpload={onUpload}
          onAssign={onAssign}
          canAssign={userIsAdmin && !movement && !book}
          canDelete={userIsAdmin}
          active={active - 1 === rowIndex}
          onDisableFilter={!readonly && filtered ? disableFilter : undefined}
          showIcon={showIcon(filtered, rowIndex)}
          onAction={onAction}
        />
      ),
      // readOnly: true,
      className: calcClassName,
      dataEditor: ActivateCell,
    } as ICell);

  const eachRow =
    (
      refCol: number,
      currentRow: number,
      srcMediaId: string,
      mediaPlaying: boolean,
      check: number[],
      active: number,
      filtered: boolean
    ) =>
    (row: IRow, rowIndex: number) => {
      const section = isSection(rowIndex);
      const passage = isPassage(rowIndex);
      const movement = isMovement(rowIndex);
      const book = isBook(rowIndex);
      const iscurrent: string =
        currentRow === rowIndex + 1 ? ' currentrow ' : '';

      const calcClassName =
        iscurrent + section
          ? 'set' +
            (passage ? 'p' : '') +
            (movement ? ' movement' : book ? ' bk' : '')
          : 'pass';

      const sheetRow = [
        stepCell(passage, row, refCol, rowIndex, calcClassName),
        assignmentCell(rowIndex, calcClassName),
        actionCell(passage, rowIndex, calcClassName, srcMediaId, mediaPlaying),
      ];
      row
        .slice(0, LastCol)
        .map(rowCells(section, passage, refCol, calcClassName))
        .forEach((c) => {
          sheetRow.push(c);
        });
      sheetRow.push(
        extrasCell(
          section,
          passage,
          rowIndex,
          calcClassName,
          row,
          check,
          movement,
          book,
          active,
          filtered
        )
      );
      return sheetRow;
    };

  return (
    refCol: number,
    currentRow: number,
    srcMediaId: string,
    mediaPlaying: boolean,
    check: number[],
    active: number,
    filtered: boolean
  ) => {
    const data = titleRow(columns);
    rowData
      .map(
        eachRow(
          refCol,
          currentRow,
          srcMediaId,
          mediaPlaying,
          check,
          active,
          filtered
        )
      )
      .forEach((r) => data.push(r));
    return data;
  };
};
