import { Section, Passage } from '../model';
import { related } from '.';

export const useSectionCounts = (
  plan: string,
  sections: Section[],
  passages: Passage[]
) => {
  const planSections = plan
    ? sections.filter((s) => related(s, 'plan') === plan)
    : ([] as Section[]);
  const planSectionIds = planSections.map((p) => p.id);
  const assigned = planSections.filter(
    (s) => related(s, 'transcriber') || related(s, 'editor')
  );
  const planPassages = passages.filter((p) =>
    planSectionIds.includes(related(p, 'section'))
  );

  return [planSectionIds, assigned, planPassages];
};
