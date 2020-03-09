import React, { useState, useEffect, useRef } from 'react';
import { Redirect } from 'react-router-dom';
import clsx from 'clsx';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { IState, Organization, IOrgSettingsStrings } from '../model';
import localStrings from '../selector/localize';
import { withData, WithDataProps } from 'react-orbitjs';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import {
  Avatar,
  TextField,
  FormControl,
  FormGroup,
  FormControlLabel,
  IconButton,
  Button,
} from '@material-ui/core';
import LinkIcon from '@material-ui/icons/Link';
import SaveIcon from '@material-ui/icons/Save';
// import EditIcon from '@material-ui/icons/Edit';
import OrgIcon from '@material-ui/icons/AccountBalance';
import DeleteExpansion from './DeleteExpansion';
import SnackBar from './SnackBar';
import Confirm from './AlertDialog';
import { API_CONFIG } from '../api-variable';
import { CreateOrg } from '../utils';
import { currentDateTime } from '../utils/currentDateTime';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
      margin: theme.spacing(4),
    },
    fullContainer: {
      margin: 0,
    },
    paper: {
      paddingLeft: theme.spacing(4),
      paddingRight: theme.spacing(4),
    },
    group: {
      paddingBottom: theme.spacing(3),
    },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    avatar: {
      paddingTop: '10px',
      paddingLeft: '10px',
    },
    iconButton: {
      padding: 10,
    },
    actions: theme.mixins.gutters({
      paddingBottom: 16,
      display: 'flex',
      flexDirection: 'row',
    }) as any,
    button: {
      margin: theme.spacing(1),
    },
    icon: {
      marginLeft: theme.spacing(1),
    },
  })
);

interface IStateProps {
  t: IOrgSettingsStrings;
}

interface IRecordProps {
  organizations: Array<Organization>;
}

interface IProps extends IStateProps, IRecordProps, WithDataProps {
  noMargin?: boolean;
  add?: boolean;
  finishAdd?: () => void;
}

