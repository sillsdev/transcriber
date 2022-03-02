import { ArtifactTypeSlug } from '../crud';

export const integrationSlug = (
  exportType: string | undefined,
  offline: boolean
) => {
  return exportType === ArtifactTypeSlug.BackTranslation && offline
    ? 'paratextlocalbacktranslation'
    : exportType === ArtifactTypeSlug.BackTranslation
    ? 'paratextbacktranslation'
    : offline
    ? 'paratextLocal'
    : 'paratext';
};
