export interface ParatextProject {
  ParatextId: string;
  Name: string;
  ShortName: string;
  LanguageTag: string;
  LanguageName: string;
  ProjectIds: string[];
  IsConnectable: boolean;
  CurrentUserRole: string;
  ProjectType: string;
  BaseProject: string;
}
export default ParatextProject;
