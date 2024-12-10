import {
  JSONAPIDocumentSerializer,
  JSONAPIResourceSerializer,
} from '@orbit/jsonapi';
import MemorySource from '@orbit/memory';
import { serializersFor } from './serializersFor';

export const getSerializer = (memory: MemorySource) => {
  return new JSONAPIResourceSerializer({
    serializerFor: serializersFor(memory),
    schema: memory?.schema,
    keyMap: memory?.keyMap,
  });
};

export const getDocSerializer = (memory: MemorySource) => {
  return new JSONAPIDocumentSerializer({
    serializerFor: serializersFor(memory),
    schema: memory?.schema,
    keyMap: memory?.keyMap,
  });
};
