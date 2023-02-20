import { useState, useEffect } from 'react';
import usePassageDetailContext from '../../../context/usePassageDetailContext';
import { parseRef, related, useOrgDefaults } from '../../../crud';
import BigDialog from '../../../hoc/BigDialog';
import { IKeyTerm, ILocalTerm, OrgKeytermTarget } from '../../../model';
import { SortBy, useKeyTerms } from './useKeyTerms';
import { cleanFileName } from '../../../utils';
import KeyTermDetail from './KeyTermDetail';
import KeyTermExclude, { ExcludeArray, KtExcludeTag } from './KeyTermExclude';
import KeyTermsSort from './KeyTermSort';
import KeyTermTable from './KeyTermTable';
import PassageDetailPlayer from '../PassageDetailPlayer';
import { useSelector, shallowEqual } from 'react-redux';
import { IKeyTermsStrings } from '../../../model';
import { keyTermsSelector } from '../../../selector';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { withData } from 'react-orbitjs';
import { useGlobal } from 'reactn';
import KeyTermSetting from './KeyTermSetting';

export const SortTag = 'ktSort';
export const KtLang = 'ktLang';

interface IRecordProps {
  keyTermTargets: OrgKeytermTarget[];
}

const KeyTerms = ({ keyTermTargets }: IRecordProps) => {
  const [org] = useGlobal('organization');
  const [memory] = useGlobal('memory');
  const { passage, mediafileId } = usePassageDetailContext();
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
  } = useKeyTerms();
  const { getOrgDefault, setOrgDefault } = useOrgDefaults();
  parseRef(passage);
  const { startChapter, startVerse, endVerse } = passage;
  const [term, setTerm] = useState<IKeyTerm & ILocalTerm>();
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

  const handleTargetDelete = (id: string) => {
    memory.update((t: TransformBuilder) =>
      t.removeRecord({ type: 'orgkeytermtarget', id })
    );
  };

  const handleVisibleToggle = (id: number) => () => {
    if (isExcluded(id)) {
      setOrgDefault(
        KtExcludeTag,
        excluded.filter((v) => v !== id)
      );
    } else {
      setOrgDefault(KtExcludeTag, excluded.concat(id));
    }
    excludeToggle(id);
  };

  const handleLang = (code: string) => {
    setLocale(code);
    setOrgDefault(KtLang, code);
  };

  useEffect(() => {
    const by = getOrgDefault(SortTag) as SortBy;
    setSortBy(by);
    const ktLang = getOrgDefault(KtLang) as string;
    setLocale(ktLang);
    const excl = getOrgDefault(KtExcludeTag) as ExcludeArray;
    if (excl) initExcluded(excl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passage.id]);

  return (
    <>
      {mediafileId && <PassageDetailPlayer />}
      <div style={{ display: 'flex', alignItems: 'center' }}>
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
        <KeyTermSetting onChange={handleLang} />
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
        }))}
        termClick={handleTermClick}
        targetDelete={handleTargetDelete}
      />
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
const mapRecordsToProps = {
  keyTermTargets: (q: QueryBuilder) => q.findRecords('orgkeytermtarget'),
};
export default withData(mapRecordsToProps)(
  KeyTerms
) as any as () => JSX.Element;
