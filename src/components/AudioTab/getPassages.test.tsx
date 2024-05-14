import { PassageD, SectionD } from '../../model';
import { GetReference } from './GetReference';
import { passageRow } from './getPassages';

const defPassage = {
  id: '1',
  attributes: {
    reference: '1:1',
    sequencenum: 1,
    book: 'Gen',
  },
} as PassageD;
const defSection = {
  id: '1',
  attributes: {
    sequencenum: 1,
    name: 'Creation',
  },
} as SectionD;
const defData = {
  media: [],
  allBookData: [],
};

const newRef = (ref: string) =>
  ({
    ...defPassage,
    attributes: { ...defPassage.attributes, reference: ref },
  } as PassageD);

describe('src/components/AudioTab/getPassages.test.tsx', () => {
  it('should return parsed reference for Gen 1:1', () => {
    const result = passageRow(defPassage, defSection, defData);

    // console.log(Array.from(result.sectionDesc).map((c) => c.codePointAt(0)));
    expect(result).toEqual({
      id: '1',
      sectionId: '1',
      sectionDesc: '  1\xa0\xa0Creation',
      reference: (
        <GetReference bookData={[]} flat={false} passage={[defPassage]} />
      ),
      attached: 'N',
      sort: '100.100',
      book: 'Gen',
      chap: 1,
      beg: 1,
      endChap: -1,
      end: -1,
      pasNum: 1,
      secNum: 1,
    });
  });

  it('should return parsed reference for Gen 1:1a', () => {
    const passage = newRef('1:1a');
    const result = passageRow(passage, defSection, defData);

    expect(result.chap).toBe(1);
    expect(result.beg).toBe(1);
    expect(result.sort).toBe('100.100');
  });

  it('should return parsed reference for Gen 1:1-3', () => {
    const passage = newRef('1:1-3');
    const result = passageRow(passage, defSection, defData);

    expect(result).toEqual({
      id: '1',
      sectionId: '1',
      sectionDesc: '  1\xa0\xa0Creation',
      reference: (
        <GetReference bookData={[]} flat={false} passage={[passage]} />
      ),
      attached: 'N',
      sort: '100.100',
      book: 'Gen',
      chap: 1,
      beg: 1,
      endChap: -1,
      end: 3,
      pasNum: 1,
      secNum: 1,
    });
  });

  it('should return parsed reference for Gen 1:1b-3a', () => {
    const passage = newRef('1:1b-3a');
    const result = passageRow(passage, defSection, defData);

    expect(result).toEqual({
      id: '1',
      sectionId: '1',
      sectionDesc: '  1\xa0\xa0Creation',
      reference: (
        <GetReference bookData={[]} flat={false} passage={[passage]} />
      ),
      attached: 'N',
      sort: '100.100',
      book: 'Gen',
      chap: 1,
      beg: 1,
      endChap: -1,
      end: 3,
      pasNum: 1,
      secNum: 1,
    });
  });

  it('should return parsed reference for Gen 1:26-2:3', () => {
    const passage = newRef('1:26-2:3');
    const result = passageRow(passage, defSection, defData);

    expect(result).toEqual({
      id: '1',
      sectionId: '1',
      sectionDesc: '  1\xa0\xa0Creation',
      reference: (
        <GetReference bookData={[]} flat={false} passage={[passage]} />
      ),
      attached: 'N',
      sort: '100.100',
      book: 'Gen',
      chap: 1,
      beg: 26,
      endChap: 2,
      end: 3,
      pasNum: 1,
      secNum: 1,
    });
  });
});
