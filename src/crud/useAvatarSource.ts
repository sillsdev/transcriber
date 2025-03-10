import { useEffect, useState } from 'react';
import { User } from '../model';
import { dataPath, PathType } from '../utils/dataPath';
import { remoteId } from '../crud';
import { isElectron } from '../api-variable';
import { RecordIdentity, RecordKeyMap } from '@orbit/records';
import { useGlobal } from '../context/GlobalContext';
const ipc = (window as any)?.electron;

export const useAvatarSource = (name: string, rec: RecordIdentity) => {
  const [source, setSource] = useState('');
  const [memory] = useGlobal('memory');

  useEffect(() => {
    (async () => {
      const url = (rec as User)?.attributes?.avatarUrl;
      let src = await dataPath(url || name, PathType.AVATARS, {
        localname:
          remoteId(rec?.type, rec.id, memory?.keyMap as RecordKeyMap) +
          name +
          '.png',
      });
      if (src && isElectron && !src.startsWith('http')) {
        if (await ipc?.exists(src)) {
          const url = (await ipc?.isWindows())
            ? new URL(src).toString().slice(8)
            : src;
          src = `transcribe-safe://${url}`;
        } else src = '';
      }
      setSource(src);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, rec]);

  return source;
};
