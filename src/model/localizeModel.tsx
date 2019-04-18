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
    "listOptions": string;
    "silTranscriberAdminProject": string;
    "search": string;
};

export interface ISnackbarStrings extends Localize.LocalizedStringsMethods {
    "undo": string;
};

export interface IUsertableStrings extends Localize.LocalizedStringsMethods {
    "silTranscriberAdmin": string;
    "chooseUser": string;
};

export interface IWelcomeStrings extends Localize.LocalizedStringsMethods {
    "silTranscriberAdmin": string;
    "thanksSigningUp": string;
    "StartTranscribingImmediately": string;
    "transcriberWeb": string;
    "transcriberDesktop": string;
    "ConfigureTranscriptionProject": string;
    "transcriberAdmin": string;
};

export interface IAlertStrings extends Localize.LocalizedStringsMethods {
    "confirmation": string;
    "areYouSure": string;
    "no": string;
    "yes": string;
};

export interface IOrganizationTableStrings extends Localize.LocalizedStringsMethods {
    "silTranscriberAdmin": string;
    "chooseOrganization": string;
};

export interface IProjectTableStrings extends Localize.LocalizedStringsMethods {
    "silTranscriberAdmin": string;
    "chooseProject": string;
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
	[key: string]: any;
};
