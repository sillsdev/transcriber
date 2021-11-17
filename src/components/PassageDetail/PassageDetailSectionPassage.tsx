import usePassageDetailContext from '../../context/usePassageDetailContext';
import { SectionPassageTitle } from '../../control/SectionPassageTitle';

export default function PassageDetailSectionPassage() {
  const { section, passage, allBookData } = usePassageDetailContext();

  return (
    <SectionPassageTitle
      section={section}
      passage={passage}
      allBookData={allBookData}
    />
  );
}
