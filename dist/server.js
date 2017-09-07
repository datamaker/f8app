var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[typeof Symbol === 'function' ? Symbol.iterator : '@@iterator'](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if ((typeof Symbol === 'function' ? Symbol.iterator : '@@iterator') in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _expressGraphql = require('express-graphql');

var _expressGraphql2 = _interopRequireDefault(_expressGraphql);

var _schema = require('./schema/schema');

var _node = require('parse/node');

var _node2 = _interopRequireDefault(_node);

var _parseServer = require('parse-server');

var _parseDashboard = require('parse-dashboard');

var _parseDashboard2 = _interopRequireDefault(_parseDashboard);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SERVER_PORT = process.env.PORT || 8080;
var SERVER_HOST = process.env.HOST || 'localhost';
var APP_ID = process.env.APP_ID || 'oss-f8-app-2016';
var MASTER_KEY = process.env.MASTER_KEY || '70c6093dba5a7e55968a1c7ad3dd3e5a74ef5cac';
var DATABASE_URI = process.env.DATABASE_URI || 'mongodb://localhost:27017/dev';
var IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';
var DASHBOARD_AUTH = process.env.DASHBOARD_AUTH;

_node2.default.initialize(APP_ID);
_node2.default.serverURL = 'http://' + SERVER_HOST + ':' + SERVER_PORT + '/parse';
_node2.default.masterKey = MASTER_KEY;
_node2.default.Cloud.useMasterKey();

function getSchema() {
  if (!IS_DEVELOPMENT) {
    return _schema.Schema;
  }

  delete require.cache[require.resolve('./schema/schema.js')];
  return require('./schema/schema.js').Schema;
}

var server = (0, _express2.default)();

server.use('/parse', new _parseServer.ParseServer({
  databaseURI: DATABASE_URI,
  cloud: _path2.default.resolve(__dirname, 'cloud.js'),
  appId: APP_ID,
  masterKey: MASTER_KEY,
  fileKey: 'f33fc1a9-9ba9-4589-95ca-9976c0d52cd5',
  serverURL: 'http://' + SERVER_HOST + ':' + SERVER_PORT + '/parse'
}));

if (IS_DEVELOPMENT) {
  var users = void 0;
  if (DASHBOARD_AUTH) {
    var _DASHBOARD_AUTH$split = DASHBOARD_AUTH.split(':');

    var _DASHBOARD_AUTH$split2 = _slicedToArray(_DASHBOARD_AUTH$split, 2);

    var user = _DASHBOARD_AUTH$split2[0];
    var pass = _DASHBOARD_AUTH$split2[1];

    users = [{ user: user, pass: pass }];
    console.log(users);
  }
  server.use('/dashboard', (0, _parseDashboard2.default)({
    apps: [{
      serverURL: '/parse',
      appId: APP_ID,
      masterKey: MASTER_KEY,
      appName: 'F8-App-2016'
    }],
    users: users
  }, IS_DEVELOPMENT));
}

server.use('/graphql', (0, _expressGraphql2.default)(function (request) {
  return {
    graphiql: IS_DEVELOPMENT,
    pretty: IS_DEVELOPMENT,
    schema: getSchema(),
    rootValue: Math.random() // TODO: Check credentials, assign user
  };
}));

server.use('/', function (req, res) {
  return res.redirect('/graphql');
});

server.listen(SERVER_PORT, function () {
  return console.log('Server is now running in ' + (process.env.NODE_ENV || 'development') + ' mode on http://localhost:' + SERVER_PORT);
});