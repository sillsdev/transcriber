import { useState, useEffect } from 'react';
import usePassageDetailContext from '../../../context/usePassageDetailContext';
import {
  orgDefaultKtExcludeTag,
  orgDefaultKtLang,
  orgDefaultSortTag,
  parseRef,
  related,
  useOrgDefaults,
} from '../../../crud';
import BigDialog from '../../../hoc/BigDialog';
import { IKeyTerm, ILocalTerm, OrgKeytermTarget } from '../../../model';
import { SortBy, useKeyTerms } from './useKeyTerms';
import { cleanFileName } from '../../../utils';
import KeyTermDetail from './KeyTermDetail';
import KeyTermExclude, { ExcludeArray } from './KeyTermExclude';
import KeyTermsSort from './KeyTermSort';
import KeyTermTable, { IKeyTermRow } from './KeyTermTable';
import { useSelector, shallowEqual } from 'react-redux';
import { IKeyTermsStrings } from '../../../model';
import { keyTermsSelector } from '../../../selector';
import { useGlobal } from 'reactn';
import KeyTermSetting from './KeyTermSetting';
import { Box } from '@mui/material';
import { useOrbitData } from '../../../hoc/useOrbitData';
import { StyledBox } from '../../../control/StyledBox';

interface IProps {
  width: number;
}

const KeyTerms = ({ width }: IProps) => {
  const keyTermTargets = useOrbitData<OrgKeytermTarget[]>('orgkeytermtarget');
  const [org] = useGlobal('organization');
  const [memory] = useGlobal('memory');
  const { passage } = usePassageDetailContext();
  const { book } = passage.attributes;
  const {
    verseTerms,
    ktDisplay,
    setSortBy,
    sortBy,
    ktCat,
    excluded,
    catLabel,
    isExcluded,
    excludeToggle,
    initExcluded,
    oneTerm,
    setLocale,
    language,
  } = useKeyTerms();
  const { getOrgDefault, setOrgDefault } = useOrgDefaults();
  parseRef(passage);
  const { startChapter, startVerse, endChapter, endVerse } = passage.attributes;
  const [term, setTerm] = useState<IKeyTerm & ILocalTerm>();
  const t: IKeyTermsStrings = useSelector(keyTermsSelector, shallowEqual);

  const handleTermClick = (term: number) => {
    setTerm(oneTerm(term));
  };

  const handleClose = () => {
    setTerm(undefined);
  };

  const handleSortBy = (by: SortBy) => {
    setSortBy(by);
    setOrgDefault(orgDefaultSortTag, by);
  };

  const handleExclude = (excl: string[]) => {
    let locExcl = excluded.map((v) => v);
    ktCat.forEach((c) => {
      if (isExcluded(c)) {
        if (excl.indexOf(c) === -1) {
          excludeToggle(c);
          locExcl = locExcl.filter((v) => v !== c);
        }
      } else {
        if (excl.indexOf(c) > -1) {
          excludeToggle(c);
          locExcl = locExcl.concat(c);
        }
      }
    });
    setOrgDefault(orgDefaultKtExcludeTag, locExcl);
  };

  const handleTargetDelete = (id: string) => {
    memory.update((t) => t.removeRecord({ type: 'orgkeytermtarget', id }));
  };

  const handleVisibleToggle = (id: number) => () => {
    if (isExcluded(id)) {
      setOrgDefault(
        orgDefaultKtExcludeTag,
        excluded.filter((v) => v !== id)
      );
    } else {
      setOrgDefault(orgDefaultKtExcludeTag, excluded.concat(id));
    }
    excludeToggle(id);
  };

  const handleLang = (code: string) => {
    setLocale(code);
    setOrgDefault(orgDefaultKtLang, code);
  };

  useEffect(() => {
    const by = getOrgDefault(orgDefaultSortTag) as SortBy;
    setSortBy(by);
    const ktLang = getOrgDefault(orgDefaultKtLang) as string;
    setLocale(ktLang);
    const excl = getOrgDefault(orgDefaultKtExcludeTag) as ExcludeArray;
    if (excl) initExcluded(excl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passage.id]);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <KeyTermsSort initSort={sortBy} onChange={handleSortBy} />
        <KeyTermExclude
          init={
            excluded
              .filter((v) => typeof v === 'string')
              .map((v) => v) as string[]
          }
          cat={ktCat}
          getLabel={catLabel}
          onChange={handleExclude}
        />
        <KeyTermSetting curCode={language} onChange={handleLang} />
      </Box>
      <StyledBox width={width}>
        <KeyTermTable
          rows={verseTerms(
            book,
            startChapter ?? 1,
            startVerse ?? 1,
            endChapter ?? startChapter ?? 1,
            endVerse,
            sortBy
          ).map(
            (to) =>
              ({
                term: to.W,
                source: ktDisplay(to.I),
                target: keyTermTargets
                  .filter(
                    (t) =>
                      t.attributes.termIndex === to.I &&
                      related(t, 'organization') === org
                  )
                  .map((t) => ({
                    id: t.id,
                    label: t.attributes.target,
                    mediaId: related(t, 'mediafile'),
                  })),
                index: to.I,
                fileName: cleanFileName(to.W),
              } as IKeyTermRow)
          )}
          termClick={handleTermClick}
          targetDelete={handleTargetDelete}
        />
      </StyledBox>
      <BigDialog
        title={t.termDetail}
        isOpen={Boolean(term)}
        onOpen={handleClose}
      >
        <KeyTermDetail
          term={term as IKeyTerm & ILocalTerm}
          hide={isExcluded(term?.I ?? 0)}
          onVisible={handleVisibleToggle(term?.I ?? 0)}
          getLabel={catLabel}
        />
      </BigDialog>
    </>
  );
};

export default KeyTerms;
