export interface AudioAlignment {
  format: 'alignment'
  version: '0.3'
  type: 'audio-reference'
  roles: ['timecode', 'text-reference']
  documents: [
    {scheme: 'vtt-timecode'; docid: 'ephesians_example_with_footnotes.mp3'},
    {scheme: 'u23003'},
  ]
  records: [
    {references: [['00:00.000 --> 00:01.927'], ['en+ulb.EPH:0']]},
    {references: [['00:01.927 --> 00:03.756'], ['en+ulb.EPH 1:0']]},
    {references: [['00:03.756 --> 04:23.239'], ['en+ulb.EPH 1']]},
    {references: [['00:03.756 --> 00:05.604'], ['en+ulb.EPH 1:1!s1']]},
    {references: [['00:05.604 --> 00:08.289'], ['en+ulb.EPH 1:1:0']]},
    {references: [['00:08.289 --> 00:16.671'], ['en+ulb.EPH 1:1']]},
    {references: [['00:16.671 --> 00:28.805'], ['en+ulb.EPH 1:1!f']]},
    {references: [['00:28.805 --> 00:30.943'], ['en+ulb.EPH 1:2:0']]},
    {references: [['00:30.943 --> 00:35.558'], ['en+ulb.EPH 1:2']]},
  ]
}
