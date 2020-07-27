export const waitForIt = async (
  label: string,
  testIt: () => boolean,
  resolvedMethod: (() => any) | undefined,
  cancelIf: () => boolean,
  waitCount: number
): Promise<any> => {
  while (!cancelIf() && waitCount > 0) {
    console.log('wait');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (testIt()) {
      if (resolvedMethod) return resolvedMethod();
      return;
    }
    waitCount -= 1;
  }
  throw new Error('waitForIt failed: ' + label);
};
