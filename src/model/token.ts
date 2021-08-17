export interface IToken {
  aud: string[]; // audience list
  azp: string; // client id
  exp: number; // expires unix date
  iat: number; // init unix date
  iss: string; // tenant url
  scope: string; // space separated list
  sub: string; // provider bar id
  [key: string]: any; // includes email_verified with base url
}
