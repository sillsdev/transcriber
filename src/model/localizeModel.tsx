// WARNING: This file is generated using ToModel.xsl. Changes made here may be lost.
import * as Localize from 'react-localization';

export interface IAccessStrings extends Localize.LocalizedStringsMethods {
    "silTranscriberAccess": string;
    "accessSilTranscriber": string;
    "createAccount": string;
    "accessExistingAccount": string;
};

export interface IAdminpanelStrings extends Localize.LocalizedStringsMethods {
    "transcriberAdmin": string;
    "search": string;
    "organizations": string;
    "addManageOrganizations": string;
    "users": string;
    "addManageUsers": string;
    "projects": string;
    "addManageProjects": string;
    "media": string;
    "addManageAudioFiles": string;
    "books": string;
    "addManageBooks": string;
};

export interface ICreateorgStrings extends Localize.LocalizedStringsMethods {
    "silTranscriberAdmin": string;
    "createOrganization": string;
    "findExistingOrganization": string;
    "organizationName": string;
    "cancel": string;
    "continue": string;
};

export interface IMediacardStrings extends Localize.LocalizedStringsMethods {
    "section": string;
};

export interface IProjectstatusStrings extends Localize.LocalizedStringsMethods {
    "silTranscriberAdminProject": string;
    "search": string;
    "listOptions": string;
    "settings": string;
    "team": string;
    "books": string;
    "projectPlans": string;
    "sets": string;
    "tasks": string;
    "media": string;
    "integrations": string;
    "newProject": string;
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

export interface IWelcomeStrings extends Localize.LocalizedStringsMethods {
    "transcriberAdmin": string;
    "thanksSigningUp": string;
    "StartTranscribingImmediately": string;
    "transcriberWeb": string;
    "transcriberDesktop": string;
    "ConfigureTranscriptionProject": string;
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
    "tasksCompleted": string;
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

export interface IBookTableStrings extends Localize.LocalizedStringsMethods {
    "name": string;
    "type": string;
    "sets": string;
    "taks": string;
    "delete": string;
    "silTranscriberAdmin": string;
    "chooseBook": string;
};

export interface ILocalizedStrings {
	loaded: boolean;
	lang: string;
	access: IAccessStrings;
	adminpanel: IAdminpanelStrings;
	createorg: ICreateorgStrings;
	mediacard: IMediacardStrings;
	projectstatus: IProjectstatusStrings;
	snackbar: ISnackbarStrings;
	usertable: IUsertableStrings;
	welcome: IWelcomeStrings;
	alert: IAlertStrings;
	organizationTable: IOrganizationTableStrings;
	projectTable: IProjectTableStrings;
	chart: IChartStrings;
	projectSettings: IProjectSettingsStrings;
	bookTable: IBookTableStrings;
	[key: string]: any;
};
