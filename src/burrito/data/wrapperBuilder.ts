export interface Burrito {
  id: string;
  path: string;
  role: string;
}

interface Alignment {
  source: string;
  target: string;
  path: string;
  description: {
    en: string;
  };
}

interface RequiredParams {
  genName: string;
  genVersion: string;
  name: string;
  abbreviation: string;
  description: string;
}

interface OptionalParams {
  dateCreated?: string;
  comments?: string;
  burritos?: Burrito[];
  alignments?: Alignment[];
}

type WrapperParams = RequiredParams & OptionalParams;

export interface BurritoWrapper {
  meta: {
    schema: string;
    version: string;
    generator: {
      name: string;
      version: string;
    };
    dateCreated: string | undefined;
    comments: string | undefined;
  };
  identification: {
    name: {
      en: string;
    };
    abbreviation: {
      en: string;
    };
    description: {
      en: string;
    };
  };
  type: {
    flavor: string;
    role: string;
  };
  contents: {
    burritos: Burrito[];
    alignments: Alignment[];
  };
}

/**
 * Creates a burrito wrapper object with the specified parameters
 * @param params - The parameters for the wrapper
 * @returns The burrito wrapper object
 */
export function wrapperBuilder({
  genName,
  genVersion,
  name,
  abbreviation,
  description,
  dateCreated = new Date().toISOString().split('T')[0],
  comments = '',
  burritos = [],
  alignments = [],
}: WrapperParams): BurritoWrapper {
  return {
    meta: {
      schema: 'https://burrito.bible/schema/burrito-wrapper.schema.json',
      version: '0.1',
      generator: {
        name: genName,
        version: genVersion,
      },
      dateCreated: dateCreated,
      comments: comments,
    },
    identification: {
      name: {
        en: name,
      },
      abbreviation: {
        en: abbreviation,
      },
      description: {
        en: description,
      },
    },
    type: {
      flavor: 'wrapper',
      role: 'container',
    },
    contents: {
      burritos: burritos,
      alignments: alignments,
    },
  };
}
