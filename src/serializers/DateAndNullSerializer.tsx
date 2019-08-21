import { DateSerializer, DateTimeSerializer } from '@orbit/serializers';

export class DateAndNullSerializer extends DateSerializer {
  serialize(arg: Date): string {
    return arg ? super.serialize(new Date(arg)) : '';
  }
}

export class DateTimeAndNullSerializer extends DateTimeSerializer {
  serialize(arg: Date): string {
    return arg ? super.serialize(new Date(arg)) : '';
  }
}
