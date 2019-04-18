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
			"books": "Books",
			"addManageBooks": "Add or manage books",
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
			"listOptions": "List Options",
			"silTranscriberAdminProject": "SIL Transcriber Admin - Project",
			"search": "Search…",
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
		}
	}),
	"welcome": new LocalizedStrings({
		"en": {
			"silTranscriberAdmin": "SIL Transcriber Admin",
			"thanksSigningUp": "Thanks for signing up!",
			"StartTranscribingImmediately": "Do you want to start transcribing immediately?",
			"transcriberWeb": "Transcriber Web",
			"transcriberDesktop": "Transcriber Desktop",
			"ConfigureTranscriptionProject": "Do you want to configure a transcription project?",
			"transcriberAdmin": "Transcriber Admin",
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
			"silTranscriberAdmin": "SIL Transcriber Admin",
			"chooseOrganization": "Choose Organization",
		}
	}),
	"projectTable": new LocalizedStrings({
		"en": {
			"silTranscriberAdmin": "SIL Transcriber Admin",
			"chooseProject": "Choose Project",
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
