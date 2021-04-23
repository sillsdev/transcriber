import en from '../assets/en.json';
import fr from '../assets/fr.json';
import ar from '../assets/ar.json';
import es from '../assets/es.json';
import ha from '../assets/ha.json';
import id from '../assets/id.json';
import ru from '../assets/ru.json';
import sw from '../assets/sw.json';
import pt from '../assets/pt.json';
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

const ldml: ILdml = { en, fr, ar, es, ha, id, ru, sw, pt, ta };

export const langName = (loc: string, opt: string): string => {
  return ldml[loc].ldml.localeDisplayNames.languages.language
    .filter((d) => d.type === opt)
    .map((d) => d.content)[0];
};
