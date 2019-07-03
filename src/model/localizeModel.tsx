// WARNING: This file is generated using ToModel.xsl. Changes made here may be lost.
import * as Localize from 'react-localization';

export interface IAccessStrings extends Localize.LocalizedStringsMethods {
    "silTranscriberAccess": string;
    "accessSilTranscriber": string;
    "createAccount": string;
    "accessExistingAccount": string;
};

export interface ISnackbarStrings extends Localize.LocalizedStringsMethods {
    "undo": string;
};

export interface IUsertableStrings extends Localize.LocalizedStringsMethods {
    "silTranscriberAdmin": string;
    "chooseUser": string;
    "name": string;
    "email": string;
    "locale": string;
    "phone": string;
    "timezone": string;
    "cancel": string;
    "continue": string;
};

export interface IAlertStrings extends Localize.LocalizedStringsMethods {
    "confirmation": string;
    "areYouSure": string;
    "no": string;
    "yes": string;
};

export interface IOrganizationTableStrings extends Localize.LocalizedStringsMethods {
    "transcriberAdmin": string;
    "chooseOrganization": string;
    "name": string;
};

export interface IProjectTableStrings extends Localize.LocalizedStringsMethods {
    "silTranscriberAdmin": string;
    "chooseProject": string;
    "name": string;
    "description": string;
    "language": string;
    "delete": string;
};

export interface IChartStrings extends Localize.LocalizedStringsMethods {
    "passagesCompleted": string;
    "totalTransactions": string;
};

export interface IProjectSettingsStrings extends Localize.LocalizedStringsMethods {
    "general": string;
    "name": string;
    "description": string;
    "projectType": string;
    "selectProjectType": string;
    "language": string;
    "transcriptionLanguage": string;
    "preferredLanguageName": string;
    "uiLanguagInUserProfile": string;
    "textEditor": string;
    "defaultFont": string;
    "selectDefaultFont": string;
    "needFont": string;
    "addMissingFont": string;
    "defaultFontSize": string;
    "selectFontSize": string;
    "rightToLeft": string;
    "add": string;
    "save": string;
};

export interface IPlanTableStrings extends Localize.LocalizedStringsMethods {
    "name": string;
    "type": string;
    "sections": string;
    "taks": string;
    "action": string;
    "silTranscriberAdmin": string;
    "choosePlan": string;
};

export interface IPlanSheetStrings extends Localize.LocalizedStringsMethods {
    "action": string;
    "delete": string;
    "move": string;
    "copy": string;
    "attachMedia": string;
    "addSection": string;
    "addPassage": string;
    "save": string;
};

export interface IScriptureTableStrings extends Localize.LocalizedStringsMethods {
    "section": string;
    "title": string;
    "passage": string;
    "book": string;
    "reference": string;
    "description": string;
};

export interface IAssignmentTableStrings extends Localize.LocalizedStringsMethods {
    "title": string;
    "section": string;
    "sectionstate": string;
    "passages": string;
    "passagestate": string;
    "user": string;
    "role": string;
    "action": string;
    "assignSection": string;
    "delete": string;
    "filter": string;
    "group": string;
    "transcriber": string;
    "reviewer": string;
};

export interface IPlanTabsStrings extends Localize.LocalizedStringsMethods {
    "sectionsPassages": string;
    "media": string;
    "assignments": string;
    "transcriptions": string;
};

export interface IPlanAddStrings extends Localize.LocalizedStringsMethods {
    "name": string;
    "addPlan": string;
    "newPlanTask": string;
    "planType": string;
    "selectPlanType": string;
    "cancel": string;
    "add": string;
    "save": string;
    "newPlan": string;
    "selectAPlanType": string;
    "editPlan": string;
};

export interface IMediaTabStrings extends Localize.LocalizedStringsMethods {
    "action": string;
    "delete": string;
    "download": string;
    "changeVersion": string;
    "attachPassage": string;
    "uploadMedia": string;
    "fileName": string;
    "sectionId": string;
    "sectionName": string;
    "book": string;
    "reference": string;
    "duration": string;
    "size": string;
    "version": string;
    "section": string;
    "date": string;
    "filter": string;
};

export interface IPassageMediaStrings extends Localize.LocalizedStringsMethods {
    "attachAvailableMedia": string;
    "attachMediaToPassages": string;
    "choosePassage": string;
    "availableMedia": string;
    "attachments": string;
    "close": string;
};

export interface IMainStrings extends Localize.LocalizedStringsMethods {
    "silTranscriberAdmin": string;
    "search": string;
    "organization": string;
    "usersAndGroups": string;
    "passages": string;
    "media": string;
    "plans": string;
    "team": string;
    "settings": string;
    "integrations": string;
    "project": string;
};

export interface ILocalizedStrings {
	loaded: boolean;
	lang: string;
	access: IAccessStrings;
	snackbar: ISnackbarStrings;
	usertable: IUsertableStrings;
	alert: IAlertStrings;
	organizationTable: IOrganizationTableStrings;
	projectTable: IProjectTableStrings;
	chart: IChartStrings;
	projectSettings: IProjectSettingsStrings;
	planTable: IPlanTableStrings;
	planSheet: IPlanSheetStrings;
	scriptureTable: IScriptureTableStrings;
	assignmentTable: IAssignmentTableStrings;
	planTabs: IPlanTabsStrings;
	planAdd: IPlanAddStrings;
	mediaTab: IMediaTabStrings;
	passageMedia: IPassageMediaStrings;
	main: IMainStrings;
	[key: string]: any;
};
