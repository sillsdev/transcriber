import { useGlobal } from 'reactn';
import { SectionResource } from '../model';
import { TransformBuilder } from '@orbit/data';
import { UpdateRecord } from '../model/baseModel';

export const useSecResUpdate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return async (secResRec: SectionResource) => {
    await memory.update((t: TransformBuilder) =>
      UpdateRecord(t, secResRec, user)
    );
  };
};
