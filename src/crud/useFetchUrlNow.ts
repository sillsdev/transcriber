import { useContext } from 'react';

import Axios from 'axios';
import { API_CONFIG, isElectron } from '../api-variable';
import { TokenContext } from '../context/TokenProvider';

import { useDownloadMedia } from '../utils';

export interface IFetchNowProps {
  id: string;
  cancelled: () => boolean;
}
export const useFetchUrlNow = (tokenError: string) => {
  const { accessToken } = useContext(TokenContext).state;
  const { tryDownload } = useDownloadMedia();

  const fetchUrl = async (props: IFetchNowProps) => {
    let { id, cancelled } = props;
    try {
      var strings = await Axios.get(
        `${API_CONFIG.host}/api/mediafiles/${id}/fileurl`,
        {
          headers: {
            Authorization: 'Bearer ' + accessToken,
          },
        }
      );
      const attr: any = strings.data.data.attributes;
      if (!attr || cancelled()) return;
      const audioUrl = attr['audio-url'] as string;
      if (isElectron) {
        return await tryDownload(audioUrl, true);
      } else return audioUrl;
    } catch (error: any) {
      if (error.errStatus === 401) return tokenError;
      throw error;
    }
  };

  return fetchUrl;
};
