import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  IPassageDetailArtifactsStrings,
  ISharedStrings,
  IState,
} from '../model';
import DataTable from './DataTable';
import { Sorting } from '@devexpress/dx-react-grid';
import { ActionRow, AltButton, GrowingSpacer, PriButton } from '../control';
import { shallowEqual, useSelector } from 'react-redux';
import { passageDetailArtifactsSelector, sharedSelector } from '../selector';
import BigDialog from '../hoc/BigDialog';
import {
  Box,
  FormControlLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  SelectProps,
  Stack,
  Switch,
  TextField,
  Typography,
  styled,
} from '@mui/material';
import BookSelect, { OptionType } from './BookSelect';
import { useGlobal } from 'reactn';
import { usePlanType } from '../crud';
import usePassageDetailContext from '../context/usePassageDetailContext';
import { ResourceTypeEnum } from './PassageDetail/Internalization/PassageDetailArtifacts';

export enum RefLevel {
  All,
  Book,
  Chapter,
  Verse,
}

interface RefOption {
  value: RefLevel;
  label: string;
}

const ReferenceLevel = styled(Select)<SelectProps>(({ theme }) => ({
  '#ref-level': {
    paddingTop: `8px`,
    paddingBottom: `8px`,
  },
}));

export interface IRRow {
  language: string;
  category: string;
  title: string;
  description: string;
  version: number;
  keywords: string;
  terms: string;
  source: string;
  srid: string;
}

interface IProps {
  isNote?: boolean;
  data: IRRow[];
  value?: number;
  bookOpt: OptionType | undefined;
  scope?: ResourceTypeEnum;
  onScope?: (val: ResourceTypeEnum) => void;
  termsOfUse: (i: number) => string | undefined;
  onOpen: (val: boolean) => void;
  onSelect?: (rows: number[]) => void;
  onBookCd: (bookCd: string | undefined) => void;
  onFindRef: (findRef: string) => void;
  onRefLevel?: (refLevel: RefLevel) => void;
  levelIn?: RefLevel;
}

