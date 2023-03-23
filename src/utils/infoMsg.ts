import { IApiError } from '../model';
import { ServerError } from '@orbit/data';
import { Severity } from '.';
import { IAxiosStatus } from '../store/AxiosStatus';

export const infoMsg = (e: Error, info: string) => {
  e.name = info + e.name;
  return e;
};

export const axiosError = (e: IAxiosStatus) =>
  ({
    name: e.statusMsg,
    message: `${e.errStatus}: ${e.errMsg}`,
  } as Error);

const orbitMsg = (err: Error | IApiError | null, info: string) =>
  err instanceof ServerError && (err as any).data?.errors?.length > 0
    ? info + ': ' + err.message + ((err as any).data.errors[0].detail || '')
    : info + (err ? ': ' + err.message : '');

export const orbitErr = (err: Error | IApiError | null, info: string) =>
  ({
    ...err,
    message: orbitMsg(err, info),
    response: { status: 500 },
  } as IApiError);

export const orbitInfo = (err: Error | null, info: string) =>
  ({
    ...err,
    message: orbitMsg(err, info),
    response: { status: Severity.info },
  } as IApiError);

export const orbitRetry = (err: Error | null, info: string) =>
  ({
    ...err,
    message: orbitMsg(err, info),
    response: { status: Severity.retry },
  } as IApiError);
