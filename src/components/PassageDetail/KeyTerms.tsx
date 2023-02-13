import { useState, useEffect } from 'react';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { parseRef, useOrgDefaults } from '../../crud';
import BigDialog from '../../hoc/BigDialog';
import { IKeyTerm, OrgKeytermTarget } from '../../model';
import { cleanFileName, SortBy, useKeyTerms } from '../../utils';
import KeyTermDetail from './KeyTermDetail';
import KeyTermExclude, { KtExcludeTag } from './KeyTermExclude';
import KeyTermsSort from './KeyTermSort';
import KeyTermTable from './KeyTermTable';
import PassageDetailPlayer from './PassageDetailPlayer';
import { useSelector, shallowEqual } from 'react-redux';
import { IKeyTermsStrings } from '../../model';
import { keyTermsSelector } from '../../selector';
import { QueryBuilder } from '@orbit/data';
import { withData } from 'react-orbitjs';

export const SortTag = 'ktSort';

interface IRecordProps {
  keyTermTargets: OrgKeytermTarget[];
}

const KeyTerms = ({ keyTermTargets }: IRecordProps) => {
  const { passage, mediafileId } = usePassageDetailContext();
  const { book } = passage.attributes;
  const {
    verseTerms,
    ktDisplay,
    setSortBy,
    sortBy,
    ktCat,
    excluded,
    isExcluded,
    excludeToggle,
    initExcluded,
    oneTerm,
  } = useKeyTerms();
  const { getOrgDefault, setOrgDefault } = useOrgDefaults();
  parseRef(passage);
  const { startChapter, startVerse, endVerse } = passage;
  const [term, setTerm] = useState<IKeyTerm>();
  const t: IKeyTermsStrings = useSelector(keyTermsSelector, shallowEqual);

  const handleTermClick = (term: number) => {
    console.log(`you chose ${term}`);
    setTerm(oneTerm(term));
  };

  const handleClose = () => {
    setTerm(undefined);
  };

  const handleSortBy = (by: SortBy) => {
    setSortBy(by);
    setOrgDefault(SortTag, by);
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
    setOrgDefault(KtExcludeTag, locExcl);
  };

  useEffect(() => {
    const by = getOrgDefault(SortTag) as SortBy;
    setSortBy(by);
    const excl = getOrgDefault(KtExcludeTag) as (string | number)[];
    if (excl) initExcluded(excl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passage.id]);

  return (
    <>
      {mediafileId && <PassageDetailPlayer />}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <KeyTermsSort initSort={sortBy} onChange={handleSortBy} />
        <KeyTermExclude
          init={excluded.filter((v) => typeof v === 'string') as string[]}
          onChange={handleExclude}
        />
      </div>
      <KeyTermTable
        rows={verseTerms(
          book,
          startChapter ?? 1,
          startVerse ?? 1,
          endVerse,
          sortBy
        ).map((to) => ({
          term: to.W,
          source: ktDisplay(to),
          target: keyTermTargets
            .filter((t) => t.attributes.termIndex === to.I)
            .map((t) => t.attributes.target),
          index: to.I,
          fileName: cleanFileName(to.W),
        }))}
        termClick={handleTermClick}
      />
      <BigDialog
        title={t.termDetail}
        isOpen={Boolean(term)}
        onOpen={handleClose}
      >
        <KeyTermDetail term={term as IKeyTerm} />
      </BigDialog>
    </>
  );
};
const mapRecordsToProps = {
  keyTermTargets: (q: QueryBuilder) => q.findRecords('orgkeytermtarget'),
};
export default withData(mapRecordsToProps)(
  KeyTerms
) as any as () => JSX.Element;
