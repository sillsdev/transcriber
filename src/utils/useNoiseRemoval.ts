import { useGlobal, useRef } from 'reactn';
import Axios from 'axios';
import { API_CONFIG } from '../api-variable';
import { RecordKeyMap } from '@orbit/records';

import JSONAPISource from '@orbit/jsonapi';
import IndexedDBSource from '@orbit/indexeddb';
import Memory from '@orbit/memory';
import { pullTableList, waitForLocalId } from '../crud';
interface job {
    taskId: string,
    mediafileid: number,
    cb: (mediafileid: string) => void,
    tries: number
}
const timerDelay = 3000;
const waitTime = 1000*60*10; //10 minutes good?

export const useNoiseRemoval = () => {
  const [reporter] = useGlobal('errorReporter');
  const [coordinator] = useGlobal('coordinator');
  const [offline] = useGlobal('offline');
  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const backup = coordinator.getSource('backup') as IndexedDBSource;
  const taskList: job[] = [];
  const taskTimer = useRef<NodeJS.Timeout>();

    const requestNoiseRemoval = async (mediafileid: number, cb: (mediafileid: string) => void) => {
        if (offline) return "";
        
        const opts = {
            timeout: 10000,
            };
        var response = await Axios.get(API_CONFIG.host + `/api/mediafiles/${mediafileid}/noiseremoval`, opts);
        //taskid is in textquality
        var taskId = response.data.data.attributes["text-quality"]??"";
        taskList.push({taskId, mediafileid, cb, tries:waitTime/timerDelay});
        if (!taskTimer.current) launchTimer();
        return taskId;
    }

    const checkTask = async (id: number, taskId: string) => {
        var response = await Axios.get(API_CONFIG.host + `/api/mediafiles/${id}/noiseremoval/${taskId}`);
        //will be a new id if completed
        return response.data.data.id as string;
    }
    const cleanupTimer = () => {
      if (taskTimer.current) {
        try {
          clearInterval(taskTimer.current);
        } catch (error) {
          console.log(error);
        }
        taskTimer.current = undefined;
      }
    };
  
    const checkNoiseRemovalTasks = async () => {

      taskList.forEach(async job => {
        try {
          var mediaId = await checkTask(job.mediafileid, job.taskId);
          if (mediaId && mediaId !== job.mediafileid.toString())
          {
            cleanup(job);
            await pullTableList(
              'mediafile',
              Array(mediaId),
              memory,
              remote,
              backup,
              reporter
            );
            var localId = await waitForLocalId('mediafile', mediaId, memory.keyMap as RecordKeyMap);
            job.cb(localId);

          } 
          else 
          {
            job.tries--;
            if (job.tries === 0)
            {
              job.cb("");
              cleanup(job);
            }
          }
        } catch (error) {
          console.log(error);
          job.cb("");
          cleanup(job);
        }
    })
  }
  const cleanup = (job: job) => {
    taskList.splice(taskList.indexOf(job), 1);
    if (taskList.length === 0) cleanupTimer();
  }
    const launchTimer = () => {
      taskTimer.current = setInterval(() => {
        checkNoiseRemovalTasks();
      }, timerDelay);
    };
  
  return requestNoiseRemoval;
};
