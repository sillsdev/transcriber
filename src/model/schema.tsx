import { KeyMap, Schema, SchemaSettings } from '@orbit/data';

export const keyMap = new KeyMap();

const schemaDefinition: SchemaSettings =  {
    models: {
        book: {
            keys: { remoteId: {} },
            attributes: {
              name: { type: 'string' },
            },
            relationships: {
              type: { type: 'hasOne', model: 'bookType', inverse: 'books' },
              sets: { type: 'hasMany', model: 'set', inverse: 'book' },
            },
        },
        bookType: {
            keys: { remoteId: {} },
            attributes: {
              name: { type: 'string' },
              description: { type: 'string' },
            },
            relationships: {
              books: { type: 'hasMany', model: 'book', inverse: 'bookType' },
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
              userMemberships: { type: 'hasMany', model: 'user', inverse: 'organization' },
              users: { type: 'hasMany', model: 'user', inverse: 'organizations' },
              projects: { type: 'hasMany', model: 'project', inverse: 'organization' },
              userRoles: { type: 'hasMany', model: 'userRole', inverse: 'organization' },
            }
        },
        project: {
            keys: { remoteId: {} },
            attributes: {
              name: { type: 'string' },
              dateCreated: { type: 'date' },
              dateUpdated: { type: 'date' },
              dateArchived: { type: 'date' },
              language: { type: 'string' },
              description: { type: 'string' },
              allowDownloads: { type: 'boolean' },
              isPublic: { type: 'boolean' },
              // filter keys
              ownerId: { type: 'number' },
              projectTypeId: { type: 'number' },
              organizationId: { type: 'number' },
            },
            relationships: {
              type: { type: 'hasOne', model: 'projectType', inverse: 'projects' },
              owner: { type: 'hasOne', model: 'user', inverse: 'projects' },
              organization: { type: 'hasOne', model: 'organization', inverse: 'projects' },
              // projectIntegrations: { type: 'hasOne', model: 'projectIntegration', inverse: 'projects' },
              projectUsers: { type: 'hasMany', model: 'user', inverse: 'projects' },
              sets: { type: 'hasMany', model: 'set', inverse: 'project' },
              userTasks: { type: 'hasMany', model: 'userTask', inverse: 'project' },
            }
        },
        projectType: {
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
              roleName: { type: 'string' },
            },
            relationships: {
              userRoles: { type: 'hasMany', model: 'userRole', inverse: 'role' },
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
              taskState: { type: 'string' },
              hold: { type: 'number' },
              title: { type: 'string' },
              dateCreated: { type: 'date' },
              dateUpdated: { type: 'date' },
            },
            relationships: {
              userTasks: { type: 'hasMany', model: 'userTask', inverse: 'task' },
              media: { type: 'hasMany', model: 'taskMedia', inverse: 'task' },
              sets: { type: 'hasMany', model: 'set', inverse: 'task' },
            },
        },
        taskMedia: {
            keys: { remoteId: {} },
            attributes: {
              versionNumber: { type: 'number' },
              artifacttype: { type: 'string' },
              eafUrl: { type: 'string' },
              audioUrl: { type: 'string' },
              duration: { type: 'number' },
              contentType: { type: 'string' },
              audioQuality: { type: 'string' },
              textQuality: { type: 'string' },
              transcription: { type: 'string' },
              dateCreated: { type: 'date' },
              dateUpdated: { type: 'date' },
            },
            relationships: {
              task: { type: 'hasOne', model: 'taskMedia', inverse: 'media' },
            },
        },
        user: {
            keys: { remoteId: {} },
            attributes: {
              name: { type: 'string' },
              givenName: { type: 'string' },
              familyName: { type: 'string' },
              auth0Id: { type: 'string' },
              email: { type: 'string' },
              phone: { type: 'string' },
              isLocked: { type: 'boolean' },
              profileVisibility: { type: 'number' },
              emailNotification: { type: 'boolean' },
              timezone: { type: 'string' },
              localization: { type: 'string' },
              decimalSeparator: { type: 'string' },
            },
            relationships: {
              ownedOrganizations: { type: 'hasMany', model: 'organization', inverse: 'owner' },
              organizationMemberships: { type: 'hasMany', model: 'organization', inverse: 'userMemberships' },
              organizations: { type: 'hasMany', model: 'organization', inverse: 'users' },
              assignedTasks: { type: 'hasMany', model: 'userTask', inverse: 'assigned' },
              projects: { type: 'hasMany', model: 'project', inverse: 'owner' },
              userRoles: { type: 'hasMany', model: 'userRole', inverse: 'user' },
            },
        },
        userRole: {
            keys: { remoteId: {} },
            attributes: {
              roleName: { type: 'string' },
            },
            relationships: {
              user: { type: 'hasOne', model: 'user', inverse: 'userRoles' },
              role: { type: 'hasOne', model: 'role', inverse: 'userRoles' },
              organization: { type: 'hasOne', model: 'organization', inverse: 'userRoles' },
            },
        },
        userTask: {
            keys: { remoteId: {} },
            attributes: {
              activityName: { type: 'string' },
              taskState: { type: 'string' },
              comment: { type: 'string' },
              dateCreated: { type: 'date' },
              dateUpdated: { type: 'date' },
            },
            relationships: {
              project: { type: 'hasOne', model: 'project', inverse: 'userTasks' },
              task: { type: 'hasOne', model: 'task', inverse: 'userTasks' },
              assigned: { type: 'hasOne', model: 'user', inverse: 'assignedTasks' },
            },
        },
    }
};

export const schema = new Schema(schemaDefinition);