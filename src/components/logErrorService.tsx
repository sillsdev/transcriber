export enum Severity {
  info = 0,
  error = 1,
}

export function logError(
  level: Severity,
  reporter: any,
  error: Error | string
) {
  if (reporter) {
    if (level === Severity.error) {
      if (reporter.notify)
        reporter.notify(typeof error === 'string' ? new Error(error) : error);
    } else if (level === Severity.info) {
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

export default logError;
