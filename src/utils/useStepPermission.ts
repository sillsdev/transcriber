import { useEffect, useState } from 'react';
import { usePeerGroups } from '../components/Peers/usePeerGroups';
import { useGlobal } from '../context/GlobalContext';
import {
  findRecord,
  orgDefaultPermissions,
  related,
  useOrgDefaults,
  useRole,
} from '../crud';
import { useOrbitData } from '../hoc/useOrbitData';
import { OrganizationD, OrgWorkflowStep, SectionD } from '../model';
import OrganizationSchemeStep from '../model/organizationSchemeStep';

export const useStepPermissions = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const { userIsAdmin } = useRole();
  // default to true so canDOSectionStep doesn't falsely return true
  const [permissionsOn, setPermissionsOn] = useState(true);
  const { myGroups } = usePeerGroups();
  const { getOrgDefault } = useOrgDefaults();
  const [org] = useGlobal('organization');
  const orgsteps = useOrbitData<OrgWorkflowStep[]>('orgworkflowstep');
  const steps = useOrbitData<OrganizationSchemeStep[]>(
    'organizationschemestep'
  );
  const organizations = useOrbitData<OrganizationD[]>('organization');

  useEffect(() => {
    var on = getOrgDefault(orgDefaultPermissions);
    //leave this here until we figure out why it's getting reset often
    console.log('org permissions turned on?', on);
    setPermissionsOn(on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizations]);

  const canDoSectionStep = (stepId: string, section: SectionD) => {
    if (userIsAdmin || !permissionsOn) return true;
    var scheme = related(section, 'organizationScheme');
    if (!scheme) return false;
    var assigned = steps.find(
      (s) =>
        related(s, 'organizationscheme') === scheme &&
        related(s, 'orgWorkflowStep') === stepId
    );
    if (!assigned) return true;
    var assignedgroup = related(assigned, 'group');
    var assigneduser = related(assigned, 'user');

    return (
      ((assignedgroup &&
        myGroups.findIndex((g) => g.id === assignedgroup) > -1) ||
        (assigneduser && assigneduser === user)) ??
      false
    );
  };

  const canDoStep = (stepId: string, sectionId: string) => {
    if (userIsAdmin || !permissionsOn) return true;
    return canDoSectionStep(
      stepId,
      findRecord(memory, 'section', sectionId) as SectionD
    );
  };

  const canDoVernacular = (sectionId: string) => {
    if (userIsAdmin || !permissionsOn) return true;
    var step = orgsteps.find(
      (s) =>
        related(s, 'organization') === org &&
        s.attributes.tool === '{"tool": "record"}'
    );
    if (!step?.id) return false;
    return canDoStep(step.id, sectionId);
  };
  return { canDoVernacular, canDoSectionStep };
};
