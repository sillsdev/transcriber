import { KeyMap, Schema, SchemaSettings } from '@orbit/data';

export const keyMap = new KeyMap();

const schemaDefinition: SchemaSettings =  {
  models: {
    book: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        bookTypeId: { type: 'number' },
      },
      relationships: {
        type: { type: 'hasOne', model: 'booktype', inverse: 'books' },
        sets: { type: 'hasMany', model: 'set', inverse: 'book' },
      },
    },
    booktype: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        description: { type: 'string' },
      },
      relationships: {
        books: { type: 'hasMany', model: 'book', inverse: 'type' },
      },
    },
    integration: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        url: { type: 'string' },
      },
      relationships: {
        projectIntegrations: { type: 'hasMany', model: 'projectintegrations', inverse: 'projects' },
      },
    },
    organization: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        websiteUrl: { type: 'string' },
        logoUrl: { type: 'string' },
        publicByDefault: { type: 'boolean' },
      },
      relationships: {
        owner: { type: 'hasOne', model: 'user', inverse: 'ownedOrganizations' },
        organizationMemberships: { type: 'hasMany', model: 'user', inverse: 'organizationMemberships' },
        userids: { type: 'hasMany', model: 'user', inverse: 'organizations' },
        users: { type: 'hasMany', model: 'user', inverse: 'organizations' },
        projects: { type: 'hasMany', model: 'project', inverse: 'organization' },
      }
    },
    project: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        projectTypeId: { type: 'number' },
        description: { type: 'string' },
        ownerId: { type: 'number' },
        organizationId: { type: 'number' },
        uilanguagebcp47: { type: 'string' },
        language: { type: 'string' },
        languageName: { type: 'string' },
        defaultFont: { type: 'string' },
        defaultFontSize: { type: 'string' },
        rtl: { type: 'string' },
        allowClaim: { type: 'boolean' },
        isPublic: { type: 'boolean' },
        // filter keys
        dateCreated: { type: 'date' },
        dateUpdated: { type: 'date' },
        dateArchived: { type: 'date' },
      },
      relationships: {
        type: { type: 'hasOne', model: 'projecttype', inverse: 'projects' },
        owner: { type: 'hasOne', model: 'user', inverse: 'projectUsers' },
        organization: { type: 'hasOne', model: 'organization', inverse: 'projects' },
        projectIntegrations: { type: 'hasMany', model: 'projectintegrations', inverse: 'projects' },
        sets: { type: 'hasMany', model: 'set', inverse: 'project' },
        users: { type: 'hasMany', model: 'usertask', inverse: 'project' },
      }
    },
      projectintegrations: {
        keys: { remoteId: {} },
        attributes: {
          projectId: { type: 'number' },
          integrationId: { type: 'number' },
          settings: { type: 'string' },
        },
        relationships: {
          integration: { type: 'hasOne', model: 'integration', inverse: 'projectIntegrations' },
          project: { type: 'hasOne', model: 'project', inverse: 'projectIntegrations' },
        },
      },
      projecttype: {
        keys: { remoteId: {} },
        attributes: {
          name: { type: 'string' },
          description: { type: 'string' },
        },
        relationships: {
          projects: { type: 'hasMany', model: 'project', inverse: 'type' },
        },
      },
      role: {
        keys: { remoteId: {} },
        attributes: {
          rolename: { type: 'string' },
        },
        relationships: {
          userRoles: { type: 'hasMany', model: 'userrole', inverse: 'role' },
        },
      },
      set: {
        keys: { remoteId: {} },
        attributes: {
          name: { type: 'string' },
        },
        relationships: {
          book: { type: 'hasOne', model: 'book', inverse: 'sets' },
          project: { type: 'hasOne', model: 'project', inverse: 'sets' },
        },
      },
      task: {
        keys: { remoteId: {} },
        attributes: {
          reference: { type: 'string' },
          passage: { type: 'string' },
          position: { type: 'number' },
          taskstate: { type: 'string' },
          hold: { type: 'number' },
          title: { type: 'string' },
          datecreated: { type: 'date' },
          dateupdated: { type: 'date' },
        },
        relationships: {
          usertasks: { type: 'hasMany', model: 'usertask', inverse: 'task' },
          media: { type: 'hasMany', model: 'taskmedia', inverse: 'task' },
          sets: { type: 'hasMany', model: 'set', inverse: 'task' },
        },
      },
      taskmedia: {
        keys: { remoteId: {} },
        attributes: {
          versionnumber: { type: 'number' },
          artifacttype: { type: 'string' },
          eafurl: { type: 'string' },
          audiourl: { type: 'string' },
          duration: { type: 'number' },
          contenttype: { type: 'string' },
          audioquality: { type: 'string' },
          textquality: { type: 'string' },
          transcription: { type: 'string' },
          datecreated: { type: 'date' },
          dateupdated: { type: 'date' },
        },
        relationships: {
          task: { type: 'hasOne', model: 'taskmedia', inverse: 'media' },
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
          dateCreated: { type: 'date' },
          dateUpdated: { type: 'date' },
        },
        relationships: {
          projectUsers: { type: 'hasMany', model: 'project', inverse: 'owner' },
          organizationMemberships: { type: 'hasMany', model: 'organization', inverse: 'organizationMemberships' },
          userRoles: { type: 'hasMany', model: 'userrole', inverse: 'user' },
          ownedOrganizations: { type: 'hasMany', model: 'user', inverse: 'owner' },
        },
      },
      userrole: {
        keys: { remoteId: {} },
        attributes: {
          rolename: { type: 'string' },
        },
        relationships: {
          user: { type: 'hasOne', model: 'user', inverse: 'userroles' },
          role: { type: 'hasOne', model: 'role', inverse: 'userroles' },
          organization: { type: 'hasOne', model: 'organization', inverse: 'userroles' },
        },
      },
      usertask: {
        keys: { remoteId: {} },
        attributes: {
          activityname: { type: 'string' },
          taskstate: { type: 'string' },
          comment: { type: 'string' },
          datecreated: { type: 'date' },
          dateupdated: { type: 'date' },
        },
        relationships: {
          project: { type: 'hasOne', model: 'project', inverse: 'usertasks' },
          task: { type: 'hasOne', model: 'task', inverse: 'usertasks' },
          assigned: { type: 'hasOne', model: 'user', inverse: 'assignedTasks' },
        },
      },
  }
};

export const schema = new Schema(schemaDefinition);