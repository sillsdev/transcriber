var _typeof =
  typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol'
    ? function(obj) {
        return typeof obj;
      }
    : function(obj) {
        return obj &&
          typeof Symbol === 'function' &&
          obj.constructor === Symbol &&
          obj !== Symbol.prototype
          ? 'symbol'
          : typeof obj;
      };

var _extends =
  Object.assign ||
  function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactTestRenderer = require('react-test-renderer');

var _reactTestRenderer2 = _interopRequireDefault(_reactTestRenderer);

var _data = require('@orbit/data');

var _store = require('@orbit/memory');

var _store2 = _interopRequireDefault(_store);

var _index = require('./../index');

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

// Unfortunately, on Windows we can't use async/await for tests
// see https://github.com/facebook/jest/issues/3750 for more info

var definition = {
  models: {
    list: {
      attributes: {
        name: { type: 'string' },
      },
      relationships: {
        owner: { type: 'hasOne', model: 'user', inverse: 'lists' },
        todos: { type: 'hasMany', model: 'todo', inverse: 'list' },
      },
    },
    todo: {
      attributes: {
        description: { type: 'string' },
      },
      relationships: {
        list: { type: 'hasOne', model: 'list', inverse: 'todos' },
        owner: { type: 'hasOne', model: 'user', inverse: 'todos' },
      },
    },
    user: {
      attributes: {
        name: { type: 'string' },
      },
      relationships: {
        lists: { type: 'hasMany', model: 'list', inverse: 'owner' },
        todos: { type: 'hasMany', model: 'todo', inverse: 'owner' },
      },
    },
  },
};

var schema = void 0;
var store = void 0;

beforeEach(function() {
  schema = new _data.Schema(_extends({}, definition));
  store = new _store2.default({ schema: schema });
});

afterEach(function() {
  // ...
});

// This will output a message to the console (Consider adding an error boundary
// to your tree to customize error handling behavior.)
test('withData requires a dataStore', function() {
  var Test = function Test() {
    return _react2.default.createElement('span', null, 'test');
  };

  var TestWithData = (0, _index.withData)()(Test);

  expect(function() {
    _reactTestRenderer2.default.create(
      _react2.default.createElement(TestWithData, null)
    );
  }).toThrow();
});

