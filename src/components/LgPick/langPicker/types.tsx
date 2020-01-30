// Describing the shape of the book names's slice of state
export interface LangTag {
  full: string;
  iana?: string;
  iso639_3?: string;
  localname?: string;
  name: string;
  names?: Array<string>;
  nophonvars?: boolean;
  region?: string;
  regionname?: string;
  regions?: Array<string>;
  script: string;
  sldr: boolean;
  tag: string;
  tags?: Array<string>;
  variants?: Array<string>;
  defaultFont?: string;
  fonts?: string[];
}

export interface IRanked {
  index: number;
  rank: number;
}

export interface LangTagMap {
  [code: string]: Array<number>;
}

export interface ScriptList {
  [code: string]: string[];
}

export interface ScriptName {
  [code: string]: string;
}

export interface FontMap {
  [code: string]: string[];
}

export interface ILangTagData {
  loaded: boolean;
  partial: LangTagMap;
  noSubtag: LangTagMap;
  exact: LangTagMap;
  scripts: ScriptList;
  fontMap: FontMap;
  scriptNames: ScriptName;
  langTags: LangTag[];
}

// Describing the different ACTION NAMES available
export const FETCH_LANGTAGS = 'FETCH_LANGTAGS';
export const FETCH_SCRIPTFONTS = 'FETCH_SCRIPTFONTS';

interface FetchLangTags {
  type: typeof FETCH_LANGTAGS;
  payload: { data: LangTag[] };
}

interface FetchScriptFonts {
  type: typeof FETCH_SCRIPTFONTS;
  payload: { data: string };
}

export type LangTagMsgs = FetchLangTags | FetchScriptFonts;
