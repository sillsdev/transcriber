import { getRegVal } from '.';

const key = 'HKCR\\Audacity.Project\\shell\\open\\command';
export const hasAudacity = async () => Boolean(await getRegVal(key, ''));
