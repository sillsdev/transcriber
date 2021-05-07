  export function convertToMP3() {}
  /* this produces garbage so giving up for now...
  ** install lamejs to use this and
  ** declare module 'lamejs' in react-app-env.d.ts

  import lamejs from 'lamejs'

  const DEFAULT_KBPS = 128
  const DEFAULT_SAMPLE_RATE = 44100

  export interface MP3Options {
      numChannels: number,
      sampleRate: number,
      kbps: number, //96 to 320
  }

  export async function convertToMP3 (data_left: any, data_right: any, options:
    MP3Options) {
    const mp3Bytes = getMP3Bytes(data_left, data_right, options);
    return new Blob(mp3Bytes, {
      type: 'audio/mpeg'
    });
  }

  function getMP3Bytes(data_left: any, data_right: any, options: MP3Options) {

    var mp3encoder = new lamejs.Mp3Encoder(
      options.numChannels,
      options.sampleRate || DEFAULT_SAMPLE_RATE,
      options.kbps || DEFAULT_KBPS
    )
    var len = data_left.len;
    var ix = 0;
    var samples_left = new Int16Array(len);
    var samples_right = data_right ? new Int16Array(len) : undefined;
    if (data_right && samples_right)
    {
      while(ix < len) {
        samples_left[ix] = convert(data_left[ix]);
        samples_right[ix] = convert(data_right[ix]);
         ++ix;
      }
    }
    else
    {
      while(ix < len) {
        samples_left[ix] = convert(data_left[ix]);
         ++ix;
      }
    }
    function convert ( n :number) {
       var v = n < 0 ? n * 32768 : n * 32767;       // convert in range [-32768, 32767]
       return Math.max(-32768, Math.min(32768, v)); // clamp
    }

    var sampleBlockSize = 1152 * 2;
    var mp3Data = [];

    var sampleChunkLeft = null;
    var sampleChunkRight = null;

    for (var i = 0; i < samples_left.length; i += sampleBlockSize) {
      sampleChunkLeft = samples_left.subarray(i, i + sampleBlockSize);

      if (samples_right)
        sampleChunkRight = samples_right.subarray(i, i + sampleBlockSize);

      var mp3buf = mp3encoder.encodeBuffer(sampleChunkLeft, sampleChunkRight);


      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }
    mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
    return mp3Data;
  }
*/
