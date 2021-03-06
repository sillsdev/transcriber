import { useGlobal } from 'reactn';
import { Plan, Section } from '../../model';
import { related } from '../../crud';

const GetPlan = (sec: Section, plans: Plan[]) => {
  const [project] = useGlobal('project');
  const plan = plans.filter((p) => p.id === related(sec, 'plan'));
  if (plan.length < 1 || !plan[0].attributes) return undefined;
  if (related(plan[0], 'project') !== project) return undefined;
  return plan[0].attributes.name;
};

export default GetPlan;
