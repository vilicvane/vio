import * as FS from 'fs';
import * as Path from 'path';

const Module = require('module');
const originalJSResolver = Module._extensions['.js'];

let lastModifiedTimestamps = new Map<string, number>();
let locks: Set<string>;

/**
 * Lock a file in case it changes during a single event loop.
 * @return A boolean indicates whether the filename had already been locked.
 */
function lock(path: string): boolean {
  if (locks) {
    if (locks.has(path)) {
      return true;
    } else {
      locks.add(path);
      return false;
    }
  }

  locks = new Set<string>([path]);

  setImmediate(() => {
    locks = undefined;
  });

  return false;
}

function stripBOM(content: string) {
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}

Module._extensions['.js'] = (module: any, filename: string) => {
  if (!lastModifiedTimestamps.has(filename)) {
    return originalJSResolver(module, filename);
  }

  let content = FS.readFileSync(filename, 'utf-8');

  content = stripBOM(content);
  content = `require = require(${JSON.stringify(__filename)})(require, module);${content}`;

  module._compile(content, filename);
};

export = (originalRequire: NodeRequire) => {
  let vioRequire = function require(path: string): any {
    let resolvedPath = originalRequire.resolve(path);

    if (
      Path.isAbsolute(resolvedPath) &&
      !/[\\/]node_modules[\\/]/.test(resolvedPath) &&
      !lock(resolvedPath)
    ) {
      let previousLastModified = lastModifiedTimestamps.get(resolvedPath);

      if (previousLastModified || !Module._cache[resolvedPath]) {
        let lastModified = FS.statSync(resolvedPath).mtime.getTime();

        if (lastModified !== previousLastModified) {
          delete Module._cache[resolvedPath];
          lastModifiedTimestamps.set(resolvedPath, lastModified);
        }
      }
    }

    return originalRequire(path);
  };

  Object.assign(vioRequire, originalRequire);

  return vioRequire;
};
