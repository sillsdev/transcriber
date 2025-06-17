export function validateEmail(email: string) {
  /* eslint-disable-next-line no-useless-escape */
  let re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email.toLowerCase());
}
export function validateMultipleEmails(emails: string) {
  const emailList = emails.split(';');
  for (const email of emailList) {
    if (!validateEmail(email.trim())) {
      return false;
    }
  }
  return true;
}
