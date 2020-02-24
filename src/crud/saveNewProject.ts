import { Project } from '../model';
import { TransformBuilder, Schema } from '@orbit/data';
import Memory from '@orbit/memory';

interface IProps {
  name: string;
  description: string;
  language: string;
  languageName: string;
  defaultFont: string;
  defaultFontSize: string;
  rtl: boolean;
  projectType: string;
  projectGroup?: string;
  organization: string;
  user: string;
  schema: Schema;
  memory: Memory;
}

export const saveNewProject = async (props: IProps) => {
  const {
    name,
    description,
    language,
    languageName,
    defaultFont,
    defaultFontSize,
    rtl,
    projectType,
    projectGroup,
    organization,
    user,
    schema,
    memory,
  } = props;

  let project: Project = {
    type: 'project',
    attributes: {
      name,
      description,
      uilanguagebcp47: null,
      language,
      languageName: languageName,
      defaultFont: defaultFont,
      defaultFontSize: defaultFontSize,
      rtl,
      allowClaim: true,
      isPublic: true,
    },
  } as Project;
  schema.initializeRecord(project);
  await memory.update((t: TransformBuilder) => [
    t.addRecord(project),
    t.replaceRelatedRecord({ type: 'project', id: project.id }, 'projecttype', {
      type: 'projecttype',
      id: projectType,
    }),
    t.replaceRelatedRecord(project, 'group', {
      type: 'group',
      id: projectGroup ? projectGroup : '',
    }),
    t.replaceRelatedRecord(project, 'organization', {
      type: 'organization',
      id: organization,
    }),
    t.replaceRelatedRecord(project, 'owner', {
      type: 'user',
      id: user,
    }),
  ]);
  return project;
};
