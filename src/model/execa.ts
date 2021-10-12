type Result = Buffer | string;

export interface IExeca {
  pid: number;
  output: Result[]; // output[1] === stdout, output[2] === stderr
  stdout: Result;
  stderr: Result;
  status: number | null;
  signal: string | null;
  error?: Error;
}
