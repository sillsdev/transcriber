export const wrapper = {
  format: 'scripture burrito wrapper',
  meta: {
    version: '0.1',
    name: { en: 'Swahili-English Back Translation with Audio' },
    abbreviation: { en: 'SW-EN-AUDIO' },
    description: {
      en: 'This Burrito Wrapper links together a Swahili translation (text and audio) and its English back translation. It includes alignments between text and audio, and between Swahili and English text.',
    },
    generator: {
      name: 'WrapperBuilder',
      version: '1.0.0',
    },
    dateCreated: '2025-05-22',
    comments:
      'Groups Swahili text/audio with English back translation; includes alignments.',
  },
  contents: {
    burritos: [
      {
        id: 'swahili-v1',
        path: 'swahili-v1/',
        role: 'targetTranslation',
      },
      {
        id: 'swahili-backtranslation-en',
        path: 'swahili-backtranslation-en/',
        role: 'backTranslation',
      },
      {
        id: 'swahili-audio-v1',
        path: 'swahili-audio-v1/',
        role: 'audioTranslation',
      },
    ],
    alignments: [
      {
        source: 'swahili-v1',
        target: 'swahili-backtranslation-en',
        path: 'alignments/sw-text_bt-text.align.json',
        description: {
          en: 'Verse-level alignment between Swahili translation and English back translation',
        },
      },
      {
        source: 'swahili-v1',
        target: 'swahili-audio-v1',
        path: 'alignments/sw-text_sw-audio.align.json',
        description: {
          en: 'Timing alignment between Swahili text verses and audio segments',
        },
      },
    ],
  },
};
