import React, { useEffect } from 'react';
import { useGlobal } from 'reactn';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Card, CardContent } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import { VProject, DialogMode, OptionType } from '../../model';
import { ProjectDialog, IProjectDialog, ProjectType } from './ProjectDialog';
import { Language, ILanguage } from '../../control';
import Uploader, { statusInit } from '../Uploader';
import Progress from '../../control/UploadProgress';
import { TeamContext, TeamIdType } from '../../context/TeamContext';
import { waitForRemoteId, remoteId, useOrganizedBy } from '../../crud';
import BookCombobox from '../../control/BookCombobox';
import { useSnackBar } from '../../hoc/SnackBar';
import StickyRedirect from '../StickyRedirect';
import NewProject from './NewProject';

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
  spellCheck: false,
};

interface IProps {
  team: TeamIdType;
}

export const AddCard = (props: IProps) => {
  const { team } = props;
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const [offlineOnly] = useGlobal('offlineOnly');
  const ctx = React.useContext(TeamContext);
  const {
    projectCreate,
    cardStrings,
    auth,
    flatAdd,
    vProjectStrings,
    bookSuggestions,
    teamProjects,
    personalProjects,
  } = ctx.state;
  const t = cardStrings;
  const { showMessage } = useSnackBar();
  const [open, setOpen] = React.useState(false);
  const [inProgress, setInProgress] = React.useState(false);
  const [uploadVisible, setUploadVisible] = React.useState(false);
  const [type, setType] = React.useState('');
  const [language, setLanguage] = React.useState<ILanguage>(initLang);
  const [book, setBook] = React.useState<OptionType | null>(null);
  const [complete, setComplete] = useGlobal('progress');
  const [steps] = React.useState([
    t.projectCreated,
    t.mediaUploaded,
    t.passagesCreated,
  ]);
  const { fromLocalizedOrganizedBy } = useOrganizedBy();
  const [step, setStep] = React.useState(0);
  const [status] = React.useState({ ...statusInit });
  const [, setPlan] = useGlobal('plan');
  const [pickOpen, setPickOpen] = React.useState(false);
  const preventBoth = React.useRef(false);
  const [view, setView] = React.useState('');
  const [forceType, setForceType] = React.useState(false);
  const [recordAudio, setRecordAudio] = React.useState(false);

  useEffect(() => {
    if (status.canceled) {
      setInProgress(false);
      setTimeout(() => {
        // Allow time for everyone to notice canceled
        status.canceled = false;
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.canceled]);

  useEffect(() => {
    setLanguage(initLang);
    setBook(null);
  }, [uploadVisible]);

  const handleForceType = (type: string) => {
    setType(type);
    setForceType(true);
  };

  const handleSolutionShow = () => {
    if (!preventBoth.current) setPickOpen(true);
    preventBoth.current = false;
  };

  const handleSolutionHide = () => {
    setPickOpen(false);
    preventBoth.current = true;
  };

  const handleProject = (val: boolean) => {
    setOpen(val);
    handleSolutionHide();
  };

  const handleUpload = () => {
    setRecordAudio(false);
    setUploadVisible(true);
    setInProgress(true);
  };

  const handleRecord = () => {
    setRecordAudio(true);
    setUploadVisible(true);
    setInProgress(true);
  };

  const handleLanguageChange = (lang: ILanguage) => {
    setLanguage(lang);
  };

  const handleReady = () =>
    type !== '' &&
    language.bcp47 !== 'und' &&
    (type !== 'scripture' || book !== null);

  const handleClickOpen = (e: React.MouseEvent) => {
    setOpen(true);
    setPickOpen(false);
    preventBoth.current = true;
    e.stopPropagation();
  };

  const nameInUse = (newName: string) => {
    const projects = team ? teamProjects(team.id) : personalProjects();
    const sameNameRec = projects.filter((p) => p?.attributes?.name === newName);
    return sameNameRec.length > 0;
  };

  const handleCommit = (values: IProjectDialog) => {
    const {
      name,
      description,
      type,
      languageName,
      spellCheck,
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
          spellCheck,
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

  const createProject = async (fileList: File[]) => {
    setStep(0);
    const name = fileList[0]?.name.split('.')[0];
    const planId = await projectCreate(
      {
        attributes: {
          name: book?.label || name,
          description: '',
          type,
          language: language.bcp47,
          languageName: language.languageName,
          spellCheck: language.spellCheck,
          defaultFont: language.font,
          defaultFontSize: 'large',
          rtl: false,
          tags: {},
          flat: true,
          organizedBy: fromLocalizedOrganizedBy(vProjectStrings.sections),
        },
      } as VProject,
      team
    );
    setPlan(planId);
    if (!offlineOnly)
      await waitForRemoteId({ type: 'plan', id: planId }, memory.keyMap);
    setStep(1);
    return planId;
  };

  const makeSectionsAndPassages = async (
    planId: string,
    mediaRemoteIds?: string[]
  ) => {
    setStep(2);
    mediaRemoteIds &&
      (await flatAdd(planId, mediaRemoteIds, book?.value, setComplete));
    setStep(3);
    setTimeout(() => {
      // Allow time for last check mark
      setInProgress(false);
      setStep(0);
      if (book?.value)
        setView(`/plan/${remoteId('plan', planId, memory.keyMap) || planId}/0`);
      else
        setView(`/work/${remoteId('plan', planId, memory.keyMap) || planId}`);
    }, 1000);
  };

  const handleBookCommit = (book: OptionType | null) => {
    setBook(book);
  };

  const cancelUpload = (what: string) => {
    status.canceled = true;
  };

  const MetaData = React.useMemo(
    () => {
      return (
        <>
          {forceType || <ProjectType type={type} onChange={setType} />}
          {type.toLowerCase() === 'scripture' && (
            <BookCombobox
              value={book}
              suggestions={bookSuggestions}
              onCommit={handleBookCommit}
            />
          )}
          <Language {...language} onChange={handleLanguageChange} />
        </>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookSuggestions, language, type, book, forceType]
  );

  if (view !== '') return <StickyRedirect to={view} />;

  return (
    <>
      <Card
        id={`teamAdd-${team}`}
        className={classes.root}
        onClick={handleSolutionShow}
      >
        <CardContent className={classes.content}>
          <div className={classes.icon}>
            <AddIcon fontSize="large" />
            <NewProject
              open={pickOpen && !open && !uploadVisible}
              onOpen={handleSolutionHide}
              doUpload={handleUpload}
              doRecord={handleRecord}
              doNewProj={handleClickOpen}
              setType={handleForceType}
            />
            <ProjectDialog
              mode={DialogMode.add}
              isOpen={open}
              onOpen={handleProject}
              onCommit={handleCommit}
              nameInUse={nameInUse}
            />
          </div>
        </CardContent>
      </Card>
      <Uploader
        recordAudio={recordAudio}
        auth={auth}
        isOpen={uploadVisible}
        onOpen={setUploadVisible}
        showMessage={showMessage}
        setComplete={setComplete}
        multiple={true}
        metaData={MetaData}
        ready={handleReady}
        createProject={createProject}
        finish={makeSectionsAndPassages}
        status={status}
        defaultFilename={book?.value}
      />
      <Progress
        title={t.uploadProgress}
        open={!uploadVisible && inProgress}
        progress={complete}
        steps={steps}
        currentStep={step}
        action={cancelUpload}
        allowCancel={true}
      />
    </>
  );
};
