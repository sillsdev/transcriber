import WaveSurfer from "wavesurfer.js";
import * as WaveSurferRegions from "wavesurfer.js/dist/plugin/wavesurfer.regions";
import * as WaveSurferTimeline from 'wavesurfer.js/dist/plugin/wavesurfer.timeline';

export function createWaveSurfer(container, height, timelineContainer)
{
 return WaveSurfer.create({
    container: container,
    scrollParent: true,
    waveColor: '#A8DBA8',
    progressColor: '#3B8686',
    height: height,
    plugins: [
      timelineContainer && WaveSurferTimeline.create({
        container: timelineContainer,
        height: 10
      }),
      WaveSurferRegions.create({
        regions: [],
        dragSelection: {
          slop: 5,
        },
      }),
    ],
  })
}
