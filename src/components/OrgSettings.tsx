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
  TextField,
  FormControl,
  FormGroup,
  FormControlLabel,
  Button,
  Checkbox,
  IconButton,
} from '@material-ui/core';
import SaveIcon from '@material-ui/icons/Save';
import LinkIcon from '@material-ui/icons/Link';
import SnackBar from './SnackBar';
import Confirm from './AlertDialog';
import { slug } from '../utils';
import moment from 'moment';

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
  const { add, organizations, t, noMargin, finishAdd } = props;
  const classes = useStyles();
  const [schema] = useGlobal('schema');
  const [memory] = useGlobal('memory');
  const [organization, setOrganization] = useGlobal('organization');
  const [user] = useGlobal('user');
  const [currentOrganization, setCurrentOrganization] = useState<
    Organization | undefined
  >();
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [logo, setLogo] = useState('');
  const [publicByDefault, setPublicByDefault] = useState(false);
  const [deleteItem, setDeleteItem] = useState('');
  const [message, setMessage] = useState(<></>);
  const websiteRef = useRef<any>();

  const handleNameChange = (e: any) => {
    setName(e.target.value);
  };
  const handleWebsiteChange = (e: any) => {
    setWebsite(e.target.value);
  };
  const handleLogoChange = (e: any) => {
    setLogo(e.target.value);
  };
  const handlePublicChange = () => {
    setPublicByDefault(!publicByDefault);
  };
  const handleWebsiteLink = () => {
    if (websiteRef.current) {
      websiteRef.current.click();
    }
  };
  const handleMessageReset = () => () => {
    setMessage(<></>);
  };
  const handleSave = () => {
    const attr = currentOrganization
      ? currentOrganization.attributes
      : undefined;
    memory.update((t: TransformBuilder) => [
      t.updateRecord({
        type: 'organization',
        id: organization,
        attributes: {
          name: name,
          slug: attr ? attr.slug : '',
          silId: attr ? attr.silId : '',
          websiteUrl: website,
          logoUrl: logo,
          publicByDefault: publicByDefault,
          dateCreated: attr ? attr.dateCreated : null,
          dateUpdaed: moment().format(),
        },
      }),
    ]);
  };
  const handleAdd = () => {
    let organization: Organization = {
      type: 'organization',
      attributes: {
        name: name,
        slug: slug(name),
        websiteUrl: website,
        logoUrl: logo,
        publicByDefault: publicByDefault,
        dateCreated: moment().format(),
        dateUpdated: null,
      },
    } as any;
    schema.initializeRecord(organization);
    memory.update((t: TransformBuilder) => [
      t.addRecord(organization),
      t.replaceRelatedRecord(
        { type: 'organization', id: organization.id },
        'owner',
        { type: 'user', id: user }
      ),
    ]);
    setOrganization(organization.id);
    if (finishAdd) {
      finishAdd();
    }
  };

  // const handleDelete = (p: Organization | undefined) => () => {
  //   if (p !== undefined) setDeleteItem(p.id);
  // };
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
        slug: '',
        websiteUrl: '',
        logoUrl: '',
        publicByDefault: false,
        dateCreated: '',
        dateUpdated: '',
      },
    } as any;
    if (add) {
      setCurrentOrganization(undefined);
    } else {
      const orgRecords = organizations.filter(
        (o: Organization) => o.id === organization
      );
      if (orgRecords.length > 0) {
        org = orgRecords[0];
        setCurrentOrganization(org);
      }
    }
    const attr = org.attributes;
    setName(attr.name);
    setWebsite(attr.websiteUrl);
    setLogo(attr.logoUrl);
    setPublicByDefault(attr.publicByDefault);
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
            <FormControlLabel
              control={
                <TextField
                  id="logo"
                  label={t.logo}
                  className={classes.textField}
                  value={logo}
                  onChange={handleLogoChange}
                  margin="normal"
                  style={{ width: 400 }}
                  variant="filled"
                  required={false}
                />
              }
              label=""
            />
            <FormControlLabel
              className={classes.textField}
              control={
                <Checkbox
                  id="checkbox-publicByDefault"
                  checked={publicByDefault}
                  onChange={handlePublicChange}
                />
              }
              label={t.publicByDefault}
            />
          </FormGroup>
        </FormControl>
        <div className={classes.actions}>
          <Button
            key="save"
            aria-label={t.save}
            variant="contained"
            color="primary"
            className={classes.button}
            disabled={name === ''}
            onClick={currentOrganization === undefined ? handleAdd : handleSave}
          >
            {currentOrganization === undefined ? t.add : t.save}
            <SaveIcon className={classes.icon} />
          </Button>
        </div>
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
