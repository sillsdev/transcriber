import { ISharedStrings } from '../model';
import { IAxiosStatus } from '../store/AxiosStatus';
import React from 'react';

const translateParatextReferenceError = (
  err: IAxiosStatus,
  t: ISharedStrings
): JSX.Element => {
  const errs = err.errMsg.split('||');
  let localizedErr: JSX.Element[] = [];
  errs.forEach((referr) => {
    var parts = referr.split('|');
    var str = '';
    switch (parts[0]) {
      case 'Empty Book':
        str = t.BookNotSet.replace('{0}', parts[1]).replace('{1}', parts[2]);
        break;
      case 'Missing Book':
        str = t.bookNotInParatext
          .replace('{0}', parts[1])
          .replace('{1}', parts[2])
          .replace('{2}', parts[3]);
        break;
      case 'Chapter':
        str = t.paratextchapterSpan
          .replace('{0}', parts[1])
          .replace('{1}', parts[2])
          .replace('{2}', parts[3]);
        break;
      case 'Reference':
        str = t.invalidReference
          .replace('{0}', parts[1])
          .replace('{1}', parts[2])
          .replace('{2}', parts[3]);
    }
    localizedErr.push(
      <>
        {str}
        <br />
      </>
    );
  });
  return <span>{localizedErr}</span>;
};
export const translateParatextError = (
  err: IAxiosStatus,
  t: ISharedStrings
): string | JSX.Element => {
  if (err.errStatus === 401) return t.expiredToken;
  if (err.errStatus === 400) return t.invalidParatextLogin;
  if (err.errStatus === 500) {
    if (
      (err?.errMsg?.length ?? 0) === 0 ||
      err.errMsg.indexOf('Detail: ') + 'Detail: '.length ===
        err.errMsg.length ||
      err.errMsg.includes('SecurityException') ||
      err.errMsg.includes('401') ||
      err.errMsg.includes('400')
    )
      return t.expiredParatextToken;
    if (err.errMsg.includes('logged in')) return t.invalidParatextLogin;
    if (err.errMsg.includes('ReferenceError')) {
      return translateParatextReferenceError(err, t);
    }
  }
  if (err.errMsg.includes('no range')) return t.referenceNotFound;
  return err.errMsg;
};
