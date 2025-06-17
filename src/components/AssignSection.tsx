import { useState, useEffect, useMemo, useContext } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { shallowEqual } from 'react-redux';
import {
  IAssignSectionStrings,
  ISharedStrings,
  OrgWorkflowStepD,
  SectionD,
} from '../model';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  LinearProgress,
} from '@mui/material';
import {
  orgDefaultPermissions,
  pullTableList,
  related,
  remoteId,
  useOrganizedBy,
  useOrgDefaults,
} from '../crud';
import { AddRecord, UpdateRelatedRecord } from '../model/baseModel';
import { AltButton, GrowingSpacer, PriButton } from '../control';
import { useOrbitData } from '../hoc/useOrbitData';
import { useSelector } from 'react-redux';
import { assignSectionSelector, sharedSelector } from '../selector';
import GroupOrUserAssignment from '../control/GroupOrUserAssignment';
import { OrganizationSchemeD } from '../model/organizationScheme';
import { waitForIt } from '../utils/waitForIt';
import { OrganizationSchemeStepD } from '../model/organizationSchemeStep';
import {
  RecordKeyMap,
  RecordOperation,
  RecordTransformBuilder,
} from '@orbit/records';
import Confirm from './AlertDialog';
import { useWfLabel } from '../utils/useWfLabel';
import { axiosPatch } from '../utils/axios';
import { TokenContext } from '../context/TokenProvider';
import IndexedDBSource from '@orbit/indexeddb';
import JSONAPISource from '@orbit/jsonapi';
import logError, { Severity } from '../utils/logErrorService';
import { useWaitForRemoteQueue } from '../utils/useWaitForRemoteQueue';

enum ConfirmType {
  delete,
  modify,
}

