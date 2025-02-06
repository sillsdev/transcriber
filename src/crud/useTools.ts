import { useState } from 'react';
import { IState, OptionType, IToolStrings } from '../model';
import localStrings from '../selector/localize';
import { useSelector, shallowEqual } from 'react-redux';
import { ToolSlug } from '.';
import { addPt } from '../utils/addPt';

const toolSlugs = [
  ToolSlug.Resource,
  ToolSlug.Record,
  ToolSlug.KeyTerm,
  ToolSlug.TeamCheck,
  ToolSlug.Community,
  ToolSlug.Discuss,
  ToolSlug.Verses,
  ToolSlug.Transcribe,
  ToolSlug.PhraseBackTranslate,
  ToolSlug.WholeBackTranslate,
  ToolSlug.Paratext,
  ToolSlug.ConsultantCheck,
  ToolSlug.Export,
  ToolSlug.Done,
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
    const strs = t as ISwitches;
    const key = addPt(strs[val]);
    return key ? key : val;
  };

  const fromLocalizedTool = (val: string) => {
    if (Object.entries(fromLocal).length === 0) {
      for (const [key, value] of Object.entries(t)) {
        fromLocal[addPt(value)] = addPt(key);
      }
    }
    return fromLocal[addPt(val)] || val;
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
    localizedTool,
    fromLocalizedTool,
  };
};
