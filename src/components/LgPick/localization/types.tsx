import { ILocalizedStrings } from './model';

// Describing the different ACTION NAMES available
export const FETCH_LOCALIZATION = 'FETCH_LOCALIZATION';
export const SET_LANGUAGE = 'SET_LANGUAGE';

interface FetchLocalizationMsg {
  type: typeof FETCH_LOCALIZATION;
  payload: { data: ILocalizedStrings };
}

interface SetLanugageMsg {
  type: typeof SET_LANGUAGE;
  payload: string;
}

export type LocalizationMsgs = FetchLocalizationMsg | SetLanugageMsg;
