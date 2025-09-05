export interface AudioAlignment {
  format: 'alignment';
  version: '0.3';
  type: 'audio-reference';
  roles: ['timecode', 'text-reference'];
  groups: [
    {
      documents: [
        {
          scheme: 'vtt-timecode';
          docid: '42LUK/024/ENGSEB2-LUK-24_13-35v1.mp3';
        },
        { scheme: 'u23003' }
      ];
      records: [
        { references: [['00:03.756 --> 00:05.604'], ['LUK 24:13-15']] },
        { references: [['00:05.604 --> 00:08.289'], ['LUK 24:16-22']] },
        { references: [['00:08.289 --> 00:16.671'], ['LUK 24:23-25']] },
        { references: [['00:16.671 --> 00:28.805'], ['LUK 24:26-28']] },
        { references: [['00:28.805 --> 00:30.943'], ['LUK 24:29-31']] },
        { references: [['00:30.943 --> 00:35.558'], ['LUK 24:32-35']] }
      ];
    },
    {
      documents: [
        {
          scheme: 'vtt-timecode';
          docid: '42LUK/024/ENGSEB2-LUK-24_36-53v1.mp3';
        },
        { scheme: 'u23003' }
      ];
      records: [
        { references: [['00:03.756 --> 00:05.604'], ['LUK 24:36-37']] },
        { references: [['00:05.604 --> 00:08.289'], ['LUK 24:38']] },
        { references: [['00:08.289 --> 00:16.671'], ['LUK 24:39']] },
        { references: [['00:16.671 --> 00:28.805'], ['LUK 24:40']] },
        { references: [['00:28.805 --> 00:30.943'], ['LUK 24:41']] },
        { references: [['00:30.943 --> 00:35.558'], ['LUK 24:42-53']] }
      ];
    },
    {
      documents: [
        {
          scheme: 'vtt-timecode';
          docid: '42LUK/024/ENGSEB2-LUK-Audio Note- hearts burningv1.mp3';
        },
        { scheme: 'u23003' }
      ];
      records: [{ references: [['00:16.671 --> 00:28.805'], ['LUK 24:53!f']] }];
    }
  ];
}
