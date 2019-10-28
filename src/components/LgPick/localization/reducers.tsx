// WARNING: This file is generated using ToReducer.xsl. Changes made here may be lost.
import LocalizedStrings from 'react-localization';
import * as type from './types';
import { ILocalizedStrings } from './model';

export const LgPickI18nClean = {
	"loaded": false,
	"lang": 'en',
	"languagePicker": new LocalizedStrings({
		"en": {
			"font": "Font",
			"script": "Script",
			"language": "Language",
			"selectLanguage": "Choose Language Details",
			"findALanguage": "Find a language by name, code, or country",
			"codeExplained": "Code Explained",
			"subtags": "Subtags",
			"details": "Details",
			"languageOf": "A Language of $1$2.",
			"inScript": " in the $1 script",
			"select": "Save",
			"cancel": "Cancel",
		}
	}),
};

export default function (state = LgPickI18nClean, action: type.LocalizationMsgs): ILocalizedStrings {
	switch (action.type) {
		case type.FETCH_LOCALIZATION:
			return {
				...state,
				loaded: true,
				languagePicker: new LocalizedStrings(action.payload.data.languagePicker) as any,
			};
		case type.SET_LANGUAGE:
			return {
				...state,
				lang: action.payload,
			};
		default:
			return state;
	}
}
