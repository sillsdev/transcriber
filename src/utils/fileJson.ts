const ipc = (window as any)?.electron;

export const fileJson = (settings: string) => {
  return ipc?.fileJson(settings);
};

export default fileJson;
