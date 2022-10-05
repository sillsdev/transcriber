import React, { useEffect, useRef } from 'react';
import { useGlobal } from 'reactn';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Card, CardContent } from '@material-ui/core';
import AddIcon from '@mui/icons-material/Add';
import { VProject, DialogMode, OptionType, Project, Plan } from '../../model';
import { ProjectDialog, IProjectDialog, ProjectType } from './ProjectDialog';
import { Language, ILanguage } from '../../control';
import Uploader from '../Uploader';
import Progress from '../../control/UploadProgress';
import { TeamContext, TeamIdType } from '../../context/TeamContext';
import { UpdateRecord } from '../../model/baseModel';
import {
  waitForRemoteId,
  remoteId,
  useOrganizedBy,
  findRecord,
  related,
} from '../../crud';
import BookCombobox from '../../control/BookCombobox';
import { useSnackBar } from '../../hoc/SnackBar';
import StickyRedirect from '../StickyRedirect';
import NewProjectGrid from './NewProjectGrid';
import { restoreScroll } from '../../utils';

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
  const [user] = useGlobal('user');
  const [offlineOnly] = useGlobal('offlineOnly');
  const ctx = React.useContext(TeamContext);
  const {
    projectCreate,
    cardStrings,
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
  const [language, setLanguagex] = React.useState<ILanguage>(initLang);
  const [book, setBookx] = React.useState<OptionType | null>(null);
  const bookRef = useRef<OptionType | null>(null);
  const languageRef = useRef<ILanguage>(initLang);
  const [complete, setComplete] = useGlobal('progress');
  const [steps] = React.useState([
    t.projectCreated,
    t.mediaUploaded,
    t.passagesCreated,
  ]);
  const { fromLocalizedOrganizedBy } = useOrganizedBy();
  const stepRef = useRef(0);
  const planRef = useRef('');
  const cancelled = useRef(false);
  const [, setPlan] = useGlobal('plan');
  const [pickOpen, setPickOpen] = React.useState(false);
  const preventBoth = React.useRef(false);
  const [view, setView] = React.useState('');
  const [forceType, setForceType] = React.useState(false);
  const [recordAudio, setRecordAudio] = React.useState(false);
  const speakerRef = useRef<string>();

  useEffect(() => {
    if (localStorage.getItem('autoaddProject') !== null && team === null) {
      setPickOpen(true);
      localStorage.removeItem('autoaddProject');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setBook = (book: OptionType | null) => {
    bookRef.current = book;
    setBookx(book);
  };
  const setLanguage = (language: ILanguage) => {
    languageRef.current = language;
    setLanguagex(language);
  };
  useEffect(() => {
    if (uploadVisible) {
      setLanguage(initLang);
      setBook(null);
      cancelled.current = false;
    } else {
      // someplace it is being shut off if I reset it here so I wait
      setTimeout(() => {
        restoreScroll();
      }, 500);
    }
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
    languageRef.current?.bcp47 !== 'und' &&
    (type !== 'scripture' || bookRef.current !== null);

  const handleClickOpen = (e: React.MouseEvent) => {
    setOpen(true);
    setPickOpen(false);
    preventBoth.current = true;
    e.stopPropagation();
  };

  const handleNameChange = (name: string) => {
    speakerRef.current = name;
  };

  const nameInUse = (newName: string) => {
    const projects = team ? teamProjects(team.id) : personalProjects;
    const sameNameRec = projects.filter((p) => p?.attributes?.name === newName);
    return sameNameRec.length > 0;
  };

  const handleCommit = (values: IProjectDialog) => {
    const {
      name,
      description,
      type,
      languageName,
      isPublic,
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
          isPublic,
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

  const nextName = (newName: string) => {
    const projects = team ? teamProjects(team.id) : personalProjects;
    const sameNameRec = projects.filter((p) => p?.attributes?.name === newName);
    return sameNameRec.length > 0
      ? `${newName} ${sameNameRec.length + 1}`
      : newName;
  };

  const createProject = async (name: string) => {
    if (stepRef.current === 1 && planRef.current) {
      const planRec = findRecord(memory, 'plan', planRef.current);
      const projRec = findRecord(
        memory,
        'project',
        related(planRec, 'project')
      ) as Project | undefined;
      if (projRec) {
        const newName = bookRef.current?.label || nextName(name);
        const updProj = {
          ...projRec,
          attributes: {
            ...projRec.attributes,
            name: newName,
            language: languageRef.current.bcp47,
            languageName: languageRef.current.languageName,
            spellCheck: languageRef.current.spellCheck,
            defaultFont: languageRef.current.font,
          },
        } as Project;
        await memory.update((t) => [
          ...UpdateRecord(t, updProj, user),
          t.replaceAttribute(planRec as Plan, 'name', newName),
        ]);
        return planRef.current;
      }
    }
    stepRef.current = 0;
    planRef.current = await projectCreate(
      {
        attributes: {
          name: bookRef.current?.label || nextName(name),
          description: '',
          type,
          language: languageRef.current.bcp47,
          languageName: languageRef.current.languageName,
          isPublic: false,
          spellCheck: languageRef.current.spellCheck,
          defaultFont: languageRef.current.font,
          defaultFontSize: 'large',
          rtl: false,
          tags: {},
          flat: true,
          organizedBy: fromLocalizedOrganizedBy(vProjectStrings.sections),
        },
      } as VProject,
      team
    );
    setPlan(planRef.current);
    if (!offlineOnly)
      await waitForRemoteId(
        { type: 'plan', id: planRef.current },
        memory.keyMap
      );
    stepRef.current = 1;
    return planRef.current;
  };

  const makeSectionsAndPassages = async (
    planId: string,
    mediaRemoteIds?: string[]
  ) => {
    stepRef.current = 2;
    mediaRemoteIds &&
      (await flatAdd(
        planId,
        mediaRemoteIds,
        bookRef.current?.value,
        setComplete
      ));
    stepRef.current = 3;
    setTimeout(() => {
      // Allow time for last check mark
      setInProgress(false);
      stepRef.current = 0;
      if (bookRef.current?.value)
        setView(`/plan/${remoteId('plan', planId, memory.keyMap) || planId}/0`);
      else
        setView(`/work/${remoteId('plan', planId, memory.keyMap) || planId}`);
    }, 1000);
  };

  const handleBookCommit = (book: OptionType | null) => {
    setBook(book);
  };

  const cancelUpload = (what: string) => {
    cancelled.current = true;
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
            <NewProjectGrid
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
        isOpen={uploadVisible}
        onOpen={setUploadVisible}
        showMessage={showMessage}
        multiple={true}
        metaData={MetaData}
        ready={handleReady}
        createProject={createProject}
        finish={makeSectionsAndPassages}
        cancelled={cancelled}
        defaultFilename={book?.value}
        allowWave={true}
        team={team?.id || undefined}
        performedBy={speakerRef.current}
        onSpeakerChange={handleNameChange}
      />
      <Progress
        title={t.uploadProgress}
        open={!uploadVisible && inProgress && !cancelled.current}
        progress={complete}
        steps={steps}
        currentStep={stepRef.current}
        action={cancelUpload}
        allowCancel={true}
      />
    </>
  );
};
