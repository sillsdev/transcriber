import moment from 'moment';

export const currentDateTime = () => moment.utc().toISOString();
