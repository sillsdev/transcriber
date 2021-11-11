import { useGlobal, useState } from 'reactn';
import { IState, IArtifactTypeStrings, OrgArtifactType } from '../model';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import localStrings from '../selector/localize';
import { useSelector, shallowEqual } from 'react-redux';
import { related } from '.';
import { currentDateTime } from '../utils';
import { AddRecord } from '../model/baseModel';

interface ISwitches {
  [key: string]: any;
}
export interface IArtifactType {
  type: string;
  id: string;
}
const stringSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'artifactType' });

export const useArtifactType = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [organization] = useGlobal('organization');
  const t: IArtifactTypeStrings = useSelector(stringSelector, shallowEqual);
  const [fromLocal] = useState<ISwitches>({});

  const localizedArtifactType = (val: string) => {
    return (t as ISwitches)[val] || val;
  };

  const fromLocalizedArtifactType = (val: string) => {
    if (Object.entries(fromLocal).length === 0) {
      for (const [key, value] of Object.entries(t)) {
        fromLocal[value] = key;
      }
    }
    return fromLocal[val] || val;
  };

  const getArtifactTypes = () => {
    const types: IArtifactType[] = [];
    const orgrecs: OrgArtifactType[] = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('orgartifacttype')
    ) as any;
    orgrecs
      .filter(
        (r) =>
          related(r, 'organization') === organization ||
          related(r, 'organization') === null
      )
      .forEach((r) =>
        types.push({
          type: localizedArtifactType(r.attributes.typename),
          id: r.id,
        })
      );

    return types;
  };
  const addNewArtifactType = async (newArtifactType: string) => {
    const artifactType: OrgArtifactType = {
      type: 'orgartifacttype',
      attributes: {
        typename: newArtifactType,
        dateCreated: currentDateTime(),
        dateUpdated: currentDateTime(),
      },
    } as any;
    const t = new TransformBuilder();
    await memory.update([
      ...AddRecord(t, artifactType, user, memory),
      t.replaceRelatedRecord(
        { type: 'orgartifacttype', id: artifactType.id },
        'organization',
        {
          type: 'organization',
          id: organization,
        }
      ),
    ]);
  };
  return {
    getArtifactTypes,
    addNewArtifactType,
    localizedArtifactType,
    fromLocalizedArtifactType,
  };
};
