import { useGlobal, useState } from 'reactn';
import { IState, IArtifactCategoryStrings, ArtifactCategory } from '../model';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import localStrings from '../selector/localize';
import { useSelector, shallowEqual } from 'react-redux';
import { related } from '.';
import { AddRecord } from '../model/baseModel';

interface ISwitches {
  [key: string]: any;
}
export interface IArtifactCategory {
  category: string;
  id: string;
}
const stringSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'artifactCategory' });

export const useArtifactCategory = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [organization] = useGlobal('organization');
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

  const getArtifactCategorys = () => {
    const categorys: IArtifactCategory[] = [];
    const orgrecs: ArtifactCategory[] = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('artifactcategory')
    ) as any;
    orgrecs
      .filter(
        (r) =>
          related(r, 'organization') === organization ||
          related(r, 'organization') === null
      )
      .forEach((r) =>
        categorys.push({
          category: localizedArtifactCategory(r.attributes.categoryname),
          id: r.id,
        })
      );

    return categorys;
  };
  const addNewArtifactCategory = async (newArtifactCategory: string) => {
    const artifactCategory: ArtifactCategory = {
      type: 'artifactcategory',
      attributes: {
        categoryname: newArtifactCategory,
      },
    } as any;
    const t = new TransformBuilder();
    var ops = [
      ...AddRecord(t, artifactCategory, user, memory),
      t.replaceRelatedRecord(
        { type: 'artifactcategory', id: artifactCategory.id },
        'organization',
        {
          type: 'organization',
          id: organization,
        }
      ),
    ];
    await memory.update(ops);
    return artifactCategory.id;
  };
  return {
    getArtifactCategorys,
    addNewArtifactCategory,
    localizedArtifactCategory,
    fromLocalizedArtifactCategory,
  };
};
