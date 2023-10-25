import { useState } from 'react';
import { useGlobal } from 'reactn';
import { IState, IArtifactCategoryStrings, ArtifactCategory } from '../model';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import localStrings from '../selector/localize';
import { useSelector, shallowEqual } from 'react-redux';
import { related, findRecord } from '.';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import { waitForIt } from '../utils';
import JSONAPISource from '@orbit/jsonapi';

interface ISwitches {
  [key: string]: any;
}
export interface IArtifactCategory {
  slug: string;
  category: string;
  org: string;
  id: string;
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
    return aRec && aRec.attributes ? aRec.attributes.categoryname : '';
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
    var orgrecs: ArtifactCategory[] = (
      memory.cache.query((q: QueryBuilder) =>
        q.findRecords('artifactcategory')
      ) as ArtifactCategory[]
    ).filter(
      (r) =>
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
      })
    );
    return categorys;
  };

  const isDuplicateCategory = async (
    newArtifactCategory: string,
    type: ArtifactCategoryType
  ) => {
    //check for duplicate
    const orgrecs: ArtifactCategory[] = memory.cache.query((q: QueryBuilder) =>
      q
        .findRecords('artifactcategory')
        .filter({ attribute: 'categoryname', value: newArtifactCategory })
    ) as any;
    var dup = false;
    orgrecs.forEach((r) => {
      var org = related(r, 'organization');
      if (org === curOrg || !org) dup = true;
    });
    if (dup) return true;
    //now check duplicate localized
    const ac = (await getArtifactCategorys(type)).filter(
      (c) => c.category === newArtifactCategory
    );
    if (ac.length > 0) return true;
    return false;
  };

  const addNewArtifactCategory = async (
    newArtifactCategory: string,
    type: ArtifactCategoryType
  ) => {
    if (!/^\s*$/.test(newArtifactCategory)) {
      if (await isDuplicateCategory(newArtifactCategory, type))
        return 'duplicate';

      const artifactCategory: ArtifactCategory = {
        type: 'artifactcategory',
        attributes: {
          categoryname: newArtifactCategory,
          resource: type === ArtifactCategoryType.Resource,
          discussion: type === ArtifactCategoryType.Discussion,
          note: type === ArtifactCategoryType.Note,
        },
      } as any;
      const t = new TransformBuilder();
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
      await memory.update(ops);
      return artifactCategory.id;
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
    localizedArtifactCategory,
    fromLocalizedArtifactCategory,
    scriptureTypeCategory,
    slugFromId,
  };
};
