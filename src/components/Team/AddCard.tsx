import React, { useEffect } from 'react';
import { useGlobal } from 'reactn';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Card, CardContent, Button } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import { VProject, DialogMode } from '../../model';
import { ProjectDialog, IProjectDialog, ProjectType } from './ProjectDialog';
import { Language, ILanguage } from '../../control';
import Uploader, { statusInit } from '../Uploader';
import Progress from '../../control/UploadProgress';
import { TeamContext, TeamIdType } from '../../context/TeamContext';
import { isElectron } from '../../api-variable';
import { waitForRemoteId, remoteId, useOrganizedBy } from '../../crud';
import { StickyRedirect } from '../../control';
import { useSnackBar } from '../../hoc/SnackBar';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      minWidth: 275,
      minHeight: 176,
      margin: theme.spacing(1),
      display: 'flex',
      backgroundColor: theme.palette.primary.light,
    },
    content: {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      justifyContent: 'center',
      color: theme.palette.primary.contrastText,
    },
    buttons: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-around',
      flexGrow: 1,
    },
    icon: {
      display: 'flex',
      justifyContent: 'center',
    },
  })
);

const initLang = {
  bcp47: 'und',
  languageName: '',
  font: '',
};

interface IProps {
  team: TeamIdType;
}

export const AddCard = (props: IProps) => {
  const { team } = props;
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const ctx = React.useContext(TeamContext);
  const {
    projectCreate,
    cardStrings,
    auth,
    flatAdd,
    sharedStrings,
  } = ctx.state;
  const t = cardStrings;
  const { showMessage, showJSXMessage } = useSnackBar();
  const [show, setShow] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [inProgress, setInProgress] = React.useState(false);
  const [uploadVisible, setUploadVisible] = React.useState(false);
  const [type, setType] = React.useState('');
  const [language, setLanguage] = React.useState<ILanguage>(initLang);
  const [complete, setComplete] = React.useState(0);
  const [steps] = React.useState([
    t.projectCreated,
    t.mediaUploaded,
    t.passagesCreated,
  ]);
  const { getOrganizedBy } = useOrganizedBy();
  const [step, setStep] = React.useState(0);
  const [status] = React.useState({ ...statusInit });
  const [, setPlan] = useGlobal('plan');
  const [view, setView] = React.useState('');

  const handleShow = () => {
    if (!open) setShow(!show);
  };

  const handleOpen = (val: boolean) => {
    setOpen(val);
  };

  const teamName = (teamId: TeamIdType) => {
    return team ? team.attributes?.name : t.personalProjects;
  };

  const handleUpload = (team: TeamIdType) => (e: any) => {
    setUploadVisible(true);
    setInProgress(true);
  };

  const handleLanguageChange = (lang: ILanguage) => {
    setLanguage(lang);
  };

  const handleReady = () => type !== '' && language.bcp47 !== 'und';

  const handleImport = (team: TeamIdType) => (e: any) => {
    console.log(`clicked ${t.import} for ${teamName(team)}`);
  };

  const handleClickOpen = (e: React.MouseEvent) => {
    setOpen(true);
    e.stopPropagation();
  };

  const handleCommit = (values: IProjectDialog) => {
    const {
      name,
      description,
      type,
      languageName,
      rtl,
      tags,
      organizedBy,
    } = values;
    projectCreate(
      {
        attributes: {
          name,
          description,
          type,
          language: values.bcp47,
          languageName,
          defaultFont: values.font,
          defaultFontSize: values.fontSize,
          rtl,
          tags,
          flat: values.flat,
          organizedBy,
        },
      } as VProject,
      team
    );
  };

  const createProject = async (files: FileList) => {
    setStep(0);
    const fileList = (files as any) as File[];
    const name = fileList[0]?.name.split('.')[0];
    const planId = await projectCreate(
      {
        attributes: {
          name,
          description: '',
          type,
          language: language.bcp47,
          languageName: language.languageName,
          defaultFont: language.font,
          defaultFontSize: 'large',
          rtl: false,
          tags: {},
          flat: true,
          organizedBy: getOrganizedBy(false),
        },
      } as any,
      team
    );
    setPlan(planId);
    await waitForRemoteId({ type: 'plan', id: planId }, memory.keyMap);
    setStep(1);
    return planId;
  };

  const makeSectionsAndPassages = async (
    planId: string,
    mediaRemoteIds?: string[]
  ) => {
    setStep(2);
    mediaRemoteIds && (await flatAdd(planId, mediaRemoteIds, setComplete));
    setInProgress(false);
    setStep(0);
    setView(`/work/${remoteId('plan', planId, memory.keyMap)}`);
  };

  useEffect(() => {
    if (status.canceled) {
      setInProgress(false);
      //get ready for next time
      status.canceled = false;
    }
  }, [status.canceled]);

  const cancelUpload = (what: string) => {
    status.canceled = true;
  };

  if (view !== '') return <StickyRedirect to={view} />;

  return (
    <>
      <Card className={classes.root} onClick={handleShow}>
        <CardContent className={classes.content}>
          {show ? (
            <div className={classes.buttons}>
              <Button variant="contained" onClick={handleUpload(team)}>
                {sharedStrings.uploadMediaPlural}
              </Button>
              <Button
                variant="contained"
                color="default"
                onClick={handleClickOpen}
              >
                {t.newProject}
              </Button>

              {/*  revisit in the future
              <Button variant="contained" onClick={handleConnect(team)}>
                {t.connectParatext}
              </Button>
              */}
              {isElectron && (
                <Button variant="contained" onClick={handleImport(team)}>
                  {t.import}
                </Button>
              )}
              <ProjectDialog
                mode={DialogMode.add}
                isOpen={open}
                onOpen={handleOpen}
                onCommit={handleCommit}
              />
            </div>
          ) : (
            <div className={classes.icon}>
              <AddIcon fontSize="large" />
            </div>
          )}
        </CardContent>
      </Card>
      <Uploader
        auth={auth}
        isOpen={uploadVisible}
        onOpen={setUploadVisible}
        showMessage={showMessage}
        showJSXMessage={showJSXMessage}
        setComplete={setComplete}
        multiple={true}
        metaData={
          <>
            <ProjectType type={type} onChange={setType} />
            <Language {...language} onChange={handleLanguageChange} />
          </>
        }
        ready={handleReady}
        createProject={createProject}
        finish={makeSectionsAndPassages}
        status={status}
      />
      <Progress
        title={t.uploadProgress}
        open={!uploadVisible && inProgress}
        progress={complete}
        steps={steps}
        currentStep={step}
        action={cancelUpload}
      />
    </>
  );
};
