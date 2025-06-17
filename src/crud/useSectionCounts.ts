import { Section, Passage } from '../model';
import { related } from '.';
import { PassageTypeEnum } from '../model/passageType';

export const useSectionCounts = (
  plan: string,
  sections: Section[],
  passages: Passage[]
) => {
  const planSections = plan
    ? sections.filter((s) => related(s, 'plan') === plan)
    : ([] as Section[]);
  const planSectionIds = planSections
    .filter((s) => s.attributes.sequencenum > 0)
    .map((p) => p.id);
  const assigned = planSections.filter((s) => related(s, 'organizationScheme'));
  const planPassages = passages.filter(
    (p) =>
      planSectionIds.includes(related(p, 'section')) &&
      !p.attributes.reference.startsWith(PassageTypeEnum.CHAPTERNUMBER)
  );

  return [planSectionIds, assigned, planPassages];
};
