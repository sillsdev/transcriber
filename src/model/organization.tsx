import TableRelationship from './relationsihp';

interface Organization {
    type: string;
    id: string;
    attributes: {
      name: string;
      "website-url": string;
      "logo-url": string;
      "public-by-default": string;
    };
    relationships: {
      owner: TableRelationship;
    };
  }

  export default Organization;