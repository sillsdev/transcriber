import { shallowEqual, useSelector } from 'react-redux';
import {
  IPlanSheetStrings,
  ISheet,
  IViewModeStrings,
  IwsKind,
  OptionType,
} from '../../model';
import { ICell, ICellChange } from './PlanSheet';
import { planSheetSelector, viewModeSelector } from '../../selector';
import {
  related,
  useOrganizedBy,
  useRole,
  ArtifactTypeSlug,
  useArtifactType,
  findRecord,
} from '../../crud';
import { rowTypes } from './rowTypes';
import { StageReport } from '../../control';
import { Avatar, Badge, Typography } from '@mui/material';
import PlanPublishActions from './PlanPublishActions';
import PlanAudioActions from './PlanAudioActions';
import {
  RefRender,
  isPublishingTitle,
  passageTypeFromRef,
} from '../../control/RefRender';
import { useContext, useCallback, useMemo, ReactElement } from 'react';
import TaskAvatar from '../TaskAvatar';
import { PassageTypeEnum } from '../../model/passageType';
import PlanActionMenu from './PlanActionMenu';
import { PlanContext } from '../../context/PlanContext';
import BookSelect from '../BookSelect';
import { useRefErrTest } from './useRefErrTest';
import { SectionSeqCol } from './PlanSheet';
import { useGetGlobal, useGlobal } from '../../context/GlobalContext';
import { useShowIcon } from './useShowIcon';
import { ExtraIcon } from '.';
import { positiveWholeOnly, stringAvatar } from '../../utils';
import { TitleEdit } from './TitleEdit';
import { getPubRefs } from './getPubRefs';
import { PublishButton } from './PublishButton';
import { NoteIcon } from '../../control/PlanIcons';
import { OrganizationSchemeD } from '../../model/organizationScheme';

type ICellEditor = (props: any) => JSX.Element;
type IRow = (string | number)[];

const pointer = { cursor: 'pointer' };

export interface IFillProps {
  currentRow: number;
  srcMediaId: string;
  mediaPlaying: boolean;
  check: number[];
  active: number;
  filtered: boolean;
  anyRecording: boolean;
}

interface IProps {
  columns: ICell[];
  colSlugs: string[];
  rowData: IRow[];
  rowInfo: ISheet[];
  inlinePassages: boolean;
  bookSuggestions?: OptionType[];
  hidePublishing: boolean;
  publishingOn: boolean;
  firstMovement: number;
  filtered: boolean;
  onPassageDetail: (rowIndex: number) => void;
  onPlayStatus: (mediaId: string) => void;
  onEdit: (rowIndex: number) => () => void;
  onHistory: (rowIndex: number) => () => void;
  onSetPreventSave: (val: boolean) => void;
  onDelete: (rowIndex: number) => () => void;
  onAudacity: (rowIndex: number) => () => void;
  onRecord: (rowIndex: number) => void;
  onUpload: (rowIndex: number) => () => void;
  onGraphic: (rowIndex: number) => void;
  onAssign: (where: number[]) => () => void;
  onFirstMovement: (rowIndex: number, firstMovement: number) => void;
  disableFilter: () => void;
  onAction: (rowIndex: number, what: ExtraIcon) => void;
  doSetActive: () => void;
  cellsChanged: (changes: ICellChange[]) => void;
  titleMediaChanged: (index: number, mediaId: string) => void;
  onRecording: (recording: boolean) => void;
}

