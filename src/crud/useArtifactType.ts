import { useGlobal, useState } from 'reactn';
import {
  IState,
  IArtifactTypeStrings,
  ArtifactType,
  OrgArtifactType,
} from '../model';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import localStrings from '../selector/localize';
import { useSelector, shallowEqual } from 'react-redux';
import { related } from '.';
import { currentDateTime } from '../utils';
import { AddRecord } from '../model/baseModel';

export interface ISwitches {
  [key: string]: any;
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
    const types: string[] = [];
    const recs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('artifacttype')
    ) as ArtifactType[];
    const orgrecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('orgartifacttype')
    ) as OrgArtifactType[];
    recs.forEach((r) =>
      types.push(localizedArtifactType(r.attributes.typename))
    );
    orgrecs
      .filter((r) => related(r, 'organization') === organization)
      .forEach((r) => types.push(localizedArtifactType(r.attributes.typename)));

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
