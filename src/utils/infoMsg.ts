import { IApiError } from '../model';
import { Severity } from '../components/logErrorService';

export const infoMsg = (e: Error, info: string) => ({
  ...e,
  name: info + e.name,
});

export const orbitInfo = (err: Error | null, info: string) =>
  ({
    message: info + (err ? ': ' + err.message : ''),
    response: { status: Severity.info },
  } as IApiError);

export const orbitRetry = (err: Error | null, info: string) =>
  ({
    message: info + (err ? ': ' + err.message : ''),
    response: { status: Severity.retry },
  } as IApiError);
