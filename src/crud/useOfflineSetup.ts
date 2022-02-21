import { useGlobal } from 'reactn';
import {
  Role,
  ProjectType,
  ArtifactCategory,
  ArtifactType,
  RoleNames,
} from '../model';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import IndexedDBSource from '@orbit/indexeddb';
import WorkflowStep from '../model/workflowStep';
import { findRecord } from '.';

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
          roleName: RoleNames.Admin,
        },
      } as Role;
      memory.schema.initializeRecord(adminRec);
      let memberRec = {
        type: 'role',
        attributes: {
          orgRole: true,
          groupRole: false,
          roleName: RoleNames.Member,
        },
      } as Role;
      memory.schema.initializeRecord(memberRec);
      let editorRec = {
        type: 'role',
        attributes: {
          orgRole: false,
          groupRole: true,
          roleName: RoleNames.Editor,
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
    if (
      offlineRoleRecs.findIndex(
        (r) => r.attributes?.roleName === RoleNames.Transcriber
      ) < 0
    ) {
      let transRec = {
        type: 'role',
        attributes: {
          orgRole: false,
          groupRole: true,
          roleName: RoleNames.Transcriber,
        },
      } as Role;
      memory.schema.initializeRecord(transRec);
      await memory.sync(
        await backup.push((t: TransformBuilder) => [t.addRecord(transRec)])
      );
    }
    /*
    if (offlineRoleRecs.findIndex(
        (r) => r.attributes?.roleName === RoleNames.Transcriber
      ) < 0) {
      const t = new TransformBuilder();
      const ops = [
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
    } */
  };

  const makeWorkflowStepsRecs = async () => {
    const allRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('workflowstep')
    ) as WorkflowStep[];
    const offlineRecs = allRecs.filter((r) => !r?.keys?.remoteId);
    if (offlineRecs.length === 0) {
      const t = new TransformBuilder();
      var process = 'OBT';
      let ops = [
        { name: 'Internalization', tool: 'resource' },
        { name: 'Record', tool: 'record' },
        { name: 'TeamCheck', tool: 'teamCheck' },
        { name: 'PeerReview', tool: 'teamCheck' },
        { name: 'Transcribe', tool: 'transcribe' },
        { name: 'ParatextSync', tool: 'paratext' },
        { name: 'CommunityTesting', tool: 'community' },
        { name: 'WholeBackTranslation', tool: 'backTranslate' },
        { name: 'PhraseBackTranslation', tool: 'backTranslate' },
        { name: 'ConsultantCheck', tool: 'discuss' },
        { name: 'FinalReview', tool: 'discuss' },
        { name: 'FinalRecording', tool: 'discuss' },
        { name: 'Export', tool: 'export' },
        { name: 'Done', tool: 'done' },
      ].map((step, ix) => {
        let rec = {
          type: 'workflowstep',
          attributes: {
            process: process,
            name: step.name,
            sequencenum: ix + 1,
            tool: `{"tool": "${step.tool}"}`,
            permissions: '{}',
          },
        } as WorkflowStep;
        memory.schema.initializeRecord(rec);
        return t.addRecord(rec);
      });
      await memory.sync(await backup.push(ops));

      process = 'OBS';
      ops = [
        { name: 'Internalization', tool: 'resource' },
        { name: 'Record', tool: 'record' },
        { name: 'TeamCheck', tool: 'teamCheck' },
        { name: 'PeerReview', tool: 'teamCheck' },
        { name: 'CommunityTest1', tool: 'community' },
        { name: 'CommunityTest2', tool: 'community' },
        { name: 'PhraseBackTranslation', tool: 'backTranslate' },
        { name: 'ConsultantCheck', tool: 'discuss' },
        { name: 'PreliminaryApproval', tool: 'export' },
        { name: 'FinalReview', tool: 'discuss' },
        { name: 'FinalRecording', tool: 'discuss' },
        { name: 'Export', tool: 'export' },
        { name: 'Done', tool: 'done' },
      ].map((step, ix) => {
        let rec = {
          type: 'workflowstep',
          attributes: {
            process: process,
            name: step.name,
            sequencenum: ix + 1,
            tool: `{"tool": "${step.tool}"}`,
            permissions: '{}',
          },
        } as WorkflowStep;
        memory.schema.initializeRecord(rec);
        return t.addRecord(rec);
      });
      await memory.sync(await backup.push(ops));
      process = 'draft';
      ops = [
        { name: 'Internalization', tool: '{"tool": "resource"}' },
        { name: 'Record', tool: '{"tool": "record"}' },
        { name: 'TeamCheck', tool: '{"tool": "teamCheck"}' },
        { name: 'Transcribe', tool: '{"tool": "transcribe"}' },
        { name: 'ParatextSync', tool: '{"tool": "paratext"}' },
        { name: 'Done', tool: '{"tool": "done"}' },
      ].map((step, ix) => {
        let rec = {
          type: 'workflowstep',
          attributes: {
            process: process,
            name: step.name,
            sequencenum: ix + 1,
            tool: `{"tool": "${step.tool}"}`,
            permissions: '{}',
          },
        } as WorkflowStep;
        memory.schema.initializeRecord(rec);
        return t.addRecord(rec);
      });
      await memory.sync(await backup.push(ops));
      process = 'transcriber';
      ops = [
        { name: 'Record', tool: 'record' },
        { name: 'Transcribe', tool: 'transcribe' },
        { name: 'ParatextSync', tool: 'paratext' },
        { name: 'Export', tool: 'export' },
        { name: 'Done', tool: 'done' },
      ].map((step, ix) => {
        let rec = {
          type: 'workflowstep',
          attributes: {
            process: process,
            name: step.name,
            sequencenum: ix + 1,
            tool: `{"tool": "${step.tool}"}`,
            permissions: '{}',
          },
        } as WorkflowStep;
        memory.schema.initializeRecord(rec);
        return t.addRecord(rec);
      });
      await memory.sync(await backup.push(ops));
    }
  };
  const makeArtifactCategoryRecs = async () => {
    const allRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('artifactcategory')
    ) as WorkflowStep[];
    const offlineRecs = allRecs.filter((r) => !r?.keys?.remoteId);
    if (offlineRecs.length === 0) {
      const t = new TransformBuilder();
      const ops = [
        'activity',
        'biblestory',
        'bookintro',
        'scripture',
        'translationresource',
      ].map((n) => {
        let rec = {
          type: 'artifactcategory',
          attributes: {
            discussion: false,
            resource: true,
            categoryname: n,
          },
        } as ArtifactCategory;
        memory.schema.initializeRecord(rec);
        return t.addRecord(rec);
      });
      await memory.sync(await backup.push(ops));
    }
  };
  const makeArtifactTypeRecs = async () => {
    const allRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('artifacttype')
    ) as WorkflowStep[];
    const offlineRecs = allRecs.filter((r) => !r?.keys?.remoteId);
    if (offlineRecs.length === 0) {
      const t = new TransformBuilder();
      const ops = [
        'activity',
        'backtranslation',
        'comment',
        'qanda',
        'resource',
        'retell',
        'sharedresource',
      ].map((n) => {
        let rec = {
          type: 'artifacttype',
          attributes: {
            typename: n,
          },
        } as ArtifactType;
        memory.schema.initializeRecord(rec);
        return t.addRecord(rec);
      });
      await memory.sync(await backup.push(ops));
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
