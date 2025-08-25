import {
  ISheet,
  IwsKind,
  IMediaShare,
  OrgWorkflowStep,
  IWorkflowStepsStrings,
  SheetLevel,
  SectionD,
  PassageD,
  OrgWorkflowStepD,
  SharedResourceD,
  MediaFileD,
  GroupD,
  BookSeq,
  AltBkSeq,
} from '../../model';
import Memory from '@orbit/memory';
import { related } from '../../crud/related';
import {
  getVernacularMediaRec,
  getMediaShared,
  getAllMediaRecs,
} from '../../crud/media';
import { getNextStep } from '../../crud/getNextStep';
import { getStepComplete } from '../../crud/getStepComplete';
import { toCamel } from '../../utils/toCamel';
import { ISTFilterState } from './filterMenu';
import { PassageTypeEnum } from '../../model/passageType';
import { passageTypeFromRef, isPublishingTitle } from '../../control/RefRender';
import { InitializedRecord, RecordIdentity } from '@orbit/records';
import { PublishDestinationEnum } from '../../crud';
import { addPt } from '../../utils/addPt';
import { OrganizationSchemeStepD } from '../../model/organizationSchemeStep';

const shtSectionUpdate = (item: ISheet, rec: ISheet) => {
  if (item.sectionUpdated && rec.sectionUpdated)
    if (item?.sectionUpdated > rec?.sectionUpdated) {
      rec.level = item.level;
      rec.kind = item.kind;
      rec.sectionSeq = item.sectionSeq;
      rec.scheme = item.scheme;
      rec.title = item.title;
      rec.deleted = item.deleted;
      rec.published = item.published;
    }
};

const shtSectionAdd = (sheet: ISheet[], item: ISheet) => {
  let index = sheet.findIndex((w) => w?.sectionId?.id === item?.sectionId?.id);
  if (index >= 0) {
    const rec = sheet[index];
    shtSectionUpdate(item, rec);
  } else {
    index = sheet.length;
    sheet.push(item);
  }
  return index;
};

const shtPassageUpdate = (item: ISheet, rec: ISheet) => {
  if (item.passageUpdated && rec.passageUpdated)
    if (item.passageUpdated > rec.passageUpdated) {
      rec.level = item.level;
      rec.kind = item.kind;
      rec.passageSeq = item.passageSeq;
      rec.book = item.book;
      rec.reference = item.reference;
      rec.comment = item.comment;
      rec.passage = item.passage;
      rec.deleted = item.deleted;
    }
};

const shtPassageAdd = (
  sheet: ISheet[],
  item: ISheet,
  sectionIndex?: number
) => {
  let index = sheet.findIndex((w) => w?.passage?.id === item?.passage?.id);
  if (index >= 0) {
    const rec = sheet[index];
    if (item.kind === IwsKind.SectionPassage) {
      shtSectionUpdate(item, rec);
    }
    shtPassageUpdate(item, rec);
    return;
  } else if (sectionIndex && sectionIndex >= 0) {
    let indexAt = sectionIndex + 1;
    while (indexAt < sheet.length) {
      if (
        item.kind !== IwsKind.Passage ||
        item.passageSeq < sheet[indexAt].passageSeq
      )
        break;
      indexAt += 1;
    }
    while (indexAt < sheet.length) {
      const saved = sheet[indexAt];
      sheet[indexAt] = item;
      item = saved;
      indexAt += 1;
    }
  }
  sheet.push(item);
};

const initItem = {} as ISheet;
export const isSectionFiltered = (
  filterState: ISTFilterState,
  minSection: number,
  sectionSeq: number,
  hidePublishing: boolean,
  ref: string
) =>
  (hidePublishing && isPublishingTitle(ref)) ||
  (!filterState.disabled &&
    ((filterState.minSection > minSection &&
      sectionSeq < filterState.minSection) ||
      (filterState.maxSection > -1 && sectionSeq > filterState.maxSection)));