/**
 * Custom hook that generates the data for filling a plan sheet based on the provided props.
 *
 * @param {Object} props - The props object containing various configuration options.
 * @param {Array} props.columns - An array of column definitions for the plan sheet.
 * @param {Array} props.colSlugs - An array of strings with slugs for columns.
 * @param {Array} props.rowData - An array of row data for the plan sheet.
 * @param {Array} props.rowInfo - An array of additional information for each row in the plan sheet.
 * @param {Array} props.inlinePassages - True if section and passage on the same line.
 * @param {Array} props.bookSuggestions - An array of book suggestions for the book select input.
 * @param {Array} props.hidePublishing - True if publishing rows hidden.
 * @param {Array} props.publishingOn - True if publishing rows can be hidden.
 * @param {Function} props.onPassageDetail - A callback function for handling passage detail.
 * @param {Function} props.onPlayStatus - A callback function for handling play status.
 * @param {Function} props.onEdit - A callback function for handling Note metadata edit.
 * @param {Function} props.onHistory - A callback function for handling history.
 * @param {Function} props.onSetPreventSave - A callback function for setting prevent save.
 * @param {Function} props.onDelete - A callback function for handling delete.
 * @param {Function} props.onAudacity - A callback function for launching audacity.
 * @param {Function} props.onRecord - A callback function for handling record.
 * @param {Function} props.onUpload - A callback function for handling upload.
 * @param {Function} props.onGraphic - A callback function for handling adding a graphic.
 * @param {Function} props.onAssign - A callback function for handling assign.
 * @param {boolean} props.disableFilter - A callback function to disable the filtering.
 * @param {Function} props.onAction - A callback function for handling action.
 * @param {Function} props.doSetActive - A callback function for setting the active row.
 * @param {Function} props.cellsChanged - A callback function for handling cell edits.
 * @param {Function} props.titleMediaChanged - A callback function for title media recorded.
 * @param {Function} props.onRecording - A callback function for recorder buffer contains recording.
 * @returns {Function} - A function that generates the data for filling a plan sheet based on the provided props.
 */
