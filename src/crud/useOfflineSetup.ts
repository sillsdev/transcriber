import { useGlobal } from 'reactn';
import { Role, ProjectType, ArtifactCategory, ArtifactType } from '../model';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import IndexedDBSource from '@orbit/indexeddb';
import WorkflowStep from '../model/workflowStep';

export const useOfflineSetup = () => {
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const backup = coordinator.getSource('backup') as IndexedDBSource;

  const makeTypeRecs = async (kind: string) => {
    const allTypeRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords(`${kind}type`)
    ) as ProjectType[];
    const offlineTypeRecs = allTypeRecs.filter((r) => !r?.keys?.remoteId);
    if (offlineTypeRecs.length === 0) {
      let scriptureRec: ProjectType = {
        type: `${kind}type`,
        attributes: {
          name: 'Scripture',
        },
      } as any;
      memory.schema.initializeRecord(scriptureRec);
      let otherRec: ProjectType = {
        type: `${kind}type`,
        attributes: {
          name: kind === 'project' ? 'Generic' : 'Other',
        },
      } as any;
      memory.schema.initializeRecord(otherRec);
      await memory.sync(
        await backup.push((t: TransformBuilder) => [
          t.addRecord(scriptureRec),
          t.addRecord(otherRec),
        ])
      );
    }
  };
  const makeRoleRecs = async () => {
    const allRoleRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('role')
    ) as Role[];
    const offlineRoleRecs = allRoleRecs.filter((r) => !r?.keys?.remoteId);
    if (offlineRoleRecs.length === 0) {
      let adminRec = {
        type: 'role',
        attributes: {
          orgRole: true,
          groupRole: true,
          roleName: 'Admin',
        },
      } as Role;
      memory.schema.initializeRecord(adminRec);
      let memberRec = {
        type: 'role',
        attributes: {
          orgRole: true,
          groupRole: false,
          roleName: 'Member',
        },
      } as Role;
      memory.schema.initializeRecord(memberRec);
      let editorRec = {
        type: 'role',
        attributes: {
          orgRole: false,
          groupRole: true,
          roleName: 'Editor',
        },
      } as Role;
      memory.schema.initializeRecord(editorRec);
      await memory.sync(
        await backup.push((t: TransformBuilder) => [
          t.addRecord(adminRec),
          t.addRecord(memberRec),
          t.addRecord(editorRec),
        ])
      );
    }
    if (offlineRoleRecs.length === 0 || offlineRoleRecs.length === 3) {
      const t = new TransformBuilder();
      const ops = [
        'Transcriber',
        'Translator',
        'BackTranslator',
        'Consultant',
        'Observer',
        'PeerReviewer',
      ].map((name) => {
        let rec = {
          type: 'role',
          attributes: {
            orgRole: false,
            groupRole: true,
            roleName: name,
          },
        } as Role;
        memory.schema.initializeRecord(rec);
        return t.addRecord(rec);
      });
      await memory.sync(await backup.push(ops));
    }
  };
  const makeWorkflowStepsRecs = async () => {
    const allRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('workflowstep')
    ) as WorkflowStep[];
    const offlineRecs = allRecs.filter((r) => !r?.keys?.remoteId);
    if (offlineRecs.length === 0) {
      const names = [
        'Internalization',
        'Record',
        'TeamCheck',
        'PeerReview',
        'KeyTerms',
        'CommunityTesting',
        'BackTranslation',
        'ConsultantCheck',
        'Review',
        'FinalEdit',
        'ReadThrough',
        'Duplication',
      ];
      const tools = [
        'audio',
        'audio',
        'transcribe',
        'audio',
        'transcribe',
        'audio',
        'back translate',
        'audio',
        'audio',
        'audio',
        'audio',
        'audio',
      ];
      for (let ix = 0; ix < names.length; ix += 1) {
        const n = names[ix];
        const s = {
          type: 'workflowstep',
          attributes: {
            process: 'OBT',
            name: n,
            sequencenum: ix + 1,
            tool: `{"tool": "${tools[ix]}"}`,
            permissions: '{"role": "any", "signoffrole": "none"}',
          },
        } as WorkflowStep;
        memory.schema.initializeRecord(s);
        await memory.sync(
          await backup.push((t: TransformBuilder) => [t.addRecord(s)])
        );
      }
    }
  };
  const makeArtifactCategoryRecs = async () => {
    const allRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('artifactcategory')
    ) as WorkflowStep[];
    const offlineRecs = allRecs.filter((r) => !r?.keys?.remoteId);
    if (offlineRecs.length === 0) {
      const names = [
        'cultural',
        'geographic',
        'person',
        'theology',
        'word',
        'grammar',
      ];
      for (let ix = 0; ix < names.length; ix += 1) {
        const n = names[ix];
        const s = {
          type: 'artifactcategory',
          attributes: {
            categoryname: n,
          },
        } as ArtifactCategory;
        memory.schema.initializeRecord(s);
        await memory.sync(
          await backup.push((t: TransformBuilder) => [t.addRecord(s)])
        );
      }
    }
  };
  const makeArtifactTypeRecs = async () => {
    const allRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('artifacttype')
    ) as WorkflowStep[];
    const offlineRecs = allRecs.filter((r) => !r?.keys?.remoteId);
    if (offlineRecs.length === 0) {
      const names = [
        'activity',
        'resource',
        'backtranslation',
        'vernacular',
        'comment',
        'testing',
      ];
      for (let ix = 0; ix < names.length; ix += 1) {
        const n = names[ix];
        const s = {
          type: 'artifacttype',
          attributes: {
            typename: n,
          },
        } as ArtifactType;
        memory.schema.initializeRecord(s);
        await memory.sync(
          await backup.push((t: TransformBuilder) => [t.addRecord(s)])
        );
      }
    }
  };
  return async () => {
    // local update only, migrate offlineproject to include offlineAvailable
    await makeRoleRecs();
    await makeTypeRecs('project');
    await makeTypeRecs('plan');
    if (parseInt(process.env.REACT_APP_SCHEMAVERSION || '100') > 3) {
      await makeArtifactCategoryRecs();
      await makeArtifactTypeRecs();
      await makeWorkflowStepsRecs();
    }
  };
};
