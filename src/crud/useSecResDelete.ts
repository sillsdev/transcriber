import { useGlobal } from 'reactn';
import { SectionResource } from '../model';
import { TransformBuilder } from '@orbit/data';

export const useSecResDelete = () => {
  const [memory] = useGlobal('memory');

  return (secResRec: SectionResource) => {
    memory.update((t: TransformBuilder) => t.removeRecord(secResRec));
  };
};
