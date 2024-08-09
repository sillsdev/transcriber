import {
  RecordKeyMap,
  RecordTransformBuilder,
  RecordSchemaSettings,
  RecordSchema,
  RecordOperation,
} from '@orbit/records';
import { MemorySource } from '@orbit/memory';
import IndexedDBSource from '@orbit/indexeddb';
import Coordinator from '@orbit/coordinator';
import { isElectron } from './api-variable';
import { LocalKey } from './utils/localUserKey';
import { getFingerprint } from './utils/getFingerprint';
import { waitForIt } from './utils/waitForIt';
import { offlineProjectCreate } from './crud/offlineProjectCreate';
import { related } from './crud/related';
import { MediaFileD, OrganizationD, PassageD, ProjectD } from './model';

const schemaDefinition: RecordSchemaSettings = {
  models: {
    activitystate: {
      keys: { remoteId: {} },
      attributes: {
        state: { type: 'string' },
        sequencenum: { type: 'number' },
        dateCreated: { type: 'string' }, // datetime
        dateUpdated: { type: 'string' }, // datetime
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        lastModifiedByUser: { kind: 'hasOne', type: 'user' },
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
        dateCreated: { type: 'string' }, // datetime
        dateUpdated: { type: 'string' }, // datetime
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        owner: { kind: 'hasOne', type: 'organization', inverse: 'groups' },
        projects: { kind: 'hasMany', type: 'project', inverse: 'group' },
        groupMemberships: {
          kind: 'hasMany',
          type: 'groupmembership',
          inverse: 'group',
        },
        lastModifiedByUser: { kind: 'hasOne', type: 'user' },
      },
    },
    groupmembership: {
      keys: { remoteId: {} },
      attributes: {
        font: { type: 'string' },
        fontSize: { type: 'string' },
        dateCreated: { type: 'string' }, // datetime
        dateUpdated: { type: 'string' }, // datetime
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        user: { kind: 'hasOne', type: 'user', inverse: 'groupMemberships' },
        group: { kind: 'hasOne', type: 'group', inverse: 'groupMemberships' },
        role: { kind: 'hasOne', type: 'role' },
        lastModifiedByUser: { kind: 'hasOne', type: 'user' },
      },
    },
    integration: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        url: { type: 'string' },
        dateCreated: { type: 'string' }, // datetime
        dateUpdated: { type: 'string' }, // datetime
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        projectIntegrations: {
          kind: 'hasMany',
          type: 'projectintegration',
          inverse: 'integration',
        },
        lastModifiedByUser: { kind: 'hasOne', type: 'user' },
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
        dateCreated: { type: 'string' }, // datetime
        dateUpdated: { type: 'string' }, // datetime
        lastUpdatedBy: { type: 'number' },
      },
      relationships: {
        organization: {
          kind: 'hasOne',
          type: 'organization',
        },
        role: {
          kind: 'hasOne',
          type: 'role',
        },
        allUsersRole: {
          kind: 'hasOne',
          type: 'role',
        },
        lastModifiedByUser: { kind: 'hasOne', type: 'user' },
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
        clusterbase: { type: 'boolean' },
        dateCreated: { type: 'string' }, // datetime
        dateUpdated: { type: 'string' }, // datetime
        lastModifiedBy: { type: 'number' }, //bkwd compat only
        defaultParams: { type: 'string' },
      },
      relationships: {
        owner: { kind: 'hasOne', type: 'user' },
        users: { kind: 'hasMany', type: 'user' },
        groups: { kind: 'hasMany', type: 'group', inverse: 'owner' },
        cluster: { kind: 'hasOne', type: 'organization' },
        lastModifiedByUser: { kind: 'hasOne', type: 'user' },
      },
    },
    organizationmembership: {
      keys: { remoteId: {} },
      attributes: {
        dateCreated: { type: 'string' }, // datetime
        dateUpdated: { type: 'string' }, // datetime
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        user: {
          kind: 'hasOne',
          type: 'user',
          inverse: 'organizationMemberships',
        },
        organization: { kind: 'hasOne', type: 'organization' },
        role: { kind: 'hasOne', type: 'role' },
        lastModifiedByUser: { kind: 'hasOne', type: 'user' },
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
        dateCreated: { type: 'string' }, // datetime
        dateUpdated: { type: 'string' }, // datetime
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        owner: { kind: 'hasOne', type: 'user' },
        project: { kind: 'hasOne', type: 'project', inverse: 'plans' },
        plantype: { kind: 'hasOne', type: 'plantype', inverse: 'plans' },
        sections: { kind: 'hasMany', type: 'section', inverse: 'plan' },
        mediafiles: { kind: 'hasMany', type: 'mediafile', inverse: 'plan' },
        lastModifiedByUser: { kind: 'hasOne', type: 'user' },
      },
    },
    plantype: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        description: { type: 'string' },
        dateCreated: { type: 'string' }, // datetime
        dateUpdated: { type: 'string' }, // datetime
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        plans: { kind: 'hasMany', type: 'plan', inverse: 'plantype' },
        lastModifiedByUser: { kind: 'hasOne', type: 'user' },
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
        dateCreated: { type: 'string' }, // datetime
        dateUpdated: { type: 'string' }, // datetime
        dateExported: { type: 'string' }, // datetime
        dateImported: { type: 'string' }, // datetime
        lastModifiedBy: { type: 'number' }, //bkwd compat only
        defaultParams: { type: 'string' },
      },
      relationships: {
        projecttype: {
          kind: 'hasOne',
          type: 'projecttype',
          inverse: 'projects',
        },
        owner: { kind: 'hasOne', type: 'user' },
        organization: { kind: 'hasOne', type: 'organization' },
        group: { kind: 'hasOne', type: 'group', inverse: 'projects' },
        projectIntegrations: {
          kind: 'hasMany',
          type: 'projectintegration',
          inverse: 'project',
        },
        // sections: { kind: 'hasMany', type: 'section', inverse: 'project' },
        plans: { kind: 'hasMany', type: 'plan', inverse: 'project' },
        lastModifiedByUser: { kind: 'hasOne', type: 'user' },
      },
    },
    projectintegration: {
      keys: { remoteId: {} },
      attributes: {
        settings: { type: 'string' },
        dateCreated: { type: 'string' }, // datetime
        dateUpdated: { type: 'string' }, // datetime
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        integration: {
          kind: 'hasOne',
          type: 'integration',
          inverse: 'projectIntegrations',
        },
        project: {
          kind: 'hasOne',
          type: 'project',
          inverse: 'projectIntegrations',
        },
        lastModifiedByUser: { kind: 'hasOne', type: 'user' },
      },
    },
    projecttype: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        description: { type: 'string' },
        dateCreated: { type: 'string' }, // datetime
        dateUpdated: { type: 'string' }, // datetime
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        projects: { kind: 'hasMany', type: 'project', inverse: 'projecttype' },
        lastModifiedByUser: { kind: 'hasOne', type: 'user' },
      },
    },
    role: {
      keys: { remoteId: {} },
      attributes: {
        orgRole: { type: 'boolean' },
        groupRole: { type: 'boolean' }, //bkwd compat only
        roleName: { type: 'string' },
        dateCreated: { type: 'string' }, // datetime
        dateUpdated: { type: 'string' }, // datetime
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        userRoles: { kind: 'hasMany', type: 'organizationalmembership' },
        lastModifiedByUser: { kind: 'hasOne', type: 'user' },
      },
    },
    section: {
      keys: { remoteId: {} },
      attributes: {
        sequencenum: { type: 'number' },
        name: { type: 'string' },
        published: { type: 'boolean' },
        level: { type: 'number' },
        state: { type: 'string' }, //publishing info
        publishTo: { type: 'string' }, //publishing destinations
        dateCreated: { type: 'string' }, // datetime
        dateUpdated: { type: 'string' }, // datetime
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        // projects: { kind: 'hasMany', type: 'project', inverse: 'sections' },
        plan: { kind: 'hasOne', type: 'plan', inverse: 'sections' },
        passages: {
          kind: 'hasMany',
          type: 'passage',
          inverse: 'section',
        },
        titleMediafile: { kind: 'hasOne', type: 'mediafile' },
        editor: { kind: 'hasOne', type: 'user' },
        transcriber: { kind: 'hasOne', type: 'user' },
        group: { kind: 'hasOne', type: 'group' },
        lastModifiedByUser: { kind: 'hasOne', type: 'user' },
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
        dateCreated: { type: 'string' }, // datetime
        dateUpdated: { type: 'string' }, // datetime
        lastModifiedBy: { type: 'number' }, //bkwd compat only
        startChapter: { type: 'number' },
        startVerse: { type: 'number' },
        endChapter: { type: 'number' },
        endVerse: { type: 'number' },
      },
      relationships: {
        mediafiles: { kind: 'hasMany', type: 'mediafile', inverse: 'passage' },
        section: {
          kind: 'hasOne',
          type: 'section',
          inverse: 'passages',
        },
        passagetype: { kind: 'hasOne', type: 'passagetype' },
        sharedResource: { kind: 'hasOne', type: 'sharedresource' },
        lastModifiedByUser: { kind: 'hasOne', type: 'user' },
      },
    },
    passagestatechange: {
      keys: { remoteId: {} },
      attributes: {
        state: { type: 'string' },
        comments: { type: 'string' },
        dateCreated: { type: 'string' }, // datetime
        dateUpdated: { type: 'string' }, // datetime
        lastModifiedBy: { type: 'number' }, //bkwd compat only
        offlineId: { type: 'string' },
      },
      relationships: {
        passage: { kind: 'hasOne', type: 'passage' },
        lastModifiedByUser: { kind: 'hasOne', type: 'user' },
      },
    },
    passagetype: {
      keys: { remoteId: {} },
      attributes: {
        usfm: { type: 'string' },
        title: { type: 'string' },
        abbrev: { type: 'string' },
        defaultOrder: { type: 'number' },
        dateCreated: { type: 'string' }, // datetime
        dateUpdated: { type: 'string' }, // datetime
        lastModifiedBy: { type: 'number' }, //bkwd compat only
        offlineId: { type: 'string' },
      },
      relationships: {
        lastModifiedByUser: { kind: 'hasOne', type: 'user' },
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
        dateCreated: { type: 'string' }, // datetime
        dateUpdated: { type: 'string' }, // datetime
        lastModifiedBy: { type: 'number' }, //bkwd compat only
        languagebcp47: { type: 'string' },
        link: { type: 'boolean' },
        readyToShare: { type: 'boolean' },
        performedBy: { type: 'string' },
        resourcePassageId: { type: 'number' },
        offlineId: { type: 'string' },
        sourceSegments: { type: 'string' },
        sourceMediaOfflineId: { type: 'string' },
        transcriptionstate: { type: 'string' },
        topic: { type: 'string' },
        //backward compatability
        planId: { type: 'number' },
        artifactTypeId: { type: 'number' },
        passageId: { type: 'number' },
        userId: { type: 'number' },
        recordedbyUserId: { type: 'number' },
        recordedByUserId: { type: 'number' },
        sourceMediaId: { type: 'number' },
      },
      relationships: {
        artifactType: { kind: 'hasOne', type: 'artifacttype' },
        artifactCategory: { kind: 'hasOne', type: 'artifactcategory' },
        orgWorkflowStep: { kind: 'hasOne', type: 'orgworkflowstep' },
        plan: { kind: 'hasOne', type: 'plan', inverse: 'mediafiles' },
        passage: { kind: 'hasOne', type: 'passage', inverse: 'mediafiles' },
        resourcePassage: { kind: 'hasOne', type: 'passage' },
        lastModifiedByUser: { kind: 'hasOne', type: 'user' },
        recordedbyUser: { kind: 'hasOne', type: 'user' },
        sourceMedia: { kind: 'hasOne', type: 'mediafile' },
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
        sharedContentAdmin: { type: 'boolean' },
        sharedContentCreator: { type: 'boolean' },
        canPublish: { type: 'boolean' },
        dateCreated: { type: 'string' }, // datetime
        dateUpdated: { type: 'string' }, // datetime
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        organizationMemberships: {
          kind: 'hasMany',
          type: 'organizationmembership',
          inverse: 'user',
        },
        groupMemberships: {
          kind: 'hasMany',
          type: 'groupmembership',
          inverse: 'user',
        },
        lastModifiedByUser: { kind: 'hasOne', type: 'user' },
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
        dateCreated: { type: 'string' }, // datetime
        dateUpdated: { type: 'string' }, // datetime
        lastModifiedBy: { type: 'number' }, //bkwd compat only
      },
      relationships: {
        organizationMemberships: {
          kind: 'hasMany',
          type: 'organizationmembership',
        },
        groupMemberships: { kind: 'hasMany', type: 'groupmembership' },
        lastModifiedByUser: { kind: 'hasOne', type: 'user' },
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
export const requestedSchema = parseInt(
  process.env.REACT_APP_SCHEMAVERSION || '100'
);

/* you can set your REACT_APP_SCHEMAVERSION to a version if you want to go back
   for testing purposes */
if (requestedSchema > 1 && schemaDefinition.models) {
  schemaDefinition.models.offlineproject = {
    keys: { remoteId: {} },
    attributes: {
      computerfp: { type: 'string' },
      snapshotDate: { type: 'string' }, // datetime
      offlineAvailable: { type: 'boolean' },
      exportedDate: { type: 'string' }, // datetime
      fileDownloadDate: { type: 'string' }, // datetime
      dateCreated: { type: 'string' }, // datetime
      dateUpdated: { type: 'string' }, // datetime
      lastModifiedBy: { type: 'number' }, //bkwd compat only
      startNext: { type: 'number' },
    },
    relationships: {
      project: {
        kind: 'hasOne',
        type: 'project',
      },
      lastModifiedByUser: { kind: 'hasOne', type: 'user' },
    },
  };
  delete schemaDefinition.models.project.attributes?.dateImported;
  delete schemaDefinition.models.project.attributes?.dateExported;
  schemaDefinition.version = 2;
}
if (requestedSchema > 2 && schemaDefinition.models) {
  schemaDefinition.models.audacityproject = {
    keys: { remoteId: {} },
    attributes: {
      audacityName: { type: 'string' },
      dateCreated: { type: 'string' }, // datetime
      dateUpdated: { type: 'string' }, // datetime
      lastModifiedBy: { type: 'number' }, //bkwd compat only
    },
    relationships: {
      passage: {
        kind: 'hasOne',
        type: 'passage',
      },
      lastModifiedByUser: { kind: 'hasOne', type: 'user' },
    },
  };
  schemaDefinition.version = 3;
}
if (requestedSchema > 3 && schemaDefinition.models) {
  schemaDefinition.models.artifactcategory = {
    keys: { remoteId: {} },
    attributes: {
      categoryname: { type: 'string' },
      discussion: { type: 'boolean' },
      resource: { type: 'boolean' },
      note: { type: 'boolean' },
      color: { type: 'string' },
      specialuse: { type: 'string' },
      dateCreated: { type: 'string' }, // datetime
      dateUpdated: { type: 'string' }, // datetime
      lastModifiedBy: { type: 'number' }, //bkwd compat only
    },
    relationships: {
      organization: { kind: 'hasOne', type: 'organization' },
      titleMediafile: { kind: 'hasOne', type: 'mediafile' },
      lastModifiedByUser: { kind: 'hasOne', type: 'user' },
    },
  };
  schemaDefinition.models.artifacttype = {
    keys: { remoteId: {} },
    attributes: {
      typename: { type: 'string' },
      dateCreated: { type: 'string' }, // datetime
      dateUpdated: { type: 'string' }, // datetime
      lastModifiedBy: { type: 'number' }, //bkwd compat only
    },
    relationships: {
      organization: { kind: 'hasOne', type: 'organization' },
      lastModifiedByUser: { kind: 'hasOne', type: 'user' },
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
      dateCreated: { type: 'string' }, // datetime
      dateUpdated: { type: 'string' }, // datetime
      lastModifiedBy: { type: 'number' }, //bkwd compat only
    },
    relationships: {
      lastModifiedByUser: { kind: 'hasOne', type: 'user' },
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
      dateCreated: { type: 'string' }, // datetime
      dateUpdated: { type: 'string' }, // datetime
      lastModifiedBy: { type: 'number' }, //bkwd compat only
    },
    relationships: {
      organization: { kind: 'hasOne', type: 'organization' },
      lastModifiedByUser: { kind: 'hasOne', type: 'user' },
    },
  };
  schemaDefinition.models.discussion = {
    keys: { remoteId: {} },
    attributes: {
      segments: { type: 'string' },
      subject: { type: 'string' },
      resolved: { type: 'boolean' },
      tool: { type: 'string' },
      permissions: { type: 'string' },
      dateCreated: { type: 'string' }, // datetime
      dateUpdated: { type: 'string' }, // datetime
      lastModifiedBy: { type: 'number' }, //bkwd compat only
      offlineId: { type: 'string' },
      offlineMediafileId: { type: 'string' },
    },
    relationships: {
      mediafile: { kind: 'hasOne', type: 'mediafile' },
      group: { kind: 'hasOne', type: 'group' },
      user: { kind: 'hasOne', type: 'user' },
      lastModifiedByUser: { kind: 'hasOne', type: 'user' },
      artifactCategory: { kind: 'hasOne', type: 'artifactcategory' },
      orgWorkflowStep: {
        kind: 'hasOne',
        type: 'orgworkflowstep',
      },
    },
  };
  schemaDefinition.models.comment = {
    keys: { remoteId: {} },
    attributes: {
      commentText: { type: 'string' },
      dateCreated: { type: 'string' }, // datetime
      dateUpdated: { type: 'string' }, // datetime
      lastModifiedBy: { type: 'number' }, //bkwd compat only
      offlineId: { type: 'string' },
      offlineDiscussionId: { type: 'string' },
      offlineMediafileId: { type: 'string' },
      visible: { type: 'string' },
    },
    relationships: {
      discussion: { kind: 'hasOne', type: 'discussion' },
      mediafile: { kind: 'hasOne', type: 'mediafile' },
      user: { kind: 'hasOne', type: 'user' },
      lastModifiedByUser: { kind: 'hasOne', type: 'user' },
    },
  };
  schemaDefinition.models.sectionresource = {
    keys: { remoteId: {} },
    attributes: {
      sequenceNum: { type: 'number' },
      description: { type: 'string' },
      dateCreated: { type: 'string' }, // datetime
      dateUpdated: { type: 'string' }, // datetime
      lastModifiedBy: { type: 'number' }, //bkwd compat only
    },
    relationships: {
      section: {
        kind: 'hasOne',
        type: 'section',
      },
      passage: {
        kind: 'hasOne',
        type: 'passage',
      },
      project: {
        kind: 'hasOne',
        type: 'project',
      },
      mediafile: {
        kind: 'hasOne',
        type: 'mediafile',
      },
      orgWorkflowStep: {
        kind: 'hasOne',
        type: 'orgworkflowstep',
      },
      lastModifiedByUser: { kind: 'hasOne', type: 'user' },
    },
  };

  schemaDefinition.models.sectionresourceuser = {
    keys: { remoteId: {} },
    attributes: {
      dateCreated: { type: 'string' }, // datetime
      dateUpdated: { type: 'string' }, // datetime
      lastModifiedBy: { type: 'number' }, //bkwd compat only
    },
    relationships: {
      sectionresource: {
        kind: 'hasOne',
        type: 'sectionresource',
      },
      user: {
        kind: 'hasOne',
        type: 'user',
      },
      lastModifiedByUser: { kind: 'hasOne', type: 'user' },
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
      mediafileId: { type: 'number' },
      passageId: { type: 'number' },
      passageSequencenum: { type: 'number' },
      passageDesc: { type: 'string' },
      book: { type: 'string' },
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
      title: { type: 'string' },
      description: { type: 'string' },
      termsOfUse: { type: 'string' },
      keywords: { type: 'string' },
      resourceId: { type: 'number' },
      idList: { type: 'number' },
      s3file: { type: 'string' },
      dateCreated: { type: 'string' },
      dateUpdated: { type: 'string' }, // datetime
      lastModifiedBy: { type: 'number' },
    },
    relationships: {
      passage: { kind: 'hasOne', type: 'passage' },
      lastModifiedByUser: { kind: 'hasOne', type: 'user' },
    },
  };
}
if (requestedSchema > 4 && schemaDefinition.models) {
  schemaDefinition.models.intellectualproperty = {
    keys: { remoteId: {} },
    attributes: {
      rightsHolder: { type: 'string' },
      notes: { type: 'string' },
      dateCreated: { type: 'string' }, // datetime
      dateUpdated: { type: 'string' }, // datetime
      lastModifiedBy: { type: 'number' },
      offlineId: { type: 'string' },
      offlineMediafileId: { type: 'string' },
    },
    relationships: {
      organization: {
        kind: 'hasOne',
        type: 'organization',
      },
      releaseMediafile: {
        kind: 'hasOne',
        type: 'mediafile',
      },
      lastModifiedByUser: { kind: 'hasOne', type: 'user' },
    },
  };

  schemaDefinition.version = 5;
}
if (requestedSchema > 5 && schemaDefinition.models) {
  schemaDefinition.models.orgkeyterm = {
    keys: { remoteId: {} },
    attributes: {
      term: { type: 'string' },
      domain: { type: 'string' },
      definition: { type: 'string' },
      category: { type: 'string' },
      offlineId: { type: 'string' },
      dateCreated: { type: 'string' }, // datetime
      dateUpdated: { type: 'string' }, // datetime
    },
    relationships: {
      organization: { kind: 'hasOne', type: 'organization' },
      lastModifiedByUser: { kind: 'hasOne', type: 'user' },
    },
  };
  schemaDefinition.models.orgkeytermtarget = {
    keys: { remoteId: {} },
    attributes: {
      term: { type: 'string' },
      termIndex: { type: 'number' },
      target: { type: 'string' },
      offlineId: { type: 'string' },
      offlineMediafileId: { type: 'string' },
      dateCreated: { type: 'string' }, // datetime
      dateUpdated: { type: 'string' }, // datetime
    },
    relationships: {
      organization: { kind: 'hasOne', type: 'organization' },
      mediafile: { kind: 'hasOne', type: 'mediafile' },
      lastModifiedByUser: { kind: 'hasOne', type: 'user' },
    },
  };
  schemaDefinition.models.orgkeytermreference = {
    keys: { remoteId: {} },
    attributes: {
      term: { type: 'string' },
      termIndex: { type: 'number' },
      target: { type: 'string' },
      offlineId: { type: 'string' },
      offlineMediafileId: { type: 'string' },
      dateCreated: { type: 'string' }, // datetime
      dateUpdated: { type: 'string' }, // datetime
    },
    relationships: {
      orgkeyterm: { kind: 'hasOne', type: 'orgkeyterm' },
      project: { kind: 'hasOne', type: 'project' },
      section: { kind: 'hasOne', type: 'section' },
      lastModifiedByUser: { kind: 'hasOne', type: 'user' },
    },
  };
  schemaDefinition.models.sharedresource = {
    keys: { remoteId: {} },
    attributes: {
      title: { type: 'string' },
      description: { type: 'string' },
      languagebcp47: { type: 'string' },
      termsOfUse: { type: 'string' },
      keywords: { type: 'string' },
      linkurl: { type: 'string' },
      note: { type: 'boolean' },
      dateCreated: { type: 'string' }, // datetime
      dateUpdated: { type: 'string' }, // datetime
    },
    relationships: {
      passage: { kind: 'hasOne', type: 'passage' },
      cluster: { kind: 'hasOne', type: 'organization' },
      artifactCategory: { kind: 'hasOne', type: 'artifactcategory' },
      titleMediafile: { kind: 'hasOne', type: 'mediafile' },
      lastModifiedByUser: { kind: 'hasOne', type: 'user' },
    },
  };
  schemaDefinition.models.sharedresourcereference = {
    keys: { remoteId: {} },
    attributes: {
      book: { type: 'string' },
      chapter: { type: 'number' },
      verses: { type: 'string' },
      dateCreated: { type: 'string' }, // datetime
      dateUpdated: { type: 'string' }, // datetime
    },
    relationships: {
      sharedResource: { kind: 'hasOne', type: 'sharedresource' },
      lastModifiedByUser: { kind: 'hasOne', type: 'user' },
    },
  };
  schemaDefinition.version = 6;
}
if (requestedSchema > 6 && schemaDefinition.models) {
  schemaDefinition.models.vwchecksum = {
    keys: { remoteId: {} },
    attributes: {
      name: { type: 'string' },
      projectId: { type: 'number' },
      checksum: { type: 'number' },
    },
  };
  schemaDefinition.version = 7;
}
if (requestedSchema > 7 && schemaDefinition.models) {
  schemaDefinition.models.bible = {
    keys: { remoteId: {} },
    attributes: {
      bibleId: { type: 'string' },
      bibleName: { type: 'string' },
      iso: { type: 'string' },
      description: { type: 'string' },
      publishingData: { type: 'string' },
      anyPublished: { type: 'boolean' },
      dateCreated: { type: 'string' }, // datetime
      dateUpdated: { type: 'string' }, // datetime
    },
    relationships: {
      isoMediafile: { kind: 'hasOne', type: 'mediafile' },
      bibleMediafile: { kind: 'hasOne', type: 'mediafile' },
      lastModifiedByUser: { kind: 'hasOne', type: 'user' },
    },
  };
  schemaDefinition.models.organizationbible = {
    keys: { remoteId: {} },
    attributes: {
      ownerorg: { type: 'boolean' },
      dateCreated: { type: 'string' }, // datetime
      dateUpdated: { type: 'string' }, // datetime
      lastModifiedBy: { type: 'number' }, //bkwd compat only
    },
    relationships: {
      bible: { kind: 'hasOne', type: 'bible' },
      organization: { kind: 'hasOne', type: 'organization' },
      lastModifiedByUser: { kind: 'hasOne', type: 'user' },
    },
  };
  schemaDefinition.models.graphic = {
    keys: { remoteId: {} },
    attributes: {
      resourceType: { type: 'string' },
      resourceId: { type: 'number' },
      info: { type: 'string' },
      dateCreated: { type: 'string' }, // datetime
      dateUpdated: { type: 'string' }, // datetime
    },
    relationships: {
      organization: { kind: 'hasOne', type: 'organization' },
      mediafile: { kind: 'hasOne', type: 'mediafile' },
      lastModifiedByUser: { kind: 'hasOne', type: 'user' },
    },
  };

  schemaDefinition.version = 8;
}

export const schema = new RecordSchema(schemaDefinition);

export const keyMap = new RecordKeyMap();

export const memory = new MemorySource({
  schema,
  keyMap,
});
const findMissingModels = (schema: RecordSchema, db: IDBDatabase) => {
  return Object.keys(schema.models).filter(
    (model) => !db.objectStoreNames.contains(model)
  );
};
const SaveOfflineProjectInfo = async (
  backup: IndexedDBSource,
  memory: MemorySource
) => {
  if (isElectron) {
    let recs = (await backup.query((q) =>
      q.findRecords('project')
    )) as ProjectD[];
    if (!Array.isArray(recs)) recs = [recs];
    const ops: RecordOperation[] = [];
    var fingerprint = recs.length > 0 ? await getFingerprint() : '';
    recs.forEach((r: ProjectD) => {
      offlineProjectCreate(
        r,
        ops,
        memory,
        fingerprint,
        r.attributes.dateImported as string,
        r.attributes.dateImported as string,
        true
      );
    });
    await backup.sync((t) => ops);
    await memory.update(ops);
    console.log('done with upgrade to v2');
  }
};
const UpdatePublicFlags = async (
  backup: IndexedDBSource,
  memory: MemorySource
) => {
  let pRecs = (await backup.query((q) =>
    q.findRecords('project')
  )) as ProjectD[];
  if (!Array.isArray(pRecs)) pRecs = [pRecs];
  const ops: RecordOperation[] = [];
  const tb = new RecordTransformBuilder();
  pRecs
    .filter((r: ProjectD) => r?.attributes?.isPublic)
    .forEach((r: ProjectD) => {
      r.attributes = { ...r.attributes, isPublic: false };
      ops.push(tb.updateRecord(r).toOperation());
    });
  let oRecs = (await backup.query((q) =>
    q.findRecords('organization')
  )) as OrganizationD[];
  if (!Array.isArray(oRecs)) oRecs = [oRecs];
  oRecs
    .filter((r: OrganizationD) => r?.attributes?.publicByDefault)
    .forEach((r: OrganizationD) => {
      r.attributes = { ...r.attributes, publicByDefault: false };
      ops.push(tb.updateRecord(r).toOperation());
    });
  if (ops.length > 0) {
    await backup.sync((t) => ops);
    await memory.sync((t) => ops);
  }
};
const MoveTranscriptionState = async (
  backup: IndexedDBSource,
  memory: MemorySource
) => {
  var pRecs = (await backup.query((q) =>
    q.findRecords('passage')
  )) as PassageD[];
  if (!Array.isArray(pRecs)) pRecs = [pRecs];
  var mediafiles = (await backup.query((q) =>
    q.findRecords('mediafile')
  )) as MediaFileD[];
  if (!Array.isArray(mediafiles)) mediafiles = [mediafiles];

  const ops: RecordOperation[] = [];
  const tb = new RecordTransformBuilder();
  pRecs.forEach((r: PassageD) => {
    //find the latest mediafile
    const meds = mediafiles
      .filter((m) => related(m, 'passage') === r.id)
      .sort(
        (a, b) => b.attributes?.versionNumber - a.attributes?.versionNumber
      );
    if (meds.length > 0) {
      const mediafile = meds[0];
      if (
        Boolean(r?.attributes?.state) &&
        mediafile?.attributes?.transcriptionstate !== r.attributes.state
      ) {
        mediafile.attributes = {
          ...mediafile.attributes,
          transcriptionstate: r.attributes.state,
        };
        ops.push(tb.updateRecord(mediafile).toOperation());
      }
    }
  });
  if (ops.length > 0) {
    await backup.sync((tb) => ops);
    await memory.sync((tb) => ops);
  }
  console.log('done with upgrade to v4');
};
const FixVersion8 = async (backup: IndexedDBSource, memory: MemorySource) => {
  const ops: RecordOperation[] = [];
  const tb = new RecordTransformBuilder();
  let pRecs = (await backup.query((q) => q.findRecords('mediafile'))) as any[];
  if (!Array.isArray(pRecs)) pRecs = [pRecs];

  pRecs.forEach((r) => {
    if (
      r.attributes.planId ||
      r.attributes.artifactTypeId ||
      r.attributes.passageId ||
      r.attributes.userId ||
      r.attributes.recordedByUserId ||
      r.attributes.recordedbyUserId ||
      r.attributes.sourceMediaId
    ) {
      r.attributes = {
        ...r.attributes,
        planId: undefined,
        artifactTypeId: undefined,
        passageId: undefined,
        userId: undefined,
        recordedByUserId: undefined,
        recordedbyUserId: undefined,
        sourceMediaId: undefined,
      };
      ops.push(tb.updateRecord(r).toOperation());
    }
  });

  let oRecs = (await backup.query((q) => q.findRecords('user'))) as any[];
  if (!Array.isArray(oRecs)) oRecs = [oRecs];
  oRecs.forEach((r: any) => {
    if (
      r.attributes?.digestPreference === false ||
      r.attributes?.digestPreference === true
    ) {
      r.attributes = {
        ...r.attributes,
        digestPreference: r.attributes?.digestPreference ? 1 : 0,
      };
      ops.push(tb.updateRecord(r).toOperation());
    }
  });
  if (ops.length > 0) {
    await backup.sync((t) => ops);
  }
  console.log('done with upgrade to v8');
};
export const backup = window.indexedDB
  ? new IndexedDBSource({
      schema,
      keyMap,
      name: 'backup',
      namespace: 'transcriber',
      defaultTransformOptions: {
        useBuffer: true,
      },
      autoUpgrade: false,
    })
  : ({} as IndexedDBSource);
//LocalKey.migration throws an error here?!
localStorage.setItem('migration', 'WAIT');
var migrating = 0;

if (backup.cache) {
  backup.cache.migrateDB = function (db, event) {
    migrating++; //add one right away so everyone waits
    console.log('migrateDb', event);
    // Ensure that all models are registered
    findMissingModels(this.schema, db).forEach((model) => {
      console.log(
        `Registering IndexedDB model at version ${event.newVersion}: ${model}`
      );
      this.registerModel(db, model);
    });
    if (isElectron && event.newVersion === 2) {
      migrating++;
      SaveOfflineProjectInfo(backup, memory).then(() => migrating--);
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
      migrating++;
      UpdatePublicFlags(backup, memory).then(() => {
        MoveTranscriptionState(backup, memory).then(() => migrating--);
      });
    }
    if (event.newVersion === 8) {
      //Feb 2024
      migrating++;
      FixVersion8(backup, memory).then(() => {
        migrating--;
      });
    }
    migrating--;
  };
}
if (process.env.NODE_ENV === 'test') {
  console.log('upgrade skipped for test');
  localStorage.setItem(LocalKey.migration, schema.version.toString());
} else {
  waitForIt(
    'backup open',
    () => backup.cache.isDBOpen,
    () => false,
    1000
  ).then(() => {
    backup
      ?.upgrade()
      .catch((e) => {
        console.log('upgrade error', e);
      })
      .finally(() =>
        waitForIt(
          'migration',
          () => !migrating,
          () => false,
          1000
        ).then(() => {
          console.log('upgrade complete');
          localStorage.setItem(LocalKey.migration, schema.version.toString());
        })
      );
  });
}

export const coordinator = new Coordinator();
coordinator.addSource(memory);
if (window.indexedDB) coordinator.addSource(backup);
