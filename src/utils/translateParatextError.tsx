import { ISharedStrings } from '../model';
import { IAxiosStatus } from '../store/AxiosStatus';
import React from 'react';
import { addPt } from './addPt';

const myPt = (s: string) => addPt(s, '{Pt}');

const translateParatextReferenceError = (
  errMsg: string,
  t: ISharedStrings
): JSX.Element => {
  const errs = errMsg.split('||');
  let localizedErr: JSX.Element[] = [];
  errs.forEach((referr) => {
    var parts = referr.split('|');
    var str = '';
    switch (parts[0]) {
      case 'Empty Book':
        str = t.BookNotSet.replace('{0}', parts[1]).replace('{1}', parts[2]);
        break;
      case 'Missing Book':
        str = myPt(t.bookNotInParatext)
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
  if (err.errStatus === 400) return myPt(t.invalidParatextLogin);
  if (err.errStatus === 500) {
    if (
      (err?.errMsg?.length ?? 0) === 0 ||
      err.errMsg.indexOf('Detail: ') + 'Detail: '.length ===
        err.errMsg.length ||
      err.errMsg.includes('SecurityException') ||
      err.errMsg.includes('401') ||
      err.errMsg.includes('400')
    )
      return myPt(t.expiredParatextToken);
    if (err.errMsg.includes('logged in')) return myPt(t.invalidParatextLogin);
  }
  return translateParatextErr(err.errMsg, t);
};
export const translateParatextErr = (errMsg: string, t: ISharedStrings) => {
  if (errMsg.includes('ReferenceError')) {
    return translateParatextReferenceError(errMsg, t);
  }
  if (errMsg.includes('no range')) return myPt(t.referenceNotFound);
  if (errMsg.includes('does not contain the book')) return myPt(t.bookNotFound);
  return errMsg;
};
