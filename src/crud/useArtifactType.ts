import { useGlobal, useMemo, useState } from 'reactn';
import { IState, IArtifactTypeStrings, ArtifactType } from '../model';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import localStrings from '../selector/localize';
import { useSelector, shallowEqual } from 'react-redux';
import { related } from '.';
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
  const [offlineOnly] = useGlobal('offlineOnly');
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
    const orgrecs: ArtifactType[] = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('artifacttype')
    ) as any;
    orgrecs
      .filter(
        (r) =>
          (related(r, 'organization') === organization ||
            related(r, 'organization') === null) &&
          Boolean(r.keys?.remoteId) !== offlineOnly
      )
      .forEach((r) =>
        types.push({
          type: localizedArtifactType(r.attributes.typename),
          id: r.id,
        })
      );

    return types;
  };
  const vernacularId = useMemo(() => {
    var types = memory.cache.query((q: QueryBuilder) =>
      q
        .findRecords('artifacttype')
        .filter({ attribute: 'typename', value: 'vernacular' })
    ) as ArtifactType[];
    var v = types.find((r) => Boolean(r?.keys?.remoteId) !== offlineOnly);
    if (v) return v.id;
    return '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offlineOnly]);

  const addNewArtifactType = async (newArtifactType: string) => {
    const artifactType: ArtifactType = {
      type: 'artifacttype',
      attributes: {
        typename: newArtifactType,
      },
    } as any;
    const t = new TransformBuilder();
    await memory.update([
      ...AddRecord(t, artifactType, user, memory),
      t.replaceRelatedRecord(
        { type: 'artifacttype', id: artifactType.id },
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
    vernacularId,
  };
};
