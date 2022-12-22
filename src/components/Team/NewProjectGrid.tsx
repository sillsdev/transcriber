import React from 'react';
import {
  Grid,
  Button,
  Typography,
  Tooltip,
  styled,
  Box,
  BoxProps,
  SxProps,
} from '@mui/material';
import BigDialog from '../../hoc/BigDialog';
import { TeamContext } from '../../context/TeamContext';
import { AltButton, ParatextLogo } from '../../control';
import { ChoiceHead } from '../../control/ChoiceHead';

const NewProjectRoot = styled(Box)<BoxProps>(() => ({
  flexGrow: 1,
  '& .MuiListSubheader-root': {
    lineHeight: 'unset',
  },
  '& .MuiListItemIcon-root': {
    minWidth: '30px',
  },
}));

const actionProps = {
  p: 2,
  textAlign: 'center',
  alignSelf: 'center',
} as SxProps;

const spacer = '\u00A0';

const ParatextDecoration = () => {
  const ctx = React.useContext(TeamContext);
  const { newProjectStrings } = ctx.state;
  const t = newProjectStrings;

  return (
    <>
      {spacer}
      <Tooltip title={t.paratextIntegration}>
        <span>
          <ParatextLogo />
        </span>
      </Tooltip>
    </>
  );
};

enum Integration {
  none,
  pt,
}

interface IActionButtonProps {
  kind: Integration;
  onUpload: (e: React.MouseEvent) => void;
  onRecord: (e: React.MouseEvent) => void;
}

const ActionButtons = ({ kind, onUpload, onRecord }: IActionButtonProps) => {
  const ctx = React.useContext(TeamContext);
  const { newProjectStrings } = ctx.state;
  const t = newProjectStrings;

  const actId = (kind: Integration, act: string) =>
    `addProj${act}-${kind === Integration.pt ? 'aud' : 'oth'}-0`;

  return (
    <>
      <AltButton id={actId(kind, 'Up')} onClick={onUpload}>
        {t.uploadAudio}
      </AltButton>
      <AltButton id={actId(kind, 'Rec')} onClick={onRecord}>
        {t.startRecording}
      </AltButton>
    </>
  );
};

interface IConfigureActionProps {
  onClick: (e: React.MouseEvent) => void;
}

const ConfigureAction = ({ onClick }: IConfigureActionProps) => {
  const ctx = React.useContext(TeamContext);
  const { newProjectStrings } = ctx.state;
  const t = newProjectStrings;

  return (
    <Button id="config" onClick={onClick} variant="outlined" color="primary">
      {t.configure}
    </Button>
  );
};

interface IProps {
  open: boolean;
  onOpen: (open: boolean) => void;
  doUpload: (e: React.MouseEvent) => void;
  doRecord: (e: React.MouseEvent) => void;
  doNewProj: (e: React.MouseEvent) => void;
  setType: (type: string) => void;
}

export function NewProjectGrid(props: IProps) {
  const { open, onOpen } = props;
  const { doUpload, doRecord, doNewProj, setType } = props;
  const ctx = React.useContext(TeamContext);
  const { newProjectStrings } = ctx.state;
  const t = newProjectStrings;

  const doSetType = (kind: Integration) => {
    setType(kind === Integration.pt ? 'scripture' : 'other');
  };

  const handleUpload = (kind: Integration) => (e: React.MouseEvent) => {
    doSetType(kind);
    doUpload(e);
    onOpen(false);
  };

  const handleRecord = (kind: Integration) => (e: React.MouseEvent) => {
    doSetType(kind);
    doRecord(e);
    onOpen(false);
  };

  const handleNewProj = (e: React.MouseEvent) => {
    doNewProj(e);
    onOpen(false);
  };

  const handleCancel = () => {
    onOpen(false);
  };

  const scriptureFactors = [t.scriptureFactor1, t.scriptureFactor2];
  const generalFactors = [t.generalFactor1, t.generalFactor2];
  const blankFactors = [t.blankFactor1, t.blankFactor2];

  return (
    <BigDialog
      title={t.newProject}
      isOpen={open}
      onOpen={handleCancel}
      description={
        <Typography sx={{ fontSize: 'small' }}>{t.likeTemplate}</Typography>
      }
    >
      <NewProjectRoot>
        <Grid container spacing={3}>
          <Grid item xs={8}>
            <ChoiceHead
              title={t.scripture}
              decorate={<ParatextDecoration />}
              keyFactorTitle={t.keyFactors}
              prose={t.scriptureTip}
              factors={scriptureFactors}
            />
          </Grid>
          <Grid item xs={4} sx={actionProps}>
            <ActionButtons
              kind={Integration.pt}
              onUpload={handleUpload(Integration.pt)}
              onRecord={handleRecord(Integration.pt)}
            />
          </Grid>
          <Grid item xs={8}>
            <ChoiceHead
              title={t.general}
              keyFactorTitle={t.keyFactors}
              prose={t.generalTip}
              factors={generalFactors}
            />
          </Grid>
          <Grid item xs={4} sx={actionProps}>
            <ActionButtons
              kind={Integration.none}
              onUpload={handleUpload(Integration.none)}
              onRecord={handleRecord(Integration.none)}
            />
          </Grid>
          <Grid item xs={8}>
            <ChoiceHead
              title={t.blank}
              keyFactorTitle={t.keyFactors}
              prose={t.blankTip}
              factors={blankFactors}
            />
          </Grid>
          <Grid item xs={4} sx={actionProps}>
            <ConfigureAction onClick={handleNewProj} />
          </Grid>
        </Grid>
      </NewProjectRoot>
    </BigDialog>
  );
}

export default NewProjectGrid;
