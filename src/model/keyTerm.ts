export const chOffset = 192;

export interface IKeyTerm {
  I: number; //index
  W: string; //Word
  S?: string; //Strong
  C?: string; //Category
  D?: string; //Definition
  A?: string; //Domain (Area)
  L: number; //Langauge number
  T: string; //Transliteration
  G: string; //Gloss
  P: string; //Link (Pointer)
}
