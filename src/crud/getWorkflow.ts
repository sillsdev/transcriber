import { IWorkflow, IwfKind, Section, Passage } from '../model';
import Memory from '@orbit/memory';
import { related, getMediaRec } from '.';

const wfSectionUpdate = (item: IWorkflow, rec: IWorkflow) => {
  if (item.sectionUpdated && rec.sectionUpdated)
    if (item?.sectionUpdated > rec?.sectionUpdated) {
      rec.level = item.level;
      rec.kind = item.kind;
      rec.sectionSeq = item.sectionSeq;
      rec.transcriber = item.transcriber;
      rec.editor = item.editor;
      rec.title = item.title;
      rec.deleted = item.deleted;
    }
};

const wfSectionAdd = (workflow: IWorkflow[], item: IWorkflow) => {
  let index = workflow.findIndex(
    (w) => w?.sectionId?.id === item?.sectionId?.id
  );
  if (index >= 0) {
    const rec = workflow[index];
    wfSectionUpdate(item, rec);
  } else {
    index = workflow.length;
    workflow.push(item);
  }
  return index;
};

const wfPassageUpdate = (item: IWorkflow, rec: IWorkflow) => {
  if (item.passageUpdated && rec.passageUpdated)
    if (item.passageUpdated > rec.passageUpdated) {
      rec.level = item.level;
      rec.kind = item.kind;
      rec.passageSeq = item.passageSeq;
      rec.passageId = item.passageId;
      rec.book = item.book;
      rec.reference = item.reference;
      rec.comment = item.comment;
      rec.deleted = item.deleted;
    }
};

const wfPassageAdd = (
  workflow: IWorkflow[],
  item: IWorkflow,
  sectionIndex?: number
) => {
  let index = workflow.findIndex(
    (w) => w?.passageId?.id === item?.passageId?.id
  );
  if (index >= 0) {
    const rec = workflow[index];
    if (item.kind === IwfKind.SectionPassage) {
      wfSectionUpdate(item, rec);
    }
    wfPassageUpdate(item, rec);
    return;
  } else if (sectionIndex && sectionIndex >= 0) {
    let indexAt = sectionIndex + 1;
    while (indexAt < workflow.length) {
      if (
        item.kind !== IwfKind.Passage ||
        item.passageSeq > workflow[indexAt].passageSeq
      )
        break;
      indexAt += 1;
    }
    while (indexAt < workflow.length) {
      const saved = workflow[indexAt];
      workflow[indexAt] = item;
      item = saved;
      indexAt += 1;
    }
  }
  workflow.push(item);
};

const initItem = {} as IWorkflow;

export const getWorkflow = (
  plan: string,
  sections: Section[],
  passages: Passage[],
  flat: boolean,
  memory: Memory,
  current?: IWorkflow[]
) => {
  const myWork = current || Array<IWorkflow>();
  let plansections = sections
    .filter((s) => related(s, 'plan') === plan)
    .sort((i, j) => i.attributes?.sequencenum - j.attributes?.sequencenum);
  const userid = { type: 'user' };
  plansections.forEach((section) => {
    let item = { ...initItem };
    let curSection = 1;
    let sectionIndex: number | undefined;
    if (section.attributes) {
      item.level = 0;
      item.kind = flat ? IwfKind.SectionPassage : IwfKind.Section;
      item.sectionId = { type: 'section', id: section.id };
      item.sectionSeq = section.attributes.sequencenum;
      item.title = section?.attributes?.name;
      const transcriber = related(section, 'transcriber');
      item.transcriber = transcriber
        ? { ...userid, id: transcriber }
        : undefined;
      const editor = related(section, 'editor');
      item.editor = editor ? { ...userid, id: editor } : undefined;
      item.sectionUpdated = section.attributes.dateUpdated;
      item.passageSeq = 0;
      item.deleted = false;
      curSection = item.sectionSeq;
    }
    if (item.kind === IwfKind.Section) {
      sectionIndex = wfSectionAdd(myWork, item);
      item = { ...initItem };
    }
    const sectionPassages = passages
      .filter((p) => related(p, 'section') === section.id)
      .sort((i, j) => i.attributes?.sequencenum - j.attributes?.sequencenum);
    sectionPassages.forEach((passage) => {
      const passAttr = passage.attributes;
      if (passAttr) {
        if (!flat) {
          item.level = 1;
          item.kind = IwfKind.Passage;
        }
        item.sectionSeq = curSection;
        item.passageSeq = passAttr.sequencenum;
        item.book = passAttr.book;
        item.reference = passAttr.reference;
        item.comment = passAttr.title;
        item.passageUpdated = passage.attributes.dateUpdated;
        item.passageId = { type: 'passage', id: passage.id };
        const mediaRec = getMediaRec(passage.id, memory);
        item.mediaId = mediaRec
          ? { type: 'mediafile', id: mediaRec.id }
          : undefined;
        item.deleted = false;
      }
      // console.log(`item ${JSON.stringify(item, null, 2)}`);
      wfPassageAdd(myWork, item, sectionIndex);
      item = { ...initItem };
    });
  });
  return myWork;
};
