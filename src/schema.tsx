import { KeyMap, Schema, SchemaSettings } from '@orbit/data';

export const keyMap = new KeyMap();

const schemaDefinition: SchemaSettings = {
  models: {
    activitystate: {
      keys: { remoteId: {} },
      attributes: {
        state: { type: 'string' },
        sequencenum: { type: 'number' },
      },
      relationships: {},
    },
    group: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        abbreviation: { type: 'string' },
        ownerId: { type: 'number' },
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
        silId: { type: 'numer' },
        accepted: { type: 'boolean' },
        dateCreated: { type: 'date' },
        dateUpdated: { type: 'date' },
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
      },
    },
    organization: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        slug: { type: 'string' },
        SilId: { type: 'number' },
        websiteUrl: { type: 'string' },
        logoUrl: { type: 'string' },
        publicByDefault: { type: 'boolean' },
        dateCreated: { type: 'date' },
        dateUpdated: { type: 'date' },
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
      attributes: {},
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
        slug: { type: 'string' },
      },
      relationships: {
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
        dateCreated: { type: 'date' },
        dateUpdated: { type: 'date' },
      },
      relationships: {
        projecttype: {
          type: 'hasOne',
          model: 'projecttype',
          inverse: 'projects',
        },
        owner: { type: 'hasOne', model: 'user', inverse: 'projects' },
        organization: { type: 'hasOne', model: 'organization' },
        group: { type: 'hasOne', model: 'group', inverse: 'projects' },
        projectIntegrations: {
          type: 'hasMany',
          model: 'projectintegration',
          inverse: 'project',
        },
        users: { type: 'hasMany', model: 'userpassage', inverse: 'project' },
        // sections: { type: 'hasMany', model: 'section', inverse: 'project' },
        plans: { type: 'hasMany', model: 'plan', inverse: 'project' },
      },
    },
    projectintegration: {
      keys: { remoteId: {} },
      attributes: {
        settings: { type: 'string' },
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
      },
      relationships: {
        // projects: { type: 'hasMany', model: 'project', inverse: 'sections' },
        plan: { type: 'hasOne', model: 'plan', inverse: 'sections' },
        passages: {
          type: 'hasMany',
          model: 'passagesection',
          inverse: 'section',
        },
        reviewer: { type: 'hasOne', model: 'user' },
        transcriber: { type: 'hasOne', model: 'user' },
      },
    },
    passage: {
      keys: { remoteId: {} },
      attributes: {
        sequencenum: { type: 'number' },
        book: { type: 'string' },
        reference: { type: 'string' },
        position: { type: 'number' },
        state: { type: 'string' },
        hold: { type: 'boolean' },
        title: { type: 'string' },
        dateCreated: { type: 'date' },
        dateUpdated: { type: 'date' },
      },
      relationships: {
        mediafiles: { type: 'hasMany', model: 'mediafile', inverse: 'passage' },
        sections: {
          type: 'hasMany',
          model: 'passagesection',
          inverse: 'passage',
        },
        users: {
          type: 'hasMany',
          model: 'userpassage',
          inverse: 'passage',
        },
      },
    },
    passagesection: {
      keys: { remoteId: {} },
      attributes: {},
      relationships: {
        passage: { type: 'hasOne', model: 'passage', inverse: 'sections' },
        section: { type: 'hasOne', model: 'section', inverse: 'passages' },
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
        dateCreated: { type: 'date' },
        dateUpdated: { type: 'date' },
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
        avatarUrl: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        timezone: { type: 'string' },
        locale: { type: 'string' },
        isLocked: { type: 'boolean' },
        externalId: { type: 'string' },
        identityToken: { type: 'string' },
        uiLanguageBcp47: { type: 'string' },
        timerCountUp: { type: 'boolean' },
        playBackSpeed: { type: 'number' },
        progressBarTypeId: { type: 'number' },
        hotKeys: { type: 'string' },
        profileVisibilit: { type: 'number' },
        emailNotification: { type: 'boolean' },
        dateCreated: { type: 'date' },
        dateUpdated: { type: 'date' },
      },
      relationships: {
        projects: { type: 'hasMany', model: 'project', inverse: 'owner' },
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
        passages: {
          type: 'hasMany',
          model: 'userpassage',
          inverse: 'users',
        },
      },
    },
    currentuser: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        givenName: { type: 'string' },
        familyName: { type: 'string' },
        avatarUrl: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        timezone: { type: 'string' },
        locale: { type: 'string' },
        isLocked: { type: 'boolean' },
        auth0: { type: 'string' },
        // externalId: { type: 'string' },
        // identityToken: { type: 'string' },
        // uiLanguageBcp47: { type: 'string' },
        // timerCountUp: { type: 'boolean' },
        // playBackSpeed: { type: 'number' },
        // progressBarTypeId: { type: 'number' },
        // hotKeys: { type: 'string' },
        // profileVisibilit: { type: 'number'},
        // emailNotification: { type: 'boolean' },
        dateCreated: { type: 'date' },
        dateUpdated: { type: 'date' },
      },
      relationships: {
        projects: { type: 'hasMany', model: 'project' },
        organizationMemberships: {
          type: 'hasMany',
          model: 'organizationmembership',
        },
        groupMemberships: { type: 'hasMany', model: 'groupmembership' },
      },
    },
    userpassage: {
      keys: { remoteId: {} },
      attributes: {
        comment: { type: 'string' },
        datecreated: { type: 'date' },
        dateupdated: { type: 'date' },
      },
      relationships: {
        role: { type: 'hasOne', model: 'role' },
        user: { type: 'hasOne', model: 'user' },
        passage: { type: 'hasOne', model: 'passage' },
      },
    },
  },
};

export const schema = new Schema(schemaDefinition);