export const usePlanSheetFill = ({
  columns,
  colSlugs,
  rowData,
  rowInfo,
  inlinePassages,
  bookSuggestions,
  hidePublishing,
  publishingOn,
  firstMovement,
  filtered,
  onPassageDetail,
  onPlayStatus,
  onEdit,
  onHistory,
  onSetPreventSave,
  onDelete,
  onAudacity,
  onRecord,
  onUpload,
  onGraphic,
  onAssign,
  onFirstMovement,
  disableFilter,
  onAction,
  doSetActive,
  cellsChanged,
  titleMediaChanged,
  onRecording,
}: IProps) => {
  const ctx = useContext(PlanContext);
  const { canEditSheet, sectionArr, setSectionArr, shared, canPublish } =
    ctx.state;
  const sectionMap = new Map<number, string>(sectionArr);
  const [memory] = useGlobal('memory');
  const [planId] = useGlobal('plan'); //will be constant here
  const [offline] = useGlobal('offline'); //verified this is not used in a function 2/18/25
  const [offlineOnly] = useGlobal('offlineOnly'); //will be constant here
  const { userIsAdmin } = useRole();
  const refErrTest = useRefErrTest();
  const { getOrganizedBy } = useOrganizedBy();
  const showIcon = useShowIcon({
    canEditSheet,
    canPublish,
    rowInfo,
    inlinePassages,
    hidePublishing: !publishingOn || hidePublishing,
  });
  const getGlobal = useGetGlobal();
  const {
    isPassageType,
    isSectionType,
    isMovement,
    isBook,
    isAltBook,
    isBeta,
  } = rowTypes(rowInfo);
  const { localizedArtifactType } = useArtifactType();
  const t: IPlanSheetStrings = useSelector(planSheetSelector, shallowEqual);
  const tv: IViewModeStrings = useSelector(viewModeSelector, shallowEqual);

  const handlePassageDetail = (i: number) => () => {
    onPassageDetail && onPassageDetail(i);
  };

  const handleGraphic = (i: number) => () => {
    onGraphic && onGraphic(i);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const organizedBy = useMemo(() => getOrganizedBy(true), [planId]);

  const bookEditor: ICellEditor = useCallback(
    (props: any) => {
      if (!canEditSheet) return <></>;
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
    [bookSuggestions, canEditSheet, t.bookSelect]
  );

  const ActivateCell: ICellEditor = (props: any) => {
    doSetActive();
    props.onRevert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return <></>;
  };

  const titleRow = (columns: ICell[]) => {
    const titles = [
      {
        value: t.step,
        readOnly: true,
      } as ICell,
      {
        value: t.assigned,
        readOnly: true,
      } as ICell,
      {
        value:
          shared || (publishingOn && !hidePublishing)
            ? t.published
            : t.versions,
        readOnly: true,
        width: 20,
      } as ICell,
      {
        value: t.action,
        readOnly: true,
        width: 50,
      } as ICell,
    ];
    if (!hidePublishing && publishingOn)
      titles.push({
        value: localizedArtifactType(ArtifactTypeSlug.Graphic),
        readOnly: true,
        width: 60,
      } as ICell);
    columns
      .map((col) => {
        return { ...col, readOnly: true };
      })
      .forEach((c) => titles.push(c));
    return [titles];
  };

  interface StepCellProps {
    passage: boolean;
    row: IRow;
    refCol: number;
    rowIndex: number;
    calcClassName: string;
    readonly: boolean;
  }

  const stepCell = ({
    passage,
    row,
    refCol,
    rowIndex,
    calcClassName,
    readonly,
  }: StepCellProps) =>
    ({
      value: passage &&
        refCol > 0 &&
        !isPublishingTitle(row[refCol].toString(), inlinePassages) && (
          <Badge
            badgeContent={rowInfo[rowIndex].discussionCount}
            color="secondary"
          >
            <StageReport
              onClick={readonly ? undefined : handlePassageDetail(rowIndex)}
              step={rowInfo[rowIndex].step || ''}
              tip={tv.gotowork}
            />
          </Badge>
        ),
      readOnly: true,
      className: calcClassName,
    } as ICell);

  const schemeName = (schemeId: string) => {
    const schemeRec = findRecord(memory, 'organizationscheme', schemeId) as
      | OrganizationSchemeD
      | undefined;
    return schemeRec?.attributes?.name;
  };

  const assignmentCell = (rowIndex: number, calcClassName: string) =>
    ({
      value: rowInfo[rowIndex].assign ? (
        <TaskAvatar assigned={rowInfo[rowIndex].assign || null} />
      ) : (
        <Typography
          sx={{
            maxWidth: '80px',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textAlign: 'center',
            fontSize: 'small',
          }}
        >
          {schemeName(rowInfo[rowIndex].scheme?.id || '')}
        </Typography>
      ),
      readOnly: true,
      className: calcClassName,
    } as ICell);

  interface PublishedValueProps {
    passage: boolean;
    rowIndex: number;
    canEdit: boolean;
  }

  const publishedValue = ({
    passage,
    rowIndex,
    canEdit,
  }: PublishedValueProps) => {
    const isShowIcon = showIcon(
      filtered,
      getGlobal('offline') && !offlineOnly,
      rowIndex
    );
    if (isShowIcon(ExtraIcon.Publish)) {
      return (
        <PublishButton
          sectionMap={sectionMap}
          rowInfo={rowInfo}
          rowIndex={rowIndex}
          organizedBy={organizedBy}
          onAction={onAction}
          canPublish={canPublish}
        />
      );
    }
    if (!passage) return <></>;
    return (
      <PlanPublishActions
        rowIndex={rowIndex}
        isPassage={passage}
        publishStatus={rowInfo[rowIndex].publishStatus || ''}
        mediaId={rowInfo[rowIndex].mediaId?.id || ''}
        mediaShared={rowInfo[rowIndex].mediaShared}
        canEdit={canEdit}
        onHistory={onHistory}
      />
    );
  };

  interface ActionValueProps {
    passage: boolean;
    rowIndex: number;
    srcMediaId: string;
    mediaPlaying: boolean;
    canPlay: boolean;
    canEdit: boolean;
    readonly: boolean;
  }

  const actionValue = ({
    passage,
    rowIndex,
    srcMediaId,
    mediaPlaying,
    canPlay,
    canEdit,
    readonly,
  }: ActionValueProps) => {
    if (!passage) return <></>;
    return (
      <PlanAudioActions
        rowIndex={rowIndex}
        isPassage={passage}
        isNote={rowInfo[rowIndex].passageType === PassageTypeEnum.NOTE}
        mediaId={rowInfo[rowIndex].mediaId?.id || ''}
        canPlay={canPlay}
        canEdit={canEdit}
        onPlayStatus={onPlayStatus}
        onEdit={
          !readonly &&
          (rowInfo[rowIndex].passageType === PassageTypeEnum.NOTE ||
            (shared &&
              rowInfo[rowIndex].passageType !== PassageTypeEnum.CHAPTERNUMBER))
            ? onEdit
            : undefined
        }
        isPlaying={srcMediaId === rowInfo[rowIndex].mediaId?.id && mediaPlaying}
        sharedResource={rowInfo[rowIndex].sharedResource}
      />
    );
  };

  interface PublishedCellProps extends PublishedValueProps {
    calcClassName: string;
  }

  const publishedCell = ({
    passage,
    rowIndex,
    calcClassName,
    canEdit,
  }: PublishedCellProps) =>
    ({
      value: publishedValue({
        passage,
        rowIndex,
        canEdit,
      }),
      readOnly: true,
      className: calcClassName,
    } as ICell);

  interface ActionCellProps extends ActionValueProps {
    calcClassName: string;
  }

  const actionCell = ({
    passage,
    rowIndex,
    calcClassName,
    srcMediaId,
    mediaPlaying,
    canEdit,
    canPlay,
    readonly,
  }: ActionCellProps) =>
    ({
      value: actionValue({
        passage,
        rowIndex,
        srcMediaId,
        mediaPlaying,
        canEdit,
        canPlay,
        readonly,
      }),
      readOnly: true,
      className: calcClassName,
    } as ICell);

  const TitleValue = (
    e: string | number,
    rowIndex: number,
    cellIndex: number,
    readonly: boolean,
    isNote: boolean = false
  ) => {
    const handleTextChange = (value: string) => {
      const change: ICellChange = {
        cell: null,
        row: rowIndex,
        col: cellIndex,
        value,
      };
      cellsChanged([change]);
    };

    const handleMediaIdChange = (mediaId: string) => {
      titleMediaChanged(rowIndex, mediaId);
    };
    const noteTitle = (e: string) => {
      return (
        <>
          {'\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0'}
          {NoteIcon}
          {'\u00A0'}
          {e}
        </>
      );
    };

    return (
      <>
        {isNote && noteTitle(e as string)}
        {!isNote && (
          <TitleEdit
            title={e as string}
            mediaId={
              rowInfo[rowIndex]?.titleMediaId?.id ||
              rowInfo[rowIndex]?.mediaId?.id ||
              ''
            }
            ws={rowInfo[rowIndex]}
            readonly={readonly}
            showpublish={!hidePublishing && publishingOn}
            onRecording={onRecording}
            onTextChange={handleTextChange}
            onMediaIdChange={handleMediaIdChange}
            passageId={
              rowInfo[rowIndex].kind === IwsKind.Passage
                ? rowInfo[rowIndex].passage?.id
                : undefined
            }
          />
        )}
      </>
    );
  };

  const refValue = (e: string | number) => {
    var pt = passageTypeFromRef(e as string, inlinePassages);
    if (pt !== PassageTypeEnum.PASSAGE)
      return <RefRender value={e as string} flat={inlinePassages} pt={pt} />;
    return e;
  };

  const graphicValue = (rowIndex: number, readonly: boolean) => {
    if (
      !isSectionType(rowIndex) &&
      ![PassageTypeEnum.NOTE, PassageTypeEnum.CHAPTERNUMBER].includes(
        passageTypeFromRef(rowInfo[rowIndex].reference, inlinePassages)
      )
    ) {
      return <></>;
    }
    const borderColor = rowInfo[rowIndex]?.color;
    const border = borderColor ? { border: '2px solid', borderColor } : {};

    if (rowInfo[rowIndex].graphicUri) {
      return (
        <Avatar
          sx={{ ...pointer, ...border }}
          src={rowInfo[rowIndex].graphicUri}
          variant="rounded"
          onClick={readonly ? undefined : handleGraphic(rowIndex)}
        />
      );
    }
    return (
      <Avatar
        {...stringAvatar(
          rowInfo[rowIndex].reference ||
            `${organizedBy} ${rowInfo[rowIndex].sectionSeq}`,
          { ...pointer, ...border }
        )}
        variant="rounded"
        onClick={handleGraphic(rowIndex)}
      />
    );
  };

  const graphicCell = (
    rowIndex: number,
    calcClassName: string,
    readonly: boolean
  ) => ({
    value: graphicValue(rowIndex, readonly),
    readOnly: true,
    className: calcClassName,
  });

  const passageSeqCol = useMemo(
    () => (inlinePassages ? -1 : 2),
    [inlinePassages]
  );

  interface RowCellsProps {
    section: boolean;
    passage: boolean;
    refCol: number;
    calcClassName: string;
    rowIndex: number;
    sharedRes: boolean;
    anyRecording: boolean;
  }

  const rowCells =
    ({
      section,
      passage,
      refCol,
      calcClassName,
      rowIndex,
      sharedRes,
      anyRecording,
    }: RowCellsProps) =>
    (e: string | number, cellIndex: number) => {
      const bookCol = colSlugs.indexOf('book');
      const titleCol = colSlugs.indexOf('title');
      const descCol = colSlugs.indexOf('comment');
      const canEditTitle =
        !anyRecording &&
        (canEditSheet || (canPublish && !hidePublishing && publishingOn));

      if (cellIndex === SectionSeqCol && section && !hidePublishing) {
        return {
          value: e,
          component: (<>{sectionMap.get(e as number) || ''}</>) as ReactElement,
          forceComponent: true,
          readOnly: true,
          className: calcClassName,
        };
      }
      if (cellIndex === bookCol && passage)
        return {
          value: e,
          readOnly: !canEditSheet,
          className: 'book ' + calcClassName,
          dataEditor: bookEditor,
        };
      if (
        cellIndex === titleCol &&
        !passage &&
        !hidePublishing &&
        publishingOn
      ) {
        return {
          value: e,
          component: TitleValue(e, rowIndex, cellIndex, !canEditTitle),
          forceComponent: true,
          readOnly: true,
          className: calcClassName,
        };
      }
      if (
        /CHNUM/.test(rowData[rowIndex][refCol] as string) &&
        !hidePublishing &&
        publishingOn
      ) {
        if (cellIndex === titleCol) {
          return {
            value: '',
            component: TitleValue(
              rowData[rowIndex][descCol] as string,
              rowIndex,
              descCol,
              !canEditTitle
            ),
            forceComponent: true,
            readOnly: true,
            className: calcClassName,
          };
        } else if (cellIndex === descCol) {
          return {
            value: '',
            readOnly: !canEditSheet,
            className: calcClassName,
          };
        }
      }
      if (
        /NOTE/.test(rowData[rowIndex][refCol] as string) &&
        !hidePublishing &&
        publishingOn &&
        cellIndex === titleCol
      ) {
        return {
          value: e,
          component: TitleValue(
            rowInfo[rowIndex].sharedResource?.attributes.title || '',
            rowIndex,
            cellIndex,
            !canEditTitle,
            true
          ),
          forceComponent: true,
          readOnly: true,
          className: calcClassName,
        };
      }

      if (cellIndex === refCol) {
        if (
          !canEditSheet ||
          !passage ||
          (!inlinePassages &&
            passageTypeFromRef(e as string, inlinePassages) !==
              PassageTypeEnum.PASSAGE)
        ) {
          return {
            value: e,
            component: (<>{refValue(e)}</>) as ReactElement,
            forceComponent: true,
            readOnly: true,
            className:
              calcClassName +
              (passage
                ? ' ref' +
                  (bookCol > 0 && refErrTest(e) ? 'Err' : '') +
                  (sharedRes ? ' shared' : '')
                : ''),
          };
        } else {
          return {
            value: e,
            className:
              calcClassName +
              (passage
                ? ' ref' +
                  (bookCol > 0 && refErrTest(e) ? 'Err' : '') +
                  (sharedRes ? ' shared' : '')
                : ''),
          };
        }
      }
      return {
        value: e,
        readOnly:
          !canEditSheet ||
          (cellIndex === SectionSeqCol && (e as number) < 0) ||
          cellIndex === passageSeqCol ||
          (sharedRes && getGlobal('offline')) ||
          passage
            ? cellIndex <= 1
            : section
            ? cellIndex > 1
            : cellIndex <= 1,
        className:
          (cellIndex === SectionSeqCol || cellIndex === passageSeqCol
            ? 'num '
            : '') + calcClassName,
      };
    };

  interface ExtrasCellProps {
    section: boolean;
    passage: boolean;
    rowIndex: number;
    calcClassName: string;
    row: IRow;
    check: number[];
    movement: boolean;
    book: boolean;
    active: number;
    filtered: boolean;
    readonly: boolean;
  }

  const extrasCell = ({
    section,
    passage,
    rowIndex,
    calcClassName,
    row,
    check,
    movement,
    book,
    active,
    filtered,
    readonly,
  }: ExtrasCellProps) =>
    readonly
      ? ({
          value: '',
          readOnly: true,
        } as ICell)
      : ({
          value: (
            <PlanActionMenu
              rowIndex={rowIndex}
              isSection={section}
              isPassage={passage}
              firstMovement={firstMovement}
              psgType={rowInfo[rowIndex].passageType}
              organizedBy={organizedBy}
              sectionSequenceNumber={
                sectionMap.get(row[SectionSeqCol] as number) ??
                positiveWholeOnly(row[SectionSeqCol] as number)
              }
              passageSequenceNumber={positiveWholeOnly(
                row[passageSeqCol >= 0 ? passageSeqCol : 0] as number
              )}
              readonly={check.length > 0}
              onDelete={onDelete}
              onPlayStatus={onPlayStatus}
              onAudacity={onAudacity}
              onRecord={onRecord}
              onUpload={onUpload}
              onAssign={onAssign}
              onFirstMovement={onFirstMovement}
              canAssign={(userIsAdmin || canEditSheet) && !movement && !book}
              canDelete={
                (userIsAdmin || canEditSheet) && (!offline || offlineOnly)
              }
              active={active - 1 === rowIndex}
              onDisableFilter={filtered ? disableFilter : undefined}
              showIcon={showIcon(filtered, offline && !offlineOnly, rowIndex)}
              onAction={onAction}
            />
          ),
          // readOnly: true,
          className: calcClassName,
          dataEditor: ActivateCell,
        } as ICell);

  const eachRow =
    ({
      currentRow,
      srcMediaId,
      mediaPlaying,
      check,
      active,
      filtered,
      anyRecording,
    }: IFillProps) =>
    (row: IRow, rowIndex: number) => {
      const refCol = colSlugs.indexOf('reference');
      const section = isSectionType(rowIndex);
      const passage = isPassageType(rowIndex);
      const movement = isMovement(rowIndex);
      const beta = isBeta(rowIndex);
      const book = isBook(rowIndex) || isAltBook(rowIndex);
      const iscurrent: string =
        currentRow === rowIndex + 1 ? ' currentrow ' : '';
      const sharedRes =
        passage &&
        Boolean(rowInfo[rowIndex].sharedResource) &&
        related(rowInfo[rowIndex].sharedResource, 'passage') !==
          rowInfo[rowIndex].passage?.id;
      const sharedOffline = sharedRes && getGlobal('offline');
      const calcClassName =
        iscurrent +
        (section
          ? 'set' +
            (passage ? 'p' : '') +
            (movement ? ' movement' : book ? ' bk' : '')
          : 'pass');
      const sheetRow = [
        stepCell({
          passage,
          row,
          refCol,
          rowIndex,
          calcClassName,
          readonly: sharedOffline || anyRecording,
        }),
        assignmentCell(rowIndex, calcClassName),
        publishedCell({
          passage,
          rowIndex,
          calcClassName:
            calcClassName + (beta && !hidePublishing ? ' beta' : ''),
          canEdit: canPublish,
        }),
        actionCell({
          passage,
          rowIndex,
          calcClassName:
            calcClassName + (beta && !hidePublishing ? ' beta' : ''),
          srcMediaId,
          mediaPlaying,
          canPlay:
            !anyRecording && (rowInfo[rowIndex].mediaId?.id || '') !== '',
          canEdit: !sharedOffline && !anyRecording,
          readonly:
            !canEditSheet && (!canPublish || hidePublishing || !publishingOn),
        }),
      ];
      if (!hidePublishing && publishingOn)
        sheetRow.push(graphicCell(rowIndex, calcClassName, !canPublish));
      row
        .slice(0, 6) // quits when it runs out of columns
        .map(
          rowCells({
            section,
            passage,
            refCol,
            calcClassName,
            rowIndex,
            sharedRes,
            anyRecording,
          })
        )
        .forEach((c) => {
          sheetRow.push(c);
        });
      sheetRow.push(
        extrasCell({
          section,
          passage,
          rowIndex,
          calcClassName,
          row,
          check,
          movement,
          book,
          active,
          filtered,
          readonly:
            sharedOffline || anyRecording || (!canEditSheet && !canPublish),
        })
      );
      return sheetRow;
    };

  if (rowData.length > 0 && rowInfo.length > 0) {
    if (!filtered) {
      if (!hidePublishing) {
        setSectionArr(
          getPubRefs({ rowInfo, rowData, passageSeqCol, firstMovement })
        );
      } else {
        setSectionArr([]);
      }
    }
  }

  return (props: IFillProps) => {
    const data = titleRow(columns);
    rowData.map(eachRow({ ...props })).forEach((r) => data.push(r));
    return data;
  };
};
