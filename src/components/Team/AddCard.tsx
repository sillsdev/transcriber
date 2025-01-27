import React, { useEffect, useRef, useState } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import {
  Box,
  Card,
  CardContent,
  CardContentProps,
  CardProps,
  styled,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {
  VProject,
  DialogMode,
  OptionType,
  Project,
  ProjectD,
} from '../../model';
import {
  ProjectDialog,
  IProjectDialog,
  ProjectType,
  initProjectState,
} from './ProjectDialog';
import { Language, ILanguage } from '../../control';
import Uploader from '../Uploader';
import Progress from '../../control/UploadProgress';
import { TeamContext, TeamIdType } from '../../context/TeamContext';
import { ReplaceRelatedRecord, UpdateRecord } from '../../model/baseModel';
import {
  waitForRemoteId,
  remoteId,
  useOrganizedBy,
  findRecord,
  related,
  usePlan,
  useTypeId,
  useOrgDefaults,
  orgDefaultLangProps,
} from '../../crud';
import BookCombobox from '../../control/BookCombobox';
import { useSnackBar } from '../../hoc/SnackBar';
import StickyRedirect from '../StickyRedirect';
import { restoreScroll, useHome, useJsonParams } from '../../utils';
import { RecordIdentity, RecordKeyMap } from '@orbit/records';
import { projDefBook } from '../../crud/useProjectDefaults';

const StyledCard = styled(Card)<CardProps>(({ theme }) => ({
  minWidth: 275,
  minHeight: 176,
  margin: theme.spacing(1),
  display: 'flex',
  backgroundColor: theme.palette.primary.light,
}));

const StyledCardContent = styled(CardContent)<CardContentProps>(
  ({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    justifyContent: 'center',
    color: theme.palette.primary.contrastText,
  })
);

const initLang = {
  bcp47: 'und',
  languageName: '',
  font: '',
  rtl: false,
  spellCheck: false,
};

interface IProps {
  team: TeamIdType;
}

export const AddCard = (props: IProps) => {
  const { team } = props;
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
    personalTeam,
    personalProjects,
    loadProject,
  } = ctx.state;
  const t = cardStrings;
  const { showMessage } = useSnackBar();
  const { leaveHome } = useHome();
  const { getOrgDefault, setOrgDefault } = useOrgDefaults();
  const [open, setOpen] = React.useState(false);
  const [inProgress, setInProgress] = React.useState(false);
  const [uploadVisible, setUploadVisible] = React.useState(false);
  const [type, setType] = React.useState('');
  const [language, setLanguagex] = React.useState<ILanguage>(initLang);
  const [projDef, setProjDef] = React.useState({
    ...initProjectState,
    isPersonal: !Boolean(team),
  });
  const [book, setBookx] = React.useState<OptionType | null>(null);
  const bookRef = useRef<OptionType | null>(null);
  const languageRef = useRef<ILanguage>(initLang);
  const [complete, setComplete] = useGlobal('progress');
  const [, setBusy] = useGlobal('importexportBusy');
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
  const [isDeveloper] = useGlobal('developer');
  const preventBoth = useRef(false);
  const [view, setView] = useState('');
  const speakerRef = useRef<string>();
  const { getPlan } = usePlan();
  const getTypeId = useTypeId();
  const { setParam } = useJsonParams();

  useEffect(() => {
    const language = getOrgDefault(
      orgDefaultLangProps,
      team?.id
    ) as typeof initLang;
    setLanguage(language ?? initLang, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setBook = (book: OptionType | null) => {
    bookRef.current = book;
    setBookx(book);
  };
  const setLanguage = (language: ILanguage, init?: boolean) => {
    languageRef.current = language;
    setLanguagex(language);
    setProjDef({ ...projDef, ...language });
    if (!init) setOrgDefault(orgDefaultLangProps, language, team?.id);
  };

  useEffect(() => {
    if (uploadVisible) {
      setBook(null);
      cancelled.current = false;
    } else {
      // someplace it is being shut off if I reset it here so I wait
      setTimeout(() => {
        restoreScroll();
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadVisible]);

  const handleSolutionShow = (e: React.MouseEvent) => {
    if (team && !isDeveloper && !open) {
      handleClickOpen(e);
      return;
    }
    if (!preventBoth.current) setOpen(true);
    preventBoth.current = false;
  };

  const handleProject = () => {
    setOpen(false);
    preventBoth.current = true;
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
    setBusy(true);
    const {
      name,
      description,
      type,
      bcp47,
      languageName,
      font,
      isPublic,
      spellCheck,
      rtl,
      tags,
      organizedBy,
      book,
    } = values;
    var defaultParams = setParam(projDefBook, book, '{}');
    setLanguage({ bcp47, languageName, font, rtl, spellCheck });
    projectCreate(
      {
        attributes: {
          name,
          description,
          type,
          language: values?.bcp47 ?? 'und',
          languageName,
          isPublic,
          spellCheck,
          defaultFont: values.font,
          defaultFontSize: values.fontSize,
          rtl,
          tags,
          flat: values.flat,
          organizedBy,
          defaultParams,
        },
      } as VProject,
      team
    )
      .then((planId) => {
        const planRec = getPlan(planId);
        if (planRec) {
          loadProject(planRec);
          leaveHome();
        }
      })
      .finally(() => setBusy(false));
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
            language: languageRef.current?.bcp47 || 'und',
            languageName: languageRef.current.languageName,
            spellCheck: languageRef.current.spellCheck,
            defaultFont: languageRef.current.font,
          },
        } as ProjectD;
        await memory.update((t) => [
          ...UpdateRecord(t, updProj, user),
          t
            .replaceAttribute(planRec as RecordIdentity, 'name', newName)
            .toOperation(),
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
          language: languageRef.current?.bcp47 || 'und',
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
        memory?.keyMap as RecordKeyMap
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
    if (planRef.current) {
      const planRecId = { type: 'plan', id: planRef.current } as RecordIdentity;
      await memory.update((t) => [
        ...ReplaceRelatedRecord(
          t,
          planRecId,
          'plantype',
          'plantype',
          getTypeId(type, 'plan')
        ),
      ]);
    }
    stepRef.current = 3;
    setTimeout(() => {
      // Allow time for last check mark
      setInProgress(false);
      stepRef.current = 0;
      setView(
        `/plan/${
          remoteId('plan', planId, memory?.keyMap as RecordKeyMap) || planId
        }/0`
      );
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
          <ProjectType type={type} onChange={setType} />
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
    [bookSuggestions, language, type, book]
  );

  if (view !== '') return <StickyRedirect to={view} />;

  return (
    <>
      <StyledCard id={`teamAdd-${team}`} onClick={handleSolutionShow}>
        <StyledCardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <AddIcon fontSize="large" />
            <ProjectDialog
              mode={DialogMode.add}
              isOpen={open}
              onOpen={handleProject}
              onCommit={handleCommit}
              nameInUse={nameInUse}
              values={projDef}
            />
          </Box>
        </StyledCardContent>
      </StyledCard>
      <Uploader
        recordAudio={false}
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
        team={personalTeam}
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
