Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Schema = undefined;

var _graphql = require('graphql');

var _graphqlRelay = require('graphql-relay');

var _node = require('parse/node');

var _node2 = _interopRequireDefault(_node);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Page = _node2.default.Object.extend('Page');
var FAQ = _node2.default.Object.extend('FAQ');
var Session = _node2.default.Object.extend('Agenda');
var Speaker = _node2.default.Object.extend('Speakers');
var Notification = _node2.default.Object.extend('Notification');
var Map = _node2.default.Object.extend('Maps');

var _nodeDefinitions = (0, _graphqlRelay.nodeDefinitions)(findObjectByGlobalId, objectToGraphQLType);

var nodeInterface = _nodeDefinitions.nodeInterface;
var nodeField = _nodeDefinitions.nodeField;


function findObjectByGlobalId(globalId) {
  var _fromGlobalId = (0, _graphqlRelay.fromGlobalId)(globalId);

  var type = _fromGlobalId.type;
  var id = _fromGlobalId.id;

  var Ent = { Page: Page, FAQ: FAQ, Session: Session, Speaker: Speaker }[type];
  return new _node2.default.Query(Ent).get(id);
}

function objectToGraphQLType(obj) {
  switch (obj.className) {
    case 'Page':
      return F8PageType;
    case 'Session':
      return F8SessionType;
    case 'Speaker':
      return F8SpeakerType;
  }
  return null;
}

var USERS_SCHEDULE = {};

var F8FriendType = new _graphql.GraphQLObjectType({
  name: 'Friend',
  description: 'Facebook friend',
  fields: function fields() {
    return {
      id: {
        type: _graphql.GraphQLID
      },
      name: {
        type: _graphql.GraphQLString
      },
      picture: {
        type: _graphql.GraphQLString,
        resolve: function resolve(friend) {
          return 'https://graph.facebook.com/' + friend.id + '/picture';
        }
      },
      schedule: {
        type: new _graphql.GraphQLList(F8SessionType),
        description: 'Friends schedule',
        resolve: function resolve(friend, args) {
          return new _node2.default.Query(Session).containedIn('objectId', Object.keys(friend.schedule)).find();
        }
      }
    };
  }
});

function loadFriends(rootValue) {
  return _node2.default.Cloud.run('friends', { user: rootValue });
}

function loadFriendsAttending(rootValue, session) {
  var id = session.id;

  return _node2.default.Cloud.run('friends', { user: rootValue }).then(function (friends) {
    return friends.filter(function (friend) {
      return !!friend.schedule[id];
    });
  });
}

var F8UserType = new _graphql.GraphQLObjectType({
  name: 'User',
  description: 'A person who uses our app',
  fields: function fields() {
    return {
      id: (0, _graphqlRelay.globalIdField)('User'),
      name: {
        type: _graphql.GraphQLString
      },
      friends: {
        type: new _graphql.GraphQLList(F8FriendType),
        description: 'User friends who are also in the F8 app and enabled sharing',
        resolve: function resolve(user, args, _ref) {
          var rootValue = _ref.rootValue;
          return loadFriends(rootValue);
        }
      },
      notifications: {
        type: new _graphql.GraphQLList(F8NotificationType),
        resolve: function resolve() {
          return new _node2.default.Query(Notification).find();
        }
      },
      faqs: {
        type: new _graphql.GraphQLList(F8FAQType),
        resolve: function resolve() {
          return new _node2.default.Query(FAQ).find();
        }
      },
      pages: {
        type: new _graphql.GraphQLList(F8PageType),
        resolve: function resolve() {
          return new _node2.default.Query(Page).find();
        }
      },
      config: {
        type: F8ConfigType,
        resolve: function resolve() {
          return _node2.default.Config.get();
        }
      }
    };
  },
  interfaces: [nodeInterface]
});

