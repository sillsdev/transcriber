import { useGlobal } from '../mods/reactn';
import { SectionResource } from '../model';
import { TransformBuilder } from '@orbit/data';
import { UpdateRecord } from '../model/baseModel';

export const useSecResUpdate = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return (secResRec: SectionResource) => {
    memory.update((t: TransformBuilder) => UpdateRecord(t, secResRec, user));
  };
};
