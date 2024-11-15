import { useGlobal } from 'reactn';
import Axios from 'axios';
import { API_CONFIG } from '../api-variable';


export const useNoiseRemoval = () => {
  const [offline] = useGlobal('offline');

    const startTask = async (mediafileid: number) => {
        if (offline) return "";
        
        const opts = {
            timeout: 10000,
            };
        var response = await Axios.get(API_CONFIG.host + `/api/mediafiles/${mediafileid}/noiseremoval`, opts);
        console.log(response, response.data);
        //taskid is in textquality
        return response.data.data.attributes["text-quality"]??"";
    }

    const checkTask = async (id: number, taskId: string) => {
        var response = await Axios.get(API_CONFIG.host + `/api/mediafiles/${id}/noiseremoval/${taskId}`);
        console.log(response.data);
        //will be a new id if completed
        return response.data.data.id as string;
    }
  
  return {startTask, checkTask};
};
