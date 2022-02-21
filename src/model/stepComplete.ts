export interface StepComplete {
  stepid: string;
  complete: boolean;
  name: string; //don't use for querying.  For our readability only
}
