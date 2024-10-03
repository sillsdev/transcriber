import { PassageD, SectionD } from '../model';
import { LocalKey, localUserKey } from './localUserKey';

export const storedCompareKey = (passage: PassageD, section: SectionD) => {
  const storeKey = (keyType?: string) =>
    `${localUserKey(LocalKey.compare)}_${
      keyType ?? passage.attributes.sequencenum
    }`;

  const SecSlug = 'secId';

  const removeKey = (value?: string) => {
    let n = 1;
    while (true) {
      const res = localStorage.getItem(storeKey(n.toString()));
      if (!res) break;
      if (!value || res === value) {
        localStorage.removeItem(storeKey(n.toString()));
      }
      n += 1;
    }
  };

  const removeStoredKeys = () => {
    const secId = localStorage.getItem(storeKey(SecSlug));
    if (secId !== section.id) {
      localStorage.setItem(storeKey(SecSlug), section.id);
      removeKey();
    }
  };

  const saveKey = (id: string) => {
    localStorage.setItem(storeKey(), id);
  };

  return { removeStoredKeys, saveKey, removeKey, storeKey, SecSlug };
};
