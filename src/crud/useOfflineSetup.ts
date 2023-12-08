import { useGlobal } from 'reactn';
import {
  Role,
  ProjectType,
  ArtifactCategory,
  ArtifactType,
  RoleNames,
  WorkflowStep,
  Integration,
  ProjectTypeD,
  IntegrationD,
  RoleD,
  WorkflowStepD,
  ArtifactCategoryD,
  ArtifactTypeD,
} from '../model';
import {
  RecordTransformBuilder,
  StandardRecordNormalizer,
} from '@orbit/records';
import IndexedDBSource from '@orbit/indexeddb';
import { ArtifactTypeSlug, useArtifactType } from '.';
import PassageType, { PassageTypeD } from '../model/passageType';

export const useOfflineSetup = () => {
  const [memory] = useGlobal('memory');
  const [coordinator] = useGlobal('coordinator');
  const backup = coordinator.getSource('backup') as IndexedDBSource;
  const { getTypeId } = useArtifactType();
  const makeTypeRecs = async (kind: string) => {
    const allTypeRecs = memory.cache.query((q) =>
      q.findRecords(`${kind}type`)
    ) as unknown as ProjectTypeD[];
    const offlineTypeRecs = allTypeRecs.filter((r) => !r?.keys?.remoteId);
    if (offlineTypeRecs.length === 0) {
      const rn = new StandardRecordNormalizer({ schema: memory.schema });

      let scriptureRec: ProjectType = {
        type: `${kind}type`,
        attributes: {
          name: 'Scripture',
        },
      } as any;
      scriptureRec = rn.normalizeRecord(scriptureRec) as ProjectTypeD;
      let otherRec: ProjectType = {
        type: `${kind}type`,
        attributes: {
          name: kind === 'project' ? 'Generic' : 'Other',
        },
      } as any;
      otherRec = rn.normalizeRecord(otherRec) as ProjectTypeD;
      const transform = (t: RecordTransformBuilder) => [
        t.addRecord(scriptureRec),
        t.addRecord(otherRec),
      ];
      await backup.sync(transform);
      await memory.sync(transform);
    }
  };

  const makeIntegrationRecs = async () => {
    const allRecs = memory.cache.query((q) =>
      q.findRecords('integration')
    ) as Integration[];
    const offlineRecs = allRecs.filter((r) => !r?.keys?.remoteId);
    const rn = new StandardRecordNormalizer({ schema: memory.schema });
    if (offlineRecs.length === 0) {
      let paratextRec = {
        type: 'integration',
        attributes: {
          name: 'paratext',
        },
      } as Integration;
      paratextRec = rn.normalizeRecord(paratextRec) as IntegrationD;
      await backup.sync((t) => [t.addRecord(paratextRec)]);
      await memory.sync((t) => [t.addRecord(paratextRec)]);
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
      wbtRec = rn.normalizeRecord(wbtRec) as IntegrationD;
      let pbtRec = {
        type: 'integration',
        attributes: {
          name: 'paratextbacktranslation',
        },
      } as Integration;
      pbtRec = rn.normalizeRecord(pbtRec) as IntegrationD;
      await backup.sync((t) => [t.addRecord(wbtRec), t.addRecord(pbtRec)]);
      await memory.sync((t) => [t.addRecord(wbtRec), t.addRecord(pbtRec)]);
    }
  };

  const makeRoleRecs = async () => {
    const allRoleRecs = memory.cache.query((q) =>
      q.findRecords('role')
    ) as Role[];
    const offlineRoleRecs = allRoleRecs.filter((r) => !r?.keys?.remoteId);
    const rn = new StandardRecordNormalizer({ schema: memory.schema });
    if (offlineRoleRecs.length === 0) {
      let adminRec = {
        type: 'role',
        attributes: {
          orgRole: true,
          roleName: RoleNames.Admin,
        },
      } as Role;
      adminRec = rn.normalizeRecord(adminRec) as RoleD;
      let memberRec = {
        type: 'role',
        attributes: {
          orgRole: true,
          roleName: RoleNames.Member,
        },
      } as Role;
      memberRec = rn.normalizeRecord(memberRec) as RoleD;
      const transform = (t: RecordTransformBuilder) => [
        t.addRecord(adminRec),
        t.addRecord(memberRec),
      ];
      await backup.sync(transform);
      await memory.sync(transform);
    }
  };

  interface ISteps {
    name: string;
    tool: string;
    artId?: string;
  }

  const makeWorkflowProcessSteps = async (process: string, steps: ISteps[]) => {
    const t = new RecordTransformBuilder();
    const rn = new StandardRecordNormalizer({ schema: memory.schema });
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
      rec = rn.normalizeRecord(rec) as WorkflowStepD;
      return t.addRecord(rec);
    });
    await backup.sync((t) => ops);
    await memory.sync((t) => ops);
  };

  const makeWorkflowStepsRecs = async () => {
    const allRecs = (await memory.query((q) =>
      q.findRecords('workflowstep')
    )) as WorkflowStep[];
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
    // console.log('WBT', WBT, 'PBT', PBT);
    if (offlineRecs.length === 0) {
      await makeWorkflowProcessSteps('OBT', [
        { name: 'Internalize', tool: 'resource' },
        { name: 'Record', tool: 'record' },
        { name: 'TermIdentify', tool: 'keyterm' },
        { name: 'Transcribe', tool: 'transcribe' },
        { name: 'Review', tool: 'transcribe' },
        { name: 'ParatextSync', tool: 'paratext' },
        { name: 'ParatextPeerReview', tool: 'discuss' },
        { name: 'CommunityTesting', tool: 'community' },
        { name: 'PhraseBackTranslation', tool: 'phraseBackTranslate' },
        { name: 'PBTTranscribe', tool: 'transcribe', artId: PBT },
        { name: 'PBTParatextSync', tool: 'paratext', artId: PBT },
        { name: 'ConsultantCheck', tool: 'consultantCheck' },
        { name: 'FinalReview', tool: 'record' },
        { name: 'FinalReviewText', tool: 'transcribe' },
        { name: 'Export', tool: 'export' },
        { name: 'Done', tool: 'done' },
      ]);

      await makeWorkflowProcessSteps('OBTs', [
        { name: 'Record', tool: 'record' },
        { name: 'Export', tool: 'export' },
      ]);

      await makeWorkflowProcessSteps('OBTr', [
        { name: 'Internalize', tool: 'resource' },
        { name: 'Record', tool: 'record' },
        { name: 'TeamCheck', tool: 'teamCheck' },
        { name: 'PeerReview', tool: 'teamCheck' },
        { name: 'CommunityTesting', tool: 'community' },
        { name: 'WholeBackTranslation', tool: 'wholeBackTranslate' },
        { name: 'PhraseBackTranslation', tool: 'phraseBackTranslate' },
        { name: 'ConsultantCheck', tool: 'consultantCheck' },
        { name: 'Export', tool: 'export' },
        { name: 'Done', tool: 'done' },
      ]);

      await makeWorkflowProcessSteps('OBTo', [
        { name: 'Internalize', tool: 'resource' },
        { name: 'Record', tool: 'record' },
        { name: 'TermIdentify', tool: 'keyterm' },
        { name: 'PeerReview', tool: 'teamCheck' },
        { name: 'PhraseBackTranslation', tool: 'phraseBackTranslate' },
        { name: 'ConsultantCheck1', tool: 'consultantCheck' },
        { name: 'CommunityTesting', tool: 'community' },
        {
          name: 'RetellBackTranslation',
          tool: 'phraseBackTranslate',
          artId: RBT,
        },
        { name: 'PhraseBackTranslation', tool: 'phraseBackTranslate' },
        { name: 'PBTTranscribe', tool: 'transcribe', artId: PBT },
        { name: 'RetellTranscribe', tool: 'paratext', artId: RBT },
        { name: 'ConsultantCheck2', tool: 'consultantCheck' },
        { name: 'FinalReview', tool: 'discuss' },
        { name: 'FinalRecording', tool: 'discuss' },
        { name: 'Export', tool: 'export' },
        { name: 'Done', tool: 'done' },
      ]);

      await makeWorkflowProcessSteps('OBS', [
        { name: 'Internalize', tool: 'resource' },
        { name: 'Record', tool: 'record' },
        { name: 'TeamCheck', tool: 'teamCheck' },
        { name: 'PeerReview', tool: 'teamCheck' },
        { name: 'CommunityTest1', tool: 'community' },
        { name: 'CommunityTest2', tool: 'community' },
        { name: 'BackTranslation', tool: 'phraseBackTranslate' },
        { name: 'ConsultantCheck', tool: 'consultantCheck' },
        { name: 'PreliminaryApproval', tool: 'export' },
        { name: 'FinalReview', tool: 'discuss' },
        { name: 'FinalRecording', tool: 'discuss' },
        { name: 'Export', tool: 'export' },
        { name: 'Done', tool: 'done' },
      ]);

      await makeWorkflowProcessSteps('draft', [
        { name: 'Internalize', tool: 'resource' },
        { name: 'Record', tool: 'record' },
        { name: 'TeamCheck', tool: 'teamCheck' },
        { name: 'Transcribe', tool: 'transcribe' },
        { name: 'Review', tool: 'transcribe' },
        { name: 'ParatextSync', tool: 'paratext' },
        { name: 'Done', tool: 'done' },
      ]);

      await makeWorkflowProcessSteps('transcriber', [
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
      await makeWorkflowProcessSteps('Render', [
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
    const rn = new StandardRecordNormalizer({ schema: memory.schema });
    const allRecs = memory.cache.query((q) =>
      q.findRecords('artifactcategory')
    ) as WorkflowStep[];
    const offlineRecs = allRecs.filter((r) => !r?.keys?.remoteId);
    if (offlineRecs.length === 0) {
      const t = new RecordTransformBuilder();
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
        rec = rn.normalizeRecord(rec) as ArtifactCategoryD;
        return t.addRecord(rec);
      });
      await backup.sync((t) => ops);
      await memory.sync((t) => ops);
    }
  };
  const makeArtifactTypeRecs = async () => {
    const rn = new StandardRecordNormalizer({ schema: memory.schema });
    const allRecs = memory.cache.query((q) =>
      q.findRecords('artifacttype')
    ) as WorkflowStep[];
    const offlineRecs = allRecs.filter((r) => !r?.keys?.remoteId);
    if (offlineRecs.length === 0) {
      const t = new RecordTransformBuilder();
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
        rec = rn.normalizeRecord(rec) as ArtifactTypeD;
        return t.addRecord(rec);
      });
      await backup.sync((t) => ops);
      await memory.sync((t) => ops);
    }
    if (offlineRecs.length < 10) {
      const t = new RecordTransformBuilder();
      const ops = ['intellectualproperty', 'wholebacktranslation'].map((n) => {
        let rec = {
          type: 'artifacttype',
          attributes: {
            typename: n,
          },
        } as ArtifactType;
        rec = rn.normalizeRecord(rec) as ArtifactTypeD;
        return t.addRecord(rec);
      });
      await backup.sync((t) => ops);
      await memory.sync((t) => ops);
    }
  };
  const makeMoreArtifactTypeRecs = async () => {
    const rn = new StandardRecordNormalizer({ schema: memory.schema });
    const allRecs = memory.cache.query((q) =>
      q.findRecords('artifacttype')
    ) as WorkflowStep[];
    const offlineRecs = allRecs.filter((r) => !r?.keys?.remoteId);
    if (offlineRecs.length < 10) {
      const t = new RecordTransformBuilder();
      const ops = ['intellectualproperty', 'wholebacktranslation'].map((n) => {
        let rec = {
          type: 'artifacttype',
          attributes: {
            typename: n,
          },
        } as ArtifactType;
        rec = rn.normalizeRecord(rec) as ArtifactTypeD;
        return t.addRecord(rec);
      });
      await backup.sync((t) => ops);
      await memory.sync((t) => ops);
    }
  };
  const makeTitleArtifactTypeRec = async () => {
    const rn = new StandardRecordNormalizer({ schema: memory.schema });
    const allRecs = memory.cache.query((q) =>
      q.findRecords('artifacttype')
    ) as WorkflowStep[];
    const offlineRecs = allRecs.filter((r) => !r?.keys?.remoteId);
    if (offlineRecs.length < 10) {
      const t = new RecordTransformBuilder();
      const ops = ['title', 'graphic'].map((n) => {
        let rec = {
          type: 'artifacttype',
          attributes: {
            typename: n,
          },
        } as ArtifactType;
        rec = rn.normalizeRecord(rec) as ArtifactTypeD;
        return t.addRecord(rec);
      });
      await backup.sync((t) => ops);
      await memory.sync((t) => ops);
    }
  };
  const makePassageTypeRecs = async () => {
    const rn = new StandardRecordNormalizer({ schema: memory.schema });
    const allRecs = memory.cache.query((q) =>
      q.findRecords('passagetype')
    ) as PassageType[];
    const offlineRecs = allRecs.filter((r) => !r?.keys?.remoteId);
    if (offlineRecs.length === 0) {
      const t = new RecordTransformBuilder();
      const ops = [
        {
          usfm: 'toc2',
          title: 'altbookname',
          abbrev: 'ALTBK',
          defaultOrder: -3,
        },
        { usfm: 'toc1', title: 'bookname', abbrev: 'BOOK', defaultOrder: -4 },
        { usfm: 'esb', title: 'audionote', abbrev: 'NOTE', defaultOrder: 0 },
        {
          usfm: 'cn',
          title: 'chapter number',
          abbrev: 'CHNUM',
          defaultOrder: -2,
        },
        { usfm: 's', title: 'title', abbrev: 'TITLE', defaultOrder: -1 },
      ].map((n) => {
        let rec = {
          type: 'passagetype',
          attributes: { ...n },
        } as PassageType;
        rec = rn.normalizeRecord(rec) as PassageTypeD;
        return t.addRecord(rec);
      });
      await backup.sync((t) => ops);
      await memory.sync((t) => ops);
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
    if (parseInt(process.env.REACT_APP_SCHEMAVERSION || '100') > 5) {
      await makePassageTypeRecs();
      makeTitleArtifactTypeRec();
    }
  };
};
