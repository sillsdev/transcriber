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
import { offlineProjectCreate, related } from './crud';
import { MediaFile } from './model';

const schemaDefinition: SchemaSettings = {
  pluralize: (word: string) => {
    if (!word) return word;
    if (word.endsWith('y')) return word.substring(0, word.length - 1) + 'ies';
    return word + 's';
  },
  singularize: (word: string) => {
    if (!word) return word;
    if (word.endsWith('ies')) return word.substring(0, word.length - 3) + 'y';
    return word.substring(0, word.length - 1);
  },
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
        permissions: { type: 'string' },
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
        description: { type: 'string' },
        websiteUrl: { type: 'string' },
        logoUrl: { type: 'string' },
        publicByDefault: { type: 'boolean' },
        dateCreated: { type: 'date-time' },
        dateUpdated: { type: 'date-time' },
        lastModifiedBy: { type: 'number' }, //bkwd compat only
        defaultParams: { type: 'string' },
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
        defaultParams: { type: 'string' },
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
        state: { type: 'string' }, //not used anymore bkwd compat only
        hold: { type: 'boolean' },
        title: { type: 'string' },
        lastComment: { type: 'string' },
        stepComplete: { type: 'string' }, //json
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
        offlineId: { type: 'string' },
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
        s3file: { type: 'string' },
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
        resourcePassageId: { type: 'number' },
        offlineId: { type: 'string' },
        sourceSegments: { type: 'string' },
        sourceMediaOfflineId: { type: 'string' },
        transcriptionstate: { type: 'string' },
        topic: { type: 'string' },
      },
      relationships: {
        artifactType: { type: 'hasOne', model: 'artifacttype' },
        artifactCategory: { type: 'hasOne', model: 'artifactcategory' },
        orgWorkflowStep: { type: 'hasOne', model: 'orgworkflowstep' },
        plan: { type: 'hasOne', model: 'plan', inverse: 'mediafiles' },
        passage: { type: 'hasOne', model: 'passage', inverse: 'mediafiles' },
        resourcePassage: { type: 'hasOne', model: 'passage' },
        lastModifiedByUser: { type: 'hasOne', model: 'user' },
        recordedbyUser: { type: 'hasOne', model: 'user' },
        sourceMedia: { type: 'hasOne', model: 'mediafile' },
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
      startNext: { type: 'number' },
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
      discussion: { type: 'bool' },
      resource: { type: 'bool' },
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
      offlineId: { type: 'string' },
      offlineMediafileId: { type: 'string' },
    },
    relationships: {
      mediafile: { type: 'hasOne', model: 'mediafile' },
      group: { type: 'hasOne', model: 'group' },
      user: { type: 'hasOne', model: 'user' },
      lastModifiedByUser: { type: 'hasOne', model: 'user' },
      artifactCategory: { type: 'hasOne', model: 'artifactcategory' },
      orgWorkflowStep: {
        type: 'hasOne',
        model: 'orgworkflowstep',
      },
    },
  };
  schemaDefinition.models.comment = {
    keys: { remoteId: {} },
    attributes: {
      commentText: { type: 'string' },
      dateCreated: { type: 'date-time' },
      dateUpdated: { type: 'date-time' },
      lastModifiedBy: { type: 'number' }, //bkwd compat only
      offlineId: { type: 'string' },
      offlineDiscussionId: { type: 'string' },
      offlineMediafileId: { type: 'string' },
      visible: { type: 'string' },
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
      description: { type: 'string' },
      dateCreated: { type: 'date-time' },
      dateUpdated: { type: 'date-time' },
      lastModifiedBy: { type: 'number' }, //bkwd compat only
    },
    relationships: {
      section: {
        type: 'hasOne',
        model: 'section',
      },
      passage: {
        type: 'hasOne',
        model: 'passage',
      },
      project: {
        type: 'hasOne',
        model: 'project',
      },
      mediafile: {
        type: 'hasOne',
        model: 'mediafile',
      },
      orgWorkflowStep: {
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
  schemaDefinition.models.resource = {
    keys: { remoteId: {} },
    attributes: {
      projectName: { type: 'string' },
      organization: { type: 'string' },
      language: { type: 'string' },
      plan: { type: 'string' },
      plantype: { type: 'string' },
      section: { type: 'string' },
      sectionSequencenum: { type: 'number' },
      passageDesc: { type: 'string' },
      passageSequencenum: { type: 'number' },
      book: { type: 'string' },
      passageId: { type: 'string' },
      reference: { type: 'string' },
      versionNumber: { type: 'number' },
      audioUrl: { type: 'string' },
      duration: { type: 'number' },
      contentType: { type: 'string' },
      transcription: { type: 'string' },
      originalFile: { type: 'string' },
      filesize: { type: 'number' },
      languagebcp47: { type: 'string' },
      categoryName: { type: 'string' },
      typeName: { type: 'string' },
      latest: { type: 'boolean' },
      s3file: { type: 'string' },
      dateCreated: { type: 'string' },
      dateUpdated: { type: 'string' },
      lastModifiedBy: { type: 'number' },
    },
    relationships: {
      passage: { type: 'hasOne', model: 'passage' },
      lastModifiedByUser: { type: 'hasOne', model: 'user' },
    },
  };
}
if (
  parseInt(process.env.REACT_APP_SCHEMAVERSION || '100') > 4 &&
  schemaDefinition.models
) {
  schemaDefinition.models.intellectualproperty = {
    keys: { remoteId: {} },
    attributes: {
      rightsHolder: { type: 'string' },
      notes: { type: 'string' },
      dateCreated: { type: 'date-time' },
      dateUpdated: { type: 'date-time' },
      lastModifiedBy: { type: 'number' },
      offlineId: { type: 'string' },
      offlineMediafileId: { type: 'string' },
    },
    relationships: {
      organization: {
        type: 'hasOne',
        model: 'organization',
      },
      releaseMediafile: {
        type: 'hasOne',
        model: 'mediafile',
      },
      lastModifiedByUser: { type: 'hasOne', model: 'user' },
    },
  };

  schemaDefinition.version = 5;
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
};
const MoveTranscriptionState = async (
  backup: IndexedDBSource,
  memory: Memory
) => {
  var p = await backup.pull((q) => q.findRecords('passage'));
  var m = await backup.pull((q) => q.findRecords('mediafile'));
  var mediafiles = m[0].operations.map((o: any) => o.record as MediaFile);

  const ops: Operation[] = [];
  const tb = new TransformBuilder();
  p[0].operations.forEach((r: any) => {
    //find the latest mediafile
    var meds = mediafiles
      .filter((m) => related(m, 'passage') === r.record.id)
      .sort(
        (a, b) => b.attributes?.versionNumber - a.attributes?.versionNumber
      );
    if (meds.length > 0) {
      var mediafile = meds[0];
      mediafile.attributes = {
        ...mediafile.attributes,
        transcriptionstate: r.record.attributes.state,
      };
      ops.push(tb.updateRecord(mediafile));
    }
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
      //Mar 2022
      // update public flags to false because we're going to start using them
      UpdatePublicFlags(backup, memory).then(() => {
        MoveTranscriptionState(backup, memory);
      });
    }
  };

export const coordinator = new Coordinator();
coordinator.addSource(memory);
if (window.indexedDB) coordinator.addSource(backup);
