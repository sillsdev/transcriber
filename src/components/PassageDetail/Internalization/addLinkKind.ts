import { SyntheticEvent, useState } from 'react';
import { OptionProps } from './FindTabs';
import { PassageD } from '../../../model';

interface Tpl {
  [key: string]: string | undefined;
}

const hrefTpls: Tpl = {
  bibleBrain: 'https://live.bible.is/bible/{0}/{1}/{2}',
};

interface IProps {
  passage: PassageD;
  setLink?: (link: string) => void;
}

export const useHandleLink = ({ passage, setLink }: IProps) => {
  const [links, setLinks] = useState<Tpl>({});

  return (kind: string) =>
    (_event: SyntheticEvent, newValue: OptionProps | null) => {
      const book = passage?.attributes?.book;
      let link = newValue?.value ?? '';
      if (hrefTpls[kind]) {
        const chapter = parseInt(passage?.attributes?.reference ?? '1');
        link = newValue?.value
          ? hrefTpls[kind]
              ?.replace('{0}', newValue?.value ?? '')
              ?.replace('{1}', book ?? 'MAT')
              ?.replace('{2}', chapter.toString()) ?? ''
          : '';
        setLinks({ ...links, [kind]: link });
      }
      setLink?.(link);
    };
};
