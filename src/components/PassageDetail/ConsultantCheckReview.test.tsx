import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import ConsultantCheckReview from './ConsultantCheckReview';
import { ArtifactTypeSlug } from '../../crud/artifactTypeSlug';
import { IRow } from '../../context/PassageDetailContext';

let mockRowData: IRow[] = [];

jest.mock('../../crud', () => ({
  ArtifactTypeSlug: jest.requireActual('../../crud/artifactTypeSlug')
    .ArtifactTypeSlug,
  findRecord: jest.fn(),
  useArtifactType: () => ({
    localizedArtifactType: jest.fn((slug: ArtifactTypeSlug) => {
      if (slug === 'vernacular') {
        return 'Vernacular';
      } else if (slug === 'backtranslation') {
        return 'Phrase Back Translation';
      }
    }),
  }),
  related: jest.requireActual('../../crud/related').related,
}));
jest.mock('../../context/usePassageDetailContext', () => () => ({
  rowData: mockRowData,
}));
jest.mock('../MediaPlayer', () => () => <div>MediaPlayer</div>);
// jest.mock('@mui/material', () => ({}));
jest.mock('@mui/icons-material', () => ({}));
jest.mock('../../selector', () => ({
  consultantSelector: jest.fn(),
}));
jest.mock('react-redux', () => ({
  useSelector: () => ({
    noMedia: 'No Media',
    noTranscription: 'No Transcription',
  }),
  shallowEqual: jest.fn(),
}));

