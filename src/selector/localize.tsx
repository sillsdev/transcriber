import { createSelector } from 'reselect';
import { IState } from '../model/state';

interface IStringsSelectorProps {
  layout: string;
}

const langSelector = (state: IState) => state.strings.lang;
const layoutSelector = (state: IState, props: IStringsSelectorProps) =>
  state.strings[props.layout];

export const localStrings = createSelector(
  layoutSelector,
  langSelector,
  (layout, lang) => {
    if (lang) {
      layout.setLanguage(lang);
    }
    return layout;
  }
);

export default localStrings;
