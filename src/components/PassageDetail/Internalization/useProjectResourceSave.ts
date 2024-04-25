import { useMemo } from 'react';
import { useGlobal } from 'reactn';
import {
  MediaFile,
  MediaFileD,
  SectionResource,
  SectionResourceD,
} from '../../../model';
import {
  RecordIdentity,
  RecordOperation,
  RecordTransformBuilder,
} from '@orbit/records';
import {
  ArtifactTypeSlug,
  related,
  useArtifactType,
  useSecResCreate,
} from '../../../crud';
import {
  getSegments,
  prettySegment,
  NamedRegions,
  updateSegments,
} from '../../../utils';
import {
  AddRecord,
  UpdateRecord,
  UpdateRelatedRecord,
} from '../../../model/baseModel';
import { useFullReference, IInfo } from '.';

interface IProps {
  t: RecordTransformBuilder;
  media: MediaFile;
  i: IInfo;
  topicIn: string;
  limitValue: string;
  mediafiles: MediaFile[];
  sectionResources: SectionResource[];
}

export const useProjectResourceSave = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const AddSectionResource = useSecResCreate({} as RecordIdentity);
  const { getTypeId } = useArtifactType();
  const fullReference = useFullReference();

  const resourceType = useMemo(
    () => getTypeId(ArtifactTypeSlug.Resource) || '',
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return async (props: IProps) => {
    const { t, media, i, topicIn, limitValue, mediafiles, sectionResources } =
      props;
    let topic = topicIn;
    const ops: RecordOperation[] = [];
    var medResRec: MediaFile | undefined = undefined;
    if (i.passage)
      medResRec = mediafiles.find(
        (m) =>
          related(m, 'passage') === i.passage?.id &&
          related(m, 'sourceMedia') === media.id
      );
    else {
      //there is no sectionid in mediafiles...so get all the ones without a passage that use this sourceMedia
      var mfs = mediafiles
        .filter(
          (m) =>
            !related(m, 'passage') && related(m, 'sourceMedia') === media.id
        )
        .map((m) => m.id);
      //use those to find the section resource for this section
      var sr = sectionResources.find(
        (sr) =>
          related(sr, 'section') === i.section.id &&
          mfs.includes(related(sr, 'mediafile'))
      );
      //and then go back and pick the mediafile attached to our segment
      medResRec = mediafiles.find((m) => m.id === related(sr, 'mediafile'));
    }

    if (medResRec) {
      const attr = medResRec.attributes;
      //this isn't formatted like all other mediafiles, so don't use parseRegions
      const regions = JSON.parse(
        getSegments(NamedRegions.ProjectResource, attr.segments)
      );
      const firstSeg = prettySegment(regions[0]);
      const limits = limitValue.split('-');
      let change = false;
      if (firstSeg !== limitValue && limits.length === 2) {
        regions[0] = {
          start: parseFloat(limits[0]),
          end: parseFloat(limits[1]),
        };
        const segments = updateSegments(
          NamedRegions.ProjectResource,
          attr.segments,
          JSON.stringify(regions)
        );
        ops.push(
          ...UpdateRecord(
            t,
            {
              ...medResRec,
              attributes: { ...attr, segments },
            } as MediaFileD,
            user
          )
        );
        attr.segments = segments;
        change = true;
      }

      if (attr.topic.trim() !== topic.trim()) {
        ops.push(
          ...UpdateRecord(
            t,
            {
              ...medResRec,
              attributes: { ...attr, topic: topic.trim() },
            } as MediaFileD,
            user
          )
        );
        const secResRec = i.passage
          ? sectionResources.find(
              (r) =>
                related(r, 'passage') === i.passage?.id &&
                related(r, 'mediafile') === medResRec?.id
            )
          : sectionResources.find(
              (r) =>
                related(r, 'section') === i.section.id &&
                !related(r, 'passage') &&
                related(r, 'mediafile') === medResRec?.id
            );
        if (secResRec) {
          ops.push(
            ...UpdateRecord(
              t,
              {
                ...secResRec,
                attributes: {
                  ...secResRec.attributes,
                  description: topic,
                },
              } as SectionResourceD,
              user
            )
          );
        }
        change = true;
      }
      if (change) await memory.update(ops);
    } else {
      let segments = '{}';
      const limits = limitValue.split('-');
      if (limits.length === 2) {
        const regions = [
          {
            start: parseFloat(limits[0]),
            end: parseFloat(limits[1]),
          },
        ];
        segments = updateSegments(
          NamedRegions.ProjectResource,
          '',
          JSON.stringify(regions) //this doesn't match the rest of the mediafiles but is only used to play resources so leave it.
        );
      }
      if (!topic) topic = fullReference(i);
      const newMedia = {
        type: 'mediafile',
        attributes: {
          ...media.attributes,
          segments,
          topic: topic,
        },
        relationships: { ...media.relationships },
      } as MediaFile;
      ops.push(...AddRecord(t, newMedia, user, memory));
      ops.push(
        ...UpdateRelatedRecord(
          t,
          newMedia as MediaFileD,
          'artifactType',
          'artifacttype',
          resourceType,
          user
        )
      );
      if (i.passage) {
        ops.push(
          ...UpdateRelatedRecord(
            t,
            newMedia as MediaFileD,
            'passage',
            'passage',
            i.passage?.id,
            user
          )
        );
      }
      ops.push(
        ...UpdateRelatedRecord(
          t,
          newMedia as MediaFileD,
          'sourceMedia',
          'mediafile',
          media.id,
          user
        )
      );
      await memory.update(ops);
      const secId = i.passage ? related(i.passage, 'section') : i.section.id;
      const cnt =
        sectionResources.filter((r) => related(r, 'section') === secId).length +
        1;
      await AddSectionResource(
        cnt,
        topic,
        newMedia as RecordIdentity,
        i.passage?.id,
        secId
      );
    }
  };
};
