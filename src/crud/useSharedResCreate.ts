import { useGlobal } from 'reactn';
import { RecordIdentity, TransformBuilder } from '@orbit/data';
import { SectionResource } from '../model';
import { AddRecord, ReplaceRelatedRecord } from '../model/baseModel';

interface IProps {
  title: string;
  description: string;
  languagebcp47: string;
  termsOfUse: string;
  keywords: string;
  category: string;
}

interface RefProps {
  passage: RecordIdentity;
  cluster?: RecordIdentity;
}

export const useSharedResCreate = ({ passage, cluster }: RefProps) => {
  const [memory] = useGlobal('memory');
  const [user] = useGlobal('user');

  return async ({
    title,
    description,
    languagebcp47,
    termsOfUse,
    keywords,
    category, // id of artifactCateogy
  }: IProps) => {
    const sharedRes: SectionResource = {
      type: 'sharedresource',
      attributes: {
        title,
        description,
        languagebcp47,
        termsOfUse,
        keywords,
      },
    } as any;
    memory.schema.initializeRecord(sharedRes);
    const t = new TransformBuilder();
    const ops = [
      ...AddRecord(t, sharedRes, user, memory),
      ...ReplaceRelatedRecord(t, sharedRes, 'passage', 'passage', passage.id),
    ];
    if (cluster) {
      ops.push([
        ...ReplaceRelatedRecord(
          t,
          sharedRes,
          'cluster',
          'organization',
          cluster.id
        ),
      ]);
    }
    if (category) {
      ops.push([
        ...ReplaceRelatedRecord(
          t,
          sharedRes,
          'artifactCategory',
          'artifactcategory',
          category
        ),
      ]);
    }
    await memory.update(ops);
  };
};