describe('ConsultantCheckReview', () => {
  beforeEach(cleanup);
  afterEach(() => {
    mockRowData = [];
  });

  it('should render', () => {
    const { container } = render(
      <ConsultantCheckReview item={ArtifactTypeSlug.Vernacular} />
    );
    expect(container).not.toBe(null);
    expect(screen.getByText('MediaPlayer')).not.toBe(null);
    expect(screen.queryAllByTestId('transcription')).toHaveLength(0);
  });

  it('should render with a different item', () => {
    const { container } = render(
      <ConsultantCheckReview item={ArtifactTypeSlug.PhraseBackTranslation} />
    );
    expect(container).not.toBe(null);
  });

  it('should render a MediaPlayer even with no audio files', () => {
    render(<ConsultantCheckReview item={ArtifactTypeSlug.Vernacular} />);
    expect(screen.getByText('MediaPlayer')).not.toBe(null);
  });

  it('should not render a transcription if there is no media file', () => {
    render(<ConsultantCheckReview item={ArtifactTypeSlug.Vernacular} />);
    expect(screen.queryAllByTestId('transcription')).toHaveLength(0);
  });

  it('should render a Media player and no missing media message if there is vernacular media', () => {
    mockRowData = [
      {
        id: '1',
        artifactType: 'Vernacular',
        mediafile: {
          id: '1',
          attributes: {
            transcription: 'vernacular transcription',
          } as any,
          type: 'mediafile',
        },
      } as any,
    ];
    render(<ConsultantCheckReview item={ArtifactTypeSlug.Vernacular} />);
    expect(screen.getByText('MediaPlayer')).not.toBe(null);
    expect(screen.queryAllByTestId('no-media')).toHaveLength(0);
  });

  it('should render a transcription if there is vernacular media transcription', () => {
    mockRowData = [
      {
        id: '1',
        artifactType: 'Vernacular',
        mediafile: {
          id: '1',
          attributes: {
            transcription: 'vernacular transcription',
          } as any,
          type: 'mediafile',
        },
      } as any,
    ];
    render(<ConsultantCheckReview item={ArtifactTypeSlug.Vernacular} />);
    expect(screen.getByText('vernacular transcription')).not.toBe(null);
  });

  it('should not render a transcription if there is no vernacular media transcription', () => {
    mockRowData = [
      {
        id: '1',
        artifactType: 'Vernacular',
        mediafile: {
          id: '1',
          attributes: {} as any,
          type: 'mediafile',
        },
      } as any,
    ];
    const { container } = render(
      <ConsultantCheckReview item={ArtifactTypeSlug.Vernacular} />
    );
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
    const textAreas = container.querySelectorAll('textarea');
    expect(textAreas[0].value).toBe('');
  });

  it('should not render a no media message if there is phrase back translation media', () => {
    mockRowData = [
      {
        id: '1',
        artifactType: 'Vernacular',
        mediafile: {
          id: '1',
          attributes: {
            transcription: 'transcription',
          } as any,
          type: 'mediafile',
        },
      } as any,
      {
        type: 'mediafile',
        id: '2',
        artifactType: 'Phrase Back Translation',
        mediafile: {
          id: '2',
          attributes: {
            transcription: 'transcription PBT',
          } as any,
          relationships: {
            sourceMedia: {
              data: {
                id: '1',
                type: 'mediafile',
              },
            },
          },
        },
      } as any,
    ];
    render(
      <ConsultantCheckReview item={ArtifactTypeSlug.PhraseBackTranslation} />
    );
    expect(screen.getByText('MediaPlayer')).not.toBe(null);
    expect(screen.queryAllByTestId('no-media')).toHaveLength(0);
  });

  it('should render a no media message for PBT if there is no PBT media', () => {
    mockRowData = [
      {
        id: '1',
        artifactType: 'Vernacular',
        mediafile: {
          id: '1',
          attributes: {
            transcription: 'transcription',
          } as any,
          type: 'mediafile',
        },
      } as any,
    ];
    render(
      <ConsultantCheckReview item={ArtifactTypeSlug.PhraseBackTranslation} />
    );
    // expect(screen.getByText('MediaPlayer')).toBe(null); // mediaplayer is rendered but zero width
    expect(screen.getByTestId('no-media')).not.toBe(null);
  });

  it('should render a no media message if the PBT media is not for the current vernacular', () => {
    mockRowData = [
      {
        id: '1',
        artifactType: 'Vernacular',
        mediafile: {
          id: '1',
          attributes: {
            transcription: 'transcription',
          } as any,
          type: 'mediafile',
        },
      } as any,
      {
        type: 'mediafile',
        id: '2',
        artifactType: 'Phrase Back Translation',
        mediafile: {
          id: '2',
          attributes: {
            transcription: 'transcription PBT',
          } as any,
          relationships: {
            sourceMedia: {
              data: {
                id: '3',
                type: 'mediafile',
              },
            },
          },
        },
      } as any,
    ];
    render(
      <ConsultantCheckReview item={ArtifactTypeSlug.PhraseBackTranslation} />
    );
    expect(screen.queryAllByTestId('no-media')).toHaveLength(1);
  });

  it('should render a slider if there are two phrase back translation media', () => {
    mockRowData = [
      {
        id: '1',
        artifactType: 'Vernacular',
        mediafile: {
          id: '1',
          attributes: {
            transcription: 'transcription',
          } as any,
          type: 'mediafile',
        },
      } as any,
      {
        type: 'mediafile',
        id: '2',
        artifactType: 'Phrase Back Translation',
        mediafile: {
          id: '2',
          attributes: {
            transcription: 'transcription PBT (1)',
          } as any,
          relationships: {
            sourceMedia: {
              data: {
                id: '1',
                type: 'mediafile',
              },
            },
          },
        },
      } as any,
      {
        type: 'mediafile',
        id: '3',
        artifactType: 'Phrase Back Translation',
        mediafile: {
          id: '3',
          attributes: {
            transcription: 'transcription PBT (2)',
          } as any,
          relationships: {
            sourceMedia: {
              data: {
                id: '1',
                type: 'mediafile',
              },
            },
          },
        },
      } as any,
    ];
    render(
      <ConsultantCheckReview item={ArtifactTypeSlug.PhraseBackTranslation} />
    );
    expect(screen.getByTestId('check-review-slider')).not.toBe(null);
  });

  it('should have the first Phrase Back Translation Transcription when there are multiple', () => {
    mockRowData = [
      {
        id: '1',
        artifactType: 'Vernacular',
        mediafile: {
          id: '1',
          attributes: {
            transcription: 'transcription',
          } as any,
          type: 'mediafile',
        },
      } as any,
      {
        type: 'mediafile',
        id: '2',
        artifactType: 'Phrase Back Translation',
        mediafile: {
          id: '2',
          attributes: {
            transcription: 'transcription PBT (1)',
          } as any,
          relationships: {
            sourceMedia: {
              data: {
                id: '1',
                type: 'mediafile',
              },
            },
          },
        },
      } as any,
      {
        type: 'mediafile',
        id: '3',
        artifactType: 'Phrase Back Translation',
        mediafile: {
          id: '3',
          attributes: {
            transcription: 'transcription PBT (2)',
          } as any,
          relationships: {
            sourceMedia: {
              data: {
                id: '1',
                type: 'mediafile',
              },
            },
          },
        },
      } as any,
    ];
    render(
      <ConsultantCheckReview item={ArtifactTypeSlug.PhraseBackTranslation} />
    );
    expect(screen.getByText('transcription PBT (1)')).not.toBe(null);
  });

  it('should have the second Phrase BT Transcription when the next button is clicked', () => {
    mockRowData = [
      {
        id: '1',
        artifactType: 'Vernacular',
        mediafile: {
          id: '1',
          attributes: {
            transcription: 'transcription',
          } as any,
          type: 'mediafile',
        },
      } as any,
      {
        type: 'mediafile',
        id: '2',
        artifactType: 'Phrase Back Translation',
        mediafile: {
          id: '2',
          attributes: {
            transcription: 'transcription PBT (1)',
          } as any,
          relationships: {
            sourceMedia: {
              data: {
                id: '1',
                type: 'mediafile',
              },
            },
          },
        },
      } as any,
      {
        type: 'mediafile',
        id: '3',
        artifactType: 'Phrase Back Translation',
        mediafile: {
          id: '3',
          attributes: {
            transcription: 'transcription PBT (2)',
          } as any,
          relationships: {
            sourceMedia: {
              data: {
                id: '1',
                type: 'mediafile',
              },
            },
          },
        },
      } as any,
    ];
    render(
      <ConsultantCheckReview item={ArtifactTypeSlug.PhraseBackTranslation} />
    );
    fireEvent.click(screen.getByText('skip_next'));
    expect(screen.getByText('transcription PBT (2)')).not.toBe(null);
    expect(screen.queryAllByText('transcription PBT (1)')).toHaveLength(0);
  });
});
