import { IState } from '../model';
import localStrings from './localize';

export const passageChooserSelector = (state: IState) =>
  localStrings(state as IState, { layout: 'passageChooser' });
