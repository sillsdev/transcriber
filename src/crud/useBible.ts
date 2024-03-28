import { useGlobal } from 'reactn';
import { Bible, BibleD, OrganizationBibleD } from '../model';
import { RecordTransformBuilder } from '@orbit/records';
import {
  AddRecord,
  ReplaceRelatedRecord,
  UpdateRecord,
} from '../model/baseModel';
import related from './related';
import { findRecord } from './tryFindRecord';
import { useJsonParams } from '../utils';

export const pubDataCopyright = 'copyright';
export const pubDataLangProps = 'langProps';

export const useBible = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const { getParam, setParam } = useJsonParams();

  const getBible = (bibleId: string) => {
    let bibles = (
      memory.cache.query((q: any) => q.findRecords('bible')) as BibleD[]
    ).filter((b) => b.attributes.bibleId === bibleId);
    if (bibles.length > 0) return bibles[0];
    return undefined;
  };
  const getBibleOwner = (bibleid: string) => {
    let bibles = (
      memory.cache.query((q: any) =>
        q.findRecords('organizationbible')
      ) as OrganizationBibleD[]
    ).filter((b) => related(b, 'bible') === bibleid && b.attributes.ownerorg);

    if (bibles.length > 0) return related(bibles[0], 'organization');
    return undefined;
  };
  const getOrgBible = (orgId: string) => {
    let orgbible = getOrgBibleRec(orgId);
    if (orgbible)
      return findRecord(memory, 'bible', related(orgbible, 'bible')) as BibleD;
    return undefined;
  };
  const getOrgBibleRec = (orgId: string) => {
    let bibles = (
      memory.cache.query((q: any) =>
        q.findRecords('organizationbible')
      ) as OrganizationBibleD[]
    ).filter((b) => related(b, 'organization') === orgId);
    if (bibles.length > 0) return bibles[0];
    return undefined;
  };

  const updaterelationships = (
    ops: any[],
    t: RecordTransformBuilder,
    bible: BibleD,
    bibleMediafile: string,
    isoMediafile: string,
    ownerOrg: string
  ) => {
    ops.push(
      ...ReplaceRelatedRecord(
        t,
        bible,
        'bibleMediafile',
        'mediafile',
        bibleMediafile
      )
    );
    ops.push(
      ...ReplaceRelatedRecord(
        t,
        bible,
        'isoMediafile',
        'mediafile',
        isoMediafile
      )
    );

    //we're only allowing one at the moment
    var orgbible = getOrgBibleRec(ownerOrg) as OrganizationBibleD;
    if (!orgbible) {
      orgbible = {
        attributes: {
          ownerorg: true,
        },
        type: 'organizationbible',
      } as OrganizationBibleD;
      ops.push(...AddRecord(t, orgbible, user, memory));
      ops.push(
        ...ReplaceRelatedRecord(
          t,
          orgbible,
          'organization',
          'organization',
          ownerOrg
        )
      );
    }
    ops.push(...ReplaceRelatedRecord(t, orgbible, 'bible', 'bible', bible.id));
  };
  const createBible = async (
    bible: BibleD,
    bibleMediafile: string,
    isoMediafile: string,
    ownerOrganization: string
  ) => {
    var t = new RecordTransformBuilder();
    const ops = [];
    ops.push(...AddRecord(t, bible, user, memory));
    updaterelationships(
      ops,
      t,
      bible,
      bibleMediafile,
      isoMediafile,
      ownerOrganization
    );
    await memory.update(ops);
    return bible.id;
  };

  const updateBible = (
    bible: BibleD,
    bibleMediafile: string,
    isoMediafile: string,
    ownerOrganization: string
  ) => {
    const t = new RecordTransformBuilder();
    const ops = [...UpdateRecord(t, bible, user)];
    updaterelationships(
      ops,
      t,
      bible,
      bibleMediafile,
      isoMediafile,
      ownerOrganization
    );
    return memory.update(ops);
  };

  const getPublishingData = (label: string, bible?: Bible) => {
    if (!bible) return undefined;
    return getParam(label, bible.attributes?.publishingData);
  };
  const setPublishingData = (label: string, value: any, bible: Bible) => {
    bible.attributes.publishingData = setParam(
      label,
      value,
      bible.attributes.publishingData
    );
  };
  return {
    getBible,
    getBibleOwner,
    getOrgBible,
    getOrgBibleRec,
    createBible,
    updateBible,
    getPublishingData,
    setPublishingData,
  };
};
