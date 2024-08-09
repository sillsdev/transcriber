// see: https://nodejs.org/api/child_process.html#child_processexecsynccommand-options
export interface IExecResult {
  pid: number;
  output: string[];
  stdout: Buffer | string;
  stderr: Buffer | string;
  status: number | null;
  signal: string | null;
  error: Error | null;
}
