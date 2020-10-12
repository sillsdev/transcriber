import { useGlobal } from 'reactn';
import { Plan, IState } from '../model';
import { QueryBuilder } from '@orbit/data';
import localStrings from '../selector/localize';
import { useSelector, shallowEqual } from 'react-redux';

export interface ISwitches {
  [key: string]: string;
}
const stringSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'vProject' });

export const useOrganizedBy = () => {
  const [memory] = useGlobal('memory');
  const [plan] = useGlobal('plan');
  const t = useSelector(stringSelector, shallowEqual);

  const switchToLocal: ISwitches = {
    section: t.sections,
    set: t.sets,
    story: t.stories,
    scene: t.scenes,
    pericope: t.pericopes,
  };
  const switchFromLocal: ISwitches = {
    [t.sections]: 'section',
    [t.sets]: 'set',
    [t.stories]: 'story',
    [t.scenes]: 'scene',
    [t.pericopes]: 'pericope',
  };

  const splitLocalized = (val: string, singular?: boolean) => {
    if (singular === undefined) return val;
    const index = (val || '').indexOf('/');
    if (index > 0) {
      if (singular) return val.substr(0, index);
      else return val.substr(index + 1);
    }
    return val || '';
  };

  const localizedOrganizedBy = (val: string, singular?: boolean) => {
    if (!val) val = 'section';
    if (val in switchToLocal)
      return splitLocalized(switchToLocal[val], singular);
    return splitLocalized(val, singular); //user defined
  };

  const fromLocalizedOrganizedBy = (val: string) => {
    if (val in switchFromLocal) return switchFromLocal[val];
    return val;
  };

  const getOrganizedBy = (singular: boolean, planId?: string) => {
    if (!planId || planId === '') planId = plan;
    if (!planId || planId === '')
      return localizedOrganizedBy('section', singular);
    const planRec = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('plan')
    ) as Plan[];
    const selected = planRec.filter((p) => p.id === planId);
    if (selected.length > 0) {
      return localizedOrganizedBy(
        selected[0]?.attributes?.organizedBy || 'section',
        singular
      );
    }
    return localizedOrganizedBy('section', singular);
  };

  return { getOrganizedBy, localizedOrganizedBy, fromLocalizedOrganizedBy };
};
