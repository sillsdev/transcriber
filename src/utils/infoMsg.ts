import { IApiError } from '../model';
import { Severity } from '../components/logErrorService';
import { ServerError } from '@orbit/data';

export const infoMsg = (e: Error, info: string) => ({
  ...e,
  name: info + e.name,
});

const orbitMsg = (err: Error | IApiError | null, info: string) =>
  err instanceof ServerError && (err as any).data?.errors?.length > 0
    ? info + ': ' + err.message + ((err as any).data.errors[0].detail || '')
    : info + (err ? ': ' + err.message : '');

export const orbitErr = (err: Error | IApiError | null, info: string) =>
  ({
    message: orbitMsg(err, info),
    response: { status: 500 },
  } as IApiError);

export const orbitInfo = (err: Error | null, info: string) =>
  ({
    message: orbitMsg(err, info),
    response: { status: Severity.info },
  } as IApiError);

export const orbitRetry = (err: Error | null, info: string) =>
  ({
    message: orbitMsg(err, info),
    response: { status: Severity.retry },
  } as IApiError);
