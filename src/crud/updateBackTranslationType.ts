import { QueryBuilder, RecordIdentity, TransformBuilder } from '@orbit/data';
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
  errorReporter: any,
  offlineSetup: () => Promise<void>
) => {
  if (token) {
    await axiosGet('mediafiles/wbt', undefined, token).catch(
      (err: AxiosError) => {
        logError(
          Severity.error,
          errorReporter,
          'Whole Back Translate Update Failed:' +
            (err.message || err.toString())
        );
      }
    );
  } else {
    //offline
    var artifacttypes = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('artifacttype')
    ) as ArtifactType[];
    var bt = artifacttypes.find(
      (a) => a.attributes.typename === 'backtranslation'
    );
    var wbt = artifacttypes.find(
      (a) => a.attributes.typename === 'wholebacktranslation'
    );

    if (!bt || !wbt) {
      await offlineSetup();
      wbt = artifacttypes.find(
        (a) => a.attributes.typename === 'wholebacktranslation'
      );
      if (!wbt) {
        logError(
          Severity.error,
          errorReporter,
          'Unable to find wholebacktranslation artifact type'
        );
        return;
      }
    }

    var mediafiles = memory.cache.query((q: QueryBuilder) =>
      q
        .findRecords('mediafile')
        .filter({ relation: 'artifactType', record: bt as RecordIdentity })
    ) as MediaFile[];
    var nosegs = mediafiles.filter(
      (m) => (m.attributes.sourceSegments?.length ?? 0) === 0
    );
    nosegs.forEach((m) =>
      memory.update((t: TransformBuilder) =>
        UpdateRelatedRecord(t, m, 'artifactType', 'artifacttype', wbt?.id, user)
      )
    );
  }
};
