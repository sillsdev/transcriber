import WaveSurfer from "wavesurfer.js";
import * as WaveSurferRegions from "wavesurfer.js/dist/plugin/wavesurfer.regions";
export function createWaveSurfer(container)
{
 return WaveSurfer.create({
    container: container,
    scrollParent: true,
    waveColor: "#A8DBA8",
    progressColor: "#3B8686",
    plugins: [
      WaveSurferRegions.create({
        regions: [],
        dragSelection: {
          slop: 5,
        },
      }),
    ],
  })
}
