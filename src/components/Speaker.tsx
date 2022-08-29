import React, { useState, useEffect, useMemo } from 'react';
import { debounce, TextField } from '@mui/material';
import { groupTabsSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { ICommunityStrings } from '../model';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../mods/react-orbitjs';
import IntellectualProperty from '../model/intellectualProperty';
import { Box } from '@mui/system';
import { PriButton } from '../control';
import BigDialog from '../hoc/BigDialog';
import ProvideRights from './ProvideRights';
import { ArtifactTypeSlug } from '../crud';

interface IRecordProps {
  intellectualProperties: IntellectualProperty[];
}
interface IProps {
  inSpeaker: string;
  onChange: (speaker: string) => void;
  onRights: (hasRights: boolean) => void;
}

export const Speaker = ({
  inSpeaker,
  onChange,
  onRights,
  intellectualProperties,
}: IProps & IRecordProps) => {
  const [speaker, setSpeaker] = useState(inSpeaker);
  const [hasRights, setHasRight] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const t: ICommunityStrings = useSelector(groupTabsSelector, shallowEqual);

  const handleChangeSpeaker = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();
    setSpeaker(e.target.value);
  };

  const handleRights = () => {
    setShowDialog(true);
  };

  const handleCloseRights = () => {
    setShowDialog(false);
  };

  const updateSpeaker = useMemo(
    () =>
      debounce(() => {
        onChange && onChange(speaker);
        const rightsRec = intellectualProperties.find(
          (p) => p.attributes.rightsHolder === speaker
        );
        const speakerRights = Boolean(rightsRec);
        if (speakerRights !== hasRights) {
          setHasRight(speakerRights);
          onRights(speakerRights);
        }
      }, 500),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [speaker]
  );
  useEffect(() => updateSpeaker.clear(), [updateSpeaker]);

  useEffect(() => {
    if (speaker !== inSpeaker) setSpeaker(inSpeaker);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inSpeaker]);

  return (
    <Box sx={{ display: 'flex' }}>
      <TextField
        sx={{ m: 1, p: 2 }}
        id="speaker"
        label={t.speaker}
        value={speaker}
        onChange={handleChangeSpeaker}
        fullWidth={true}
      />
      {!hasRights && (
        <PriButton id="rights" onClick={handleRights}>
          {t.rights}
        </PriButton>
      )}
      <BigDialog
        title={t.provideRights}
        isOpen={showDialog}
        onOpen={handleCloseRights}
      >
        <ProvideRights
          speaker={speaker}
          recordType={ArtifactTypeSlug.IntellectualProperty}
        />
      </BigDialog>
    </Box>
  );
};

const mapRecordsToProps = {
  intellectualproperties: (q: QueryBuilder) =>
    q.findRecords('intellectualproperty'),
};
export default withData(mapRecordsToProps)(Speaker) as any as (
  props: IProps
) => JSX.Element;
