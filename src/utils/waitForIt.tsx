export const waitForIt = async (
  label: string,
  testIt: () => boolean,
  resolvedMethod: (() => any) | undefined,
  cancelIf: () => boolean,
  tryCount: number
): Promise<any> => {
  while (!cancelIf() && tryCount > 0) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (testIt()) {
      if (resolvedMethod) return resolvedMethod();
      return;
    }
    tryCount -= 1;
  }
  throw new Error('waitForIt failed: ' + label);
};
