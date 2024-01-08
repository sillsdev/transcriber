import { useGlobal } from 'reactn';
import { RecordIdentity, RecordTransformBuilder } from '@orbit/records';
import { ArtifactCategory, SharedResource } from '../model';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';
import { findRecord } from './tryFindRecord';
import { useArtifactCategory } from '.';

interface IProps {
  title: string;
  mediaId?: string;
  description: string;
  languagebcp47: string;
  termsOfUse: string;
  keywords: string;
  linkurl: string;
  note: boolean;
  category: string;
}

interface RefProps {
  passage: RecordIdentity;
  cluster?: RecordIdentity;
  onUpdRef?: (id: string, val: string) => void;
}

export const useSharedResCreate = ({
  passage,
  cluster,
  onUpdRef,
}: RefProps) => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');
  const { localizedArtifactCategory } = useArtifactCategory();

  return async ({
    title,
    mediaId,
    description,
    languagebcp47,
    termsOfUse,
    keywords,
    category, // id of artifactCateogy
    linkurl,
    note,
  }: IProps) => {
    const sharedRes: SharedResource = {
      type: 'sharedresource',
      attributes: {
        title,
        description,
        languagebcp47,
        termsOfUse,
        keywords,
        linkurl,
        note,
      },
    } as SharedResource;
    const t = new RecordTransformBuilder();
    const ops = [
      ...AddRecord(t, sharedRes, user, memory),
      ...ReplaceRelatedRecord(
        t,
        sharedRes as RecordIdentity,
        'passage',
        'passage',
        passage.id
      ),
    ];
    if (cluster) {
      ops.push(
        ...ReplaceRelatedRecord(
          t,
          sharedRes as RecordIdentity,
          'cluster',
          'organization',
          cluster.id
        )
      );
    }
    if (category) {
      ops.push(
        ...ReplaceRelatedRecord(
          t,
          sharedRes as RecordIdentity,
          'artifactCategory',
          'artifactcategory',
          category
        )
      );
    }
    if (mediaId) {
      ops.push(
        ...ReplaceRelatedRecord(
          t,
          sharedRes as RecordIdentity,
          'titleMediafile',
          'mediafile',
          mediaId
        )
      );
    }
    if (note && onUpdRef) {
      const catRec = findRecord(memory, 'artifactcategory', category) as
        | ArtifactCategory
        | undefined;
      if (catRec) {
        const catText = localizedArtifactCategory(
          catRec.attributes.categoryname
        );
        onUpdRef(passage.id, `NOTE ${catText}`);
      }
    }
    await memory.update(ops);
  };
};
