// WARNING: This file is generated using ToReducer.xsl. Changes made here may be lost.
import LocalizedStrings from 'react-localization';
import { FETCH_LOCALIZATION, SET_LANGUAGE } from '../actions/types';
import { ILocalizedStrings } from '../model/localizeModel';

const initialState = {
	"loaded": false,
	"lang": 'en',
	"access": new LocalizedStrings({
		"en": {
			"silTranscriberAccess": "SIL Transcriber Access",
			"accessSilTranscriber": "Access SIL Transcriber",
			"createAccount": "Create an Account",
			"accessExistingAccount": "Access with existing Account",
		}
	}),
	"adminpanel": new LocalizedStrings({
		"en": {
			"transcriberAdmin": "Transcriber Admin",
			"search": "Search…",
			"organizations": "Organizations",
			"addManageOrganizations": "Add or manage organizations",
			"users": "Users",
			"addManageUsers": "Add or manage users",
			"projects": "Projects",
			"addManageProjects": "Add or manage projects",
			"media": "Media",
			"addManageAudioFiles": "Add or manage audio files",
			"plans": "Plans",
			"addManagePlans": "Add or manage plans",
		}
	}),
	"createorg": new LocalizedStrings({
		"en": {
			"silTranscriberAdmin": "SIL Transcriber Admin",
			"createOrganization": "Create Organization",
			"findExistingOrganization": "Find an existing Organization",
			"organizationName": "Organization Name",
			"cancel": "Cancel",
			"continue": "Continue",
		}
	}),
	"mediacard": new LocalizedStrings({
		"en": {
			"section": "Section",
		}
	}),
	"projectstatus": new LocalizedStrings({
		"en": {
			"silTranscriberAdminProject": "SIL Transcriber Admin - Project",
			"search": "Search…",
			"listOptions": "List Options",
			"settings": "Settings",
			"team": "Team",
			"plans": "Plans",
			"projectPlans": "Project Plans",
			"sections": "Sections",
			"passages": "Passages",
			"media": "Media",
			"integrations": "Integrations",
			"newProject": "New Project",
		}
	}),
	"snackbar": new LocalizedStrings({
		"en": {
			"undo": "UNDO",
		}
	}),
	"usertable": new LocalizedStrings({
		"en": {
			"silTranscriberAdmin": "SIL Transcriber Admin",
			"chooseUser": "Choose User",
			"name": "Name",
			"email": "Email",
			"locale": "Locale",
			"phone": "Phone",
			"timezone": "Timezone",
			"cancel": "Cancel",
			"continue": "Continue",
		}
	}),
	"welcome": new LocalizedStrings({
		"en": {
			"transcriberAdmin": "Transcriber Admin",
			"thanksSigningUp": "Thanks for signing up!",
			"StartTranscribingImmediately": "Do you want to start transcribing immediately?",
			"transcriberWeb": "Transcriber Web",
			"transcriberDesktop": "Transcriber Desktop",
			"ConfigureTranscriptionProject": "Do you want to configure a transcription project?",
		}
	}),
	"alert": new LocalizedStrings({
		"en": {
			"confirmation": "Confirmation",
			"areYouSure": "Are you sure?",
			"no": "No",
			"yes": "Yes",
		}
	}),
	"organizationTable": new LocalizedStrings({
		"en": {
			"transcriberAdmin": "SIL Transcriber Admin",
			"chooseOrganization": "Choose Organization",
			"name": "Name",
		}
	}),
	"projectTable": new LocalizedStrings({
		"en": {
			"silTranscriberAdmin": "SIL Transcriber Admin",
			"chooseProject": "Choose Project",
			"name": "Name",
			"description": "Description",
			"language": "Language",
			"delete": "Delete",
		}
	}),
	"chart": new LocalizedStrings({
		"en": {
			"passagesCompleted": "Passages Completed",
			"totalTransactions": "Total Transactions",
		}
	}),
	"projectSettings": new LocalizedStrings({
		"en": {
			"general": "General",
			"name": "Name",
			"description": "Description",
			"projectType": "Project Type",
			"selectProjectType": "Please select your project type",
			"language": "Language",
			"transcriptionLanguage": "Transcription Language",
			"preferredLanguageName": "Preferred Language Name",
			"uiLanguagInUserProfile": "(User interface languages are set in the user profile.)",
			"textEditor": "Text Editor",
			"defaultFont": "Default Font",
			"selectDefaultFont": "Please select the preferred default font",
			"needFont": "Need Font",
			"addMissingFont": "Can't find the font you need?",
			"defaultFontSize": "Default Font Size",
			"selectFontSize": "Please select the default font size",
			"rightToLeft": "Right to left?",
			"add": "Add",
			"save": "Save",
		}
	}),
	"planTable": new LocalizedStrings({
		"en": {
			"name": "Name",
			"type": "Type",
			"sections": "Sections",
			"taks": "Passages",
			"action": "Action",
			"silTranscriberAdmin": "SIL Transcriber Admin",
			"choosePlan": "Choose a Project Plan",
		}
	}),
};

export default function (state = initialState, action: any): ILocalizedStrings {
	switch (action.type) {
		case FETCH_LOCALIZATION:
			return {
				...state,
				"loaded": true,
				"access" : new LocalizedStrings(action.payload.data.access),
				"adminpanel" : new LocalizedStrings(action.payload.data.adminpanel),
				"createorg" : new LocalizedStrings(action.payload.data.createorg),
				"mediacard" : new LocalizedStrings(action.payload.data.mediacard),
				"projectstatus" : new LocalizedStrings(action.payload.data.projectstatus),
				"snackbar" : new LocalizedStrings(action.payload.data.snackbar),
				"usertable" : new LocalizedStrings(action.payload.data.usertable),
				"welcome" : new LocalizedStrings(action.payload.data.welcome),
				"alert" : new LocalizedStrings(action.payload.data.alert),
				"organizationTable" : new LocalizedStrings(action.payload.data.organizationTable),
				"projectTable" : new LocalizedStrings(action.payload.data.projectTable),
				"chart" : new LocalizedStrings(action.payload.data.chart),
				"projectSettings" : new LocalizedStrings(action.payload.data.projectSettings),
				"planTable" : new LocalizedStrings(action.payload.data.planTable),
			};
		case SET_LANGUAGE:
			return {
				...state,
				lang: action.payload,
			};
		default:
			return state;
	}
}
