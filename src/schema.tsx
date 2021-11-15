import {
  KeyMap,
  Operation,
  Schema,
  SchemaSettings,
  TransformBuilder,
} from '@orbit/data';
import Memory from '@orbit/memory';
import IndexedDBSource from '@orbit/indexeddb';
import Coordinator from '@orbit/coordinator';
import { isElectron } from './api-variable';
import { getFingerprint } from './utils';
import { offlineProjectCreate } from './crud';

const schemaDefinition: SchemaSettings = {
  models: {
    activitystate: {
      keys: { remoteId: {} },
      attributes: {
        state: { type: 'string' },
        sequencenum: { type: 'number' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        lastModifiedByUser: { type: 'hasOne', model: 'user' },
      },
    },
    group: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        abbreviation: { type: 'string' },
        ownerId: { type: 'number' },
        allUsers: { type: 'boolean' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        owner: { type: 'hasOne', model: 'organization', inverse: 'groups' },
        projects: { type: 'hasMany', model: 'project', inverse: 'group' },
        groupMemberships: {
          type: 'hasMany',
          model: 'groupmembership',
          inverse: 'group',
        },
        lastModifiedByUser: { type: 'hasOne', model: 'user' },
      },
    },
    groupmembership: {
      keys: { remoteId: {} },
      attributes: {
        font: { type: 'string' },
        fontSize: { type: 'string' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        user: { type: 'hasOne', model: 'user', inverse: 'groupMemberships' },
        group: { type: 'hasOne', model: 'group', inverse: 'groupMemberships' },
        role: { type: 'hasOne', model: 'role' },
        lastModifiedByUser: { type: 'hasOne', model: 'user' },
      },
    },
    integration: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        url: { type: 'string' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        projectIntegrations: {
          type: 'hasMany',
          model: 'projectintegration',
          inverse: 'integration',
        },
        lastModifiedByUser: { type: 'hasOne', model: 'user' },
      },
    },
    invitation: {
      keys: { remoteId: {} },
      attributes: {
        email: { type: 'string' },
        loginLink: { type: 'string' },
        invitedBy: { type: 'string' },
        strings: { type: 'string' },
        silId: { type: 'numer' },
        accepted: { type: 'boolean' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastUpdatedBy: { type: 'number' },
      },
      relationships: {
        organization: {
          type: 'hasOne',
          model: 'organization',
        },
        role: {
          type: 'hasOne',
          model: 'role',
        },
        group: {
          type: 'hasOne',
          model: 'group',
        },
        groupRole: {
          type: 'hasOne',
          model: 'role',
        },
        allUsersRole: {
          type: 'hasOne',
          model: 'role',
        },
        lastModifiedByUser: { type: 'hasOne', model: 'user' },
      },
    },
    organization: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        slug: { type: 'string' },
        SilId: { type: 'number' },
        description: { type: 'string' },
        websiteUrl: { type: 'string' },
        logoUrl: { type: 'string' },
        publicByDefault: { type: 'boolean' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        owner: { type: 'hasOne', model: 'user' },
        users: { type: 'hasMany', model: 'user' },
        groups: { type: 'hasMany', model: 'group', inverse: 'owner' },
        lastModifiedByUser: { type: 'hasOne', model: 'user' },
      },
    },
    organizationmembership: {
      keys: { remoteId: {} },
      attributes: {
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        user: {
          type: 'hasOne',
          model: 'user',
          inverse: 'organizationMemberships',
        },
        organization: { type: 'hasOne', model: 'organization' },
        role: { type: 'hasOne', model: 'role' },
        lastModifiedByUser: { type: 'hasOne', model: 'user' },
      },
    },
    plan: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        organizedBy: { type: 'string' },
        tags: { type: 'string' },
        flat: { type: 'boolean' },
        sectionCount: { type: 'number' },
        slug: { type: 'string' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        owner: { type: 'hasOne', model: 'user' },
        project: { type: 'hasOne', model: 'project', inverse: 'plans' },
        plantype: { type: 'hasOne', model: 'plantype', inverse: 'plans' },
        sections: { type: 'hasMany', model: 'section', inverse: 'plan' },
        mediafiles: { type: 'hasMany', model: 'mediafile', inverse: 'plan' },
        lastModifiedByUser: { type: 'hasOne', model: 'user' },
      },
    },
    plantype: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        description: { type: 'string' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        plans: { type: 'hasMany', model: 'plan', inverse: 'plantype' },
        lastModifiedByUser: { type: 'hasOne', model: 'user' },
      },
    },
    project: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        slug: { type: 'string' },
        description: { type: 'string' },
        uilanguagebcp47: { type: 'string' },
        language: { type: 'string' },
        languageName: { type: 'string' },
        defaultFont: { type: 'string' },
        defaultFontSize: { type: 'string' },
        rtl: { type: 'boolean' },
        spellCheck: { type: 'boolean' },
        allowClaim: { type: 'boolean' },
        isPublic: { type: 'boolean' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        dateExported: { type: 'date-time' },
        dateImported: { type: 'date-time' },
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        projecttype: {
          type: 'hasOne',
          model: 'projecttype',
          inverse: 'projects',
        },
        owner: { type: 'hasOne', model: 'user' },
        organization: { type: 'hasOne', model: 'organization' },
        group: { type: 'hasOne', model: 'group', inverse: 'projects' },
        projectIntegrations: {
          type: 'hasMany',
          model: 'projectintegration',
          inverse: 'project',
        },
        // sections: { type: 'hasMany', model: 'section', inverse: 'project' },
        plans: { type: 'hasMany', model: 'plan', inverse: 'project' },
        lastModifiedByUser: { type: 'hasOne', model: 'user' },
      },
    },
    projectintegration: {
      keys: { remoteId: {} },
      attributes: {
        settings: { type: 'string' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        integration: {
          type: 'hasOne',
          model: 'integration',
          inverse: 'projectIntegrations',
        },
        project: {
          type: 'hasOne',
          model: 'project',
          inverse: 'projectIntegrations',
        },
        lastModifiedByUser: { type: 'hasOne', model: 'user' },
      },
    },
    projecttype: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        description: { type: 'string' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        projects: { type: 'hasMany', model: 'project', inverse: 'projecttype' },
        lastModifiedByUser: { type: 'hasOne', model: 'user' },
      },
    },
    role: {
      keys: { remoteId: {} },
      attributes: {
        orgRole: { type: 'boolean' },
        groupRole: { type: 'boolean' },
        roleName: { type: 'string' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        userRoles: { type: 'hasMany', model: 'organizationalmembership' },
        lastModifiedByUser: { type: 'hasOne', model: 'user' },
      },
    },
    section: {
      keys: { remoteId: {} },
      attributes: {
        sequencenum: { type: 'number' },
        name: { type: 'string' },
        state: { type: 'string' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        // projects: { type: 'hasMany', model: 'project', inverse: 'sections' },
        plan: { type: 'hasOne', model: 'plan', inverse: 'sections' },
        passages: {
          type: 'hasMany',
          model: 'passage',
          inverse: 'section',
        },
        editor: { type: 'hasOne', model: 'user' },
        transcriber: { type: 'hasOne', model: 'user' },
        lastModifiedByUser: { type: 'hasOne', model: 'user' },
      },
    },
    passage: {
      keys: { remoteId: {} },
      attributes: {
        sequencenum: { type: 'number' },
        book: { type: 'string' },
        reference: { type: 'string' },
        state: { type: 'string' },
        hold: { type: 'boolean' },
        title: { type: 'string' },
        lastComment: { type: 'string' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        mediafiles: { type: 'hasMany', model: 'mediafile', inverse: 'passage' },
        section: {
          type: 'hasOne',
          model: 'section',
          inverse: 'passages',
        },
        orgWorkflowStep: { type: 'hasOne', model: 'orgworkflowstep' },
        lastModifiedByUser: { type: 'hasOne', model: 'user' },
      },
    },
    passagestatechange: {
      keys: { remoteId: {} },
      attributes: {
        state: { type: 'string' },
        comments: { type: 'string' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        passage: { type: 'hasOne', model: 'passage' },
        lastModifiedByUser: { type: 'hasOne', model: 'user' },
      },
    },
    mediafile: {
      keys: { remoteId: {} },
      attributes: {
        versionNumber: { type: 'number' },
        eafUrl: { type: 'string' },
        audioUrl: { type: 'string' },
        duration: { type: 'number' },
        contentType: { type: 'string' },
        audioQuality: { type: 'string' },
        textQuality: { type: 'string' },
        transcription: { type: 'string' },
        originalFile: { type: 'string' },
        filesize: { type: 'number' },
        position: { type: 'number' },
        segments: { type: 'string' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' }, //bkwd compat only
        languagebcp47: { type: 'string' },
        link: { type: 'bool' },
        readyToShare: { type: 'bool' },
        performedBy: { type: 'string' },
      },
      relationships: {
        artifactType: { type: 'hasOne', model: 'artifacttype' },
        artifactCategory: { type: 'hasOne', model: 'artifactcategory' },
        orgWorkflowStep: { type: 'hasOne', model: 'orgworkflowstep' },
        plan: { type: 'hasOne', model: 'plan', inverse: 'mediafiles' },
        passage: { type: 'hasOne', model: 'passage', inverse: 'mediafiles' },
        lastModifiedByUser: { type: 'hasOne', model: 'user' },
        recordedbyUser: { type: 'hasOne', model: 'user' },
        resourcePassage: { type: 'hasOne', model: 'passage' },
      },
    },
    user: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        givenName: { type: 'string' },
        familyName: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        timezone: { type: 'string' },
        locale: { type: 'string' },
        isLocked: { type: 'boolean' },
        auth0Id: { type: 'string' },
        silUserid: { type: 'number' },
        identityToken: { type: 'string' },
        uilanguagebcp47: { type: 'string' },
        timercountUp: { type: 'boolean' },
        playbackSpeed: { type: 'number' },
        progressbarTypeid: { type: 'number' },
        avatarUrl: { type: 'string' },
        hotKeys: { type: 'string' },
        digestPreference: { type: 'number' },
        newsPreference: { type: 'boolean' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        organizationMemberships: {
          type: 'hasMany',
          model: 'organizationmembership',
          inverse: 'user',
        },
        groupMemberships: {
          type: 'hasMany',
          model: 'groupmembership',
          inverse: 'user',
        },
        lastModifiedByUser: { type: 'hasOne', model: 'user' },
      },
    },
    currentuser: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        givenName: { type: 'string' },
        familyName: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        timezone: { type: 'string' },
        locale: { type: 'string' },
        isLocked: { type: 'boolean' },
        auth0Id: { type: 'string' },
        silUserid: { type: 'number' },
        identityToken: { type: 'string' },
        uilanguagebcp47: { type: 'string' },
        timercountUp: { type: 'boolean' },
        playbackSpeed: { type: 'number' },
        progressbarTypeid: { type: 'number' },
        avatarUrl: { type: 'string' },
        hotKeys: { type: 'string' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        organizationMemberships: {
          type: 'hasMany',
          model: 'organizationmembership',
        },
        groupMemberships: { type: 'hasMany', model: 'groupmembership' },
        lastModifiedByUser: { type: 'hasOne', model: 'user' },
      },
    },
    orgdata: {
      keys: { remoteId: {} },
      attributes: {
        json: { type: 'string' },
        startnext: { type: 'number' },
      },
      relationships: {},
    },
    projdata: {
      keys: { remoteId: {} },
      attributes: {
        json: { type: 'string' },
        startnext: { type: 'number' },
        projectid: { type: 'number' },
      },
      relationships: {},
    },

    sectionpassage: {
      keys: { remoteId: {} },
      attributes: {
        data: { type: 'string' },
        planId: { type: 'number' },
        uuid: { type: 'string' },
      },
      relationships: {},
    },
  },
  version: 1,
};
/* you can set your REACT_APP_SCHEMAVERSION to a version if you want to go back
   for testing purposes */
if (
  parseInt(process.env.REACT_APP_SCHEMAVERSION || '100') > 1 &&
  schemaDefinition.models
) {
  schemaDefinition.models.offlineproject = {
    keys: { remoteId: {} },
    attributes: {
      computerfp: { type: 'string' },
      snapshotDate: { type: 'date-time' },
      offlineAvailable: { type: 'boolean' },
      exportedDate: { type: 'date-time' },
      dateCreated: { type: 'date-time' },
      dateUpdated: { type: 'date-time' },
      lastModifiedBy: { type: 'number' }, //bkwd compat only
    },
    relationships: {
      project: {
        type: 'hasOne',
        model: 'project',
      },
      lastModifiedByUser: { type: 'hasOne', model: 'user' },
    },
  };
  delete schemaDefinition.models.project.attributes?.dateImported;
  delete schemaDefinition.models.project.attributes?.dateExported;
  schemaDefinition.version = 2;
}
if (
  parseInt(process.env.REACT_APP_SCHEMAVERSION || '100') > 2 &&
  schemaDefinition.models
) {
  schemaDefinition.models.audacityproject = {
    keys: { remoteId: {} },
    attributes: {
      audacityName: { type: 'string' },
      dateCreated: { type: 'date-time' },
      dateUpdated: { type: 'date-time' },
      lastModifiedBy: { type: 'number' }, //bkwd compat only
    },
    relationships: {
      passage: {
        type: 'hasOne',
        model: 'passage',
      },
      lastModifiedByUser: { type: 'hasOne', model: 'user' },
    },
  };
  schemaDefinition.version = 3;
}
if (
  parseInt(process.env.REACT_APP_SCHEMAVERSION || '100') > 3 &&
  schemaDefinition.models
) {
  schemaDefinition.models.artifactcategory = {
    keys: { remoteId: {} },
    attributes: {
      categoryname: { type: 'string' },
      dateCreated: { type: 'date-time' },
      dateUpdated: { type: 'date-time' },
      lastModifiedBy: { type: 'number' }, //bkwd compat only
    },
    relationships: {
      organization: { type: 'hasOne', model: 'organization' },
      lastModifiedByUser: { type: 'hasOne', model: 'user' },
    },
  };
  schemaDefinition.models.artifacttype = {
    keys: { remoteId: {} },
    attributes: {
      typename: { type: 'string' },
      dateCreated: { type: 'date-time' },
      dateUpdated: { type: 'date-time' },
      lastModifiedBy: { type: 'number' }, //bkwd compat only
    },
    relationships: {
      organization: { type: 'hasOne', model: 'organization' },
      lastModifiedByUser: { type: 'hasOne', model: 'user' },
    },
  };
  schemaDefinition.models.workflowstep = {
    keys: { remoteId: {} },
    attributes: {
      process: { type: 'string' },
      name: { type: 'string' },
      sequencenum: { type: 'number' },
      tool: { type: 'string' },
      permissions: { type: 'string' },
      dateCreated: { type: 'date-time' },
      dateUpdated: { type: 'date-time' },
      lastModifiedBy: { type: 'number' }, //bkwd compat only
    },
    relationships: {
      lastModifiedByUser: { type: 'hasOne', model: 'user' },
    },
  };
  schemaDefinition.models.orgworkflowstep = {
    keys: { remoteId: {} },
    attributes: {
      process: { type: 'string' },
      name: { type: 'string' },
      sequencenum: { type: 'number' },
      tool: { type: 'string' },
      permissions: { type: 'string' },
      dateCreated: { type: 'date-time' },
      dateUpdated: { type: 'date-time' },
      lastModifiedBy: { type: 'number' }, //bkwd compat only
    },
    relationships: {
      organization: { type: 'hasOne', model: 'organization' },
      lastModifiedByUser: { type: 'hasOne', model: 'user' },
    },
  };
  schemaDefinition.models.discussion = {
    keys: { remoteId: {} },
    attributes: {
      segments: { type: 'string' },
      subject: { type: 'string' },
      resolved: { type: 'bool' },
      tool: { type: 'string' },
      permissions: { type: 'string' },
      dateCreated: { type: 'date-time' },
      dateUpdated: { type: 'date-time' },
      lastModifiedBy: { type: 'number' }, //bkwd compat only
    },
    relationships: {
      mediafile: { type: 'hasOne', model: 'mediafile' },
      role: { type: 'hasOne', model: 'role' },
      user: { type: 'hasOne', model: 'user' },
      lastModifiedByUser: { type: 'hasOne', model: 'user' },
      artifactCategory: { type: 'hasOne', model: 'artifactcategory' },
      orgworkflowstep: {
        type: 'hasOne',
        model: 'orgworkflowstep',
      },
    },
  };
  schemaDefinition.models.comment = {
    keys: { remoteId: {} },
    attributes: {
      commenttext: { type: 'string' },
      dateCreated: { type: 'date-time' },
      dateUpdated: { type: 'date-time' },
      lastModifiedBy: { type: 'number' }, //bkwd compat only
    },
    relationships: {
      discussion: { type: 'hasOne', model: 'discussion' },
      mediafile: { type: 'hasOne', model: 'mediafile' },
      user: { type: 'hasOne', model: 'user' },
      lastModifiedByUser: { type: 'hasOne', model: 'user' },
    },
  };
  schemaDefinition.models.sectionresource = {
    keys: { remoteId: {} },
    attributes: {
      sequenceNum: { type: 'number' },
      dateCreated: { type: 'date-time' },
      dateUpdated: { type: 'date-time' },
      lastModifiedBy: { type: 'number' }, //bkwd compat only
    },
    relationships: {
      section: {
        type: 'hasOne',
        model: 'section',
      },
      mediafile: {
        type: 'hasOne',
        model: 'mediafile',
      },
      orgworkflowstep: {
        type: 'hasOne',
        model: 'orgworkflowstep',
      },
      lastModifiedByUser: { type: 'hasOne', model: 'user' },
    },
  };

  schemaDefinition.models.sectionresourceuser = {
    keys: { remoteId: {} },
    attributes: {
      dateCreated: { type: 'date-time' },
      dateUpdated: { type: 'date-time' },
      lastModifiedBy: { type: 'number' }, //bkwd compat only
    },
    relationships: {
      sectionresource: {
        type: 'hasOne',
        model: 'sectionresource',
      },
      user: {
        type: 'hasOne',
        model: 'user',
      },
      lastModifiedByUser: { type: 'hasOne', model: 'user' },
    },
  };

  schemaDefinition.version = 4;
}
export const schema = new Schema(schemaDefinition);

export const keyMap = new KeyMap();

export const memory = new Memory({ schema, keyMap });
const findMissingModels = (schema: Schema, db: IDBDatabase) => {
  return Object.keys(schema.models).filter(
    (model) => !db.objectStoreNames.contains(model)
  );
};
const SaveOfflineProjectInfo = async (
  backup: IndexedDBSource,
  memory: Memory
) => {
  if (isElectron) {
    var t = await backup.pull((q) => q.findRecords('project'));
    const ops: Operation[] = [];
    var fingerprint = t[0].operations.length > 0 ? await getFingerprint() : '';
    t[0].operations.forEach((r: any) => {
      offlineProjectCreate(
        r.record,
        ops,
        memory,
        fingerprint,
        r.record.attributes.dateImported,
        r.record.attributes.dateImported,
        true
      );
    });
    await backup.push(ops);
    await memory.update(ops);
    console.log('done with upgrade to v2');
  }
};
const UpdatePublicFlags = async (backup: IndexedDBSource, memory: Memory) => {
  var p = await backup.pull((q) => q.findRecords('project'));
  const ops: Operation[] = [];
  const tb = new TransformBuilder();
  p[0].operations.forEach((r: any) => {
    r.record.attributes = { ...r.record.attributes, isPublic: false };
    ops.push(tb.updateRecord(r.record));
  });
  var o = await backup.pull((q) => q.findRecords('organization'));
  o[0].operations.forEach((r: any) => {
    r.record.attributes = { ...r.record.attributes, publicByDefault: false };
    ops.push(tb.updateRecord(r.record));
  });
  await memory.sync(await backup.push(ops));
  console.log('done with upgrade to v4');
};
export const backup = window.indexedDB
  ? new IndexedDBSource({
      schema,
      keyMap,
      name: 'backup',
      namespace: 'transcriber',
    })
  : ({} as IndexedDBSource);

if (backup.cache)
  backup.cache.migrateDB = function (db, event) {
    console.log('migrateDb', event);
    // Ensure that all models are registered
    findMissingModels(this.schema, db).forEach((model) => {
      console.log(
        `Registering IndexedDB model at version ${event.newVersion}: ${model}`
      );
      this.registerModel(db, model);
    });
    if (isElectron && event.newVersion === 2) {
      SaveOfflineProjectInfo(backup, memory);
    }
    if (event.newVersion === 3) {
      //Summer 2021
      // Add missing `relatedIdentity` index. This is required.
      // https://github.com/orbitjs/orbit/pull/825
      const transaction = (event.target as any).transaction;
      if (transaction) {
        const objectStore = transaction.objectStore('__inverseRels__');
        if (!objectStore.indexNames.contains('relatedIdentity'))
          objectStore.createIndex('relatedIdentity', 'relatedIdentity', {
            unique: false,
          });
      }
    }
    if (event.newVersion === 4) {
      //Dec 2021
      // update public flags to false because we're going to start using them
      UpdatePublicFlags(backup, memory);
    }
  };

export const coordinator = new Coordinator();
coordinator.addSource(memory);
if (window.indexedDB) coordinator.addSource(backup);
