export enum PublishDestinationEnum {
  AkuoBeta,
  AkuoPublic,
  Aquifer,
  Internalization,
  OBTHelps,
  PublishDestinationSetByUser, // This is a special value that is used to indicate that the user has set the publish destination
}

export const usePublishDestination = () => {
  const isPublished = (destinations: PublishDestinationEnum[]) => {
    return (
      destinations.filter(
        (p) => p !== PublishDestinationEnum.PublishDestinationSetByUser
      ).length > 0
    );
  };

  const getDefaults = (hasPublishing: boolean, shared: boolean) => {
    var destinations: PublishDestinationEnum[] = [];
    if (shared) {
      destinations.concat([
        PublishDestinationEnum.OBTHelps,
        PublishDestinationEnum.Internalization,
      ]);
    }
    if (hasPublishing) destinations.push(PublishDestinationEnum.AkuoPublic);
    return destinations;
  };
  //TODO?: pass in the project defaults for destinations
  const getPublishTo = (
    publishTo: string,
    hasPublishing: boolean,
    shared: boolean
  ) => {
    var destinations: PublishDestinationEnum[] = [];
    if ((publishTo || '{}') === '{}') return getDefaults(hasPublishing, shared);
    var json = JSON.parse(publishTo);
    if (json['Beta'] === 'true')
      destinations.push(PublishDestinationEnum.AkuoBeta);
    if (json['Public'] === 'true')
      destinations.push(PublishDestinationEnum.AkuoPublic);
    if (json['Aquifer'] === 'true')
      destinations.push(PublishDestinationEnum.Aquifer);
    if (json['Internalization'] === 'true')
      destinations.push(PublishDestinationEnum.Internalization);
    if (json['OBTHelps'] === 'true')
      destinations.push(PublishDestinationEnum.OBTHelps);
    if (json['PublishDestinationSetByUser'] === 'true')
      destinations.push(PublishDestinationEnum.PublishDestinationSetByUser);
    return destinations;
  };
  const setPublishTo = (destinations: PublishDestinationEnum[]) => {
    var json: { [key: string]: string } = {}; // Add type annotation here
    destinations.forEach((destination) => {
      switch (destination) {
        case PublishDestinationEnum.AkuoBeta:
          json['Beta'] = 'true';
          break;
        case PublishDestinationEnum.AkuoPublic:
          json['Public'] = 'true';
          break;
        case PublishDestinationEnum.Aquifer:
          json['Aquifer'] = 'true';
          break;
        case PublishDestinationEnum.Internalization:
          json['Internalization'] = 'true';
          break;
        case PublishDestinationEnum.OBTHelps:
          json['OBTHelps'] = 'true';
          break;
      }
    });
    json['PublishDestinationSetByUser'] = 'true';
    return JSON.stringify(json);
  };

  return { getPublishTo, setPublishTo, getDefaults, isPublished };
};
