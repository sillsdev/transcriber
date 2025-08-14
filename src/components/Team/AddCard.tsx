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
import { VProject, DialogMode } from '../../model';
import {
  ProjectDialog,
  IProjectDialog,
  initProjectState,
} from './ProjectDialog';
import { ILanguage, initLang } from '../../control';
import Progress from '../../control/UploadProgress';
import { TeamContext, TeamIdType } from '../../context/TeamContext';
import { usePlan, useOrgDefaults, orgDefaultLangProps } from '../../crud';
import StickyRedirect from '../StickyRedirect';
import { useHome, useJsonParams } from '../../utils';
import { projDefBook, projDefStory } from '../../crud/useProjectDefaults';

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

interface IProps {
  team: TeamIdType;
}

export const AddCard = (props: IProps) => {
  const { team } = props;

  const ctx = React.useContext(TeamContext);
  const {
    projectCreate,
    cardStrings,
    teamProjects,
    personalProjects,
    loadProject,
    generalBook,
  } = ctx.state;
  const t = cardStrings;

  const { leaveHome } = useHome();
  const { getOrgDefault, setOrgDefault } = useOrgDefaults();
  const [open, setOpen] = React.useState(false);
  const [inProgress] = React.useState(false);

  const [, setLanguagex] = React.useState<ILanguage>(initLang);
  const [projDef, setProjDef] = React.useState({
    ...initProjectState,
    isPersonal: !Boolean(team),
  });
  const languageRef = useRef<ILanguage>(initLang);
  const [complete] = useGlobal('progress'); //verified this is not used in a function 2/18/25S
  const [, setBusy] = useGlobal('importexportBusy');
  const [steps] = React.useState([
    t.projectCreated,
    t.mediaUploaded,
    t.passagesCreated,
  ]);

  const stepRef = useRef(0);
  const cancelled = useRef(false);
  const [isDeveloper] = useGlobal('developer');
  const preventBoth = useRef(false);
  const [view] = useState('');
  const { getPlan } = usePlan();
  const { setParam } = useJsonParams();

  useEffect(() => {
    const language = getOrgDefault(
      orgDefaultLangProps,
      team?.id
    ) as typeof initLang;
    setLanguage(language ?? initLang, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLanguage = (language: ILanguage, init?: boolean) => {
    languageRef.current = language;
    setLanguagex(language);
    setProjDef({ ...projDef, ...language });
    if (!init) setOrgDefault(orgDefaultLangProps, language, team?.id);
  };

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

  const handleClickOpen = (e: React.MouseEvent) => {
    setOpen(true);
    preventBoth.current = true;
    e.stopPropagation();
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
      story,
      sheetUser,
      sheetGroup,
      publishUser,
      publishGroup,
    } = values;
    let defaultParams = setParam(
      projDefBook,
      book || generalBook(team?.id),
      '{}'
    );
    defaultParams = setParam(projDefStory, story, defaultParams);
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
          sheetUser,
          sheetGroup,
          publishUser,
          publishGroup,
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

  const cancelUpload = (what: string) => {
    cancelled.current = true;
  };
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
              team={team?.id}
            />
          </Box>
        </StyledCardContent>
      </StyledCard>
      <Progress
        title={t.uploadProgress}
        open={inProgress && !cancelled.current}
        progress={complete}
        steps={steps}
        currentStep={stepRef.current}
        action={cancelUpload}
        allowCancel={true}
      />
    </>
  );
};
