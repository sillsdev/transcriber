import { QueryBuilder, TransformBuilder } from '@orbit/data';
import MemorySource from '@orbit/memory';
import { AxiosError } from 'axios';
import { ArtifactType, MediaFile } from '../model';
import { UpdateRelatedRecord } from '../model/baseModel';
import { logError, Severity } from '../utils';
import { axiosGet } from '../utils/axios';

export const updateBackTranslationType = async (
  memory: MemorySource,
  token: string | null,
  user: string,
  errorReporter: any
) => {
  if (token) {
    await axiosGet('mediafiles/wbt', undefined, token)
      // eslint-disable-next-line no-loop-func
      .then((response) => {
        var fr = response.data as any;
        console.log(fr);
      })
      // eslint-disable-next-line no-loop-func
      .catch((err: AxiosError) => {
        logError(
          Severity.error,
          errorReporter,
          'Whole Back Translate Update Failed:' +
            (err.message || err.toString())
        );
      });
  } else {
    //offline
    var artifacttypes = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('artifacttype')
    ) as ArtifactType[];
    var bt =
      artifacttypes.filter((a) => a.attributes.typename === 'backtranslation')
        .length > 0
        ? artifacttypes.filter(
            (a) => a.attributes.typename === 'backtranslation'
          )[0]
        : null;

    var wbt =
      artifacttypes.filter(
        (a) => a.attributes.typename === 'wholebacktranslation'
      ).length > 0
        ? artifacttypes.filter(
            (a) => a.attributes.typename === 'wholebacktranslation'
          )[0]
        : null;

    if (bt === null || wbt === null) return;

    var mediafiles = memory.cache.query((q: QueryBuilder) =>
      q
        .findRecords('mediafile')
        .filter({ relation: 'artifactType', record: bt })
        .filter({ attribute: 'sourceSegments', value: null })
    ) as MediaFile[];

    mediafiles.forEach((m) =>
      memory.update((t: TransformBuilder) =>
        UpdateRelatedRecord(t, m, 'artifactType', 'artifacttype', wbt?.id, user)
      )
    );
  }
};
