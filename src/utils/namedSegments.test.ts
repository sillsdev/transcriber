import { mergedSegments, NamedRegions } from './namedSegments'; // import the namedSegments module

var mockDefaultParams = {
  silenceThreshold: 0.004,
  timeThreshold: 0.02,
  segLenThreshold: 0.5,
};

describe('namedSegments', () => {
  it('should copy verse segment if no Transcription segmetns', () => {
    const result = mergedSegments({
      from: NamedRegions.Verse,
      into: NamedRegions.Transcription,
      params: mockDefaultParams,
      savedSegs: JSON.stringify([
        {
          name: 'Verse',
          regionInfo: JSON.stringify({
            regions: JSON.stringify([{ start: 0, end: 1, label: '\\v 1' }]),
          }),
        },
      ]),
    });
    expect(result).toEqual(
      JSON.stringify({
        regions: JSON.stringify([{ start: 0, end: 1, label: '\\v 1' }]),
      })
    );
  });

  it('should copy transcription segment if no Verse segmetns', () => {
    const result = mergedSegments({
      from: NamedRegions.Verse,
      into: NamedRegions.Transcription,
      params: mockDefaultParams,
      savedSegs: JSON.stringify([
        {
          name: 'Transcription',
          regionInfo: JSON.stringify({
            regions: JSON.stringify([{ start: 0, end: 1 }]),
          }),
        },
      ]),
    });
    expect(result).toEqual(
      JSON.stringify({
        regions: JSON.stringify([{ start: 0, end: 1 }]),
      })
    );
  });

  it('should merge 1 Verse and 1 Transcription segments with same start', () => {
    const result = mergedSegments({
      from: NamedRegions.Verse,
      into: NamedRegions.Transcription,
      params: mockDefaultParams,
      savedSegs: JSON.stringify([
        {
          name: 'Verse',
          regionInfo: JSON.stringify({
            regions: JSON.stringify([{ start: 0, end: 1, label: '\\v 1' }]),
          }),
        },
        {
          name: 'Transcription',
          regionInfo: JSON.stringify({
            regions: JSON.stringify([{ start: 0, end: 1 }]),
          }),
        },
      ]),
    });
    expect(result).toEqual(
      JSON.stringify({
        regions: JSON.stringify([{ start: 0, end: 1, label: '\\v 1' }]),
      })
    );
  });

  it('should merge 1 Verse into 3 Transcriptions segments with same start', () => {
    const result = mergedSegments({
      from: NamedRegions.Verse,
      into: NamedRegions.Transcription,
      params: mockDefaultParams,
      savedSegs: JSON.stringify([
        {
          name: 'Verse',
          regionInfo: JSON.stringify({
            regions: JSON.stringify([{ start: 1, end: 3, label: '\\v 1' }]),
          }),
        },
        {
          name: 'Transcription',
          regionInfo: JSON.stringify({
            regions: JSON.stringify([
              { start: 0, end: 1 },
              { start: 1, end: 2 },
              { start: 2, end: 3 },
            ]),
          }),
        },
      ]),
    });
    expect(result).toEqual(
      JSON.stringify({
        regions: JSON.stringify([
          { start: 0, end: 1 },
          { start: 1, end: 2, label: '\\v 1' },
          { start: 2, end: 3 },
        ]),
      })
    );
  });

  it('should merge 1 Verse with start in one of 3 Transcriptions segments', () => {
    const result = mergedSegments({
      from: NamedRegions.Verse,
      into: NamedRegions.Transcription,
      params: mockDefaultParams,
      savedSegs: JSON.stringify([
        {
          name: 'Verse',
          regionInfo: JSON.stringify({
            regions: JSON.stringify([{ start: 1.5, end: 3, label: '\\v 1' }]),
          }),
        },
        {
          name: 'Transcription',
          regionInfo: JSON.stringify({
            regions: JSON.stringify([
              { start: 0, end: 1 },
              { start: 1, end: 2 },
              { start: 2, end: 3 },
            ]),
          }),
        },
      ]),
    });
    expect(result).toEqual(
      JSON.stringify({
        regions: JSON.stringify([
          { start: 0, end: 1 },
          { start: 1, end: 1.5 },
          { start: 1.5, end: 2, label: '\\v 1' },
          { start: 2, end: 3 },
        ]),
      })
    );
  });

  it('should merge 1 Verse with start less than min in one of 3 Transcriptions segments', () => {
    const result = mergedSegments({
      from: NamedRegions.Verse,
      into: NamedRegions.Transcription,
      params: mockDefaultParams,
      savedSegs: JSON.stringify([
        {
          name: 'Verse',
          regionInfo: JSON.stringify({
            regions: JSON.stringify([{ start: 1.4, end: 3, label: '\\v 1' }]),
          }),
        },
        {
          name: 'Transcription',
          regionInfo: JSON.stringify({
            regions: JSON.stringify([
              { start: 0, end: 1 },
              { start: 1, end: 2 },
              { start: 2, end: 3 },
            ]),
          }),
        },
      ]),
    });
    expect(result).toEqual(
      JSON.stringify({
        regions: JSON.stringify([
          { start: 0, end: 1.4 },
          { start: 1.4, end: 2, label: '\\v 1' },
          { start: 2, end: 3 },
        ]),
      })
    );
  });

  it('should merge 1 Verse with start less than min to end in one of 3 Transcriptions segments', () => {
    const result = mergedSegments({
      from: NamedRegions.Verse,
      into: NamedRegions.Transcription,
      params: mockDefaultParams,
      savedSegs: JSON.stringify([
        {
          name: 'Verse',
          regionInfo: JSON.stringify({
            regions: JSON.stringify([{ start: 1.6, end: 3, label: '\\v 1' }]),
          }),
        },
        {
          name: 'Transcription',
          regionInfo: JSON.stringify({
            regions: JSON.stringify([
              { start: 0, end: 1 },
              { start: 1, end: 2 },
              { start: 2, end: 3 },
            ]),
          }),
        },
      ]),
    });
    expect(result).toEqual(
      JSON.stringify({
        regions: JSON.stringify([
          { start: 0, end: 1 },
          { start: 1, end: 1.6 },
          { start: 1.6, end: 3, label: '\\v 1' },
        ]),
      })
    );
  });
});
