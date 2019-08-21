import {
  DateAndNullSerializer,
  DateTimeAndNullSerializer,
} from './DateAndNullSerializer';
import { JSONAPISerializer, JSONAPISerializerSettings } from '@orbit/jsonapi';

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
