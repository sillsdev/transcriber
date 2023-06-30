import { cleanup, render } from '@testing-library/react';
import ConsultantCheckReview from './ConsultantCheckReview';
import { ArtifactTypeSlug } from '../../model/artifactTypeSlug';

jest.mock('../../crud', () => ({
  findRecord: jest.fn(),
  useArtifactType: () => ({
    localizedArtifactType: jest.fn(),
  }),
  related: jest.fn(),
}));
jest.mock('../../context/usePassageDetailContext', () => () => ({
  rowData: [],
}));
jest.mock('../MediaPlayer', () => () => <div>MediaPlayer</div>);
// jest.mock('@mui/material', () => ({}));
jest.mock('@mui/icons-material', () => ({}));

describe('ConsultantCheckReview', () => {
  beforeEach(cleanup);

  it('should render', () => {
    const { container } = render(
      <ConsultantCheckReview item={ArtifactTypeSlug.Vernacular} />
    );
    expect(container).not.toBe(null);
  });
});