interface IProps {
  sections: Array<SectionD>;
  scheme?: string; // id of scheme to edit
  visible: boolean;
  closeMethod?: (cancel?: boolean) => void;
  refresh?: () => void;
  readOnly?: boolean;
  inChange?: boolean; // if true, the dialog is opened from a change request
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
  const allSections = useOrbitData<SectionD[]>('section');
  const [organization] = useGlobal('organization');
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const remote = coordinator?.getSource('remote') as JSONAPISource;
  const backup = coordinator?.getSource('backup') as IndexedDBSource;
  const [errorReporter] = useGlobal('errorReporter');
  const [busy, setBusy] = useGlobal('remoteBusy');
  const [user] = useGlobal('user');
  const [org] = useGlobal('organization');
  const [open, setOpen] = useState(visible);
  const [schemeName, setSchemeName] = useState('');
  const [assignArr, setAssignArr] = useState<[string, string][]>([]);
  const [changed, setChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const { getOrganizedBy } = useOrganizedBy();
  const [organizedBy, setOrganizedBy] = useState('');
  const [confirm, setConfirm] = useState<ConfirmType>();
  const [confirmMsg, setConfirmMsg] = useState('');
  const getWfLabel = useWfLabel();
  const { getOrgDefault } = useOrgDefaults();
  const waitForRemoteQueue = useWaitForRemoteQueue();
  const isPermission = useMemo(
    () => Boolean(getOrgDefault(orgDefaultPermissions)),
    [getOrgDefault]
  );
  const token = useContext(TokenContext).state.accessToken ?? '';

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
      .filter((s) => s.id !== scheme && related(s, 'organization') === org)
      .some((s) => s.attributes?.name === schemeName.trim());
  }, [scheme, schemeName, schemes, org]);

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
        if (!step) continue;
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

  const doAssign = async (schemeId: string) => {
    if (!sections.some((s) => related(s, 'organizationScheme') !== schemeId))
      return;
    var ids = sections.map(
      (s) => remoteId('section', s.id, memory.keyMap as RecordKeyMap) as string
    );
    var list = ids.join('|');
    var id = remoteId(
      'organizationscheme',
      schemeId,
      memory.keyMap as RecordKeyMap
    );
    await waitForRemoteQueue('steps created');
    try {
      await axiosPatch(`sections/assign/${id}/${list}`, undefined, token);
      await pullTableList(
        'section',
        ids,
        memory,
        remote,
        backup,
        errorReporter
      );
    } catch (err) {
      logError(Severity.error, errorReporter, err as Error);
    }
  };

  const justClose = (cancel?: boolean) => {
    setChanged(false);
    setSaving(false);
    setConfirm(undefined);
    refresh?.();
    closeMethod?.(cancel);
    setOpen(false);
  };

  const confirmDelete = async () => {
    if (scheme) {
      //remove scheme assignment on sections
      await memory.update((t) =>
        impactedSections.map((s) =>
          t.replaceRelatedRecord(s, 'organizationScheme', null)
        )
      );
      //remove steps used by scheme
      await memory.update((t) =>
        steps
          .filter((s) => related(s, 'organizationscheme') === scheme)
          .map((s) => t.removeRecord(s))
      );
      //remove scheme
      await memory.update((t) =>
        t.removeRecord({ type: 'organizationscheme', id: scheme })
      );
      setSchemeName('');
    }
    justClose();
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
    setSaving(true);
    setBusy(true);
    const schemeId = await handleAdd();
    await doAssign(schemeId);
    setBusy(false);
    justClose();
  };

  const handleClose = async () => {
    if (readOnly || !schemeName.trim() || isNameDuplicate) {
      justClose();
      return;
    }
    const nImp = impactedSections.length;
    if (changed && nImp > sections.length) {
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
          const step = related(s, 'orgWorkflowStep');
          if (related(s, 'group')) {
            assignMap.set(step, 'g:' + related(s, 'group'));
          } else if (related(s, 'user')) {
            assignMap.set(step, 'u:' + related(s, 'user'));
          }
        }
        setAssignArr(Array.from(assignMap.entries()));
      }
    } else {
      setSchemeName('');
      setAssignArr([]);
    }
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
    const assignMap = new Map<string, string>(assignArr);
    assignMap.set(step, value);
    setAssignArr(Array.from(assignMap.entries()));
    setChanged(true);
  };

  const handleNameChange = (name: string) => {
    setSchemeName(name);
    setChanged(true);
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
          {isPermission ? t.title : t.title2}
        </DialogTitle>
        <DialogContent>
          <TextField
            id="scheme-name"
            label={isPermission ? t.schemeName : t.schemeName2}
            value={schemeName}
            helperText={
              isNameDuplicate && schemeName.trim() !== ''
                ? isPermission
                  ? t.duplicateName
                  : t.duplicateName2
                : ''
            }
            onChange={(e) => handleNameChange(e.target.value)}
            disabled={readOnly || saving}
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
                label={(isPermission ? t.assignment : t.assignment2).replace(
                  '{0}',
                  getWfLabel(s?.attributes?.name ?? '')
                )}
                emptyValue={isPermission ? t.noRestriction : t.noAssignment}
                initAssignment={assignArr.find((a) => a[0] === s.id)?.[1] ?? ''}
                onChange={(value) => handleAssign(s.id, value)}
                disabled={readOnly || saving}
              />
            ))}
        </DialogContent>
        {busy && <LinearProgress variant="indeterminate" />}
        <DialogActions>
          {scheme && !readOnly && !saving && (
            <AltButton color="warning" onClick={handleDelete}>
              {t.delete}
            </AltButton>
          )}
          <GrowingSpacer />
          {!saving && (
            <AltButton onClick={() => justClose(true)}>
              {readOnly ? ts.close : ts.cancel}
            </AltButton>
          )}
          {!readOnly && (
            <PriButton
              id="assignClose"
              onClick={handleClose}
              disabled={
                !schemeName.trim() ||
                isNameDuplicate ||
                !(props.inChange || changed) ||
                saving
              }
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
