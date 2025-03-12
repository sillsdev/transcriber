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
import { useOrganizedBy, useRole } from '../../../crud';
import { useCanBeFlat } from '../../../crud/useCanBeFlat';
import { IVProjectStrings } from '../../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { vProjectSelector } from '../../../selector';
import { useGlobal } from '../../../context/GlobalContext';
import { Render } from '../../../assets/brands';

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
  const { state, setState, addMode } = props;
  const { organizedBy, isPublic } = state;
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
      )}
      <SnackBar message={message} />
    </Box>
  );
}
