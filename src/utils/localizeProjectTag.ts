import { IVProjectStrings } from '../model';

export const localizeProjectTag = (tag: string, t: IVProjectStrings) => {
  switch (tag) {
    case 'training':
      return t.training;
    case 'testing':
      return t.testing;
    case 'backTranslation':
      return t.backtranslation;
    default:
      return tag;
  }
};
