import { useGetGlobal, useGlobal } from '../context/GlobalContext';
import related from './related';
import { Passage, Plan, Section } from '../model';
import { passageTypeFromRef } from '../control/RefRender';
import { PassageTypeEnum } from '../model/passageType';

export const useCanBeFlat = () => {
  const [memory] = useGlobal('memory');
  const getGlobal = useGetGlobal();

  return () => {
    const plans = memory?.cache.query((q) => q.findRecords('plan')) as Plan[];
    const plan = plans.find(
      (p) => related(p, 'project') === getGlobal('project')
    );
    const sectionIds = (
      memory?.cache.query((q) => q.findRecords('section')) as Section[]
    )
      .filter((s) => related(s, 'plan') === plan?.id)
      .map((s) => s.id);
    const passages = (
      memory?.cache.query((q) => q.findRecords('passage')) as Passage[]
    ).filter((p) => sectionIds.includes(related(p, 'section')));
    const canPublish = passages.reduce(
      (p, c) =>
        p ||
        passageTypeFromRef(c.attributes.reference) !== PassageTypeEnum.PASSAGE,
      false
    );
    return !canPublish;
  };
};
