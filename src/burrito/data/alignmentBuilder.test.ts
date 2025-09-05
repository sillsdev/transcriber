import { AlignmentBuilder, createAudioAlignment } from './alignmentBuilder';
import type { Align, AlignmentRecord } from './alignmentBuilder';

describe('AlignmentBuilder', () => {
  it('should create a basic alignment with default values', () => {
    const alignment = new AlignmentBuilder().build();

    expect(alignment.format).toBe('alignment');
    expect(alignment.version).toBe('0.4');
    expect(alignment.type).toBe('audio-reference');
    expect(alignment.roles).toEqual(['timecode', 'text-reference']);
  });

  it('should add a document', () => {
    const alignment = new AlignmentBuilder()
      .withDocument('vtt-timecode', 'test.mp3')
      .build();

    expect(alignment.documents?.[0]?.scheme).toBe('vtt-timecode');
    expect(alignment.documents?.[0]?.docid).toBe('test.mp3');
  });

  it('should add a document without docid', () => {
    const alignment = new AlignmentBuilder().withDocument('u23003').build();

    expect(alignment.documents?.[0]?.scheme).toBe('u23003');
    expect(alignment.documents?.[0]?.docid).toBeUndefined();
  });

  it('should add multiple documents', () => {
    const alignment = new AlignmentBuilder()
      .withDocument('vtt-timecode', 'test.mp3')
      .withDocument('u23003')
      .build();

    expect(alignment.documents).toHaveLength(2);
    expect(alignment.documents?.[0]?.scheme).toBe('vtt-timecode');
    expect(alignment.documents?.[1]?.scheme).toBe('u23003');
  });

  it('should add a record', () => {
    const alignment = new AlignmentBuilder()
      .withRecord([['00:00.000 --> 00:01.000'], ['en+ulb.GEN 1:1']])
      .build();

    expect(alignment.records?.[0]?.references[0][0]).toBe(
      '00:00.000 --> 00:01.000'
    );
    expect(alignment.records?.[0]?.references[1][0]).toBe('en+ulb.GEN 1:1');
  });

  it('should add multiple records', () => {
    const alignment = new AlignmentBuilder()
      .withRecord([['00:00.000 --> 00:01.000'], ['en+ulb.GEN 1:1']])
      .withRecord([['00:01.000 --> 00:02.000'], ['en+ulb.GEN 1:2']])
      .build();

    expect(alignment.records).toHaveLength(2);
    expect(alignment.records?.[0]?.references[0][0]).toBe(
      '00:00.000 --> 00:01.000'
    );
    expect(alignment.records?.[1]?.references[0][0]).toBe(
      '00:01.000 --> 00:02.000'
    );
  });

  it('should add records in bulk', () => {
    const records: AlignmentRecord[] = [
      {
        references: [['00:00.000 --> 00:01.000'], ['en+ulb.GEN 1:1']],
      },
      {
        references: [['00:01.000 --> 00:02.000'], ['en+ulb.GEN 1:2']],
      },
    ];

    const alignment = new AlignmentBuilder().withRecords(records).build();

    expect(alignment.records).toHaveLength(2);
    expect(alignment.records?.[0]?.references[0][0]).toBe(
      '00:00.000 --> 00:01.000'
    );
    expect(alignment.records?.[1]?.references[0][0]).toBe(
      '00:01.000 --> 00:02.000'
    );
  });

  it('should create a complete audio alignment', () => {
    const alignment = createAudioAlignment();

    expect(alignment.format).toBe('alignment');
    expect(alignment.version).toBe('0.4');
    expect(alignment.type).toBe('audio-reference');
    expect(alignment.roles).toEqual(['timecode', 'text-reference']);
    expect(alignment.documents).toHaveLength(2);
    expect(alignment.documents?.[0]?.scheme).toBe('vtt-timecode');
    expect(alignment.documents?.[0]?.docid).toBe(
      'ephesians_example_with_footnotes.mp3'
    );
    expect(alignment.documents?.[1]?.scheme).toBe('u23003');
    expect(alignment.records).toHaveLength(9);
    expect(alignment.records?.[0]?.references[0][0]).toBe(
      '00:00.000 --> 00:01.927'
    );
    expect(alignment.records?.[0]?.references[1][0]).toBe('en+ulb.EPH:0');
    expect(alignment.records?.[8]?.references[0][0]).toBe(
      '00:30.943 --> 00:35.558'
    );
    expect(alignment.records?.[8]?.references[1][0]).toBe('en+ulb.EPH 1:2');
  });

  it('should set custom roles with withRoles', () => {
    const alignment = new AlignmentBuilder().withRoles('foo', 'bar').build();
    expect(alignment.roles).toEqual(['foo', 'bar']);
  });

  it('should add meta information with withAlignmentMeta', () => {
    const alignment = new AlignmentBuilder()
      .withAlignmentMeta({ creator: 'APM 4.2.0' })
      .build();
    expect(alignment.meta).toEqual({ creator: 'APM 4.2.0' });
  });

  it('should create a group-based alignment like audioAlignment2', () => {
    const group1Docs = [
      { scheme: 'vtt-timecode', docid: '42LUK/024/ENGSEB2-LUK-24_13-35v1.mp3' },
      { scheme: 'u23003' },
    ];
    const group1Records = [
      {
        references: [['00:03.756 --> 00:05.604'], ['LUK 24:13-15']] as Align,
      },
      {
        references: [['00:05.604 --> 00:08.289'], ['LUK 24:16-22']] as Align,
      },
      {
        references: [['00:08.289 --> 00:16.671'], ['LUK 24:23-25']] as Align,
      },
      {
        references: [['00:16.671 --> 00:28.805'], ['LUK 24:26-28']] as Align,
      },
      {
        references: [['00:28.805 --> 00:30.943'], ['LUK 24:29-31']] as Align,
      },
      {
        references: [['00:30.943 --> 00:35.558'], ['LUK 24:32-35']] as Align,
      },
    ];
    const group2Docs = [
      { scheme: 'vtt-timecode', docid: '42LUK/024/ENGSEB2-LUK-24_36-53v1.mp3' },
      { scheme: 'u23003' },
    ];
    const group2Records = [
      {
        references: [['00:03.756 --> 00:05.604'], ['LUK 24:36-37']] as Align,
      },
      {
        references: [['00:05.604 --> 00:08.289'], ['LUK 24:38']] as Align,
      },
      {
        references: [['00:08.289 --> 00:16.671'], ['LUK 24:39']] as Align,
      },
      {
        references: [['00:16.671 --> 00:28.805'], ['LUK 24:40']] as Align,
      },
      {
        references: [['00:28.805 --> 00:30.943'], ['LUK 24:41']] as Align,
      },
      {
        references: [['00:30.943 --> 00:35.558'], ['LUK 24:42-53']] as Align,
      },
    ];
    const group3Docs = [
      {
        scheme: 'vtt-timecode',
        docid: '42LUK/024/ENGSEB2-LUK-Audio Note- hearts burningv1.mp3',
      },
      { scheme: 'u23003' },
    ];
    const group3Records = [
      {
        references: [['00:16.671 --> 00:28.805'], ['LUK 24:53!f']] as Align,
      },
    ];
    const alignment = new AlignmentBuilder()
      .withGroups([
        { documents: group1Docs, records: group1Records },
        { documents: group2Docs, records: group2Records },
        { documents: group3Docs, records: group3Records },
      ])
      .build();
    expect(alignment.groups).toHaveLength(3);
    expect(alignment.groups?.[0].documents[0].docid).toBe(
      '42LUK/024/ENGSEB2-LUK-24_13-35v1.mp3'
    );
    expect(alignment.groups?.[1].records[5].references[1][0]).toBe(
      'LUK 24:42-53'
    );
    expect(alignment.groups?.[2].documents[0].docid).toBe(
      '42LUK/024/ENGSEB2-LUK-Audio Note- hearts burningv1.mp3'
    );
    expect(alignment.groups?.[2].records[0].references[1][0]).toBe(
      'LUK 24:53!f'
    );
  });
});
