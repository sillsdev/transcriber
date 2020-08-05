import en from '../assets/en.json';
import fr from '../assets/fr.json';

interface ILangDes {
  type: string;
  content: string;
}
interface ILdml {
  [loc: string]: {
    ldml: {
      localeDisplayNames: {
        languages: {
          language: Array<ILangDes>;
        };
      };
    };
  };
}
const ldml: ILdml = { en, fr };

export const localeDefault = (bcp47?: string) => {
  const code1 = bcp47 && bcp47.split('-')[0];
  if (code1 && ldml.hasOwnProperty(code1)) return code1;
  const code = navigator.language.split('-')[0];
  return ldml.hasOwnProperty(code) ? code : 'en';
};
