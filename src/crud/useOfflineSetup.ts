import { useGlobal } from 'reactn';
import {
  Role,
  ProjectType,
  ArtifactCategory,
  ArtifactType,
  RoleNames,
  WorkflowStep,
} from '../model';
import { QueryBuilder, TransformBuilder } from '@orbit/data';
import IndexedDBSource from '@orbit/indexeddb';
import { ArtifactTypeSlug, useArtifactType } from '.';

export const useOfflineSetup = () => {
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const backup = coordinator.getSource('backup') as IndexedDBSource;
  const { getTypeId } = useArtifactType();
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
          roleName: RoleNames.Admin,
        },
      } as Role;
      memory.schema.initializeRecord(adminRec);
      let memberRec = {
        type: 'role',
        attributes: {
          orgRole: true,
          roleName: RoleNames.Member,
        },
      } as Role;
      memory.schema.initializeRecord(memberRec);

      await memory.sync(
        await backup.push((t: TransformBuilder) => [
          t.addRecord(adminRec),
          t.addRecord(memberRec),
        ])
      );
    }
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
        { name: 'Internalize', tool: 'resource' },
        { name: 'Record', tool: 'record' },
        { name: 'TeamCheck', tool: 'teamCheck' },
        { name: 'PeerReview', tool: 'teamCheck' },
        { name: 'Transcribe', tool: 'transcribe' },
        { name: 'ParatextSync', tool: 'paratext' },
        { name: 'CommunityTesting', tool: 'community' },
        { name: 'WholeBackTranslation', tool: 'wholeBackTranslate' },
        { name: 'PhraseBackTranslation', tool: 'phraseBackTranslate' },
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
        { name: 'Internalize', tool: 'resource' },
        { name: 'Record', tool: 'record' },
        { name: 'TeamCheck', tool: 'teamCheck' },
        { name: 'PeerReview', tool: 'teamCheck' },
        { name: 'CommunityTest1', tool: 'community' },
        { name: 'CommunityTest2', tool: 'community' },
        { name: 'BackTranslation', tool: 'phraseBackTranslate' },
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
        { name: 'Internalize', tool: 'resource' },
        { name: 'Record', tool: 'record' },
        { name: 'TeamCheck', tool: 'teamCheck' },
        { name: 'Transcribe', tool: 'transcribe"}' },
        { name: 'ParatextSync', tool: 'paratext' },
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
    if (
      offlineRecs.filter((w) => w.attributes.process === 'Render').length === 0
    ) {
      const t = new TransformBuilder();
      const WBT = getTypeId(ArtifactTypeSlug.WholeBackTranslation, true);
      const PBT = getTypeId(ArtifactTypeSlug.PhraseBackTranslation, true);
      console.log('WBT', WBT, 'PBT', PBT);
      process = 'Render';
      let ops = [
        { name: 'Transcribe', tool: 'transcribe' },
        { name: 'ParatextSync', tool: 'paratext' },
        { name: 'WholeBackTranslation', tool: 'wholeBackTranslate' },
        {
          name: 'WBTTranscribe',
          tool: 'transcribe',
          settings: WBT,
        },
        {
          name: 'WBTParatextSync',
          tool: 'paratext',
          settings: WBT,
        },
        { name: 'PhraseBackTranslation', tool: 'phraseBackTranslate' },
        { name: 'PBTTranscribe', tool: 'transcribe', settings: PBT },
        { name: 'PBTParatextSync', tool: 'paratext', settings: PBT },
      ].map((step, ix) => {
        console.log(step, 'step.settings', step.settings);
        var tool =
          `{"tool": "${step.tool}", "settings":` +
          (step.settings ? `{"artifactTypeId": "${step.settings}"}}` : `""}`);
        let rec = {
          type: 'workflowstep',
          attributes: {
            process: process,
            name: step.name,
            sequencenum: ix + 1,
            tool: tool,
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
        'projectresource',
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
    if (offlineRecs.length < 10) {
      const t = new TransformBuilder();
      const ops = ['intellectualproperty', 'wholebacktranslation'].map((n) => {
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
  const makeMoreArtifactTypeRecs = async () => {
    const allRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('artifacttype')
    ) as WorkflowStep[];
    const offlineRecs = allRecs.filter((r) => !r?.keys?.remoteId);
    if (offlineRecs.length < 10) {
      const t = new TransformBuilder();
      const ops = ['intellectualproperty', 'wholebacktranslation'].map((n) => {
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
    if (parseInt(process.env.REACT_APP_SCHEMAVERSION || '100') > 4) {
      await makeMoreArtifactTypeRecs();
    }
  };
};