export function OrgSettings(props: IProps) {
  const { add, organizations, t, noMargin, finishAdd } = props;
  const classes = useStyles();
  const [schema] = useGlobal('schema');
  const [memory] = useGlobal('memory');
  const [remote] = useGlobal('remote');
  const [orgRole] = useGlobal('orgRole');
  const [user] = useGlobal('user');
  const [organization, setOrganization] = useGlobal('organization');
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [_project, setProject] = useGlobal('project');
  const [curOrg, setCurOrg] = useState<Organization>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState<string | null>(null);
  const [orgAvatar, setOrgAvatar] = useState<string | null>(null);
  const [website, setWebsite] = useState<string | null>(null);
  const [publicByDefault, setPublic] = useState(true);
  const [deleteItem, setDeleteItem] = useState('');
  const [message, setMessage] = useState(<></>);
  const websiteRef = useRef<any>();
  const [changed, setChanged] = useState(false);
  const [view, setView] = useState('');

  const handleNameChange = (e: any) => {
    setChanged(true);
    setName(e.target.value);
  };

  const handleDescriptionChange = (e: any) => {
    setChanged(true);
    setDescription(e.target.value);
  };

  const handleWebsiteChange = (e: any) => {
    setChanged(true);
    setWebsite(e.target.value);
  };

  const handleWebsiteLink = () => {
    if (websiteRef.current) {
      websiteRef.current.click();
    }
  };

  const handleMessageReset = () => () => setMessage(<></>);

  const handleSave = () => {
    memory.update((t: TransformBuilder) => [
      t.updateRecord({
        type: 'organization',
        id: organization,
        attributes: {
          name,
          description,
          websiteUrl: website,
          logoUrl: orgAvatar,
          publicByDefault,
          dateUpdated: currentDateTime(),
        },
      }),
      // we aren't allowing them to change owner oraganization currently
    ]);
  };

  const handleAdd = () => {
    let orgRec: Organization = {
      type: 'organization',
      attributes: {
        name,
        description,
        websiteUrl: website,
        logoUrl: orgAvatar,
        publicByDefault,
      },
    } as any;
    CreateOrg({
      orgRec,
      user,
      schema,
      memory,
      remote,
      setOrganization,
      setProject,
    });
    if (finishAdd) {
      finishAdd();
    }
  };

  const handleCancel = () => setView('Main');

  const handleDelete = () => {
    if (curOrg !== undefined) setDeleteItem(curOrg.id);
  };

  const handleDeleteConfirmed = () => {
    memory.update((t: TransformBuilder) =>
      t.removeRecord({ type: 'organization', id: deleteItem })
    );
  };

  const handleDeleteRefused = () => setDeleteItem('');

  useEffect(() => {
    let org: Organization = {
      type: 'organization',
      id: '',
      attributes: {
        name: '',
        description: '',
        slug: '',
        websiteUrl: '',
        logoUrl: '',
        publicByDefault: true,
        dateCreated: '',
        dateUpdated: '',
      },
    } as Organization;
    if (!add) {
      const orgRecords = organizations.filter(
        (o: Organization) => o.id === organization
      );
      if (orgRecords.length > 0) {
        org = orgRecords[0];
        setCurOrg(org);
      }
    }
    const attr = org.attributes;
    setName(attr.name);
    setDescription(attr.description || '');
    setOrgAvatar(attr.logoUrl);
    setWebsite(attr.websiteUrl || '');
    setOrgAvatar(attr.logoUrl);
    setPublic(attr.publicByDefault);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [add, organization, organizations]);

  if (/Main/i.test(view)) return <Redirect to="/main" />;
  const textStyle = { width: 400 };
  return (
    <div
      className={clsx(classes.container, {
        [classes.fullContainer]: noMargin,
      })}
    >
      <div className={classes.paper}>
        <FormControl>
          <FormGroup className={classes.group}>
            <FormControlLabel
              control={
                <TextField
                  id="name"
                  label={t.name}
                  className={classes.textField}
                  value={name || ''}
                  onChange={handleNameChange}
                  margin="normal"
                  style={textStyle}
                  variant="filled"
                  required={true}
                />
              }
              label=""
            />
            <FormControlLabel
              control={
                <div className={classes.avatar}>
                  {orgAvatar && orgAvatar.startsWith('http') ? (
                    <Avatar src={orgAvatar} />
                  ) : (
                    <OrgIcon />
                  )}
                </div>
              }
              label=""
            />
            <FormControlLabel
              control={
                <TextField
                  id="description"
                  label={t.description}
                  className={classes.textField}
                  value={description || ''}
                  onChange={handleDescriptionChange}
                  margin="normal"
                  style={textStyle}
                  variant="filled"
                  required={false}
                />
              }
              label=""
            />
            <FormControlLabel
              control={
                <>
                  <TextField
                    id="website"
                    label={t.website}
                    className={classes.textField}
                    value={website || ''}
                    onChange={handleWebsiteChange}
                    margin="normal"
                    style={textStyle}
                    variant="filled"
                    required={false}
                  />
                  <IconButton
                    color="primary"
                    className={classes.iconButton}
                    onClick={handleWebsiteLink}
                    disabled={!website || website.indexOf('.') === -1}
                  >
                    <LinkIcon />
                  </IconButton>
                </>
              }
              label=""
            />
          </FormGroup>
        </FormControl>
        {!API_CONFIG.isApp && (curOrg === undefined || orgRole === 'admin') && (
          <div className={classes.actions}>
            <Button
              key="cancel"
              aria-label={t.cancel}
              variant="outlined"
              color="primary"
              className={classes.button}
              onClick={handleCancel}
            >
              {t.cancel}
            </Button>
            <Button
              key="add"
              aria-label={t.add}
              variant="contained"
              color="primary"
              className={classes.button}
              disabled={name === '' || !changed}
              onClick={curOrg === undefined ? handleAdd : handleSave}
            >
              {curOrg === undefined ? t.add : t.save}
              <SaveIcon className={classes.icon} />
            </Button>
          </div>
        )}
        {!API_CONFIG.isApp && curOrg !== undefined && orgRole === 'admin' && (
          <DeleteExpansion
            title={t.deleteOrg}
            explain={t.deleteExplained}
            handleDelete={() => handleDelete()}
          />
        )}
      </div>
      {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
      <a
        ref={websiteRef}
        href={
          !website
            ? '#'
            : website.toLocaleLowerCase().indexOf('http') !== -1
            ? website
            : 'http://' + website
        }
        target="_blank"
        rel="noopener noreferrer"
      ></a>
      {deleteItem !== '' && (
        <Confirm
          yesResponse={handleDeleteConfirmed}
          noResponse={handleDeleteRefused}
        />
      )}
      <SnackBar {...props} message={message} reset={handleMessageReset} />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'orgSettings' }),
});

const mapRecordsToProps = {
  organizations: (q: QueryBuilder) => q.findRecords('organization'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(OrgSettings) as any
) as any;
