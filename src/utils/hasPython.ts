import { getRegVal } from '.';

const key = 'HKCR\\Python.CompiledFile\\shell\\open\\command';
export const hasPython = async () => Boolean(await getRegVal(key, ''));
