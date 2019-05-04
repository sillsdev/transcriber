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
    group: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        organizationId: { type: 'number' },
      },
      relationships: {
        organization: { type: 'hasOne', model: 'organization', inverse: 'groups' },
        users: { type: 'hasMany', model: 'groupmembership', inverse: 'group' },
      },
    },
    groupmembership: {
      keys: { remoteId: {} },
      attributes: {
        email: { type: 'string' },
        userId: { type: 'number' },
        groupId: { type: 'number' },
      },
      relationships: {
        user: { type: 'hasOne', model: 'user', inverse: 'groupMemberships' },
        group: { type: 'hasOne', model: 'group', inverse: 'users' },
      }
    },
    integration: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        url: { type: 'string' },
      },
      relationships: {
        projectIntegrations: { type: 'hasMany', model: 'projectintegration', inverse: 'project' },
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
        owner: { type: 'hasOne', model: 'user' },
        users: { type: 'hasMany', model: 'users'},
        groups: { type: 'hasMany', model: 'groupmembership'},
        userRoles: { type: 'hasMany', model: 'userrole'},
      }
    },
    organizationmembership: {
      keys: { remoteId: {} },
      attributes: {
        email: { type: 'string' },
        userId: { type: 'number' },
        organizationId: { type: 'number' },
      },
      relationships: {
        user: { type: 'hasOne', model: 'user' },
        organization: { type: 'hasOne', model: 'organization' },
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
        groupId: { type: 'number' },
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
        dateArchived: { type: 'date' },
      },
      relationships: {
        type: { type: 'hasOne', model: 'projecttype', inverse: 'projects' },
        owner: { type: 'hasOne', model: 'user', inverse: 'projects' },
        organization: { type: 'hasOne', model: 'organization'},
        group: { type: 'hasOne', model: 'group' },
        projectIntegrations: { type: 'hasMany', model: 'projectintegration', inverse: 'project' },
        users: { type: 'hasMany', model: 'usertask', inverse: 'project' },
        sets: { type: 'hasMany', model: 'set', inverse: 'project' },
      }
    },
    projectintegration: {
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
    projectuser: {
      keys: { remoteId: {} },
      attributes: {
        userId: { type: 'number' },
        projectId: { type: 'number' },
        roleId: { type: 'number' },
        font:  { type: 'string' },
        fontSize: { type: 'string' },
      },
      relationships: {
        user: { type: 'hasOne', model: 'user' },
        project: { type: 'hasOne', model: 'project' },
        role: { type: 'hasOne', model: 'role' },
      },
    },
    role: {
      keys: { remoteId: {} },
      attributes: {
        roleName: { type: 'string' },
      },
      relationships: {
        userRoles: { type: 'hasMany', model: 'userrole', inverse: 'role' },
      },
    },
    set: {
      keys: { remoteId: {} },
      attributes: {
        name: { type: 'string' },
        bookId: { type: 'number' },
      },
      relationships: {
        projects: { type: 'hasMany', model: 'project', inverse: 'sets' },
        book: { type: 'hasOne', model: 'book', inverse: 'sets' },
        tasks: { type: 'hasMany', model: 'taskset', inverse: 'set' },
      },
    },
    task: {
      keys: { remoteId: {} },
      attributes: {
        reference: { type: 'string' },
        passage: { type: 'string' },
        position: { type: 'number' },
        taskstate: { type: 'string' },
        hold: { type: 'boolean' },
        title: { type: 'string' },
        datecreated: { type: 'date' },
        dateupdated: { type: 'date' },
      },
      relationships: {
        media: { type: 'hasMany', model: 'taskmedia', inverse: 'task' },
        sets: { type: 'hasMany', model: 'taskset', inverse: 'task' },
      },
    },
    tasksets: {
      keys: { remoteId: {} },
      attributes: {
        taskId: { type: 'number' },
        setId: { type: 'number' },
      },
      relationships: {
        task: { type: 'hasOne', model: 'task', inverse: 'sets' },
        set: { type: 'hasOne', model: 'set', inverse: 'tasks' },
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
        projects: { type: 'hasMany', model: 'project', inverse: 'owner' },
        organizationMemberships: { type: 'hasMany', model: 'organizationMembership', inverse: 'user' },
        userRoles: { type: 'hasMany', model: 'userrole', inverse: 'user' },
        groupMemberships: { type: 'hasMany', model: 'groupmembership', inverse: 'user' },
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
        dateCreated: { type: 'date' },
        dateUpdated: { type: 'date' },
      },
      relationships: {
        projects: { type: 'hasMany', model: 'project' },
        organizationMemberships: { type: 'hasMany', model: 'organizationMembership' },
        userRoles: { type: 'hasMany', model: 'userrole' },
        groupMemberships: { type: 'hasMany', model: 'groupmembership' },
      },
    },
    userrole: {
      keys: { remoteId: {} },
      attributes: {
        userId: { type: 'number' },
        roleId: { type: 'number' },
        organizationId: { type: 'number' },
      },
      relationships: {
        user: { type: 'hasOne', model: 'user', inverse: 'userRoles' },
        role: { type: 'hasOne', model: 'role', inverse: 'userRoles' },
        organization: { type: 'hasOne', model: 'organization', inverse: 'userRoles' },
      },
    },
    usertask: {
      keys: { remoteId: {} },
      attributes: {
        userid: { type: 'number' },
        taskid: { type: 'number' },
        projectid: { type: 'number' },
        activityname: { type: 'string' },
        taskstate: { type: 'string' },
        comment: { type: 'string' },
        datecreated: { type: 'date' },
        dateupdated: { type: 'date' },
      },
      relationships: {
        project: { type: 'hasOne', model: 'project', inverse: 'users' },
        assigned: { type: 'hasOne', model: 'user' },
      },
    },
  }
};

export const schema = new Schema(schemaDefinition);