export const SelectSharedResource = (props: IProps) => {
  const {
    isNote,
    data,
    value,
    scope,
    onScope,
    onOpen,
    onSelect,
    onBookCd,
    onFindRef,
    onRefLevel,
    termsOfUse,
  } = props;
  const [refLevel, setRefLevel] = useState<RefLevel>(RefLevel.Verse);
  const [checks, setChecks] = useState<number[]>([]);
  const [termsCheck, setTermsCheck] = useState<number[]>([]);
  const [curTermsCheck, setCurTermsCheck] = useState<number>();
  const [bookOpt, setBookOpt] = useState<OptionType>();
  const [plan] = useGlobal('plan');
  const planType = usePlanType();
  const bookSuggestions = useSelector(
    (state: IState) => state.books.suggestions
  );
  const { passage } = usePassageDetailContext();
  const [findRef, setFindRef] = useState('');
  const t: IPassageDetailArtifactsStrings = useSelector(
    passageDetailArtifactsSelector,
    shallowEqual
  );
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const columnDefs = !isNote
    ? [
        { name: 'language', title: t.language },
        { name: 'category', title: t.category },
        { name: 'title', title: t.title },
        { name: 'description', title: t.description },
        { name: 'version', title: t.version },
        { name: 'keywords', title: t.keywords },
        { name: 'terms', title: t.termsOfUse },
        { name: 'source', title: t.source },
      ]
    : [
        { name: 'category', title: t.category },
        { name: 'title', title: t.title },
        { name: 'description', title: t.description },
        { name: 'keywords', title: t.keywords },
        { name: 'source', title: t.source },
      ];
  const columnWidths = [
    { columnName: 'language', width: 150 },
    { columnName: 'category', width: 150 },
    { columnName: 'title', width: 200 },
    { columnName: 'description', width: 200 },
    { columnName: 'version', width: 100 },
    { columnName: 'keywords', width: 200 },
    { columnName: 'terms', width: 100 },
    { columnName: 'source', width: 200 },
  ];
  const columnFormatting = [
    { columnName: 'title', wordWrapEnabled: true },
    { columnName: 'description', wordWrapEnabled: true },
    { columnName: 'keywords', wordWrapEnabled: true },
    { columnName: 'source', wordWrapEnabled: true },
  ];
  const sorting: Sorting[] = [
    { columnName: 'language', direction: 'asc' },
    { columnName: 'category', direction: 'asc' },
    { columnName: 'title', direction: 'asc' },
  ];
  const referenceLevel: RefOption[] = [
    {
      label: t.verseLevel.replace('{0}', isNote ? t.notes : t.resources),
      value: RefLevel.Verse,
    },
    {
      label: t.chapterLevel.replace('{0}', isNote ? t.notes : t.resources),
      value: RefLevel.Chapter,
    },
    {
      label: t.bookLevel.replace('{0}', isNote ? t.notes : t.resources),
      value: RefLevel.Book,
    },
    {
      label: t.allLevel.replace('{0}', isNote ? t.notes : t.resources),
      value: RefLevel.All,
    },
  ];

  const isScripture = useMemo(
    () => planType(plan)?.scripture,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plan]
  );

  useEffect(() => {
    var val = value ?? -1;
    if (val >= 0 && val < data.length && checks.findIndex((r) => r === val) < 0)
      setChecks([val]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, data]); //don't add checks

  useEffect(() => {
    setBookOpt(props.bookOpt);
  }, [props.bookOpt]);

  useEffect(() => {
    setRefLevel(props.levelIn ?? RefLevel.Verse);
  }, [props.levelIn]);

  const handleCancel = () => {
    onOpen && onOpen(false);
  };

  const numSort = (i: number, j: number) => i - j;

  const handleCheck = (chks: Array<number>) => {
    //if we're a note, we want single select so if there are more than one, we take the last one
    if (isNote && chks.length > 1) chks = [chks[chks.length - 1]];
    const curLen = checks.length;
    const newLen = chks.length;
    if (isNote || curLen < newLen) {
      const termsList: number[] = [];
      const noTermsList: number[] = [];
      for (const c of chks) {
        if (!checks.includes(c)) {
          if (termsOfUse(c)) {
            termsList.push(c);
          } else {
            noTermsList.push(c);
          }
        }
      }

      if (noTermsList.length > 0) {
        setChecks((isNote ? [] : checks).concat(noTermsList).sort(numSort));
      }
      if (termsList.length > 0) {
        setTermsCheck(termsList);
        setCurTermsCheck(termsList[0]);
      }
    } else if (curLen > newLen) {
      setChecks(chks);
    }
  };

  const handleTermsCancel = () => {
    setTermsCheck([]);
    setCurTermsCheck(undefined);
  };

  const handleTermsReject = () => {
    const updatedTermsCheck = termsCheck.filter((t) => t !== curTermsCheck);
    setTermsCheck(updatedTermsCheck);
    if (updatedTermsCheck.length === 0) {
      handleTermsCancel();
    } else {
      setCurTermsCheck(updatedTermsCheck[0]);
    }
  };

  const handleTermsAccept = () => {
    //note is single select so we can just replace the check
    if (curTermsCheck !== undefined)
      setChecks((isNote ? [] : checks).concat([curTermsCheck]));
    handleTermsReject();
  };

  const handleBookCommit = (newValue: string) => {
    onBookCd(newValue);
    const newOpt = bookSuggestions.find((v) => v.value === newValue);
    setBookOpt(newOpt);
  };
  const handleBookRevert = () => {
    onBookCd(undefined);
  };
  const handlePreventSave = () => {};

  const handleFindRefChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFindRef(event.target.value);
    onFindRef(event.target.value);
  };

  const handleLevelChange = (event: SelectChangeEvent<RefLevel>) => {
    setRefLevel(event.target.value as RefLevel);
    onRefLevel && onRefLevel(event.target.value as RefLevel);
  };

  const handleLink = useCallback(() => {
    if (onSelect) {
      onSelect(checks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checks]);

  const handleScopeToggle = () => {
    onScope &&
      onScope(
        scope === ResourceTypeEnum.passageResource
          ? ResourceTypeEnum.sectionResource
          : ResourceTypeEnum.passageResource
      );
  };

  return (
    <div id="passage-data-table">
      {isScripture && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', my: 1 }}>
          {onScope && (
            <FormControlLabel
              control={
                <Switch
                  value={scope === ResourceTypeEnum.passageResource}
                  onClick={handleScopeToggle}
                />
              }
              label={t.passageResource}
            />
          )}
          <GrowingSpacer />
          {refLevel !== RefLevel.All && (
            <>
              <Box sx={{ width: '200px' }}>
                <BookSelect
                  placeHolder={t.selectBook}
                  suggestions={bookSuggestions}
                  value={bookOpt}
                  autoFocus={false}
                  onCommit={handleBookCommit}
                  onRevert={handleBookRevert}
                  setPreventSave={handlePreventSave}
                />
              </Box>
              {refLevel !== RefLevel.Book && (
                <TextField
                  id="find-refs"
                  variant="outlined"
                  value={findRef}
                  onChange={handleFindRefChange}
                  inputProps={{
                    sx: { py: 1 },
                    placeholder: passage?.attributes.reference ?? t.reference,
                  }}
                  sx={{ width: '400px' }}
                />
              )}
            </>
          )}
          {onRefLevel && (
            <ReferenceLevel
              id="ref-level"
              value={refLevel ?? RefLevel.All}
              onChange={handleLevelChange as any}
              sx={{ width: '325px' }}
              inputProps={{ autoFocus: true }}
            >
              {referenceLevel.map((rl) => (
                <MenuItem key={rl.value} value={rl.value}>
                  {rl.label}
                </MenuItem>
              ))}
            </ReferenceLevel>
          )}
        </Stack>
      )}
      <DataTable
        columns={columnDefs}
        columnWidths={columnWidths}
        columnFormatting={columnFormatting}
        sorting={sorting}
        rows={data}
        select={handleCheck}
        checks={checks}
        shaping={true}
        expandedGroups={[]} // shuts off toolbar row
      />
      <ActionRow>
        <AltButton id="res-select-cancel" onClick={handleCancel}>
          {ts.cancel}
        </AltButton>
        <PriButton
          id="res-selected"
          onClick={handleLink}
          disabled={checks.length === 0 || termsCheck.length > 0}
        >
          {t.link}
        </PriButton>
      </ActionRow>
      {curTermsCheck !== undefined && (
        <BigDialog
          title={t.termsReview}
          description={
            <Typography sx={{ pb: 2 }}>
              {'for {0}'.replace('{0}', data[curTermsCheck].title)}
            </Typography>
          }
          isOpen={termsCheck !== undefined}
          onOpen={handleTermsCancel}
        >
          <>
            <Typography>{termsOfUse(curTermsCheck)}</Typography>
            <ActionRow>
              <AltButton id="terms-cancel" onClick={handleTermsReject}>
                {ts.cancel}
              </AltButton>
              <PriButton id="terms-accept" onClick={handleTermsAccept}>
                {t.accept}
              </PriButton>
            </ActionRow>
          </>
        </BigDialog>
      )}
    </div>
  );
};

export default SelectSharedResource;
