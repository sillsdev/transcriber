import { useState, useEffect, useMemo, useRef } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { shallowEqual } from 'react-redux';
import {
  Section,
  SectionD,
  IAssignSectionStrings,
  ISharedStrings,
  OrgWorkflowStepD,
} from '../model';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { related, useOrganizedBy } from '../crud';
import {
  AddRecord,
  UpdateLastModifiedBy,
  UpdateRelatedRecord,
} from '../model/baseModel';
import { PriButton } from '../control';
import { useOrbitData } from '../hoc/useOrbitData';
import { useSelector } from 'react-redux';
import { assignSectionSelector, sharedSelector } from '../selector';
import GroupOrUserAssignment from '../control/GroupOrUserAssignment';
import { OrganizationSchemeD } from '../model/organizationScheme';
import { waitForIt } from '../utils/waitForIt';
import { OrganizationSchemeStepD } from '../model/organizationSchemeStep';
import { RecordOperation, RecordTransformBuilder } from '@orbit/records';

interface IProps {
  sections: Array<Section>;
  visible: boolean;
  closeMethod?: () => void;
  refresh?: () => void;
}

function AssignSection(props: IProps) {
  const { sections, visible, closeMethod, refresh } = props;
  const t: IAssignSectionStrings = useSelector(
    assignSectionSelector,
    shallowEqual
  );
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const allOrgSteps = useOrbitData<OrgWorkflowStepD[]>('orgworkflowstep');
  const [organization] = useGlobal('organization');
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [open, setOpen] = useState(visible);
  const [schemeName, setSchemeName] = useState('');
  const assignMap = useRef(new Map<string, string>());
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy, setOrganizedBy] = useState('');
  const orgSteps = useMemo(() => {
    return allOrgSteps?.filter(
      (s) => related(s, 'organization') === organization
    );
  }, [allOrgSteps, organization]);

  const handleAdd = async () => {
    let schemeRec = {
      type: 'organizationscheme',
      attributes: {
        name: schemeName,
      },
    } as OrganizationSchemeD;
    await memory.update((t) => [
      ...AddRecord(t, schemeRec, user, memory),
      ...UpdateRelatedRecord(
        t,
        schemeRec,
        'organization',
        'organization',
        organization,
        user
      ),
    ]);
    await waitForIt(
      'add scheme',
      () => Boolean(schemeRec.id),
      () => false,
      500
    );
    for (let [step, value] of Array.from(assignMap.current.entries())) {
      let stepRec = {
        type: 'organizationschemestep',
        attributes: {},
      } as OrganizationSchemeStepD;
      let t = new RecordTransformBuilder();
      let ops: RecordOperation[] = [...AddRecord(t, stepRec, user, memory)];
      ops.push(
        ...UpdateRelatedRecord(
          t,
          stepRec,
          'organizationscheme',
          'organizationscheme',
          schemeRec.id,
          user
        )
      );
      ops.push(
        ...UpdateRelatedRecord(
          t,
          stepRec,
          'orgWorkflowStep',
          'orgworkflowstep',
          step,
          user
        )
      );
      const [actorType, actorId] = value.split(':');
      const relateType = actorType === 'u' ? 'user' : 'group';
      ops.push(
        ...UpdateRelatedRecord(
          t,
          stepRec,
          relateType,
          relateType,
          actorId,
          user
        )
      );
      await memory.update(ops);
    }
    return schemeRec.id as string;
  };

  const assign = async (section: Section, schemeId: string) => {
    await memory.update((t) => [
      ...UpdateRelatedRecord(
        t,
        section as SectionD,
        'organizationScheme',
        'organizationscheme',
        schemeId,
        user
      ),
      ...UpdateLastModifiedBy(
        t,
        { type: 'plan', id: related(section, 'plan') },
        user
      ),
    ]);
  };

  const doAssigne = async (schemeId: string) => {
    for (let s of sections) {
      await assign(s, schemeId);
    }
  };

  const handleClose = async () => {
    const schemeId = await handleAdd();
    await doAssigne(schemeId);
    refresh?.();
    if (closeMethod) {
      closeMethod();
    }
    setOpen(false);
  };

  useEffect(() => {
    const newOrganizedBy = getOrganizedBy(false);
    if (organizedBy !== newOrganizedBy) {
      setOrganizedBy(newOrganizedBy);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (visible) setOpen(true);
  }, [visible]);

  const handleAssign = (step: string, value: string) => {
    console.log('handleAssign', step, value);
    assignMap.current.set(step, value);
  };

  return (
    <Dialog
      open={open}
      fullWidth={true}
      maxWidth="sm"
      onClose={handleClose}
      aria-labelledby="assignDlg"
      disableEnforceFocus
    >
      <DialogTitle id="assignDlg">
        {t.title.replace('{0}', organizedBy)}
      </DialogTitle>
      <DialogContent>
        <TextField
          id="scheme-name"
          label={t.schemeName}
          value={schemeName}
          onChange={(e) => setSchemeName(e.target.value)}
          sx={{ m: 1, width: '40ch' }}
        />
        {orgSteps
          .filter((s) => (s?.attributes?.sequencenum ?? -1) >= 0)
          .sort(
            (a, b) =>
              (a?.attributes?.sequencenum ?? 0) -
              (b?.attributes?.sequencenum ?? 0)
          )
          .map((s) => (
            <GroupOrUserAssignment
              listAdmins={true}
              key={s.id}
              label={t.assignment.replace('{0}', s?.attributes?.name ?? '')}
              onChange={(value) => handleAssign(s.id, value)}
            />
          ))}
      </DialogContent>
      <DialogActions>
        <PriButton
          id="assignClose"
          onClick={handleClose}
          disabled={!schemeName.trim()}
        >
          {ts.save}
        </PriButton>
      </DialogActions>
    </Dialog>
  );
}

export default AssignSection;
