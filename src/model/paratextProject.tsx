export interface ParatextProject {
  ParatextId: string;
  Name: string;
  LanguageTag: string;
  LanguageName: string;
  ProjectIds: number[];
  IsConnected: boolean;
  IsConnectable: boolean;
  CurrentUserRole: string;
}
export default ParatextProject;
