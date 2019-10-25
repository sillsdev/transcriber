import React, { useState, useEffect, useRef } from 'react';
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
import EditIcon from '@material-ui/icons/Edit';
import OrgIcon from '@material-ui/icons/AccountBalance';
import SnackBar from './SnackBar';
import Confirm from './AlertDialog';
import { API_CONFIG } from '../api-variable';

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
    }),
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
  const { add, organizations, t, noMargin } = props;
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const [orgRole] = useGlobal('orgRole');
  const [organization] = useGlobal('organization');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [orgAvatar, setOrgAvatar] = useState('');
  const [website, setWebsite] = useState('');
  const [deleteItem, setDeleteItem] = useState('');
  const [message, setMessage] = useState(<></>);
  const websiteRef = useRef<any>();

  const handleNameChange = (e: any) => {
    setName(e.target.value);
  };
  const handleDescriptionChange = (e: any) => {
    setDescription(e.target.value);
  };
  const handleWebsiteChange = (e: any) => {
    setWebsite(e.target.value);
  };
  const handleWebsiteLink = () => {
    if (websiteRef.current) {
      websiteRef.current.click();
    }
  };
  const handleMessageReset = () => () => {
    setMessage(<></>);
  };
  const handleDeleteConfirmed = () => {
    memory.update((t: TransformBuilder) =>
      t.removeRecord({ type: 'organization', id: deleteItem })
    );
  };
  const handleDeleteRefused = () => {
    setDeleteItem('');
  };

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
        publicByDefault: false,
        dateCreated: '',
        dateUpdated: '',
      },
    } as any;
    if (!add) {
      const orgRecords = organizations.filter(
        (o: Organization) => o.id === organization
      );
      if (orgRecords.length > 0) {
        org = orgRecords[0];
      }
    }
    const attr = org.attributes;
    setName(attr.name);
    setDescription(attr.description ? attr.description : '');
    setOrgAvatar(attr.logoUrl ? attr.logoUrl : '');
    setWebsite(attr.websiteUrl ? attr.websiteUrl : '');
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [add, organization, organizations]);

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
                  value={name}
                  onChange={handleNameChange}
                  margin="normal"
                  variant="filled"
                  required={true}
                  disabled
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
                  value={description}
                  onChange={handleDescriptionChange}
                  margin="normal"
                  style={{ width: 400 }}
                  variant="filled"
                  required={false}
                  disabled
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
                    value={website}
                    onChange={handleWebsiteChange}
                    margin="normal"
                    style={{ width: 400 }}
                    variant="filled"
                    required={false}
                    disabled
                  />
                  <IconButton
                    color="primary"
                    className={classes.iconButton}
                    onClick={handleWebsiteLink}
                  >
                    <LinkIcon />
                  </IconButton>
                </>
              }
              label=""
            />
          </FormGroup>
        </FormControl>
        {!API_CONFIG.isApp && orgRole === 'admin' && (
          <div className={classes.actions}>
            <Button
              key="save"
              aria-label={t.save}
              variant="contained"
              color="primary"
              className={classes.button}
              disabled={name === ''}
              onClick={() => setMessage(<span>{'Not implemented'}</span>)}
            >
              {'Edit'}
              <EditIcon className={classes.icon} />
            </Button>
          </div>
        )}
      </div>
      {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
      <a
        ref={websiteRef}
        href={
          !website || website.toLocaleLowerCase().indexOf('http') !== -1
            ? website
            : 'http://' + website
        }
        target="_blank"
        rel="noopener noreferrer"
      ></a>
      {deleteItem !== '' ? (
        <Confirm
          yesResponse={handleDeleteConfirmed}
          noResponse={handleDeleteRefused}
        />
      ) : (
        <></>
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

export default withData(mapRecordsToProps)(connect(mapStateToProps)(
  OrgSettings
) as any) as any;
