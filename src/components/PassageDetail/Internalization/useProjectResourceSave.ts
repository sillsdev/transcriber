import { useMemo } from 'react';
import { useGlobal } from 'reactn';
import { Section, Passage, MediaFile, SectionResource } from '../../../model';
import { Operation, TransformBuilder } from '@orbit/data';
import {
  ArtifactTypeSlug,
  related,
  useArtifactType,
  useSecResCreate,
} from '../../../crud';
import { parseRegions } from '../../../crud/useWavesurferRegions';
import { getSegments, prettySegment } from '../../../utils';
import { NamedRegions, updateSegments } from '../../../utils';
import {
  AddRecord,
  UpdateRecord,
  UpdateRelatedRecord,
} from '../../../model/baseModel';
import { useFullReference } from '.';

interface IProps {
  t: TransformBuilder;
  media: MediaFile;
  p: Passage;
  topicIn: string;
  limitValue: string;
  mediafiles: MediaFile[];
  sectionResources: SectionResource[];
}

export const useProjectResourceSave = () => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const AddSectionResource = useSecResCreate({} as Section);
  const { getTypeId } = useArtifactType();
  const fullReference = useFullReference();

  const resourceType = useMemo(
    () => getTypeId(ArtifactTypeSlug.Resource) || '',
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return async (props: IProps) => {
    const { t, media, p, topicIn, limitValue, mediafiles, sectionResources } =
      props;
    let topic = topicIn;
    const ops: Operation[] = [];
    const medResRec = mediafiles.find(
      (m) =>
        related(m, 'passage') === p.id && related(m, 'sourceMedia') === media.id
    );
    if (medResRec) {
      const attr = medResRec.attributes;
      const regions = parseRegions(
        getSegments(NamedRegions.ProjectResource, attr.segments)
      ).regions;
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
            } as MediaFile,
            user
          )
        );
        change = true;
      }

      if (attr.topic !== topic) {
        ops.push(
          ...UpdateRecord(
            t,
            {
              ...medResRec,
              attributes: { ...attr, topic },
            } as MediaFile,
            user
          )
        );
        const secResRec = sectionResources.find(
          (r) =>
            related(r, 'passage') === p.id &&
            related(r, 'mediafile') === medResRec.id
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
              } as SectionResource,
              user
            )
          );
        }
        change = true;
      }
      if (change) await memory.update(ops);
    } else {
      const limits = limitValue.split('-');
      if (limits.length === 2) {
        const regions = [
          {
            start: parseFloat(limits[0]),
            end: parseFloat(limits[1]),
          },
        ];
        const segments = updateSegments(
          NamedRegions.ProjectResource,
          '{}',
          JSON.stringify(regions)
        );
        if (!topic) topic = fullReference(p);
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
            newMedia,
            'artifactType',
            'artifacttype',
            resourceType,
            user
          )
        );
        ops.push(
          ...UpdateRelatedRecord(t, newMedia, 'passage', 'passage', p.id, user)
        );
        ops.push(
          ...UpdateRelatedRecord(
            t,
            newMedia,
            'sourceMedia',
            'mediafile',
            media.id,
            user
          )
        );
        await memory.update(ops);
        const secId = related(p, 'section');
        const cnt =
          sectionResources.filter((r) => related(r, 'section') === secId)
            .length + 1;
        await AddSectionResource(cnt, topic, newMedia, p.id, secId);
        await memory.update((t) => [
          t.replaceAttribute(newMedia, 'audioUrl', media.attributes.audioUrl),
          t.replaceAttribute(newMedia, 's3file', media.attributes.s3file),
        ]);
      }
    }
  };
};
