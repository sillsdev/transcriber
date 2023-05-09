const ipc = (window as any)?.electron;

export const fileJson = async (settings: string) => {
  return JSON.parse(await ipc?.fileJson(settings));
};

export default fileJson;
