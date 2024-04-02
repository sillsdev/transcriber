export const JSONParse = (json: string | undefined) => {
  try {
    return JSON.parse(json || '{}');
  } catch (e) {
    return json;
  }
};
