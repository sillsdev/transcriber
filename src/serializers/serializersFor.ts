import { JSONAPISerializers, buildJSONAPISerializerFor } from '@orbit/jsonapi';
import MemorySource from '@orbit/memory';
import { buildInflector, buildSerializerSettingsFor } from '@orbit/serializers';

const serializerMap = {
  [JSONAPISerializers.ResourceField]: {
    serializationOptions: { inflectors: ['dasherize'] },
  },
  [JSONAPISerializers.ResourceFieldParam]: {
    serializationOptions: { inflectors: ['dasherize'] },
  },
  [JSONAPISerializers.ResourceFieldPath]: {
    serializationOptions: { inflectors: ['dasherize'] },
  },
  [JSONAPISerializers.ResourceType]: {
    serializationOptions: {
      inflectors: ['pluralize', 'dasherize'],
    },
  },
  [JSONAPISerializers.ResourceTypePath]: {
    serializationOptions: {
      inflectors: ['pluralize', 'dasherize'],
    },
  },
};

export const serializersSettings = () =>
  buildSerializerSettingsFor({
    sharedSettings: {
      // Optional: Custom `pluralize` / `singularize` inflectors that know about
      // your app's unique data.
      inflectors: {
        pluralize: buildInflector(
          undefined, // custom mappings
          (word: string) => {
            if (!word) return word;
            if (word.endsWith('y'))
              return word.substring(0, word.length - 1) + 'ies';
            return word + 's';
          }
        ),
        singularize: buildInflector(
          undefined, // custom mappings
          (word: string) => {
            if (!word) return word;
            if (word.endsWith('ies'))
              return word.substring(0, word.length - 3) + 'y';
            return word.substring(0, word.length - 1);
          }
        ),
        dasherize: buildInflector(
          { vwChecksums: 'vwchecksums' }, // custom mappings
          (word: string) => {
            if (!word) return word;
            return word
              .replace(/([a-z\d])([A-Z])/g, '$1_$2')
              .toLowerCase()
              .replace(/[ _]/g, '-');
          }
        ),
        camelize: buildInflector(
          { vwChecksums: 'vwchecksums' }, // custom mappings
          (word: string) => {
            if (!word) return word;
            return word
              .replace(/(-|_|\.|\s)+(.)?/g, function (match, separator, chr) {
                return chr ? chr.toUpperCase() : '';
              })
              .replace(/(^|\/)([A-Z])/g, function (match) {
                return match.toLowerCase();
              });
          }
        ),
      },
    },
    // Serialization settings according to the type of serializer
    settingsByType: serializerMap,
  });

export function serializersFor(memory: MemorySource) {
  return buildJSONAPISerializerFor({
    serializerSettingsFor: serializersSettings(),
    schema: memory?.schema,
    keyMap: memory?.keyMap,
  });
}
