export enum PublishDestinationEnum {
  AkuoBeta,
  AkuoPublic,
  Aquifer,
  Internalization,
  OBTHelps,
  PublishDestinationSetByUser, // This is a special value that is used to indicate that the user has set the publish destination
  PropogateSection,
}

export const usePublishDestination = () => {
  const isPublished = (destinations: PublishDestinationEnum[]) => {
    return (
      destinations.filter(
        (p) =>
          p !== PublishDestinationEnum.PublishDestinationSetByUser &&
          p !== PublishDestinationEnum.PropogateSection
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
    shared: boolean,
    noDefault?: boolean
  ) => {
    var destinations: PublishDestinationEnum[] = [];
    if ((publishTo || '{}') === '{}') {
      return noDefault ? destinations : getDefaults(hasPublishing, shared);
    }
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
        case PublishDestinationEnum.PropogateSection:
          json['Propogate'] = 'true';
      }
    });
    json['PublishDestinationSetByUser'] = 'true';
    return JSON.stringify(json);
  };

  const publishStatus = (destinations: PublishDestinationEnum[]) => {
    let value = 0;
    if (
      destinations.includes(PublishDestinationEnum.AkuoPublic) ||
      destinations.includes(PublishDestinationEnum.AkuoBeta)
    ) {
      value += 1;
    }
    if (destinations.includes(PublishDestinationEnum.Aquifer)) {
      value += 2;
    }
    if (destinations.includes(PublishDestinationEnum.Internalization)) {
      value += 4;
    }
    if (destinations.includes(PublishDestinationEnum.OBTHelps)) {
      value += 8;
    }
    const codes = [
      0x2b1a, 0x2b61, 0x2b62, 0x2b67, 0x2b63, 0x2b65, 0x2b68, 0x2b17, 0x2b60,
      0x2b66, 0x2b64, 0x2b12, 0x2b69, 0x2b16, 0x2b13, 0x2b24,
    ];
    return String.fromCodePoint(codes[value]);
  };

  return {
    getPublishTo,
    setPublishTo,
    getDefaults,
    isPublished,
    publishStatus,
  };
};
