import { useGlobal } from 'reactn';
import { RecordOperation, RecordTransformBuilder } from '@orbit/records';
import {
  PlanD,
  MediaFileD,
  DiscussionD,
  CommentD,
  SectionD,
  PassageD,
  PassageStateChangeD,
  SectionResourceD,
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
      memory.cache.query((q) =>
        q.findRecords('plan').filter({
          relation: 'project',
          record: { type: 'project', id: projectid },
        })
      ) as PlanD[]
    ).map((s) => s.id);
    if (!plans.length) return;

    const planid = plans[0];
    var ops: RecordOperation[] = [];
    var t = new RecordTransformBuilder();
    if (offlineOnly) {
      const mediafiles = (
        memory.cache.query((q) =>
          q
            .findRecords('mediafile')
            .filter({ relation: 'plan', record: { type: 'plan', id: planid } })
        ) as MediaFileD[]
      ).map((m) => m.id);
      const discussions = (
        memory.cache.query((q) => q.findRecords('discussion')) as DiscussionD[]
      )
        .filter((d) => mediafiles.includes(related(d, 'mediafile')))
        .map((x) => x.id);
      const comments = (
        memory.cache.query((q) => q.findRecords('comment')) as CommentD[]
      )
        .filter((d) => discussions.includes(related(d, 'discussion')))
        .map((x) => x.id);
      const sections = (
        memory.cache.query((q) =>
          q
            .findRecords('section')
            .filter({ relation: 'plan', record: { type: 'plan', id: planid } })
        ) as SectionD[]
      ).map((s) => s.id);
      const passages = (
        memory.cache.query((q) => q.findRecords('passage')) as PassageD[]
      )
        .filter((p) => sections.includes(related(p, 'section')))
        .map((p) => p.id);
      const psc = (
        memory.cache.query((q) =>
          q.findRecords('passagestatechange')
        ) as PassageStateChangeD[]
      )
        .filter((p) => passages.includes(related(p, 'passage')))
        .map((p) => p.id);
      const sectionresources = (
        memory.cache.query((q) =>
          q.findRecords('sectionresource')
        ) as SectionResourceD[]
      )
        .filter((r) => sections.includes(r.id))
        .map((r) => r.id);

      psc.forEach((id) =>
        ops.push(
          t
            .removeRecord({
              type: 'passagestatechange',
              id: id,
            })
            .toOperation()
        )
      );
      comments.forEach((id) =>
        ops.push(
          t
            .removeRecord({
              type: 'comment',
              id: id,
            })
            .toOperation()
        )
      );
      discussions.forEach((id) =>
        ops.push(
          t
            .removeRecord({
              type: 'discussion',
              id: id,
            })
            .toOperation()
        )
      );
      mediafiles.forEach((id) =>
        ops.push(
          t
            .removeRecord({
              type: 'mediafile',
              id: id,
            })
            .toOperation()
        )
      );
      sectionresources.forEach((id) =>
        ops.push(
          t
            .removeRecord({
              type: 'sectionresource',
              id: id,
            })
            .toOperation()
        )
      );

      passages.forEach((id) =>
        ops.push(
          t
            .removeRecord({
              type: 'passage',
              id: id,
            })
            .toOperation()
        )
      );
      sections.forEach((id) =>
        ops.push(
          t
            .removeRecord({
              type: 'section',
              id: id,
            })
            .toOperation()
        )
      );
    }
    ops.push(
      t.removeRecord({ type: 'plan', id: planid }).toOperation(),
      t.removeRecord({ type: 'project', id: projectid }).toOperation()
    );
    await memory.update(ops);

    setProjectsLoaded(projectsLoaded.filter((p) => p !== projectid));
  };
};
