import { TransformBuilder } from '@orbit/data';
import { useGlobal } from 'reactn';
import { MediaFile } from '../model';
import { AddRecord } from '../model/baseModel';
import { currentDateTime } from '../utils';

export const useOfflnMediafileCreate = () => {
  const [memory] = useGlobal('memory');
  const [plan] = useGlobal('plan');
  const [user] = useGlobal('user');

  const createMedia = async (
    data: any, //from upload
    version: number,
    size: number,
    passageId: string,
    artifactTypeId: string
  ) => {
    const newMediaRec: MediaFile = {
      type: 'mediafile',
      attributes: {
        ...data,
        versionNumber: version,
        transcription: '',
        filesize: size,
        position: 0,
        dateCreated: currentDateTime(),
        dateUpdated: currentDateTime(),
      },
    } as any;
    const t = new TransformBuilder();
    await memory.update([
      ...AddRecord(t, newMediaRec, user, memory),
      t.replaceRelatedRecord(newMediaRec, 'plan', {
        type: 'plan',
        id: plan || data.planId,
      }),
    ]);
    if (passageId)
      await memory.update([
        t.replaceRelatedRecord(newMediaRec, 'passage', {
          type: 'passage',
          id: passageId,
        }),
      ]);
    if (artifactTypeId)
      await memory.update([
        t.replaceRelatedRecord(newMediaRec, 'artifactType', {
          type: 'artifacttype',
          id: artifactTypeId,
        }),
      ]);
    return newMediaRec;
  };
  return { createMedia };
};