export const isPassageFiltered = (
  w: ISheet,
  filterState: ISTFilterState,
  minSection: number,
  hidePublishing: boolean,
  orgWorkflowSteps: OrgWorkflowStep[],
  doneStepId: string,
  sectionScheme: RecordIdentity | undefined,
  assign: RecordIdentity | undefined,
  user: string,
  myGroups: GroupD[]
) => {
  const stepIndex = (stepId: string) =>
    orgWorkflowSteps.findIndex((s) => s.id === stepId);
  if (hidePublishing && isPublishingTitle(w.reference)) return true;
  return (
    !filterState.disabled &&
    ((filterState.hideDone && w.stepId === doneStepId) ||
      (filterState.maxStep &&
        w.stepId &&
        stepIndex(w.stepId) > stepIndex(filterState.maxStep)) ||
      (filterState.minStep &&
        w.stepId &&
        stepIndex(w.stepId) < stepIndex(filterState.minStep)) ||
      (filterState.minSection > minSection &&
        w.sectionSeq < filterState.minSection) ||
      (filterState.maxSection > -1 && w.sectionSeq > filterState.maxSection) ||
      (filterState.assignedToMe &&
        w.discussionCount === 0 &&
        sectionScheme !== undefined &&
        (!assign ||
          (assign.id !== user &&
            myGroups.findIndex((g) => g.id === assign.id) < 0))))
  );
};

export interface GetSheetProps {
  plan: string;
  sections: SectionD[];
  passages: PassageD[];
  organizationSchemeSteps: OrganizationSchemeStepD[];
  flat: boolean;
  projectShared: boolean;
  memory: Memory;
  orgWorkflowSteps: OrgWorkflowStepD[];
  wfStr: IWorkflowStepsStrings;
  filterState: ISTFilterState;
  minSection: number;
  hasPublishing: boolean;
  hidePublishing: boolean;
  doneStepId: string;
  getDiscussionCount: (passageId: string, stepId: string) => number;
  graphicFind: (
    rec: InitializedRecord,
    ref?: string
  ) => { uri?: string; rights?: string; url?: string; color?: string };
  getPublishTo: (
    publishTo: string,
    hasPublishing: boolean,
    shared: boolean,
    noDefault?: boolean
  ) => PublishDestinationEnum[];
  publishStatus: (destinations: PublishDestinationEnum[]) => string;
  getSharedResource: (p: PassageD) => SharedResourceD | undefined;
  current?: ISheet[];
  user: string;
  myGroups: GroupD[];
  isDeveloper?: boolean;
}

