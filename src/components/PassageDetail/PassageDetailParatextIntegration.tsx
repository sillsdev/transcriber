import {
  ArtifactTypeSlug,
  remoteIdGuid,
  useArtifactType,
  usePlanType,
  useStepTool,
} from '../../crud';
import Integration from '../Integration';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import { useMemo } from 'react';
import { RecordKeyMap } from '@orbit/records';
import { useGlobal } from 'reactn';
import { passageTypeFromRef } from '../../control/RefRender';
import { PassageTypeEnum } from '../../model/passageType';
import { Paper, SxProps, Typography } from '@mui/material';
import { shallowEqual, useSelector } from 'react-redux';
import { sharedSelector } from '../../selector';
import { ISharedStrings } from '../../model';

const paperProps = { p: 2, m: 'auto', width: `calc(100% - 32px)` } as SxProps;

export default function PassageDetailParatextIntegration() {
  const { passage, currentstep, sectionArr, gotoNextStep, setStepComplete } =
    usePassageDetailContext();
  const [memory] = useGlobal('memory');
  const [plan] = useGlobal('plan');
  const { slugFromId } = useArtifactType();
  const planType = usePlanType();
  const { settings } = useStepTool(currentstep);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  const isFlat = useMemo(() => {
    return planType(plan)?.flat;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  const passType = useMemo(
    () => passageTypeFromRef(passage?.attributes?.reference, isFlat),
    [passage, isFlat]
  );

  const artifactId = useMemo(() => {
    if (settings) {
      var id = JSON.parse(settings).artifactTypeId;
      if (id)
        return (
          remoteIdGuid('artifacttype', id, memory.keyMap as RecordKeyMap) ?? id
        );
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const artifactSlug = useMemo(() => {
    return artifactId ? slugFromId(artifactId) : ArtifactTypeSlug.Vernacular;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artifactId]);

  const handleSyncComplete = async (step: string, complete: boolean) => {
    await setStepComplete(step, complete);
    if (complete) gotoNextStep();
  };

  return passType === PassageTypeEnum.PASSAGE ? (
    <Integration
      artifactType={artifactSlug as ArtifactTypeSlug}
      passage={passage}
      setStepComplete={handleSyncComplete}
      currentstep={currentstep}
      sectionArr={sectionArr}
      gotoNextStep={gotoNextStep}
    />
  ) : (
    <Paper sx={paperProps}>
      <Typography variant="h2" align="center">
        {ts.notSupported}
      </Typography>
    </Paper>
  );
}
