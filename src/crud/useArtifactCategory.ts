import { useState } from 'react';
import { useGlobal } from 'reactn';
import {
  IState,
  IArtifactCategoryStrings,
  ArtifactCategory,
  ArtifactCategoryD,
  Organization,
} from '../model';
import { RecordTransformBuilder } from '@orbit/records';
import localStrings from '../selector/localize';
import { useSelector, shallowEqual } from 'react-redux';
import { related, findRecord } from '.';
import {
  AddRecord,
  ReplaceRelatedRecord,
  UpdateRecord,
} from '../model/baseModel';
import { cleanFileName, waitForIt } from '../utils';
import JSONAPISource from '@orbit/jsonapi';

interface ISwitches {
  [key: string]: any;
}
export interface IArtifactCategory {
  slug: string;
  category: string;
  org: string;
  id: string;
  titleMediaId: string;
  color: string;
}
export enum ArtifactCategoryType {
  Resource = 'resource',
  Discussion = 'discussion',
  Note = 'note',
}
const stringSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'artifactCategory' });

export const useArtifactCategory = (teamId?: string) => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [offline] = useGlobal('offline');
  const [organization] = useGlobal('organization');
  const curOrg = teamId ?? organization;
  const [offlineOnly] = useGlobal('offlineOnly');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator.getSource('remote') as JSONAPISource;

  const t: IArtifactCategoryStrings = useSelector(stringSelector, shallowEqual);
  const [fromLocal] = useState<ISwitches>({});

  const localizedArtifactCategory = (val: string) => {
    return (t as ISwitches)[val] || val;
  };

  const fromLocalizedArtifactCategory = (val: string) => {
    if (Object.entries(fromLocal).length === 0) {
      for (const [key, value] of Object.entries(t)) {
        fromLocal[value] = key;
      }
    }
    return fromLocal[val] || val;
  };

  const slugFromId = (id: string) => {
    var aRec = {} as ArtifactCategory;
    if (id)
      aRec = findRecord(memory, 'artifactcategory', id) as ArtifactCategory;
    return aRec?.attributes?.categoryname ?? '';
  };

  const defaultMediaName = (name: string) => {
    var orgRec = findRecord(memory, 'organization', curOrg) as Organization;
    return cleanFileName(orgRec?.attributes?.slug + 'cat' + name) ?? '';
  };

  const getArtifactCategorys = async (type: ArtifactCategoryType) => {
    const categorys: IArtifactCategory[] = [];
    /* wait for new categories remote id to fill in */
    await waitForIt(
      'category update',
      () => !remote || remote.requestQueue.length === 0,
      () => offline && !offlineOnly,
      200
    );
    var orgrecs: ArtifactCategoryD[] = (
      memory.cache.query((q) =>
        q.findRecords('artifactcategory')
      ) as ArtifactCategoryD[]
    ).filter(
      (r) =>
        Boolean(r.relationships) &&
        (related(r, 'organization') === curOrg ||
          related(r, 'organization') === null) &&
        Boolean(r.keys?.remoteId) !== offlineOnly
    );
    if (type === ArtifactCategoryType.Resource)
      orgrecs = orgrecs.filter((r) => r.attributes.resource);
    else if (type === ArtifactCategoryType.Discussion)
      orgrecs = orgrecs.filter((r) => r.attributes.discussion);
    else if (type === ArtifactCategoryType.Note)
      orgrecs = orgrecs.filter((r) => r.attributes.note);

    orgrecs.forEach((r) =>
      categorys.push({
        slug: r.attributes.categoryname,
        category: localizedArtifactCategory(r.attributes.categoryname),
        org: related(r, 'organization') ?? '',
        id: r.id,
        titleMediaId: related(r, 'titleMediafile') ?? '',
        color: r.attributes.color ?? '',
      })
    );
    return categorys;
  };

  const isDuplicateCategory = async (
    newArtifactCategory: string,
    type: ArtifactCategoryType,
    id?: string
  ) => {
    //check for duplicate
    const orgrecs: ArtifactCategory[] = memory.cache.query((q) =>
      q
        .findRecords('artifactcategory')
        .filter({ attribute: 'categoryname', value: newArtifactCategory })
    ) as any;
    var dup = false;
    orgrecs.forEach((r) => {
      var org = related(r, 'organization');
      if ((org === curOrg || !org) && r.id !== id) dup = true;
    });
    if (dup) return true;
    //now check duplicate localized
    const ac = (await getArtifactCategorys(type)).filter(
      (c) => c.category === newArtifactCategory
    );
    if (ac.length > 0 && ac[0].id !== id) return true;
    return false;
  };

  const addNewArtifactCategory = async (
    newArtifactCategory: string,
    type: ArtifactCategoryType,
    titleMedia?: string,
    color?: string
  ) => {
    if (!/^\s*$/.test(newArtifactCategory)) {
      if (await isDuplicateCategory(newArtifactCategory, type))
        return 'duplicate';

      const artifactCategory: ArtifactCategoryD = {
        type: 'artifactcategory',
        attributes: {
          categoryname: newArtifactCategory,
          resource: type === ArtifactCategoryType.Resource,
          discussion: type === ArtifactCategoryType.Discussion,
          note: type === ArtifactCategoryType.Note,
          color: color ?? '',
        },
      } as any;
      const t = new RecordTransformBuilder();
      var ops = [
        ...AddRecord(t, artifactCategory, user, memory),
        ...ReplaceRelatedRecord(
          t,
          artifactCategory,
          'organization',
          'organization',
          curOrg
        ),
      ];
      if (titleMedia) {
        ops = [
          ...ops,
          ...ReplaceRelatedRecord(
            t,
            artifactCategory,
            'titleMediafile',
            'mediafile',
            titleMedia
          ),
        ];
      }
      await memory.update(ops);
      return artifactCategory.id;
    }
  };
  const updateArtifactCategory = async (category: IArtifactCategory) => {
    const rec = findRecord(
      memory,
      'artifactcategory',
      category.id
    ) as ArtifactCategoryD;
    if (rec) {
      const t = new RecordTransformBuilder();
      var ops = [
        ...UpdateRecord(
          t,
          {
            ...rec,
            attributes: {
              ...rec.attributes,
              categoryname: category.category,
              color: category.color,
            },
          } as ArtifactCategoryD,
          user
        ),
      ];
      if (category.titleMediaId) {
        ops = [
          ...ops,
          ...ReplaceRelatedRecord(
            t,
            rec,
            'titleMediafile',
            'mediafile',
            category.titleMediaId
          ),
        ];
      }
      await memory.update(ops);
    }
  };
  const scriptureTypeCategory = (cat: string) => {
    return ['scripture', 'biblestory'].includes(
      fromLocalizedArtifactCategory(cat)
    );
  };

  return {
    getArtifactCategorys,
    isDuplicateCategory,
    addNewArtifactCategory,
    updateArtifactCategory,
    localizedArtifactCategory,
    fromLocalizedArtifactCategory,
    scriptureTypeCategory,
    slugFromId,
    defaultMediaName,
  };
};
