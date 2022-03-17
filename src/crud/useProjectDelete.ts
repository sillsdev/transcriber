import { useGlobal } from 'reactn';
import { Operation, QueryBuilder, TransformBuilder } from '@orbit/data';
import {
  Section,
  Passage,
  SectionResource,
  Plan,
  MediaFile,
  Discussion,
  Comment,
  PassageStateChange,
} from '../model';
import { useOfflnProjDelete } from './useOfflnProjDelete';
import { related } from '.';

export const useProjectDelete = () => {
  const [memory] = useGlobal('memory');
  const [offlineOnly] = useGlobal('offlineOnly');
  const offlineDelete = useOfflnProjDelete();
  const [projectsLoaded, setProjectsLoaded] = useGlobal('projectsLoaded');

  return async (projectid: string) => {
    await offlineDelete(projectid);
    const plans = (
      memory.cache.query((q: QueryBuilder) =>
        q.findRecords('plan').filter({
          relation: 'project',
          record: { type: 'project', id: projectid },
        })
      ) as Plan[]
    ).map((s) => s.id);
    if (!plans.length) return;

    const planid = plans[0];
    const t = new TransformBuilder();
    const ops: Operation[] = [];
    if (offlineOnly) {
      const mediafiles = (
        memory.cache.query((q: QueryBuilder) =>
          q
            .findRecords('mediafile')
            .filter({ relation: 'plan', record: { type: 'plan', id: planid } })
        ) as MediaFile[]
      ).map((m) => m.id);
      const discussions = (
        memory.cache.query((q: QueryBuilder) =>
          q.findRecords('discussion')
        ) as Discussion[]
      )
        .filter((d) => mediafiles.includes(related(d, 'mediafile')))
        .map((x) => x.id);
      const comments = (
        memory.cache.query((q: QueryBuilder) =>
          q.findRecords('comment')
        ) as Comment[]
      )
        .filter((d) => discussions.includes(related(d, 'discussion')))
        .map((x) => x.id);
      const sections = (
        memory.cache.query((q: QueryBuilder) =>
          q
            .findRecords('section')
            .filter({ relation: 'plan', record: { type: 'plan', id: planid } })
        ) as Section[]
      ).map((s) => s.id);
      const passages = (
        memory.cache.query((q: QueryBuilder) =>
          q.findRecords('passage')
        ) as Passage[]
      )
        .filter((p) => sections.includes(related(p, 'section')))
        .map((p) => p.id);
      const psc = (
        memory.cache.query((q: QueryBuilder) =>
          q.findRecords('passagestatechange')
        ) as PassageStateChange[]
      )
        .filter((p) => passages.includes(related(p, 'passage')))
        .map((p) => p.id);
      const sectionresources = (
        memory.cache.query((q: QueryBuilder) =>
          q.findRecords('sectionresource')
        ) as SectionResource[]
      )
        .filter((r) => sections.includes(r.id))
        .map((r) => r.id);

      psc.forEach((id) =>
        ops.push(
          t.removeRecord({
            type: 'passagestatechange',
            id: id,
          })
        )
      );
      comments.forEach((id) =>
        ops.push(
          t.removeRecord({
            type: 'comment',
            id: id,
          })
        )
      );
      discussions.forEach((id) =>
        ops.push(
          t.removeRecord({
            type: 'discussion',
            id: id,
          })
        )
      );
      mediafiles.forEach((id) =>
        ops.push(
          t.removeRecord({
            type: 'mediafile',
            id: id,
          })
        )
      );
      sectionresources.forEach((id) =>
        ops.push(
          t.removeRecord({
            type: 'sectionresource',
            id: id,
          })
        )
      );

      passages.forEach((id) =>
        ops.push(
          t.removeRecord({
            type: 'passage',
            id: id,
          })
        )
      );
      sections.forEach((id) =>
        ops.push(
          t.removeRecord({
            type: 'section',
            id: id,
          })
        )
      );
    }
    ops.push(
      t.removeRecord({
        type: 'plan',
        id: planid,
      }),
      t.removeRecord({
        type: 'project',
        id: projectid,
      })
    );
    await memory.update(ops);

    setProjectsLoaded(projectsLoaded.filter((p) => p !== projectid));
  };
};
