import {
  IWorkflow,
  IwfKind,
  Section,
  Passage,
  IMediaShare,
  OrgWorkflowStep,
  IWorkflowStepsStrings,
} from '../../model';
import Memory from '@orbit/memory';
import { related } from '../../crud/related';
import { getVernacularMediaRec, getMediaShared } from '../../crud/media';
import { getNextStep } from '../../crud/getNextStep';
import { getStepComplete } from '../../crud';
import { toCamel } from '../../utils';
import { ISTFilterState } from './filterMenu';

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
        item.passageSeq < workflow[indexAt].passageSeq
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
export const isSectionFiltered = (
  filterState: ISTFilterState,
  sectionSeq: number
) =>
  !filterState.disabled &&
  ((filterState.minSection > 1 && sectionSeq < filterState.minSection) ||
    (filterState.maxSection > -1 && sectionSeq > filterState.maxSection));

export const isPassageFiltered = (
  w: IWorkflow,
  filterState: ISTFilterState,
  orgWorkflowSteps: OrgWorkflowStep[],
  doneStepId: string
) => {
  const stepIndex = (stepId: string) =>
    orgWorkflowSteps.findIndex((s) => s.id === stepId);
  return (
    !filterState.disabled &&
    ((filterState.hideDone && w.stepId === doneStepId) ||
      (filterState.assignedToMe && w.discussionCount > 0) ||
      (filterState.maxStep &&
        w.stepId &&
        stepIndex(w.stepId) > stepIndex(filterState.maxStep)) ||
      (filterState.minStep &&
        w.stepId &&
        stepIndex(w.stepId) < stepIndex(filterState.minStep)) ||
      (filterState.minSection > 1 && w.sectionSeq < filterState.minSection) ||
      (filterState.maxSection > -1 && w.sectionSeq > filterState.maxSection))
  );
};
export const getWorkflow = (
  plan: string,
  sections: Section[],
  passages: Passage[],
  flat: boolean,
  projectShared: boolean,
  memory: Memory,
  orgWorkflowSteps: OrgWorkflowStep[],
  wfStr: IWorkflowStepsStrings,
  filterState: ISTFilterState,
  doneStepId: string,
  getDiscussionCount: (passageId: string, stepId: string) => number,
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
      item.transcriber =
        transcriber && transcriber.id !== ''
          ? { ...userid, id: transcriber }
          : undefined;
      const editor = related(section, 'editor');
      item.editor =
        editor && editor.id !== '' ? { ...userid, id: editor } : undefined;
      item.sectionUpdated = section.attributes.dateUpdated;
      item.passageSeq = 0;
      item.deleted = false;
      item.filtered = isSectionFiltered(filterState, item.sectionSeq);
      curSection = item.sectionSeq;
    }
    let first = true;
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
        if (!flat || !first) {
          item.level = 1;
          item.kind = IwfKind.Passage;
        }
        first = false;
        item.sectionSeq = curSection;
        item.passageSeq = passAttr.sequencenum;
        item.book = passAttr.book;
        item.reference = passAttr.reference;
        item.comment = passAttr.title;
        item.passageUpdated = passage.attributes.dateUpdated;
        item.passageId = { type: 'passage', id: passage.id };
        const mediaRec = getVernacularMediaRec(passage.id, memory);
        item.mediaId = mediaRec
          ? { type: 'mediafile', id: mediaRec.id }
          : undefined;
        item.mediaShared = projectShared
          ? getMediaShared(passage.id, memory)
          : IMediaShare.NotPublic;

        const stepId = getNextStep({
          psgCompleted: getStepComplete(passage),
          orgWorkflowSteps,
        });
        const stepRec = orgWorkflowSteps.find((s) => s.id === stepId);
        if (stepRec) {
          item.step =
            wfStr.getString(toCamel(stepRec.attributes.name)) ||
            stepRec.attributes.name;
          item.stepId = stepRec.id;
          item.discussionCount = item.passageId
            ? getDiscussionCount(item.passageId.id, item.stepId)
            : 0;
        }
        item.deleted = false;
        item.filtered =
          item.filtered ||
          isPassageFiltered(item, filterState, orgWorkflowSteps, doneStepId);
      }
      //console.log(`item ${JSON.stringify(item, null, 2)}`);
      wfPassageAdd(myWork, item, sectionIndex);
      item = { ...initItem };
    });
  });
  return myWork;
};
