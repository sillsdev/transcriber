import moment from 'moment';
import 'moment/locale/fr';
import 'moment/locale/pt';
import 'moment/locale/ru';
import 'moment/locale/ar';
import 'moment/locale/es';
import 'moment/locale/id';
import 'moment/locale/sw';
import 'moment/locale/ta';

export const dateOrTime = (val: string | Date, locale: string) => {
  const updated =
    typeof val !== 'string'
      ? moment(val)
      : moment(val.endsWith('Z') ? val : val + 'Z');
  const today = moment().format('YYYY-MM-DD');
  const date = updated ? updated.format('YYYY-MM-DD') : '';
  const displayDate = updated ? updated.locale(locale).format('L') : '';
  const displayTime = updated ? updated.locale(locale).format('LT') : '';
  return date === today ? displayTime : displayDate;
};
