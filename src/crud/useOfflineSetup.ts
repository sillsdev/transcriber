import { useGlobal } from 'reactn';
import {
  Role,
  ProjectType,
  ArtifactCategory,
  ArtifactType,
  RoleNames,
  WorkflowStep,
  Integration,
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

  const makeIntegrationRecs = async () => {
    const allRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('integration')
    ) as Integration[];
    const offlineRecs = allRecs.filter((r) => !r?.keys?.remoteId);
    if (offlineRecs.length === 0) {
      let paratextRec = {
        type: 'integration',
        attributes: {
          name: 'paratext',
        },
      } as Integration;
      memory.schema.initializeRecord(paratextRec);
      await memory.sync(
        await backup.push((t: TransformBuilder) => [t.addRecord(paratextRec)])
      );
    }
    if (
      offlineRecs.filter(
        (r) => r.attributes.name === 'paratextwholebacktranslation'
      ).length === 0
    ) {
      let wbtRec = {
        type: 'integration',
        attributes: {
          name: 'paratextwholebacktranslation',
        },
      } as Integration;
      memory.schema.initializeRecord(wbtRec);
      let pbtRec = {
        type: 'integration',
        attributes: {
          name: 'paratextbacktranslation',
        },
      } as Integration;
      memory.schema.initializeRecord(pbtRec);
      await memory.sync(
        await backup.push((t: TransformBuilder) => [
          t.addRecord(wbtRec),
          t.addRecord(pbtRec),
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

  interface ISteps {
    name: string;
    tool: string;
    artId?: string;
  }

  const makeWorkflowProcessSteps = async (process: string, steps: ISteps[]) => {
    const t = new TransformBuilder();
    let ops = steps.map((step, ix) => {
      const toolSettings = step.artId
        ? `, "settings":{"artifactTypeId": "${step.artId}"}`
        : '';
      let rec = {
        type: 'workflowstep',
        attributes: {
          process: process,
          name: step.name,
          sequencenum: ix + 1,
          tool: `{"tool": "${step.tool}"${toolSettings}}`,
          permissions: '{}',
        },
      } as WorkflowStep;
      memory.schema.initializeRecord(rec);
      return t.addRecord(rec);
    });
    await memory.sync(await backup.push(ops));
  };

  const makeWorkflowStepsRecs = async () => {
    const allRecs = memory.cache.query((q: QueryBuilder) =>
      q.findRecords('workflowstep')
    ) as WorkflowStep[];
    const offlineRecs = allRecs.filter((r) => !r?.keys?.remoteId);
    const WBT = getTypeId(
      ArtifactTypeSlug.WholeBackTranslation,
      true
    ) as string;
    const PBT = getTypeId(
      ArtifactTypeSlug.PhraseBackTranslation,
      true
    ) as string;
    const RBT = getTypeId(ArtifactTypeSlug.Retell, true) as string;
    console.log('WBT', WBT, 'PBT', PBT);
    if (offlineRecs.length === 0) {
      makeWorkflowProcessSteps('OBT', [
        { name: 'Internalize', tool: 'resource' },
        { name: 'Record', tool: 'record' },
        { name: 'TermIdentify', tool: 'keyterm' },
        { name: 'PeerReview', tool: 'teamCheck' },
        { name: 'CommunityTesting', tool: 'community' },
        { name: 'Transcribe', tool: 'transcribe' },
        { name: 'ParatextSync', tool: 'paratext' },
        { name: 'PhraseBackTranslation', tool: 'phraseBackTranslate' },
        { name: 'PBTTranscribe', tool: 'transcribe', artId: PBT },
        { name: 'PBTParatextSync', tool: 'paratext', artId: PBT },
        { name: 'ConsultantCheck', tool: 'discuss' },
        { name: 'FinalReview', tool: 'discuss' },
        { name: 'FinalReviewText', tool: 'discuss' },
        { name: 'Export', tool: 'export' },
        { name: 'Done', tool: 'done' },
      ]);

      makeWorkflowProcessSteps('OBTs', [
        { name: 'Record', tool: 'record' },
        { name: 'Export', tool: 'export' },
      ]);

      makeWorkflowProcessSteps('OBTr', [
        { name: 'Internalize', tool: 'resource' },
        { name: 'Record', tool: 'record' },
        { name: 'TeamCheck', tool: 'teamCheck' },
        { name: 'PeerReview', tool: 'teamCheck' },
        { name: 'CommunityTesting', tool: 'community' },
        { name: 'WholeBackTranslation', tool: 'wholeBackTranslate' },
        { name: 'PhraseBackTranslation', tool: 'phraseBackTranslate' },
        { name: 'ConsultantCheck', tool: 'discuss' },
        { name: 'Export', tool: 'export' },
        { name: 'Done', tool: 'done' },
      ]);

      makeWorkflowProcessSteps('OBTo', [
        { name: 'Internalize', tool: 'resource' },
        { name: 'Record', tool: 'record' },
        { name: 'TermIdentify', tool: 'keyterm' },
        { name: 'PeerReview', tool: 'teamCheck' },
        { name: 'PhraseBackTranslation', tool: 'phraseBackTranslate' },
        { name: 'ConsultantCheck1', tool: 'discuss' },
        { name: 'CommunityTesting', tool: 'community' },
        {
          name: 'RetellBackTranslation',
          tool: 'phraseBackTranslate',
          artId: RBT,
        },
        { name: 'PhraseBackTranslation', tool: 'phraseBackTranslate' },
        { name: 'PBTTranscribe', tool: 'transcribe', artId: PBT },
        { name: 'RetellTranscribe', tool: 'paratext', artId: RBT },
        { name: 'ConsultantCheck2', tool: 'discuss' },
        { name: 'FinalReview', tool: 'discuss' },
        { name: 'FinalRecording', tool: 'discuss' },
        { name: 'Export', tool: 'export' },
        { name: 'Done', tool: 'done' },
      ]);

      makeWorkflowProcessSteps('OBS', [
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
      ]);

      makeWorkflowProcessSteps('draft', [
        { name: 'Internalize', tool: 'resource' },
        { name: 'Record', tool: 'record' },
        { name: 'TeamCheck', tool: 'teamCheck' },
        { name: 'Transcribe', tool: 'transcribe"}' },
        { name: 'ParatextSync', tool: 'paratext' },
        { name: 'Done', tool: 'done' },
      ]);

      makeWorkflowProcessSteps('transcriber', [
        { name: 'Record', tool: 'record' },
        { name: 'Transcribe', tool: 'transcribe' },
        { name: 'ParatextSync', tool: 'paratext' },
        { name: 'Export', tool: 'export' },
        { name: 'Done', tool: 'done' },
      ]);
    }
    if (
      offlineRecs.filter((w) => w.attributes.process === 'Render').length === 0
    ) {
      makeWorkflowProcessSteps('Render', [
        { name: 'Transcribe', tool: 'transcribe' },
        { name: 'ParatextSync', tool: 'paratext' },
        { name: 'WholeBackTranslation', tool: 'wholeBackTranslate' },
        { name: 'WBTTranscribe', tool: 'transcribe', artId: WBT },
        { name: 'WBTParatextSync', tool: 'paratext', artId: WBT },
        { name: 'PhraseBackTranslation', tool: 'phraseBackTranslate' },
        { name: 'PBTTranscribe', tool: 'transcribe', artId: PBT },
        { name: 'PBTParatextSync', tool: 'paratext', artId: PBT },
      ]);
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
    await makeIntegrationRecs(); //this used to be automatic until we started trying to guess at what project they wanted.
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