test('withData renders children with no arguments', function() {
  var Test = function Test() {
    return _react2.default.createElement('span', null, 'test withdata');
  };

  var TestWithData = (0, _index.withData)()(Test);

  var component = _reactTestRenderer2.default.create(
    _react2.default.createElement(
      _index.DataProvider,
      { dataStore: store },
      _react2.default.createElement(TestWithData, null)
    )
  );

  var tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('withData renders children with empty object', function() {
  var Test = function Test() {
    return _react2.default.createElement('span', null, 'test withdata');
  };

  var TestWithData = (0, _index.withData)({})(Test);

  var component = _reactTestRenderer2.default.create(
    _react2.default.createElement(
      _index.DataProvider,
      { dataStore: store },
      _react2.default.createElement(TestWithData, null)
    )
  );

  var tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('withData renders children with function returning empty object', function() {
  var Test = function Test() {
    return _react2.default.createElement('span', null, 'test withdata');
  };

  var TestWithData = (0, _index.withData)(function() {
    return {};
  })(Test);

  var component = _reactTestRenderer2.default.create(
    _react2.default.createElement(
      _index.DataProvider,
      { dataStore: store },
      _react2.default.createElement(TestWithData, null)
    )
  );

  var tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('withData passes down own props', function() {
  var Test = function Test(_ref) {
    var test = _ref.test;

    return _react2.default.createElement('span', null, test);
  };

  var TestWithData = (0, _index.withData)()(Test);

  var component = _reactTestRenderer2.default.create(
    _react2.default.createElement(
      _index.DataProvider,
      { dataStore: store },
      _react2.default.createElement(TestWithData, { test: 'test' })
    )
  );

  var tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});

test('withData subscribes and unsubscribes from store event', function() {
  var Test = function Test() {
    return _react2.default.createElement('span', null, 'test');
  };

  var mapRecordsToProps = {
    todos: function todos(q) {
      return q.findRecords('todo');
    },
  };

  var TestWithData = (0, _index.withData)(mapRecordsToProps)(Test);

  expect(store.listeners('transform')).toHaveLength(0);

  var component = _reactTestRenderer2.default.create(
    _react2.default.createElement(
      _index.DataProvider,
      { dataStore: store },
      _react2.default.createElement(TestWithData, null)
    )
  );

  expect(store.listeners('transform')).toHaveLength(1);

  component.unmount();

  expect(store.listeners('transform')).toHaveLength(0);
});

test('withData passes records as prop', function() {
  var Test = function Test(_ref2) {
    var todos = _ref2.todos;

    expect(todos).toHaveLength(0);

    return _react2.default.createElement('span', null, 'test');
  };

  var mapRecordsToProps = {
    todos: function todos(q) {
      return q.findRecords('todo');
    },
  };

  var TestWithData = (0, _index.withData)(mapRecordsToProps)(Test);

  var component = _reactTestRenderer2.default.create(
    _react2.default.createElement(
      _index.DataProvider,
      { dataStore: store },
      _react2.default.createElement(TestWithData, null)
    )
  );
});

test('withData passes non-existing record as undefined in findRecord', function() {
  var Test = function Test(_ref3) {
    var todo = _ref3.todo;

    expect(todo).toBeUndefined();

    return _react2.default.createElement('span', null, 'test');
  };

  var mapRecordsToProps = {
    todo: function todo(q) {
      return q.findRecord({ type: 'todo', id: 'non-existing' });
    },
  };

  var TestWithData = (0, _index.withData)(mapRecordsToProps)(Test);

  var component = _reactTestRenderer2.default.create(
    _react2.default.createElement(
      _index.DataProvider,
      { dataStore: store },
      _react2.default.createElement(TestWithData, null)
    )
  );
});

test('withData passes non-existing record as empty array in findRecords', function() {
  var Test = function Test(_ref4) {
    var todos = _ref4.todos;

    expect(todos).toHaveLength(0);

    return _react2.default.createElement('span', null, 'test');
  };

  var mapRecordsToProps = {
    todos: function todos(q) {
      return q.findRecords('todo');
    },
  };

  var TestWithData = (0, _index.withData)(mapRecordsToProps)(Test);

  var component = _reactTestRenderer2.default.create(
    _react2.default.createElement(
      _index.DataProvider,
      { dataStore: store },
      _react2.default.createElement(TestWithData, null)
    )
  );
});

test('withData passes dataStore', function() {
  var Test = function Test(_ref5) {
    var dataStore = _ref5.dataStore;

    expect(dataStore).toBe(store);

    return _react2.default.createElement('span', null, 'test');
  };

  var TestWithData = (0, _index.withData)()(Test);

  _reactTestRenderer2.default.create(
    _react2.default.createElement(
      _index.DataProvider,
      { dataStore: store },
      _react2.default.createElement(TestWithData, null)
    )
  );
});

test('withData passes queryStore', function() {
  var Test = function Test(_ref6) {
    var queryStore = _ref6.queryStore;

    expect(
      typeof queryStore === 'undefined' ? 'undefined' : _typeof(queryStore)
    ).toEqual('function');

    // queryStore should return a promise
    expect(
      _typeof(
        queryStore(function(q) {
          return q.findRecords('todo');
        })
      )
    ).toEqual('object');

    return _react2.default.createElement('span', null, 'test');
  };

  var TestWithData = (0, _index.withData)()(Test);

  var component = _reactTestRenderer2.default.create(
    _react2.default.createElement(
      _index.DataProvider,
      { dataStore: store },
      _react2.default.createElement(TestWithData, null)
    )
  );
});

test('withData passes updateStore', function() {
  var Test = function Test(_ref7) {
    var updateStore = _ref7.updateStore;

    expect(
      typeof updateStore === 'undefined' ? 'undefined' : _typeof(updateStore)
    ).toEqual('function');

    // updateStore should return a promise
    expect(
      _typeof(
        updateStore(function(t) {
          return t.addRecord({});
        })
      )
    ).toEqual('object');

    return _react2.default.createElement('span', null, 'test');
  };

  var TestWithData = (0, _index.withData)()(Test);

  var component = _reactTestRenderer2.default.create(
    _react2.default.createElement(
      _index.DataProvider,
      { dataStore: store },
      _react2.default.createElement(TestWithData, null)
    )
  );
});

test('withData receives updates for findRecord', function(done) {
  var callCount = 0;

  var record = {
    type: 'todo',
    id: 'my-first-todo',
    attributes: {
      description: 'Run tests',
    },
  };

  var testTodo = function testTodo(todo) {
    if (callCount++ === 1) {
      expect(todo).toEqual(record);
      done();
    }
  };

  var Test = function Test(_ref8) {
    var todo = _ref8.todo;

    testTodo(todo);

    return _react2.default.createElement('span', null, 'test');
  };

  var mapRecordsToProps = {
    todo: function todo(q) {
      return q.findRecord({ type: 'todo', id: 'my-first-todo' });
    },
  };

  var TestWithData = (0, _index.withData)(mapRecordsToProps)(Test);

  var component = _reactTestRenderer2.default.create(
    _react2.default.createElement(
      _index.DataProvider,
      { dataStore: store },
      _react2.default.createElement(TestWithData, null)
    )
  );

  store.update(function(t) {
    return t.addRecord(record);
  });
});

test('withData receives updates for findRecords', function(done) {
  var callCount = 0;

  var testTodos = function testTodos(todos) {
    expect(todos).toHaveLength(callCount++);

    if (callCount === 2) {
      done();
    }
  };

  var Test = function Test(_ref9) {
    var todos = _ref9.todos;

    testTodos(todos);

    return _react2.default.createElement('span', null, 'test');
  };

  var mapRecordsToProps = {
    todos: function todos(q) {
      return q.findRecords('todo');
    },
  };

  var TestWithData = (0, _index.withData)(mapRecordsToProps)(Test);

  var component = _reactTestRenderer2.default.create(
    _react2.default.createElement(
      _index.DataProvider,
      { dataStore: store },
      _react2.default.createElement(TestWithData, null)
    )
  );

  store.update(function(t) {
    return t.addRecord({
      type: 'todo',
      id: 'my-first-todo',
      attributes: {
        description: 'Run tests',
      },
    });
  });
});

test('withData receives updates for findRelatedRecord', function(done) {
  // Unfortunately, on Windows we can't use async/await for tests
  // see https://github.com/facebook/jest/issues/3750 for more info
  var callCount = 0;
  var user = {
    type: 'user',
    id: 'test-user',
    attributes: {
      name: 'Test user',
    },
  };
  var updatedName = 'updated-test-user';

  store
    .update(function(t) {
      return t.addRecord(user);
    })
    .then(function() {
      return store.update(function(t) {
        return t.addRecord({
          type: 'todo',
          id: 'my-first-todo',
          attributes: {
            description: 'Run tests',
          },
        });
      });
    })
    .then(function() {
      var testTodos = function testTodos(owner) {
        callCount++;

        if (callCount === 1) {
          expect(owner).toBeNull();
        } else if (callCount === 2) {
          expect(owner).toMatchObject(user);
        } else if (callCount === 3) {
          expect(owner.attributes.name).toEqual(updatedName);
        } else if (callCount === 4) {
          expect(owner).toBeNull();
          done();
        }
      };

      var Test = function Test(_ref10) {
        var owner = _ref10.owner;

        testTodos(owner);

        return _react2.default.createElement('span', null, 'test');
      };

      var mapRecordsToProps = {
        owner: function owner(q) {
          return q.findRelatedRecord(
            {
              type: 'todo',
              id: 'my-first-todo',
            },
            'owner'
          );
        },
      };

      var TestWithData = (0, _index.withData)(mapRecordsToProps)(Test);

      var component = _reactTestRenderer2.default.create(
        _react2.default.createElement(
          _index.DataProvider,
          { dataStore: store },
          _react2.default.createElement(TestWithData, null)
        )
      );

      store
        .update(function(t) {
          return t.replaceRelatedRecord(
            { type: 'todo', id: 'my-first-todo' },
            'owner',
            { type: 'user', id: 'test-user' }
          );
        })
        .then(function() {
          store.update(function(t) {
            return t.replaceAttribute(
              { type: 'user', id: 'test-user' },
              'name',
              updatedName
            );
          });
        })
        .then(function() {
          store.update(function(t) {
            return t.replaceRelatedRecord(
              { type: 'todo', id: 'my-first-todo' },
              'owner',
              null
            );
          });
        });
    });
});

test('withData receives updates for findRelatedRecords', function(done) {
  // Unfortunately, on Windows we can't use async/await for tests
  // see https://github.com/facebook/jest/issues/3750 for more info
  var callCount = 0;
  var updatedDescription = 'Run tests again';

  store
    .update(function(t) {
      return t.addRecord({
        type: 'user',
        id: 'test-user',
        attributes: {
          name: 'Test user',
        },
      });
    })
    .then(function() {
      return store.update(function(t) {
        return t.addRecord({
          type: 'todo',
          id: 'my-first-todo',
          attributes: {
            description: 'Run tests',
          },
        });
      });
    })
    .then(function() {
      var testTodos = function testTodos(todos, user) {
        callCount++;

        if (callCount === 1) {
          expect(todos).toHaveLength(0);
        } else if (callCount === 2) {
          expect(todos).toHaveLength(1);
          expect(user.relationships.todos.data).toHaveLength(1);
        } else if (callCount === 3) {
          expect(todos).toHaveLength(1);
          expect(todos[0].attributes.description).toEqual(updatedDescription);
          expect(user.relationships.todos.data).toHaveLength(1);
        } else if (callCount === 4) {
          expect(todos).toHaveLength(0);
          expect(user.relationships.todos.data).toHaveLength(0);
        } else if (callCount === 5) {
          expect(todos).toHaveLength(1);
          expect(user.relationships.todos.data).toHaveLength(1);
        } else if (callCount === 6) {
          expect(todos).toHaveLength(0);
          expect(user.relationships.todos.data).toHaveLength(0);
          done();
        }
      };

      var Test = function Test(_ref11) {
        var todos = _ref11.todos,
          user = _ref11.user;

        testTodos(todos, user);

        return _react2.default.createElement('span', null, 'test');
      };

      var mapRecordsToProps = {
        user: function user(q) {
          return q.findRecord({ type: 'user', id: 'test-user' });
        },
        todos: function todos(q) {
          return q.findRelatedRecords(
            {
              type: 'user',
              id: 'test-user',
            },
            'todos'
          );
        },
      };

      var TestWithData = (0, _index.withData)(mapRecordsToProps)(Test);

      var component = _reactTestRenderer2.default.create(
        _react2.default.createElement(
          _index.DataProvider,
          { dataStore: store },
          _react2.default.createElement(TestWithData, null)
        )
      );

      store
        .update(function(t) {
          return t.addToRelatedRecords(
            { type: 'user', id: 'test-user' },
            'todos',
            {
              type: 'todo',
              id: 'my-first-todo',
            }
          );
        })
        .then(function() {
          return store.update(function(t) {
            return t.replaceAttribute(
              { type: 'todo', id: 'my-first-todo' },
              'description',
              updatedDescription
            );
          });
        })
        .then(function() {
          store.update(function(t) {
            return t.removeFromRelatedRecords(
              { type: 'user', id: 'test-user' },
              'todos',
              { type: 'todo', id: 'my-first-todo' }
            );
          });
        })
        .then(function() {
          store.update(function(t) {
            return t.addRecord({
              type: 'todo',
              id: 'my-second-todo',
              attributes: {
                description: 'Run more tests',
              },
              relationships: {
                owner: {
                  data: { type: 'user', id: 'test-user' },
                },
              },
            });
          });
        })
        .then(function() {
          store.update(function(t) {
            return t.removeRecord({
              type: 'todo',
              id: 'my-second-todo',
            });
          });
        });
    });
});

test('withData receives updates for findRelatedRecords when calling addRecord with relationship intersection', function(done) {
  // Unfortunately, on Windows we can't use async/await for tests
  // see https://github.com/facebook/jest/issues/3750 for more info
  var callCount = 0;
  var updatedDescription = 'Run tests again';

  store
    .update(function(t) {
      return t.addRecord({
        type: 'user',
        id: 'test-user',
        attributes: {
          name: 'Test user',
        },
      });
    })
    .then(function() {
      return store.update(function(t) {
        return t.addRecord({
          type: 'list',
          id: 'test-list',
          attributes: {
            name: 'Test list',
          },
          relationships: {
            todos: {
              data: [],
            },
            owner: {
              data: {
                type: 'user',
                id: 'test-user',
              },
            },
          },
        });
      });
    })
    .then(function() {
      var testLists = function testLists(lists) {
        callCount++;

        if (callCount === 1) {
          expect(lists).toHaveLength(1);
          expect(lists[0].relationships.todos.data).toHaveLength(0);
        } else if (callCount === 2) {
          expect(lists).toHaveLength(1);
          expect(lists[0].relationships.todos.data).toHaveLength(1);
          done();
        }
      };

      var Test = function Test(_ref12) {
        var lists = _ref12.lists;

        testLists(lists);

        return _react2.default.createElement('span', null, 'test');
      };

      var mapRecordsToProps = {
        lists: function lists(q) {
          return q.findRelatedRecords(
            {
              type: 'user',
              id: 'test-user',
            },
            'lists'
          );
        },
      };

      var TestWithData = (0, _index.withData)(mapRecordsToProps)(Test);

      var component = _reactTestRenderer2.default.create(
        _react2.default.createElement(
          _index.DataProvider,
          { dataStore: store },
          _react2.default.createElement(TestWithData, null)
        )
      );

      store.update(function(t) {
        return t.addRecord({
          type: 'todo',
          id: 'test-todo',
          attributes: {
            description: 'Do something',
          },
          relationships: {
            list: {
              data: {
                type: 'list',
                id: 'test-list',
              },
            },
          },
        });
      });
    });
});

test('withData receives updates for multiple keys', function(done) {
  // Unfortunately, on Windows we can't use async/await for tests
  // see https://github.com/facebook/jest/issues/3750 for more info
  var callCount = 0;

  store
    .update(function(t) {
      return t.addRecord({
        type: 'user',
        id: 'test-user',
        attributes: {
          name: 'Test user',
        },
      });
    })
    .then(function() {
      return store.update(function(t) {
        return t.addRecord({
          type: 'todo',
          id: 'my-first-todo',
          attributes: {
            description: 'Run tests',
          },
        });
      });
    })
    .then(function() {
      var testTodos = function testTodos(_ref13) {
        var todos = _ref13.todos,
          users = _ref13.users;

        callCount++;

        if (callCount === 1) {
          expect(todos).toHaveLength(1);
          expect(users).toHaveLength(1);
        } else if (callCount === 2) {
          expect(todos).toHaveLength(2);
          expect(users).toHaveLength(1);
        } else if (callCount === 3) {
          expect(todos).toHaveLength(2);
          expect(users).toHaveLength(2);
          done();
        }
      };

      var Test = function Test(_ref14) {
        var todos = _ref14.todos,
          users = _ref14.users;

        testTodos({ todos: todos, users: users });

        return _react2.default.createElement('span', null, 'test');
      };

      var mapRecordsToProps = {
        todos: function todos(q) {
          return q.findRecords('todo');
        },
        users: function users(q) {
          return q.findRecords('user');
        },
      };

      var TestWithData = (0, _index.withData)(mapRecordsToProps)(Test);

      var component = _reactTestRenderer2.default.create(
        _react2.default.createElement(
          _index.DataProvider,
          { dataStore: store },
          _react2.default.createElement(TestWithData, null)
        )
      );

      store
        .update(function(t) {
          return t.addRecord({
            type: 'todo',
            id: 'my-second-todo',
            attributes: {
              description: 'Run more tests',
            },
          });
        })
        .then(function() {
          store.update(function(t) {
            return t.addRecord({
              type: 'user',
              id: 'another-user',
              attributes: {
                name: 'Another user',
              },
            });
          });
        });
    });
});

test('withData keeps references for unchanged props', function(done) {
  store
    .update(function(t) {
      return t.addRecord({
        type: 'user',
        id: 'test-user',
        attributes: {
          name: 'Test user',
        },
      });
    })
    .then(function() {
      var Test = function Test(_ref15) {
        var todos = _ref15.todos,
          users = _ref15.users;
        return _react2.default.createElement('span', null);
      };

      var mapRecordsToProps = {
        todos: function todos(q) {
          return q.findRecords('todo');
        },
        users: function users(q) {
          return q.findRecords('user');
        },
      };

      var TestWithData = (0, _index.withData)(mapRecordsToProps)(Test);

      var componentRenderer = _reactTestRenderer2.default.create(
        _react2.default.createElement(
          _index.DataProvider,
          { dataStore: store },
          _react2.default.createElement(TestWithData, null)
        )
      );

      var testComponent = componentRenderer.root.findByType(Test);

      expect(testComponent.props.todos).toHaveLength(0);
      expect(testComponent.props.users).toHaveLength(1);

      var previousUsers = testComponent.props.users;

      store
        .update(function(t) {
          return t.addRecord({
            type: 'todo',
            id: 'my-first-todo',
            attributes: {
              description: 'Run tests',
            },
          });
        })
        .then(function() {
          expect(testComponent.props.todos).toHaveLength(1);
          expect(testComponent.props.users).toHaveLength(1);
          expect(testComponent.props.users).toBe(previousUsers);
          done();
        });
    });
});

test('withData receives updates for findRecord depending on own props', function(done) {
  var record = {
    type: 'user',
    id: 'test-user',
    attributes: {
      name: 'Test user',
    },
  };

  var Test = function Test(_ref16) {
    var user = _ref16.user;
    return _react2.default.createElement('span', null);
  };

  var mapRecordsToProps = function mapRecordsToProps(_ref17) {
    var userId = _ref17.userId;
    return {
      user: function user(q) {
        return q.findRecord({ type: 'user', id: userId });
      },
    };
  };

  var TestWithData = (0, _index.withData)(mapRecordsToProps)(Test);

  var componentRenderer = _reactTestRenderer2.default.create(
    _react2.default.createElement(
      _index.DataProvider,
      { dataStore: store },
      _react2.default.createElement(TestWithData, { userId: 'test-user' })
    )
  );

  var testComponent = componentRenderer.root.findByType(Test);

  expect(testComponent.props.user).toBeUndefined();

  store
    .update(function(t) {
      return t.addRecord(record);
    })
    .then(function() {
      expect(testComponent.props.user).toEqual(record);
      done();
    });
});

test('withData receives updates when own props change', function(done) {
  var record = {
    type: 'user',
    id: 'test-user',
    attributes: {
      name: 'Test user',
    },
  };

  store
    .update(function(t) {
      return t.addRecord(record);
    })
    .then(function() {
      var Test = function Test(_ref18) {
        var user = _ref18.user;
        return _react2.default.createElement('span', null);
      };

      var mapRecordsToProps = function mapRecordsToProps(_ref19) {
        var userId = _ref19.userId;
        return {
          user: function user(q) {
            return q.findRecord({ type: 'user', id: userId });
          },
        };
      };

      var TestWithData = (0, _index.withData)(mapRecordsToProps)(Test);

      var testComponent = void 0;
      var componentRenderer = _reactTestRenderer2.default.create(
        _react2.default.createElement(
          _index.DataProvider,
          { dataStore: store },
          _react2.default.createElement(TestWithData, null)
        )
      );
      testComponent = componentRenderer.root.findByType(Test);

      expect(testComponent.props.user).toBeUndefined();

      componentRenderer.update(
        _react2.default.createElement(
          _index.DataProvider,
          { dataStore: store },
          _react2.default.createElement(TestWithData, { userId: 'test-user' })
        )
      );
      testComponent = componentRenderer.root.findByType(Test);

      expect(testComponent.props.user).toEqual(record);

      done();
    });
});

test("withData doesn't update props if records remain the same", function() {
  var Test = function Test() {
    return _react2.default.createElement('span', null);
  };

  var mapRecordsToProps = function mapRecordsToProps() {
    return {
      users: function users(q) {
        return q.findRecords('user');
      },
    };
  };

  var TestWithData = (0, _index.withData)(mapRecordsToProps)(Test);

  var testComponent = void 0;
  var usersProp = void 0;

  var componentRenderer = _reactTestRenderer2.default.create(
    _react2.default.createElement(
      _index.DataProvider,
      { dataStore: store },
      _react2.default.createElement(TestWithData, { unusedProp: 1 })
    )
  );
  testComponent = componentRenderer.root.findByType(Test);

  expect(testComponent.props.users).toHaveLength(0);
  usersProp = testComponent.props.users;

  componentRenderer.update(
    _react2.default.createElement(
      _index.DataProvider,
      { dataStore: store },
      _react2.default.createElement(TestWithData, { unusedProp: 2 })
    )
  );
  testComponent = componentRenderer.root.findByType(Test);

  expect(testComponent.props.users).toHaveLength(0);
  expect(testComponent.props.users).toBe(usersProp);
});

test('withData resets all props when mRtP returns an empty object', function(done) {
  var record = {
    type: 'user',
    id: 'test-user',
    attributes: {
      name: 'Test user',
    },
  };

  store
    .update(function(t) {
      return t.addRecord(record);
    })
    .then(function() {
      var Test = function Test() {
        return _react2.default.createElement('span', null);
      };

      var mapRecordsToProps = function mapRecordsToProps(_ref20) {
        var showUsers = _ref20.showUsers;

        if (showUsers) {
          return {
            users: function users(q) {
              return q.findRecords('user');
            },
          };
        }

        return {};
      };

      var TestWithData = (0, _index.withData)(mapRecordsToProps)(Test);

      var testComponent = void 0;

      var componentRenderer = _reactTestRenderer2.default.create(
        _react2.default.createElement(
          _index.DataProvider,
          { dataStore: store },
          _react2.default.createElement(TestWithData, { showUsers: true })
        )
      );
      testComponent = componentRenderer.root.findByType(Test);

      expect(testComponent.props.users).toHaveLength(1);

      componentRenderer.update(
        _react2.default.createElement(
          _index.DataProvider,
          { dataStore: store },
          _react2.default.createElement(TestWithData, { showUsers: false })
        )
      );
      testComponent = componentRenderer.root.findByType(Test);

      expect(testComponent.props.users).toBeUndefined();

      done();
    });
});

test('withData resets some props when mRtP returns different keys', function(done) {
  store
    .update(function(t) {
      return t.addRecord({
        type: 'user',
        id: 'test-user',
        attributes: {
          name: 'Test user',
        },
      });
    })
    .then(function() {
      return store.update(function(t) {
        return t.addRecord({
          type: 'todo',
          id: 'my-first-todo',
          attributes: {
            description: 'Run tests',
          },
        });
      });
    })
    .then(function() {
      var Test = function Test() {
        return _react2.default.createElement('span', null);
      };

      var mapRecordsToProps = function mapRecordsToProps(_ref21) {
        var showTodos = _ref21.showTodos,
          showUsers = _ref21.showUsers;

        if (showUsers) {
          return {
            users: function users(q) {
              return q.findRecords('user');
            },
          };
        }

        if (showTodos) {
          return {
            todos: function todos(q) {
              return q.findRecords('todo');
            },
          };
        }

        return {};
      };

      var TestWithData = (0, _index.withData)(mapRecordsToProps)(Test);

      var testComponent = void 0;

      var componentRenderer = _reactTestRenderer2.default.create(
        _react2.default.createElement(
          _index.DataProvider,
          { dataStore: store },
          _react2.default.createElement(TestWithData, {
            showUsers: true,
            showTodos: false,
          })
        )
      );
      testComponent = componentRenderer.root.findByType(Test);

      expect(testComponent.props.users).toHaveLength(1);
      expect(testComponent.props.todos).toBeUndefined();

      componentRenderer.update(
        _react2.default.createElement(
          _index.DataProvider,
          { dataStore: store },
          _react2.default.createElement(TestWithData, {
            showUsers: false,
            showTodos: true,
          })
        )
      );
      testComponent = componentRenderer.root.findByType(Test);

      expect(testComponent.props.users).toBeUndefined();
      expect(testComponent.props.todos).toHaveLength(1);

      done();
    });
});

test('withData keeps references for unchanged records when own props are updated', function(done) {
  var callCount = 0;

  store
    .update(function(t) {
      return t.addRecord({
        type: 'user',
        id: 'test-user',
        attributes: {
          name: 'Test user',
        },
      });
    })
    .then(function() {
      return store.update(function(t) {
        return t.addRecord({
          type: 'todo',
          id: 'test-todo',
          attributes: {
            description: 'Run even more tests',
          },
          relationships: {
            owner: {
              data: {
                type: 'user',
                id: 'test-user',
              },
            },
          },
        });
      });
    })
    .then(function() {
      var Test = function Test() {
        callCount++;

        return _react2.default.createElement('span', null, 'test');
      };

      // Need to provide one argument at least, otherwise re-renders are optimized
      var mapRecordsToProps = function mapRecordsToProps(props) {
        return {
          todos: function todos(q) {
            return q.findRelatedRecords(
              { type: 'user', id: 'test-user' },
              'todos'
            );
          },
        };
      };

      var TestWithData = (0, _index.withData)(mapRecordsToProps)(Test);

      var testComponent = void 0;
      var todosProp = void 0;

      var componentRenderer = _reactTestRenderer2.default.create(
        _react2.default.createElement(
          _index.DataProvider,
          { dataStore: store },
          _react2.default.createElement(TestWithData, { unusedProp: 1 })
        )
      );
      testComponent = componentRenderer.root.findByType(Test);
      expect(testComponent.props.todos).toHaveLength(1);
      todosProp = testComponent.props.todos;

      componentRenderer.update(
        _react2.default.createElement(
          _index.DataProvider,
          { dataStore: store },
          _react2.default.createElement(TestWithData, { unusedProp: 1 })
        )
      );
      testComponent = componentRenderer.root.findByType(Test);
      expect(testComponent.props.todos).toHaveLength(1);
      expect(testComponent.props.todos).toBe(todosProp);

      componentRenderer.update(
        _react2.default.createElement(
          _index.DataProvider,
          { dataStore: store },
          _react2.default.createElement(TestWithData, { unusedProp: 2 })
        )
      );
      testComponent = componentRenderer.root.findByType(Test);
      expect(testComponent.props.todos).toHaveLength(1);
      expect(testComponent.props.todos).toEqual(todosProp);

      expect(callCount).toBe(2);
      done();
    });
});

test('withData keeps references for unchanged records when own props are updated', function(done) {
  var callCount = 0;

  store
    .update(function(t) {
      return t.addRecord({
        type: 'user',
        id: 'user-1',
        attributes: {
          name: 'Test user 1',
        },
      });
    })
    .then(function() {
      return store.update(function(t) {
        return t.addRecord({
          type: 'user',
          id: 'user-2',
          attributes: {
            name: 'Test user 2',
          },
        });
      });
    })
    .then(function() {
      return store.update(function(t) {
        return t.addRecord({
          type: 'todo',
          id: 'test-todo',
          attributes: {
            description: 'Run some tests',
          },
        });
      });
    })
    .then(function() {
      var Test = function Test() {
        callCount++;

        return _react2.default.createElement('span', null, 'test');
      };

      var mapRecordsToProps = function mapRecordsToProps(_ref22) {
        var userId = _ref22.userId;
        return {
          todos: function todos(q) {
            return q.findRecords('todo');
          },
          user: function user(q) {
            return q.findRecord({ type: 'user', id: userId });
          },
        };
      };

      var TestWithData = (0, _index.withData)(mapRecordsToProps)(Test);

      var testComponent = void 0;
      var todosProp = void 0;

      var componentRenderer = _reactTestRenderer2.default.create(
        _react2.default.createElement(
          _index.DataProvider,
          { dataStore: store },
          _react2.default.createElement(TestWithData, { userId: 'user-1' })
        )
      );
      testComponent = componentRenderer.root.findByType(Test);
      expect(testComponent.props.todos).toHaveLength(1);
      expect(testComponent.props.user.id).toEqual('user-1');
      todosProp = testComponent.props.todos;

      componentRenderer.update(
        _react2.default.createElement(
          _index.DataProvider,
          { dataStore: store },
          _react2.default.createElement(TestWithData, { userId: 'user-2' })
        )
      );
      testComponent = componentRenderer.root.findByType(Test);
      expect(testComponent.props.todos).toHaveLength(1);
      expect(testComponent.props.todos).toBe(todosProp);
      expect(testComponent.props.user.id).toEqual('user-2');

      expect(callCount).toBe(2);
      done();
    });
});

test('[regression] withData passes convenience props in subsequent renders (without ownProps)', function() {
  var Test = function Test() {
    return _react2.default.createElement('span', null, 'test');
  };

  var mapRecordsToProps = {};

  var TestWithData = (0, _index.withData)(mapRecordsToProps)(Test);

  var testComponent = void 0;
  var componentRenderer = _reactTestRenderer2.default.create(
    _react2.default.createElement(
      _index.DataProvider,
      { dataStore: store },
      _react2.default.createElement(TestWithData, null)
    )
  );
  testComponent = componentRenderer.root.findByType(Test);

  expect(testComponent.props.dataStore).toBe(store);
  expect(_typeof(testComponent.props.queryStore)).toEqual('function');
  expect(_typeof(testComponent.props.updateStore)).toEqual('function');

  componentRenderer.update(
    _react2.default.createElement(
      _index.DataProvider,
      { dataStore: store },
      _react2.default.createElement(TestWithData, { userId: 'test-user' })
    )
  );
  testComponent = componentRenderer.root.findByType(Test);

  expect(testComponent.props.dataStore).toBe(store);
  expect(_typeof(testComponent.props.queryStore)).toEqual('function');
  expect(_typeof(testComponent.props.updateStore)).toEqual('function');
});

test('[regression] withData passes convenience props in subsequent renders (with ownProps)', function() {
  var Test = function Test() {
    return _react2.default.createElement('span', null, 'test');
  };

  var mapRecordsToProps = function mapRecordsToProps(ownProps) {
    return {};
  };

  var TestWithData = (0, _index.withData)(mapRecordsToProps)(Test);

  var testComponent = void 0;
  var componentRenderer = _reactTestRenderer2.default.create(
    _react2.default.createElement(
      _index.DataProvider,
      { dataStore: store },
      _react2.default.createElement(TestWithData, null)
    )
  );
  testComponent = componentRenderer.root.findByType(Test);

  expect(testComponent.props.dataStore).toBe(store);
  expect(_typeof(testComponent.props.queryStore)).toEqual('function');
  expect(_typeof(testComponent.props.updateStore)).toEqual('function');

  componentRenderer.update(
    _react2.default.createElement(
      _index.DataProvider,
      { dataStore: store },
      _react2.default.createElement(TestWithData, { userId: 'test-user' })
    )
  );
  testComponent = componentRenderer.root.findByType(Test);

  expect(testComponent.props.dataStore).toBe(store);
  expect(_typeof(testComponent.props.queryStore)).toEqual('function');
  expect(_typeof(testComponent.props.updateStore)).toEqual('function');
});
