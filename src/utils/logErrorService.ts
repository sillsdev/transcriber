import { isElectron } from '../api-variable';
import moment from 'moment';
import { join } from 'path';
import { Stats } from 'fs';
import { createFolder } from '.';
var fs = isElectron ? require('fs-extra') : undefined;

export enum Severity {
  info = 0,
  error = 1,
  retry = 2,
}

export function logError(
  level: Severity,
  reporter: any,
  error: Error | string
) {
  if (typeof reporter === 'string') {
    logMessage(reporter, level, error);
  } else if (reporter) {
    if (level === Severity.error) {
      if (reporter.notify)
        reporter.notify(typeof error === 'string' ? new Error(error) : error);
    } else if (level === Severity.info || level === Severity.retry) {
      if (typeof error === 'string') {
        if (error !== '' && reporter.leaveBreadcrumb) {
          reporter.leaveBreadcrumb(error);
        }
      } else {
        if (reporter.leaveBreadcrumb)
          reporter.leaveBreadcrumb(error.message, { name: error.name });
      }
    }
  }
  if (typeof error !== 'string' || error !== '') {
    console.log(level ? 'ERROR:' : 'INFO:', error);
  }
}

const dayFormat = (s?: Date) => moment(s).format('YYYY-MM-DD');
const isToday = (s: Date) => dayFormat(s) === dayFormat();

const homedir = require('os').homedir();
const LogFolder = join(homedir, '.transcriber-logs');

const logFileHeader = (logFullName: string) => {
  // Add file header
  console.log(`creating new file ${logFullName}`);
  fs.open(logFullName, 'w', (err: IStatErr, fd: number) => {
    if (err) throw err;
    fs.writeFile(
      fd,
      `Log for ${moment().locale('en').format('L LT Z')}\n`,
      (err: IStatErr) => {
        fs.close(fd, (err: IStatErr) => {
          if (err) throw err;
        });
        if (err) throw err;
      }
    );
  });
};

const levelText = (level: Severity) =>
  level === Severity.info
    ? 'INFO'
    : level === Severity.error
    ? 'ERROR'
    : 'RETRY';

const msgText = (message: Error | string) =>
  typeof message === 'string' ? message : JSON.stringify(message);

const logMessage = (
  logFullName: string,
  level: Severity,
  msg: Error | string
) => {
  // Add file header
  console.log(`creating new file ${logFullName}`);
  fs.open(logFullName, 'a', (err: IStatErr, fd: number) => {
    if (err) throw err;
    fs.writeFile(
      fd,
      `${new Date().toISOString()} ${levelText(level)}: ${msgText(msg)}\n`,
      (err: IStatErr) => {
        fs.close(fd, (err: IStatErr) => {
          if (err) throw err;
        });
        if (err) throw err;
      }
    );
  });
};

interface IStatErr {
  errno: number;
  code: string;
  syscall: string;
  path: string;
}

export function logFile() {
  const loc = Intl.NumberFormat().resolvedOptions().locale;
  console.log(`logfile locale=${loc}`);
  const logName = `log-${moment().locale(loc).format('DD')}.log`;
  const logFullName = join(LogFolder, logName);
  fs.stat(logFullName, (err: IStatErr, stats: Stats) => {
    if (err?.code === 'ENOENT') {
      createFolder(LogFolder);
      logFileHeader(logFullName);
    } else if (err) {
      console.log(JSON.stringify(err));
    } else {
      if (!isToday(stats.ctime)) {
        logFileHeader(logFullName);
      } else {
        console.log(`using existing file ${logFullName}`);
      }
    }
  });
  return logFullName;
}

export default logError;
