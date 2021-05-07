export const waitForIt = async (
  label: string,
  testIt: () => boolean,
  cancelIf: () => boolean,
  waitCount: number
): Promise<any> => {
  if (testIt()) {
    return;
  }
  while (!cancelIf() && waitCount > 0) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (testIt()) {
      return;
    }
    waitCount -= 1;
  }
  throw new Error('waitForIt failed: ' + label);
};
