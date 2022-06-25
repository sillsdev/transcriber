import { useGlobal, useMemo, useState } from 'reactn';
import {
  IState,
  IArtifactTypeStrings,
  ArtifactType,
  MediaFile,
} from '../model';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import localStrings from '../selector/localize';
import { useSelector, shallowEqual } from 'react-redux';
import { findRecord, related } from '.';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';

export const VernacularTag = null; // used to test the relationship

export enum ArtifactTypeSlug {
  Vernacular = 'vernacular',
  BackTranslation = 'backtranslation',
  Retell = 'retell',
  QandA = 'qanda',
  Comment = 'comment',
  Activity = 'activity',
  Resource = 'resource',
  SharedResource = 'sharedResource',
  ProjectResource = 'projectresource',
}
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
  const localizedArtifactTypeFromId = (id: string) => {
    return localizedArtifactType(slugFromId(id));
  };

  const slugFromId = (id: string) => {
    var at = {} as ArtifactType;
    if (id) at = findRecord(memory, 'artifacttype', id) as ArtifactType;
    return at && at.attributes ? at.attributes.typename : 'vernacular';
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

  const IsVernacularMedia = (m: MediaFile) => {
    return related(m, 'artifactType') === VernacularTag;
  };

  const getTypeId = (typeSlug: string) => {
    if (typeSlug === ArtifactTypeSlug.Vernacular) return null;
    const types = memory.cache.query((q: QueryBuilder) =>
      q
        .findRecords('artifacttype')
        .filter({ attribute: 'typename', value: typeSlug })
    ) as ArtifactType[];
    const v = types.find((r) => Boolean(r?.keys?.remoteId) !== offlineOnly);
    return v?.id || '';
  };

  const commentId = useMemo(() => {
    return getTypeId(ArtifactTypeSlug.Comment) as string;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offlineOnly]);

  const retellId = useMemo(() => {
    return getTypeId(ArtifactTypeSlug.Retell) as string;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offlineOnly]);

  const qAndaId = useMemo(() => {
    return getTypeId(ArtifactTypeSlug.QandA) as string;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offlineOnly]);

  const backTranslationId = useMemo(() => {
    return getTypeId(ArtifactTypeSlug.BackTranslation) as string;
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
      ...ReplaceRelatedRecord(
        t,
        artifactType,
        'organization',
        'organization',
        organization
      ),
    ]);
  };
  return {
    getArtifactTypes,
    addNewArtifactType,
    localizedArtifactType,
    slugFromId,
    localizedArtifactTypeFromId,
    fromLocalizedArtifactType,
    commentId,
    retellId,
    qAndaId,
    backTranslationId,
    getTypeId,
    IsVernacularMedia,
  };
};