var F8MapType = new _graphql.GraphQLObjectType({
  name: 'Map',
  description: 'A place at F8 venue',
  fields: function fields() {
    return {
      id: (0, _graphqlRelay.globalIdField)('Map'),
      name: {
        type: _graphql.GraphQLString,
        resolve: function resolve(map) {
          return map.get('name');
        }
      },
      map: {
        type: _graphql.GraphQLString,
        resolve: function resolve(map) {
          return map.get('x1') && map.get('x1').url();
        }
      }
    };
  }
});

var F8SessionType = new _graphql.GraphQLObjectType({
  name: 'Session',
  description: 'Represents F8 agenda item',
  fields: function fields() {
    return {
      id: (0, _graphqlRelay.globalIdField)('Session'),
      title: {
        type: _graphql.GraphQLString,
        resolve: function resolve(session) {
          return session.get('sessionTitle');
        }
      },
      slug: {
        type: _graphql.GraphQLString,
        resolve: function resolve(session) {
          return session.get('sessionSlug');
        }
      },
      day: {
        type: _graphql.GraphQLInt,
        resolve: function resolve(session) {
          return session.get('day');
        }
      },
      startTime: {
        type: _graphql.GraphQLFloat,
        resolve: function resolve(session) {
          return session.get('startTime').getTime();
        }
      },
      endTime: {
        type: _graphql.GraphQLFloat,
        resolve: function resolve(session) {
          return session.get('endTime').getTime();
        }
      },
      location: {
        type: F8MapType,
        resolve: function resolve(session) {
          return new _node2.default.Query(Map).equalTo('name', session.get('sessionLocation')).first();
        }
      },
      description: {
        type: _graphql.GraphQLString,
        resolve: function resolve(session) {
          return session.get('sessionDescription');
        }
      },
      speakers: {
        type: new _graphql.GraphQLList(F8SpeakerType),
        resolve: function resolve(session) {
          return Promise.all((session.get('speakers') || []).map(function (speaker) {
            return speaker.fetch();
          }));
        }
      },
      isAdded: {
        type: _graphql.GraphQLBoolean,
        description: 'If the session has been added to persons schedule',
        resolve: function resolve(session, args, _ref2) {
          var rootValue = _ref2.rootValue;

          return !!USERS_SCHEDULE[session.id];
        }
      },
      friends: {
        type: new _graphql.GraphQLList(F8FriendType),
        description: 'User\'s friends who attend this session',
        resolve: function resolve(session, args, _ref3) {
          var rootValue = _ref3.rootValue;
          return loadFriendsAttending(rootValue, session);
        }
      }
    };
  },
  interfaces: [nodeInterface]
});

var F8PageType = new _graphql.GraphQLObjectType({
  name: 'Page',
  description: 'Facebook pages',
  fields: function fields() {
    return {
      id: (0, _graphqlRelay.globalIdField)('Page'),
      title: {
        type: _graphql.GraphQLString,
        resolve: function resolve(page) {
          return page.get('title');
        }
      },
      url: {
        type: _graphql.GraphQLString,
        resolve: function resolve(page) {
          return 'https://www.facebook.com/' + page.get('alias');
        }
      },
      logo: {
        type: _graphql.GraphQLString,
        resolve: function resolve(page) {
          var logo = page.get('logo');
          if (logo) {
            return logo.url();
          } else {
            return 'https://graph.facebook.com/' + page.get('alias') + '/picture?type=large';
          }
        }
      }
    };
  },
  interfaces: [nodeInterface]
});

var F8FAQType = new _graphql.GraphQLObjectType({
  name: 'FAQ',
  description: 'Frequently asked questions',
  fields: function fields() {
    return {
      id: (0, _graphqlRelay.globalIdField)('FAQ'),
      question: {
        type: _graphql.GraphQLString,
        resolve: function resolve(faq) {
          return faq.get('question');
        }
      },
      answer: {
        type: _graphql.GraphQLString,
        resolve: function resolve(faq) {
          return faq.get('answer');
        }
      }
    };
  },
  interfaces: [nodeInterface]
});

