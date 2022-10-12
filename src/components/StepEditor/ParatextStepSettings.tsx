import { useEffect, useState } from 'react';
import { ArtifactTypeSlug } from '../../crud';
import SelectArtifactType from '../Workflow/SelectArtifactType';

interface IProps {
  toolSettings: string;
  onChange: (toolSettings: string) => void;
}

export const ParatextStepSettings = ({ toolSettings, onChange }: IProps) => {
  // const classes = useStyles();
  const artifacts = [
    ArtifactTypeSlug.Vernacular,
    ArtifactTypeSlug.WholeBackTranslation,
    ArtifactTypeSlug.PhraseBackTranslation,
  ];
  const [initialValue, setInitialValue] = useState<string | null>(null);
  useEffect(() => {
    if (toolSettings) {
      var json = JSON.parse(toolSettings);
      setInitialValue(json.artifactTypeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolSettings]);
  const handleSelect = (artifactTypeId: string | null) => {
    onChange(JSON.stringify({ artifactTypeId: artifactTypeId }));
  };

  return (
    <SelectArtifactType
      onTypeChange={handleSelect}
      limit={artifacts}
      initialValue={initialValue}
    />
  );
};
