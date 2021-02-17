import en from '../assets/en.json';
import fr from '../assets/fr.json';
import ar from '../assets/ar.json';
import es from '../assets/es.json';
import ha from '../assets/ha.json';
import id from '../assets/id.json';
import pt from '../assets/pt.json';
import ru from '../assets/ru.json';
import sw from '../assets/sw.json';
import ta from '../assets/ta.json';

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
const ldmlProd: ILdml = { en, fr, pt, ru };
const ldmlDev: ILdml = { en, fr, ar, es, ha, id, ru, sw, pt, ta };

export const localeDefault = (isDev: boolean, bcp47?: string) => {
  const code1 = bcp47 && bcp47.split('-')[0];
  const ldml = isDev ? ldmlDev : ldmlProd;
  if (code1 && ldml.hasOwnProperty(code1)) return code1;
  const code = navigator.language.split('-')[0];
  return ldml.hasOwnProperty(code) ? code : 'en';
};