export const getSheet = ({
  plan,
  sections,
  passages,
  organizationSchemeSteps,
  flat,
  projectShared,
  memory,
  orgWorkflowSteps,
  wfStr,
  filterState,
  minSection,
  hasPublishing,
  hidePublishing,
  doneStepId,
  getDiscussionCount,
  graphicFind,
  getPublishTo,
  publishStatus,
  getSharedResource,
  current,
  user,
  myGroups,
  isDeveloper = false,
}: GetSheetProps) => {
  const myWork = current || Array<ISheet>();
  let plansections = sections
    .filter((s) => related(s, 'plan') === plan)
    .sort((i, j) => i.attributes?.sequencenum - j.attributes?.sequencenum);
  let sectionfiltered = false;
  let schemeId: string | undefined = undefined;
  plansections.forEach((section) => {
    let item = { ...initItem };
    let curSection = 1;
    let curSectionPublished = false;
    let sectionIndex: number | undefined;
    let sectionScheme: RecordIdentity | undefined;
    if (section.attributes) {
      item.level = section.attributes.level || SheetLevel.Section;
      item.kind = flat ? IwsKind.SectionPassage : IwsKind.Section;
      item.sectionId = { type: 'section', id: section.id };
      item.sectionSeq = section.attributes.sequencenum;
      item.passageType =
        item.level === SheetLevel.Movement
          ? PassageTypeEnum.MOVEMENT
          : item.level === SheetLevel.Book && item.sectionSeq === BookSeq
          ? PassageTypeEnum.BOOK
          : item.level === SheetLevel.Book && item.sectionSeq === AltBkSeq
          ? PassageTypeEnum.ALTBOOK
          : PassageTypeEnum.PASSAGE;
      item.reference =
        item.passageType === PassageTypeEnum.PASSAGE
          ? ''
          : item.level === SheetLevel.Book && isDeveloper
          ? section.attributes.state
          : item.passageType;
      item.title = section?.attributes?.name;
      schemeId = related(section, 'organizationScheme');
      item.scheme = schemeId
        ? { type: 'organizationscheme', id: schemeId }
        : undefined;
      sectionScheme = item.scheme;
      item.sectionUpdated = section.attributes.dateUpdated;
      item.passageSeq = 0;
      item.deleted = false;
      sectionfiltered = isSectionFiltered(
        filterState,
        minSection,
        item.sectionSeq,
        hidePublishing,
        item.reference
      );
      item.filtered = sectionfiltered;
      item.published = getPublishTo(
        section.attributes.publishTo,
        hasPublishing,
        projectShared,
        true
      );
      curSectionPublished = section.attributes.published;
      const gr = graphicFind(section);
      item.graphicUri = gr?.uri;
      item.graphicRights = gr?.rights;
      item.graphicFullSizeUrl = gr?.url;
      const titleMediaId = related(section, 'titleMediafile');
      item.titleMediaId = titleMediaId
        ? { type: 'mediafile', id: titleMediaId }
        : undefined;
      curSection = item.sectionSeq;
    }
    let first = true;
    let hasOnePassage = false;
    if (item.kind === IwsKind.Section) {
      sectionIndex = shtSectionAdd(myWork, item);
      item = { ...initItem };
    }
    const sectionPassages = passages
      .filter((p) => related(p, 'section') === section.id)
      .sort((i, j) => i.attributes?.sequencenum - j.attributes?.sequencenum);
    sectionPassages.forEach((passage) => {
      const passAttr = passage.attributes;
      if (passAttr) {
        if (!flat || !first) {
          item.level = SheetLevel.Passage;
          item.kind = IwsKind.Passage;
        }
        first = false;
        item.sectionSeq = curSection;
        item.passageSeq = passAttr.sequencenum;
        item.book = passAttr.book;
        item.reference = passAttr.reference;
        item.comment = passAttr.title;
        item.passageUpdated = passage.attributes.dateUpdated;
        item.passage = passage;
        item.passageType = passageTypeFromRef(passAttr.reference, flat);
        item.sharedResource = getSharedResource(passage);
        let mediaRec: MediaFileD | null;
        if (item.sharedResource) {
          mediaRec = getVernacularMediaRec(
            related(item.sharedResource, 'passage'),
            memory
          );
        } else mediaRec = getVernacularMediaRec(passage.id, memory);

        item.mediaId = mediaRec
          ? { type: 'mediafile', id: mediaRec.id }
          : undefined;
        item.mediaShared =
          projectShared || (curSectionPublished && !hidePublishing)
            ? getMediaShared(related(mediaRec, 'passage'), memory)
            : IMediaShare.NotPublic;

        if (item.mediaShared === IMediaShare.OldVersionOnly) {
          const all = getAllMediaRecs(
            related(mediaRec, 'passage'),
            memory,
            null
          );
          const pub = all.find((m) => m.attributes.readyToShare);
          const oldpublished = getPublishTo(
            pub?.attributes?.publishTo || '{}',
            hasPublishing,
            projectShared,
            true
          );
          item.published = oldpublished;
          item.publishStatus = publishStatus(oldpublished);
        } else {
          const published = getPublishTo(
            mediaRec?.attributes?.publishTo || '{}',
            hasPublishing,
            projectShared,
            true
          );
          item.published = published;
          item.publishStatus = publishStatus(published);
        }
        const stepId = getNextStep({
          psgCompleted: getStepComplete(passage),
          orgWorkflowSteps,
        });
        const stepRec = orgWorkflowSteps.find((s) => s.id === stepId);
        if (stepRec) {
          const strTag = toCamel(stepRec.attributes.name);
          item.step = wfStr.hasOwnProperty(strTag)
            ? addPt(wfStr.getString(strTag))
            : stepRec.attributes.name;
          item.stepId = stepRec.id;
          const schemeStep = organizationSchemeSteps.find(
            (s) =>
              related(s, 'orgWorkflowStep') === stepId &&
              related(s, 'organizationscheme') === schemeId
          );
          if (schemeStep) {
            item.assign = (schemeStep.relationships?.user?.data ||
              schemeStep.relationships?.group?.data) as RecordIdentity;
          }
          item.discussionCount = item.passage.id
            ? getDiscussionCount(item.passage.id, item.stepId)
            : 0;
        }
        item.deleted = false;
        item.filtered =
          sectionfiltered ||
          isPassageFiltered(
            item,
            filterState,
            minSection,
            hidePublishing,
            orgWorkflowSteps,
            doneStepId,
            sectionScheme,
            item.assign,
            user,
            myGroups
          );
        if (
          [PassageTypeEnum.NOTE, PassageTypeEnum.CHAPTERNUMBER].includes(
            item.passageType
          )
        ) {
          const gr = graphicFind(passage, item.reference);
          item.graphicUri = gr?.uri;
          item.graphicRights = gr?.rights;
          item.graphicFullSizeUrl = gr?.url;
          item.color = gr?.color;
        }
      }
      shtPassageAdd(myWork, item, sectionIndex);
      if (!item.filtered) hasOnePassage = true;
      item = { ...initItem };
    });
    if (myWork[sectionIndex!]) {
      const rec = myWork[sectionIndex!];
      if (rec) {
        if (!hasOnePassage && filterState.assignedToMe) {
          rec.filtered = true;
        }
      }
    }
  });
  return myWork;
};
