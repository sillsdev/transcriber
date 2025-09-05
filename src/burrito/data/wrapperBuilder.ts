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
  name: string;
  description: string;
}

interface OptionalParams {
  version?: string;
  abbreviation?: string;
  dateCreated?: string;
  comments?: string;
  genName?: string;
  genVersion?: string;
  burritos?: Burrito[];
  alignments?: Alignment[];
}

type WrapperParams = RequiredParams & OptionalParams;

interface Meta {
  version: string;
  name: {
    en: string;
  };
  abbreviation?: {
    en: string;
  };
  description: {
    en: string;
  };
  generator?: {
    name: string;
    version?: string;
  };
  dateCreated?: string;
  comments?: string;
}

interface Contents {
  burritos: Burrito[];
  alignments?: Alignment[];
}

export interface BurritoWrapper {
  format: string;
  meta: Meta;
  contents: Contents;
}

/**
 * Creates a burrito wrapper object with the specified parameters
 * @param params - The parameters for the wrapper
 * @returns The burrito wrapper object
 */
export function wrapperBuilder({
  version,
  name,
  abbreviation,
  description,
  dateCreated = new Date().toISOString().split('T')[0],
  comments = '',
  genName,
  genVersion,
  burritos = [],
  alignments = [],
}: WrapperParams): BurritoWrapper {
  const meta = {
    version: version || '0.0.1',
    name: {
      en: name,
    },
  } as Meta;
  if (abbreviation) {
    meta.abbreviation = { en: abbreviation };
  }
  meta.description = { en: description };
  if (genName) {
    meta.generator = { name: genName };
    if (genVersion) {
      meta.generator.version = genVersion;
    }
  }
  meta.dateCreated = dateCreated || new Date().toISOString().split('T')[0];
  if (comments) {
    meta.comments = comments;
  }

  const contents = {} as Contents;
  if (burritos.length > 0) {
    contents.burritos = burritos;
  }
  if (alignments.length > 0) {
    contents.alignments = alignments;
  }

  return {
    format: 'scripture burrito wrapper',
    meta,
    contents,
  };
}
