import {
  DateAndNullSerializer,
  DateTimeAndNullSerializer,
} from './DateAndNullSerializer';
import { JSONAPISerializer, JSONAPISerializerSettings } from '@orbit/jsonapi';
import Memory from '@orbit/memory';

export class JSONAPISerializerCustom extends JSONAPISerializer {
  constructor(s: JSONAPISerializerSettings) {
    if (!s.serializers) {
      s.serializers = {};
    }
    s.serializers.date = new DateAndNullSerializer();
    s.serializers.datetime = new DateTimeAndNullSerializer();
    super(s);
  }
}

export function getSerializer(memory: Memory) {
  const s: JSONAPISerializerSettings = {
    schema: memory.schema,
    keyMap: memory.keyMap,
  };
  const ser = new JSONAPISerializerCustom(s);
  ser.resourceKey = () => {
    return 'remoteId';
  };
  return ser;
}
