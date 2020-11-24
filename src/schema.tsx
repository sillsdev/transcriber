import { KeyMap, Operation, Schema, SchemaSettings } from '@orbit/data';
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
        lastModifiedBy: { type: 'number' },
      },
      relationships: {},
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
        lastModifiedBy: { type: 'number' },
      },
      relationships: {
        owner: { type: 'hasOne', model: 'organization', inverse: 'groups' },
        projects: { type: 'hasMany', model: 'project', inverse: 'group' },
        groupMemberships: {
          type: 'hasMany',
          model: 'groupmembership',
          inverse: 'group',
        },
      },
    },
    groupmembership: {
      keys: { remoteId: {} },
      attributes: {
        font: { type: 'string' },
        fontSize: { type: 'string' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' },
      },
      relationships: {
        user: { type: 'hasOne', model: 'user', inverse: 'groupMemberships' },
        group: { type: 'hasOne', model: 'group', inverse: 'groupMemberships' },
        role: { type: 'hasOne', model: 'role' },
      },
    },
    integration: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        url: { type: 'string' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' },
      },
      relationships: {
        projectIntegrations: {
          type: 'hasMany',
          model: 'projectintegration',
          inverse: 'integration',
        },
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
        lastModifiedBy: { type: 'number' },
      },
      relationships: {
        owner: { type: 'hasOne', model: 'user' },
        users: { type: 'hasMany', model: 'user' },
        groups: { type: 'hasMany', model: 'group', inverse: 'owner' },
      },
    },
    organizationmembership: {
      keys: { remoteId: {} },
      attributes: {
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' },
      },
      relationships: {
        user: {
          type: 'hasOne',
          model: 'user',
          inverse: 'organizationMemberships',
        },
        organization: { type: 'hasOne', model: 'organization' },
        role: { type: 'hasOne', model: 'role' },
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
        lastModifiedBy: { type: 'number' },
      },
      relationships: {
        owner: { type: 'hasOne', model: 'user' },
        project: { type: 'hasOne', model: 'project', inverse: 'plans' },
        plantype: { type: 'hasOne', model: 'plantype', inverse: 'plans' },
        sections: { type: 'hasMany', model: 'section', inverse: 'plan' },
        mediafiles: { type: 'hasMany', model: 'mediafile', inverse: 'plan' },
      },
    },
    plantype: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        description: { type: 'string' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' },
      },
      relationships: {
        plans: { type: 'hasMany', model: 'plan', inverse: 'plantype' },
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
        allowClaim: { type: 'boolean' },
        isPublic: { type: 'boolean' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' },
        dateExported: { type: 'date-time' },
        dateImported: { type: 'date-time' },
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
      },
    },
    projectintegration: {
      keys: { remoteId: {} },
      attributes: {
        settings: { type: 'string' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' },
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
      },
    },
    projecttype: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        description: { type: 'string' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' },
      },
      relationships: {
        projects: { type: 'hasMany', model: 'project', inverse: 'projecttype' },
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
        lastModifiedBy: { type: 'number' },
      },
      relationships: {
        userRoles: { type: 'hasMany', model: 'organizationalmembership' },
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
        lastModifiedBy: { type: 'number' },
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
        lastModifiedBy: { type: 'number' },
      },
      relationships: {
        mediafiles: { type: 'hasMany', model: 'mediafile', inverse: 'passage' },
        section: {
          type: 'hasOne',
          model: 'section',
          inverse: 'passages',
        },
      },
    },
    passagestatechange: {
      keys: { remoteId: {} },
      attributes: {
        state: { type: 'string' },
        comments: { type: 'string' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' },
      },
      relationships: {
        passage: { type: 'hasOne', model: 'passage' },
      },
    },
    mediafile: {
      keys: { remoteId: {} },
      attributes: {
        versionNumber: { type: 'number' },
        artifactType: { type: 'string' },
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
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' },
      },
      relationships: {
        plan: { type: 'hasOne', model: 'plan', inverse: 'mediafiles' },
        passage: { type: 'hasOne', model: 'passage', inverse: 'mediafiles' },
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
        lastModifiedBy: { type: 'number' },
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
        lastModifiedBy: { type: 'number' },
      },
      relationships: {
        organizationMemberships: {
          type: 'hasMany',
          model: 'organizationmembership',
        },
        groupMemberships: { type: 'hasMany', model: 'groupmembership' },
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
if (process.env.REACT_APP_SCHEMAVERSION !== '1' && schemaDefinition.models) {
  schemaDefinition.models.offlineproject = {
    keys: { remoteId: {} },
    attributes: {
      computerfp: { type: 'string' },
      snapshotDate: { type: 'date-time' },
      offlineAvailable: { type: 'boolean' },
      exportedDate: { type: 'date-time' },
      dateCreated: { type: 'date-time' },
      dateUpdated: { type: 'date-time' },
      lastModifiedBy: { type: 'number' },
    },
    relationships: {
      project: {
        type: 'hasOne',
        model: 'project',
      },
    },
  };
  schemaDefinition.version = 2;
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
      offlineProjectCreate(r.record, ops, memory, fingerprint, true);
    });
    await backup.push(ops);
    await memory.update(ops);
    console.log('done with upgrade to v2');
  }
};

export const backup = window.indexedDB
  ? new IndexedDBSource({
      schema,
      keyMap,
      name: 'backup',
      namespace: 'transcriber',
    })
  : ({} as IndexedDBSource);

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
};

export const onlineCoordinator = new Coordinator();
onlineCoordinator.addSource(memory);
if (window.indexedDB) onlineCoordinator.addSource(backup);

export const offlineCoordinator = new Coordinator();
offlineCoordinator.addSource(memory);
if (window.indexedDB) offlineCoordinator.addSource(backup);
