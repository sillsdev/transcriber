import React from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { Card, CardContent, Button } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import { Organization } from '../../model';
import { AddProjectDialog } from '.';
import { ProjectType } from './AddProject';
import { Language, ILanguage } from '../../control';
import MediaUpload, { UploadType } from '../MediaUpload';
import { isElectron } from '../../api-variable';

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
      justifyContent: 'space-between',
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

const t = {
  upload: 'Upload Audio',
  newProject: 'New Project',
  connectParatext: 'Connect A Paratext Project',
  import: 'Import PTF File',
};

type TeamIdType = Organization | null;

interface IProps {
  team: TeamIdType;
}

export const AddCard = (props: IProps) => {
  const { team } = props;
  const classes = useStyles();
  const [show, setShow] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [uploadVisible, setUploadVisible] = React.useState(false);
  const [type, setType] = React.useState('');
  const [language, setLanguage] = React.useState<ILanguage>(initLang);

  const handleShow = () => {
    if (!isOpen) setShow(!show);
  };

  const handleOpen = (val: boolean) => {
    setIsOpen(val);
  };

  const teamName = (teamId: TeamIdType) => {
    return team ? team.attributes?.name : 'Personal Projects';
  };

  const handleUpload = (team: TeamIdType) => (e: any) => {
    console.log(`clicked ${t.upload} for ${teamName(team)}`);
    setUploadVisible(true);
  };

  const handleUploadMethod = (files: FileList) => {
    console.log(`Uploading ${files}`);
  };

  const handleCancelUpload = () => {
    setLanguage(initLang);
    setType('');
    setUploadVisible(false);
  };

  const handleLanguageChange = (lang: ILanguage) => {
    setLanguage(lang);
  };

  const handleReady = () => type !== '' && language.bcp47 !== 'und';

  const handleConnect = (team: TeamIdType) => (e: any) => {
    console.log(`clicked ${t.connectParatext} for ${teamName(team)}`);
  };

  const handleImport = (team: TeamIdType) => (e: any) => {
    console.log(`clicked ${t.import} for ${teamName(team)}`);
  };

  return (
    <>
      <Card className={classes.root} onClick={handleShow}>
        <CardContent className={classes.content}>
          {show ? (
            <div className={classes.buttons}>
              <Button variant="contained" onClick={handleUpload(team)}>
                {t.upload}
              </Button>
              <AddProjectDialog isOpen={handleOpen} />
              <Button variant="contained" onClick={handleConnect(team)}>
                {t.connectParatext}
              </Button>
              {isElectron && (
                <Button variant="contained" onClick={handleImport(team)}>
                  {t.import}
                </Button>
              )}
            </div>
          ) : (
            <div className={classes.icon}>
              <AddIcon fontSize="large" />
            </div>
          )}
        </CardContent>
      </Card>
      <MediaUpload
        visible={uploadVisible}
        uploadType={UploadType.Media}
        uploadMethod={handleUploadMethod}
        cancelMethod={handleCancelUpload}
        metaData={
          <>
            <ProjectType type={type} onChange={setType} />
            <Language {...language} onChange={handleLanguageChange} />
          </>
        }
        ready={handleReady}
      />
    </>
  );
};