var F8SpeakerType = new _graphql.GraphQLObjectType({
  name: 'Speaker',
  fields: function fields() {
    return {
      id: (0, _graphqlRelay.globalIdField)('Speaker'),
      name: {
        type: _graphql.GraphQLString,
        resolve: function resolve(speaker) {
          return speaker.get('speakerName');
        }
      },
      title: {
        type: _graphql.GraphQLString,
        resolve: function resolve(speaker) {
          return speaker.get('speakerTitle');
        }
      },
      picture: {
        type: _graphql.GraphQLString,
        resolve: function resolve(speaker) {
          return speaker.get('speakerPic') && speaker.get('speakerPic').url();
        }
      }
    };
  },
  interfaces: [nodeInterface]
});

var F8NotificationType = new _graphql.GraphQLObjectType({
  name: 'Notification',
  fields: function fields() {
    return {
      id: (0, _graphqlRelay.globalIdField)('Notification'),
      text: {
        type: _graphql.GraphQLString,
        resolve: function resolve(notification) {
          return notification.get('text');
        }
      },
      url: {
        type: _graphql.GraphQLString,
        resolve: function resolve(notification) {
          return notification.get('url');
        }
      },
      time: {
        type: _graphql.GraphQLFloat,
        description: 'Unix timestamp when the notification was sent.',
        resolve: function resolve(notification) {
          return notification.get('createdAt').getTime();
        }
      }
    };
  }
});

var F8ConfigType = new _graphql.GraphQLObjectType({
  name: 'Config',
  fields: function fields() {
    return {
      wifiNetwork: {
        type: _graphql.GraphQLString,
        resolve: function resolve(config) {
          return config.get('wifiNetwork');
        }
      },
      wifiPassword: {
        type: _graphql.GraphQLString,
        resolve: function resolve(config) {
          return config.get('wifiPassword');
        }
      }
    };
  }
});

var F8QueryType = new _graphql.GraphQLObjectType({
  name: 'Query',
  fields: function fields() {
    return {
      node: nodeField,
      viewer: {
        type: F8UserType,
        resolve: function resolve(rootValue) {
          return rootValue;
        } // TODO: Authenticate user
      },
      schedule: {
        type: new _graphql.GraphQLList(F8SessionType),
        description: 'F8 agenda',
        resolve: function resolve(user, args) {
          return new _node2.default.Query(Session).ascending('startTime').find();
        }
      }
    };
  }
});

var addToScheduleMutation = (0, _graphqlRelay.mutationWithClientMutationId)({
  name: 'AddToSchedule',
  inputFields: {
    sessionId: {
      type: new _graphql.GraphQLNonNull(_graphql.GraphQLID)
    }
  },
  outputFields: {
    session: {
      type: F8SessionType,
      resolve: function resolve(payload) {
        return new _node2.default.Query(Session).get(payload.id);
      }
    }
  },
  mutateAndGetPayload: function mutateAndGetPayload(_ref4, _ref5) {
    var sessionId = _ref4.sessionId;
    var rootValue = _ref5.rootValue;

    var _fromGlobalId2 = (0, _graphqlRelay.fromGlobalId)(sessionId);

    var type = _fromGlobalId2.type;
    var id = _fromGlobalId2.id;

    if (type !== 'Session') {
      throw new Error('Invalid type ' + type);
    }
    USERS_SCHEDULE[id] = true;
    console.log('Mutate ' + id, rootValue);
    return { id: id };
  }
});

var F8MutationType = new _graphql.GraphQLObjectType({
  name: 'Mutation',
  fields: function fields() {
    return {
      // Add your own mutations here
      addToSchedule: addToScheduleMutation
    };
  }
});

var Schema = exports.Schema = new _graphql.GraphQLSchema({
  query: F8QueryType,
  mutation: F8MutationType
});