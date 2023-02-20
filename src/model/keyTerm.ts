export const chOffset = 192;

export interface IKeyTerm {
  I: number; //index
  W: string; //Word
  G: string; //Gloss
  S?: string; //Strong
  C?: string; //Category
  A?: string; //Domain (Area)
  L: number; //Langauge number
  T: string; //Transliteration
  P: string; //Link (Pointer)
}

export interface ILocalTerm {
  G: string; //Gloss
  D?: string; //Definition
}
