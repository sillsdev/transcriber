import { createSelector } from 'reselect';
import { IState } from '../model/state';

interface IStringsSelectorProps {
    layout: string;
};

const langSelector = (state: IState) => state.strings.lang;
const layoutSelector = (state: IState, props: IStringsSelectorProps) => state.strings[props.layout];

const localStrings = createSelector( layoutSelector, langSelector, (layout, lang) => {
    layout.setLanguage(lang);
    return (layout)
});

export default localStrings;
