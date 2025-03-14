import React, { useEffect, useState } from 'react';
import {
  Typography,
  FormControlLabel,
  Checkbox,
  FormLabel,
  Box,
} from '@mui/material';
import { IProjectDialogState } from './ProjectDialog';
import { Options } from '.';
import RenderLogo from '../../../control/RenderLogo';
import { useSnackBar } from '../../../hoc/SnackBar';
import {
  orgDefaultPermissions,
  useOrganizedBy,
  useOrgDefaults,
  useRole,
} from '../../../crud';
import { useCanBeFlat } from '../../../crud/useCanBeFlat';
import { IVProjectStrings } from '../../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { vProjectSelector } from '../../../selector';
import { useGlobal } from '../../../context/GlobalContext';
import { Render } from '../../../assets/brands';
import GroupOrUserAssignment from '../../../control/GroupOrUserAssignment';
import { useGroupOrUser } from '../../../crud/useGroupOrUser';
import { TeamContext } from '../../../context/TeamContext';

const RenderRecommended = () => {
  const t = useSelector(vProjectSelector, shallowEqual);

  return (
    <Typography variant="caption" sx={{ display: 'flex' }}>
      <RenderLogo />
      {'\u00A0' + t.renderRecommended.replace('{0}', Render)}
    </Typography>
  );
};

export function ProjectExpansion(props: IProjectDialogState) {
  const { state, setState, addMode, team } = props;
  const {
    organizedBy,
    isPublic,
    sheetUser,
    sheetGroup,
    publishUser,
    publishGroup,
  } = state;
  const [initialized, setInitialized] = useState(false);
  const { getOrgDefault } = useOrgDefaults();
  const [organization] = useGlobal('organization');
  const ctx = React.useContext(TeamContext);
  const { personalTeam } = ctx.state;
  const [org] = useState(team ?? organization);
  const [permissions, setPermissions] = useState(false);
  const canBeFlat = useCanBeFlat();
  const { localizedOrganizedBy, fromLocalizedOrganizedBy } = useOrganizedBy();
  const { userIsSharedContentCreator } = useRole();
  const [localOrgBy, setLocalOrgBy] = useState('');
  const t: IVProjectStrings = useSelector(vProjectSelector, shallowEqual);
  const [options, setOptions] = React.useState([
    t.sections,
    t.sets,
    t.stories,
    t.scenes,
    t.pericopes,
  ]);
  const { SnackBar, showMessage } = useSnackBar();
  const [message] = useGlobal('snackMessage');
  const {
    assignedGroup: assignedSheetGroup,
    assignedUser: assignedSheetUser,
    editAssigned: editSheetAssigned,
    setEditAssigned: setEditSheetAssigned,
    setAssigned: setSheetAssigned,
  } = useGroupOrUser();
  const {
    assignedGroup: assignedPublishGroup,
    assignedUser: assignedPublishUser,
    editAssigned: editPublishAssigned,
    setEditAssigned: setEditPublishAssigned,
    setAssigned: setPublishAssigned,
  } = useGroupOrUser();

  useEffect(() => {
    setPermissions(
      getOrgDefault(orgDefaultPermissions, org) ?? org !== personalTeam
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org]);

  useEffect(() => {
    setSheetAssigned(sheetGroup, sheetUser);
    setPublishAssigned(publishGroup, publishUser);
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      initialized &&
      ((state.publishGroup ?? '') !== (assignedPublishGroup?.id ?? '') ||
        (state.publishUser ?? '') !== (assignedPublishUser?.id ?? ''))
    ) {
      setState((state) => ({
        ...state,
        publishGroup: assignedPublishGroup?.id,
        publishUser: assignedPublishUser?.id,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, assignedPublishGroup, assignedPublishUser]);

  useEffect(() => {
    if (
      initialized &&
      (state.sheetGroup !== assignedSheetGroup?.id ||
        state.sheetUser !== assignedSheetUser?.id)
    )
      setState((state) => ({
        ...state,
        sheetGroup: assignedSheetGroup?.id,
        sheetUser: assignedSheetUser?.id,
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, assignedSheetGroup, assignedSheetUser]);

  const handleShareable = (e: any, val: boolean) => {
    setState((state) => ({ ...state, isPublic: val }));
  };
  const handleLayoutChange = (val: string) => {
    if (!addMode && !canBeFlat()) {
      showMessage(t.cannotChangeLayout);
      return;
    }
    setState((state) => ({ ...state, flat: val === t.flat }));
  };

  const handleOrgByChange = (val: string) => {
    setState((state) => ({
      ...state,
      organizedBy: fromLocalizedOrganizedBy(val),
    }));
  };

  useEffect(() => {
    const addOption = (val: string) => {
      const newOptions = options.map((i) => i);
      newOptions.push(val);
      setOptions(newOptions);
    };

    var optionVal = localizedOrganizedBy(organizedBy, undefined);
    if (!options.includes(optionVal)) addOption(optionVal);
    setLocalOrgBy(optionVal);
  }, [localizedOrganizedBy, options, organizedBy]);

  const handleAddOption = (val: string) => {
    if (val.indexOf('/') === -1) {
      showMessage(t.correctformat);
      return false;
    }
    handleOrgByChange(val);
    return true;
  };

  const decoration = {
    [t.sets]: <RenderRecommended />,
    [t.flat]: <RenderRecommended />,
  };
  const handleEditsheetAssignedChange = (e: string) => {
    setEditSheetAssigned(e);
  };
  const handlePublishAssignedChange = (e: string) => {
    setEditPublishAssigned(e);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Options
        label={t.layout}
        defaultValue={state.flat ? t.flat : t.hierarchical}
        options={[t.hierarchical, t.flat]}
        onChange={handleLayoutChange}
        decorations={decoration}
        pt={0}
      />
      <Options
        label={t.organizedBy}
        defaultValue={localOrgBy}
        options={options}
        onChange={handleOrgByChange}
        addOption={options.length === 5 ? handleAddOption : undefined}
        otherLabel={t.other}
        decorations={decoration}
      />
      {!state.isPersonal && (
        <>
          {permissions && (
            <>
              <FormLabel sx={{ color: 'secondary.main' }}>
                {t.permissionSettings}
              </FormLabel>
              <GroupOrUserAssignment
                id={`sheet`}
                listAdmins={false}
                initAssignment={editSheetAssigned}
                onChange={handleEditsheetAssignedChange}
                required={false}
                label={t.permissionEditSheet}
                team={team}
              />
              <GroupOrUserAssignment
                id={`publish`}
                listAdmins={false}
                initAssignment={editPublishAssigned}
                onChange={handlePublishAssignedChange}
                required={false}
                label={t.permissionPublish}
                team={team}
              />
            </>
          )}
          <Box sx={{ pt: 2 }}>
            <FormLabel sx={{ color: 'secondary.main' }}>
              {t.sharedResources}
            </FormLabel>
            {!userIsSharedContentCreator && (
              <FormLabel>{t.howToPublic}</FormLabel>
            )}
            <FormControlLabel
              sx={{ display: 'flex', flexDirection: 'row', mx: 1, mb: 1 }}
              control={
                <Checkbox
                  id="checkbox-shared"
                  checked={isPublic}
                  onChange={handleShareable}
                  disabled={!userIsSharedContentCreator}
                />
              }
              label={t.isPublic}
            />
          </Box>
        </>
      )}
      <SnackBar message={message} />
    </Box>
  );
}
