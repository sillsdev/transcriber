import moment from 'moment';
import { join } from 'path-browserify';
import { Stats } from 'fs-extra';
import { createFolder } from '.';
const ipc = (window as any)?.electron;

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

const LogFolder = () =>
  join(localStorage.getItem('home') || '', '.transcriber-logs');

const logFileHeader = (logFullName: string) => {
  // Add file header
  console.log(`creating new file ${logFullName}`);
  ipc?.write(
    logFullName,
    `Log for ${moment().locale('en').format('L LT Z')}\n`
  );
};

const levelText = (level: Severity) =>
  level === Severity.info
    ? 'INFO'
    : level === Severity.error
    ? 'ERROR'
    : 'RETRY';

const msgText = (message: Error | string) =>
  typeof message === 'string' ? message : JSON.stringify(message);

const logMessage = async (
  logFullName: string,
  level: Severity,
  msg: Error | string
) => {
  // Add file header
  console.log(`creating new file ${logFullName}`);
  await ipc?.append(
    logFullName,
    `${new Date().toISOString()} ${levelText(level)}: ${msgText(msg)}\n`
  );
};

interface IStatErr {
  errno: number;
  code: string;
  syscall: string;
  path: string;
}

export async function logFile() {
  const logFolder = LogFolder();
  const loc = Intl.NumberFormat().resolvedOptions().locale;
  console.log(`logfile locale=${loc}`);
  const logName = `log-${moment().locale(loc).format('DD')}.log`;
  const logFullName = join(logFolder, logName);
  const stats = JSON.parse(await ipc?.stat(logFullName)) as Stats & IStatErr;
  if (stats?.code) {
    const err = stats;
    if (err?.code === 'ENOENT') {
      await createFolder(logFolder);
      logFileHeader(logFullName);
    } else if (err) {
      console.log(JSON.stringify(err));
    }
  } else {
    if (!isToday(stats.ctime)) {
      logFileHeader(logFullName);
    } else {
      console.log(`using existing file ${logFullName}`);
    }
  }
  return logFullName;
}

export default logError;
