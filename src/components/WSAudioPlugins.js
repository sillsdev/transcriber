import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions'
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline'
import ZoomPlugin from 'wavesurfer.js/dist/plugins/zoom'
import RecordPlugin from 'wavesurfer.js/dist/plugins/record'
import { maxZoom } from './WSAudioPlayerZoom';
//import * as WaveSurferMarkers from 'wavesurfer.js/dist/plugin/markers';

export function createWaveSurfer(container, height, timelineContainer) {
  const regionsPlugin = RegionsPlugin.create({
    regions: [],
    dragSelection: {
      slop: 5,
    },
  });
      /*
  const recorderPlugin = RecordPlugin.create({
       renderRecordedAudio: false,
       scrollingWaveform:false,
       continuousWaveform: true,
       continuousWaveformDuration: 30, // optional
     });*/

//, recorder]);

  const wavesurfer= WaveSurfer.create({
    container: container,
    fillParent: true,  // This ensures the waveform fills the container
    waveColor: '#A8DBA8',
    progressColor: '#3B8686',
    height: height,
    normalize: true,
    plugins: [
      timelineContainer &&
        TimelinePlugin.create({
          container: timelineContainer,
          height: 10,
        }),
      regionsPlugin,
      ZoomPlugin.create({
               scale: 0.5,
               maxZoom: maxZoom,
             })
      //WaveSurferMarkers.create({}),
    ]});
  return {wavesurfer, regions: regionsPlugin}
}
