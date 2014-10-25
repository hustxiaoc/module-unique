var Module = require('module'),
    assert = require('assert').ok,
    fs = require('fs'),
    path = require('path');

var moduleCache = {},
    options;

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

function statPath(path) {
  try {
    return fs.statSync(path);
  } catch (ex) {}
  return false;
}

// check if the directory is a package.json dir
var packageMainCache = {};

function readPackage(requestPath) {
  if (hasOwnProperty(packageMainCache, requestPath)) {
    return packageMainCache[requestPath];
  }

  try {
    var jsonPath = path.resolve(requestPath, 'package.json');
    var json = fs.readFileSync(jsonPath, 'utf8');
  } catch (e) {
    return false;
  }

  try {
    var pkg = packageMainCache[requestPath] = JSON.parse(json);
  } catch (e) {
    e.path = jsonPath;
    e.message = 'Error parsing ' + jsonPath + ': ' + e.message;
    throw e;
  }
  return pkg;
}

function tryPackage(requestPath, exts) {
  var pkg = readPackage(requestPath);

  if (!(pkg && pkg.main)) return false;

  var name = pkg.name,
      version = pkg.version,
      main = pkg.main;

  var cache = moduleCache[name];
  if(!cache){
    cache = moduleCache[name] = {};
  }

  var filename =  cache[version];

  if(!filename) {
     filename = path.resolve(requestPath, main);
     cache[version] = filename;
  }

  return tryFile(filename) || tryExtensions(filename, exts) ||
         tryExtensions(path.resolve(filename, 'index'), exts);
}


// check if the file exists and is not a directory
function tryFile(requestPath) {
  var stats = statPath(requestPath);
  if (stats && !stats.isDirectory()) {
    return fs.realpathSync(requestPath, Module._realpathCache);
  }
  return false;
}

// given a path check a the file exists with any of the set extensions
function tryExtensions(p, exts) {
  for (var i = 0, EL = exts.length; i < EL; i++) {
    var filename = tryFile(p + exts[i]);

    if (filename) {
      return filename;
    }
  }
  return false;
}

module.exports = {
    init: function(_options){
              if(options) {
                return;
              }
              options = _options||{};
              Module._findPath = function(request, paths) {
                var exts = Object.keys(Module._extensions);

                if (request.charAt(0) === '/') {
                  paths = [''];
                }

                var trailingSlash = (request.slice(-1) === '/');

                var cacheKey = JSON.stringify({request: request, paths: paths});
                if (Module._pathCache[cacheKey]) {
                  return Module._pathCache[cacheKey];
                }

                // For each path
                for (var i = 0, PL = paths.length; i < PL; i++) {
                  var basePath = path.resolve(paths[i], request);
                  var filename;

                  if (!trailingSlash) {
                    // try to join the request to the path
                    filename = tryFile(basePath);

                    if (!filename && !trailingSlash) {
                      // try it with each of the extensions
                      filename = tryExtensions(basePath, exts);
                    }
                  }

                  if (!filename) {
                    filename = tryPackage(basePath, exts);
                  }

                  if (!filename) {
                    filename = tryExtensions(path.resolve(basePath, 'index'), exts);
                  }

                  if (filename) {
                    Module._pathCache[cacheKey] = filename;
                    return filename;
                  }
                }
                return false;
              };
          },
    moduleCache: moduleCache
}
