interface AlignmentDocument {
  scheme: string;
  docid?: string;
}

export type Align = [string[], string[]];

export interface AlignmentRecord {
  references: Align;
  meta?: { [key: string]: string };
}

export interface AlignmentGroup {
  documents: AlignmentDocument[];
  records: AlignmentRecord[];
  meta?: { [key: string]: string };
}

export interface Alignment {
  format: 'alignment';
  version: '0.4';
  type: 'audio-reference';
  roles: string[];
  documents?: AlignmentDocument[];
  records?: AlignmentRecord[];
  groups?: AlignmentGroup[];
  meta?: { [key: string]: string };
}

export class AlignmentBuilder {
  private alignment: Alignment = {
    format: 'alignment',
    version: '0.4',
    type: 'audio-reference',
    roles: ['timecode', 'text-reference'],
    // documents, records, and groups are optional
  };

  withAlignmentMeta(meta: { [key: string]: string }): AlignmentBuilder {
    this.alignment.meta = meta;
    return this;
  }

  // For backward compatibility (single group)
  withDocument(scheme: string, docid?: string): AlignmentBuilder {
    if (!this.alignment.documents) this.alignment.documents = [];
    this.alignment.documents.push({ scheme, ...(docid && { docid }) });
    return this;
  }

  withDocuments(documents: AlignmentDocument[]): AlignmentBuilder {
    this.alignment.documents = documents;
    return this;
  }

  withRecord(references: Align): AlignmentBuilder {
    if (!this.alignment.records) this.alignment.records = [];
    this.alignment.records.push({ references });
    return this;
  }

  withRecords(records: AlignmentRecord[]): AlignmentBuilder {
    this.alignment.records = records;
    return this;
  }

  withRoles(...roles: string[]): AlignmentBuilder {
    this.alignment.roles = roles;
    return this;
  }

  // For new group-based format
  withGroup(
    documents: AlignmentDocument[],
    records: AlignmentRecord[]
  ): AlignmentBuilder {
    if (!this.alignment.groups) this.alignment.groups = [];
    this.alignment.groups.push({ documents, records });
    return this;
  }

  withGroups(groups: AlignmentGroup[]): AlignmentBuilder {
    this.alignment.groups = groups;
    return this;
  }

  build(): Alignment {
    return { ...this.alignment };
  }
}

// Example usage:
export const createAudioAlignment = () => {
  return new AlignmentBuilder()
    .withDocument('vtt-timecode', 'ephesians_example_with_footnotes.mp3')
    .withDocument('u23003')
    .withRecord([['00:00.000 --> 00:01.927'], ['en+ulb.EPH:0']])
    .withRecord([['00:01.927 --> 00:03.756'], ['en+ulb.EPH 1:0']])
    .withRecord([['00:03.756 --> 04:23.239'], ['en+ulb.EPH 1']])
    .withRecord([['00:03.756 --> 00:05.604'], ['en+ulb.EPH 1:1!s1']])
    .withRecord([['00:05.604 --> 00:08.289'], ['en+ulb.EPH 1:1:0']])
    .withRecord([['00:08.289 --> 00:16.671'], ['en+ulb.EPH 1:1']])
    .withRecord([['00:16.671 --> 00:28.805'], ['en+ulb.EPH 1:1!f']])
    .withRecord([['00:28.805 --> 00:30.943'], ['en+ulb.EPH 1:2:0']])
    .withRecord([['00:30.943 --> 00:35.558'], ['en+ulb.EPH 1:2']])
    .build();
};
