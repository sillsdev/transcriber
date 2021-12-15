import { useState } from 'react';
import { IState, OptionType, IToolStrings } from '../model';
import localStrings from '../selector/localize';
import { useSelector, shallowEqual } from 'react-redux';

export const toolNames = [
  'resource',
  'record',
  'teamCheck',
  'keyTerms',
  'discuss',
  'transcribe',
  'segment',
  'paratext',
];

const toolMap = [
  { from: 'audio', to: 'discuss' },
  { from: 'backTranslate', to: 'segment' },
];

interface ISwitches {
  [key: string]: any;
}
const stringSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'tool' });

export const useTools = () => {
  const t: IToolStrings = useSelector(stringSelector, shallowEqual);
  const [fromLocal] = useState<ISwitches>({});

  const localizedTool = (val: string) => {
    return (t as ISwitches)[val] || val;
  };

  const fromLocalizedTool = (val: string) => {
    if (Object.entries(fromLocal).length === 0) {
      for (const [key, value] of Object.entries(t)) {
        fromLocal[value] = key;
      }
    }
    return fromLocal[val] || val;
  };

  const mapTool = (tool: string) => {
    for (const { from, to } of toolMap) {
      if (tool === from) return to;
    }
    return tool;
  };

  const getToolOptions = () => {
    return toolNames.map(
      (v) =>
        ({
          label: localizedTool(v),
          value: v,
        } as OptionType)
    );
  };

  return {
    getToolOptions,
    mapTool,
    localizedTool,
    fromLocalizedTool,
  };
};
