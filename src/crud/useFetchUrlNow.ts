import { useContext } from 'react';

import { isElectron } from '../api-variable';
import { TokenContext } from '../context/TokenProvider';

import { useDownloadMedia } from '../utils';
import { useSelector, shallowEqual } from 'react-redux';
import { ISharedStrings } from '../model';
import { sharedSelector } from '../selector';
import { errStatus } from '../store/AxiosStatus';
import { axiosGet } from '../utils/axios';
import { AxiosError } from 'axios';

export interface IFetchNowProps {
  id: string;
  cancelled: () => boolean;
}
export const useFetchUrlNow = () => {
  const { accessToken } = useContext(TokenContext).state;
  const { tryDownload } = useDownloadMedia();
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  const fetchUrl = async (props: IFetchNowProps): Promise<string> => {
    let { id, cancelled } = props;
    try {
      var strings = await axiosGet(
        `mediafiles/${id}/fileurl`,
        undefined,
        accessToken
      );
      const attr: any = strings.data.attributes;
      if (!attr || cancelled()) return '';
      const audioUrl = attr['audio-url'] as string;
      if (isElectron) {
        return await tryDownload(audioUrl, true);
      } else return audioUrl;
    } catch (error: any) {
      if (error.errStatus === 401) return ts.expiredToken;
      var err = error as AxiosError;
      if (err.status === 401) return ts.expiredToken;
      if (errStatus(error).errMsg.includes('transient')) {
        return await fetchUrl(props);
      } else throw error;
    }
  };

  return fetchUrl;
};
