import { useState } from 'react';
import { IState, OptionType, IToolStrings } from '../model';
import localStrings from '../selector/localize';
import { useSelector, shallowEqual } from 'react-redux';

export enum ToolSlug {
  Resource = 'resource',
  Record = 'record',
  TeamCheck = 'teamCheck',
  Discuss = 'discuss',
  Transcribe = 'transcribe',
  Segment = 'segment',
  Paratext = 'paratext',
  Community = 'community',
  Export = 'export',
  Done = 'done',
}

const toolSlugs = [
  ToolSlug.Resource,
  ToolSlug.Record,
  ToolSlug.TeamCheck,
  ToolSlug.Discuss,
  ToolSlug.Transcribe,
  ToolSlug.Segment,
  ToolSlug.Paratext,
  ToolSlug.Community,
  ToolSlug.Export,
  ToolSlug.Done,
];

const toolMap = [
  { from: 'audio', to: ToolSlug.Discuss },
  { from: 'backTranslate', to: ToolSlug.Segment },
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
    return toolSlugs.map(
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
