import usePassageDetailContext from '../../context/usePassageDetailContext';
import { SectionPassageTitle } from '../../control/SectionPassageTitle';
import { useSharedResRead } from '../../crud';

export default function PassageDetailSectionPassage() {
  const { section, passage, allBookData } = usePassageDetailContext();
  const { getSharedResource } = useSharedResRead();
  const sr = getSharedResource(passage);

  return (
    <SectionPassageTitle
      section={section}
      passage={passage}
      sharedResource={sr}
      allBookData={allBookData}
    />
  );
}
