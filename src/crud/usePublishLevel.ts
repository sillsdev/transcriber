//may include communitytest in future
export enum PublishLevelEnum {
  None,
  Beta,
  Public,
}
export const usePublishLevel = () => {
  const getPublishLevel = (published: string) => {
    if ((published || '') === ('' || '{}')) return PublishLevelEnum.None;
    var json = JSON.parse(published);
    if (json['Beta'] === 'true') return PublishLevelEnum.Beta;
    if (json['Public'] === 'true') return PublishLevelEnum.Public;
    return PublishLevelEnum.None;
  };
  const setPublishLevel = (level: PublishLevelEnum) => {
    var json: { [key: string]: string } = {}; // Add type annotation here
    switch (level) {
      case PublishLevelEnum.None:
        break;
      case PublishLevelEnum.Public:
        json['Public'] = 'true';
        break;
      case PublishLevelEnum.Beta:
        json['Beta'] = 'true';
        break;
    }
    return JSON.stringify(json);
  };

  return { getPublishLevel, setPublishLevel };
};
