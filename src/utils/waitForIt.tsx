export const waitForIt = async (
  label: string,
  testIt: () => boolean,
  resolvedMethod: (() => any) | undefined,
  tryCount: number
): Promise<any> => {
  while (tryCount > 0) {
    if (testIt()) {
      if (resolvedMethod) return resolvedMethod();
      return;
    }
    tryCount -= 1;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('waitForIt failed: ' + label);
};
