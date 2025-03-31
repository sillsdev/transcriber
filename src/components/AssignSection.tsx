import { useState, useEffect, useMemo } from 'react';
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
import { AltButton, GrowingSpacer, PriButton } from '../control';
import { useOrbitData } from '../hoc/useOrbitData';
import { useSelector } from 'react-redux';
import { assignSectionSelector, sharedSelector } from '../selector';
import GroupOrUserAssignment from '../control/GroupOrUserAssignment';
import { OrganizationSchemeD } from '../model/organizationScheme';
import { waitForIt } from '../utils/waitForIt';
import { OrganizationSchemeStepD } from '../model/organizationSchemeStep';
import { RecordOperation, RecordTransformBuilder } from '@orbit/records';
import Confirm from './AlertDialog';

enum ConfirmType {
  delete,
  modify,
}

interface IProps {
  sections: Array<Section>;
  scheme?: string; // id of scheme to edit
  visible: boolean;
  closeMethod?: () => void;
  refresh?: () => void;
  readOnly?: boolean;
}

function AssignSection(props: IProps) {
  const { sections, scheme, visible, closeMethod, readOnly, refresh } = props;
  const t: IAssignSectionStrings = useSelector(
    assignSectionSelector,
    shallowEqual
  );
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const allOrgSteps = useOrbitData<OrgWorkflowStepD[]>('orgworkflowstep');
  const schemes = useOrbitData<OrganizationSchemeD[]>('organizationscheme');
  const steps = useOrbitData<OrganizationSchemeStepD[]>(
    'organizationschemestep'
  );
  const allSections = useOrbitData<Section[]>('section');
  const [organization] = useGlobal('organization');
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const [open, setOpen] = useState(visible);
  const [schemeName, setSchemeName] = useState('');
  const [assignArr, setAssignArr] = useState<[string, string][]>([]);
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy, setOrganizedBy] = useState('');
  const [confirm, setConfirm] = useState<ConfirmType>();
  const [confirmMsg, setConfirmMsg] = useState('');
  const orgSteps = useMemo(() => {
    return allOrgSteps?.filter(
      (s) => related(s, 'organization') === organization
    );
  }, [allOrgSteps, organization]);
  const impactedSections = useMemo(() => {
    return allSections?.filter(
      (s) => related(s, 'organizationScheme') === scheme
    );
  }, [allSections, scheme]);

  const isNameDuplicate = useMemo(() => {
    return schemes
      .filter((s) => s.id !== scheme)
      .some((s) => s.attributes?.name === schemeName.trim());
  }, [scheme, schemeName, schemes]);

  interface IStepProps {
    t: RecordTransformBuilder;
    ops: RecordOperation[];
    schemeRec: OrganizationSchemeD;
    step: string;
    relateType: string;
    actorId: string;
    value: string;
  }
  const createSchemeStep = ({
    t,
    ops,
    schemeRec,
    step,
    relateType,
    actorId,
  }: IStepProps) => {
    const stepRec = {
      type: 'organizationschemestep',
      attributes: {},
    } as OrganizationSchemeStepD;
    ops.push(...AddRecord(t, stepRec, user, memory));
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
    ops.push(
      ...UpdateRelatedRecord(t, stepRec, relateType, relateType, actorId, user)
    );
  };

  const handleAdd = async () => {
    let schemeRec = schemes.find((s) => s.id === scheme) as
      | OrganizationSchemeD
      | undefined;
    if (schemeRec !== undefined) {
      // update name if changed
      if (schemeName !== schemeRec?.attributes?.name) {
        await memory.update((t) =>
          t.replaceAttribute(
            schemeRec as OrganizationSchemeD,
            'name',
            schemeName.trim()
          )
        );
      }
      for (let [step, value] of assignArr) {
        if (!step || !value) continue;
        const [actorType, actorId] = value.split(':');
        const relateType = actorType === 'u' ? 'user' : 'group';
        let t = new RecordTransformBuilder();
        let ops: RecordOperation[] = [];
        let stepRec = steps.find(
          (s) =>
            related(s, 'organizationscheme') === scheme &&
            related(s, 'orgWorkflowStep') === step
        ) as OrganizationSchemeStepD | undefined;
        // if the step permission exists, update it
        if (stepRec !== undefined) {
          const curId = related(stepRec, relateType);
          if (curId !== actorId) {
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
          }
          // changing the type user <=> group, remove old type
          const otherType = actorType === 'u' ? 'group' : 'user';
          const otherId = related(stepRec, otherType);
          if (otherId !== '') {
            ops.push(
              ...UpdateRelatedRecord(t, stepRec, otherType, otherType, '', user)
            );
          }
        } else {
          createSchemeStep({
            t,
            ops,
            schemeRec,
            step,
            relateType,
            actorId,
            value,
          });
        }
        if (ops.length > 0) {
          await memory.update(ops);
        }
      }

      return schemeRec.id as string;
    }
    schemeRec = {
      type: 'organizationscheme',
      attributes: {
        name: schemeName.trim(),
      },
    } as OrganizationSchemeD;
    await memory.update((t) => [
      ...AddRecord(t, schemeRec as OrganizationSchemeD, user, memory),
      ...UpdateRelatedRecord(
        t,
        schemeRec as OrganizationSchemeD,
        'organization',
        'organization',
        organization,
        user
      ),
    ]);
    await waitForIt(
      'add scheme',
      () => Boolean(schemeRec?.id),
      () => false,
      500
    );
    for (let [step, value] of assignArr) {
      let t = new RecordTransformBuilder();
      let ops: RecordOperation[] = [];
      const [actorType, actorId] = value.split(':');
      const relateType = actorType === 'u' ? 'user' : 'group';
      createSchemeStep({
        t,
        ops,
        schemeRec,
        step,
        relateType,
        actorId,
        value,
      });
      await memory.update(ops);
    }
    return schemeRec.id as string;
  };

  const assign = async (section: Section, schemeId: string) => {
    if (related(section, 'organizationScheme') === schemeId) return;
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

  const doAssign = async (schemeId: string) => {
    for (let s of sections) {
      await assign(s, schemeId);
    }
  };

  const handleCancel = () => {
    if (closeMethod) {
      closeMethod();
    }
    setOpen(false);
  };

  const confirmDelete = async () => {
    if (scheme) {
      await memory.update((t) =>
        t.removeRecord({ type: 'organizationscheme', id: scheme })
      );
    }
    refresh?.();
    if (closeMethod) {
      closeMethod();
    }
    setOpen(false);
  };

  const handleDelete = async () => {
    if (impactedSections.length > 0) {
      const nImp = impactedSections.length;
      setConfirmMsg(
        t.deleteSections
          .replace('{0}', nImp.toString())
          .replace('{1}', getOrganizedBy(nImp === 1))
      );
      setConfirm(ConfirmType.delete);
      return;
    }
    await confirmDelete();
  };

  const confirmClose = async () => {
    const schemeId = await handleAdd();
    await doAssign(schemeId);
    refresh?.();
    if (closeMethod) {
      closeMethod();
    }
    setOpen(false);
  };

  const handleClose = async () => {
    const nImp = impactedSections.length;
    if (nImp > sections.length) {
      const nSecs = sections.length;
      setConfirmMsg(
        t.modifySections
          .replace('{0}', nSecs.toString())
          .replace('{1}', getOrganizedBy(nSecs === 1))
          .replace('{2}', nImp.toString())
          .replace('{3}', getOrganizedBy(nImp === 1))
      );
      setConfirm(ConfirmType.modify);
      return;
    }
    await confirmClose();
  };

  useEffect(() => {
    if (scheme) {
      const schemeRec = schemes.find((s) => s.id === scheme);
      if (schemeRec) {
        setSchemeName(schemeRec.attributes?.name);
      }
      if (steps?.length > 0) {
        const assignMap = new Map<string, string>();
        for (let s of steps.filter(
          (s) => related(s, 'organizationscheme') === scheme
        )) {
          if (related(s, 'group')) {
            assignMap.set(
              related(s, 'orgWorkflowStep'),
              'g:' + related(s, 'group')
            );
          } else if (related(s, 'user')) {
            assignMap.set(
              related(s, 'orgWorkflowStep'),
              'u:' + related(s, 'user')
            );
          }
        }
        setAssignArr(Array.from(assignMap.entries()));
      }
    } else {
      setSchemeName('');
      setAssignArr([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, schemes, scheme]);

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
    const assignMap = new Map<string, string>(assignArr);
    assignMap.set(step, value);
    setAssignArr(Array.from(assignMap.entries()));
  };

  return (
    <>
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
            helperText={
              isNameDuplicate && schemeName.trim() !== '' ? t.duplicateName : ''
            }
            onChange={(e) => setSchemeName(e.target.value)}
            disabled={readOnly}
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
                initAssignment={assignArr.find((a) => a[0] === s.id)?.[1] ?? ''}
                onChange={(value) => handleAssign(s.id, value)}
                disabled={readOnly}
              />
            ))}
        </DialogContent>
        <DialogActions>
          {scheme && !readOnly && (
            <AltButton color="warning" onClick={handleDelete}>
              {t.delete}
            </AltButton>
          )}
          <GrowingSpacer />
          <AltButton onClick={handleCancel}>
            {readOnly ? ts.close : ts.cancel}
          </AltButton>
          {!readOnly && (
            <PriButton
              id="assignClose"
              onClick={handleClose}
              disabled={!schemeName.trim() || isNameDuplicate}
            >
              {ts.save}
            </PriButton>
          )}
        </DialogActions>
      </Dialog>
      {confirm !== undefined && (
        <Confirm
          title={
            confirm === ConfirmType.modify ? t.confirmModify : t.confirmDelete
          }
          text={confirmMsg}
          noResponse={() => setConfirm(undefined)}
          yesResponse={() => {
            if (confirm === ConfirmType.modify) confirmClose();
            else confirmDelete();
          }}
        />
      )}
    </>
  );
}

export default AssignSection;
