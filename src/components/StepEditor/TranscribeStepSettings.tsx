import { useEffect, useMemo, useState } from 'react';
import { ArtifactTypeSlug, remoteIdGuid, useArtifactType } from '../../crud';
import SelectArtifactType from '../Sheet/SelectArtifactType';
import { ILanguage, Language } from '../../control';
import { useGlobal } from 'reactn';
import { RecordKeyMap } from '@orbit/records';
import { JSONParse } from '../../utils';

interface LangState {
  artId: string;
  bcp47: string;
  languageName: string;
  font: string;
  rtl: boolean;
  spellCheck: boolean;
  changed: boolean;
}

const initLang = {
  artId: '',
  bcp47: 'und',
  languageName: '',
  font: '',
  rtl: false,
  spellCheck: false,
  changed: false,
};

interface IProps {
  toolSettings: string;
  onChange: (toolSettings: string) => void;
}

export const TranscribeStepSettings = ({ toolSettings, onChange }: IProps) => {
  // const classes = useStyles();
  const artifacts = [
    ArtifactTypeSlug.Vernacular,
    ArtifactTypeSlug.WholeBackTranslation,
    ArtifactTypeSlug.PhraseBackTranslation,
    ArtifactTypeSlug.QandA,
    ArtifactTypeSlug.Retell,
  ];
  const [initialValue, setInitialValue] = useState<string | null>(null);
  const [lgState, setLgState] = useState<LangState>({ ...initLang });
  const { slugFromId } = useArtifactType();
  const [memory] = useGlobal('memory');

  const handleSelect = (artifactTypeId: string | null) => {
    const json = JSONParse(toolSettings);
    onChange(JSON.stringify({ ...json, artifactTypeId: artifactTypeId }));
  };

  const handleLanguageChange = (val: ILanguage) => {
    if (lgState.bcp47 !== val.bcp47 || lgState.font !== val.font) {
      setLgState((state) => ({ ...state, ...val, changed: true }));
      const json = JSONParse(toolSettings);
      onChange(
        JSON.stringify({
          ...json,
          language: `${val.languageName}|${val.bcp47}`,
          font: val.font,
          rtl: val.rtl,
        })
      );
    }
  };

  const langSlugs = [
    ArtifactTypeSlug.WholeBackTranslation,
    ArtifactTypeSlug.PhraseBackTranslation,
  ];

  const hasLang = useMemo(() => {
    const id =
      (lgState.artId &&
        remoteIdGuid(
          'artifacttype',
          lgState.artId,
          memory.keyMap as RecordKeyMap
        )) ??
      lgState.artId;
    return id && langSlugs.includes(slugFromId(id) as ArtifactTypeSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lgState]);

  useEffect(() => {
    if (toolSettings) {
      var json = JSON.parse(toolSettings);
      setInitialValue(json.artifactTypeId);
      const [languageName, bcp47] = json?.language?.split('|') ?? ['', 'und'];
      setLgState((state) => ({
        ...state,
        artId: json.artifactTypeId,
        languageName,
        bcp47,
        font: json.font,
        rtl: json.rtl,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolSettings]);

  return (
    <>
      <SelectArtifactType
        onTypeChange={handleSelect}
        limit={artifacts}
        initialValue={initialValue}
      />
      {hasLang && (
        <Language
          {...lgState}
          onChange={handleLanguageChange}
          hideSpelling
          hideFont
          disabled={false}
          sx={{ ml: 1 }}
        />
      )}
    </>
  );
};
