import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { inspect } from 'util';


import findUp from 'find-up';
import chalk from 'chalk';
import dateTime from 'date-time';
import isDev from 'electron-is-dev';
import chokidar from 'chokidar';
import { app, BrowserWindow } from 'electron';

const getMainProcessPaths = (topModuleObject, cwd) => {
  const paths = new Set([topModuleObject.filename]);

  const getPaths = moduleObject => {
    for (const child of moduleObject.children) {
      if (path.relative(cwd, child.filename).includes('node_modules')) {
        continue;
      }

      paths.add(child.filename);
      getPaths(child);
    }
  };

  getPaths(topModuleObject);

  return paths;
}

/**
 *
 * @param moduleObject {NodeModule} - The required module object
 * @param options.electronPath {string?} - Electron binary path
 * @param options {Object?} - Options
 * @param options.hardResetMethod {'quit' | 'exit'?} - Gracefully exit or not
 * @param options.argv {string[]?} - Gracefully exit or not
 * @param options.appDirectory {string?} - App directory used for hard reset
 * @param options.watchRenderer {boolean?} - True if rendered process should be watched as well
 * @param options.ignored {(string | RegExp)[]?} - Ignored globs
 * @param options.debug {boolean?} - True to display debug logs
 */
const reload = (moduleObject, options = {}) => {
  /* This module should be a dev dependency, but this in case the user included it as a dependency. */
  if (!isDev) {
    return;
  }

  if (!moduleObject) {
    throw new Error('You have to pass the `module` object');
  }

  const formattedOptions = {
    watchRenderer: true,
    ...options,
  };
  const { electronPath, appDirectory } = formattedOptions;
  if (electronPath && !appDirectory) {
    throw new Error('You cannot hot reload your Electron binary without specifying your application directory.')
  }

  const mainProcessDirectory = path.dirname(moduleObject.filename);
  const packageDirectory = findUp.sync('package.json', { cwd: mainProcessDirectory });
  const cwd = packageDirectory ? path.dirname(packageDirectory) : mainProcessDirectory;
  const mainProcessPaths = getMainProcessPaths(moduleObject, cwd);
  const watchPaths = formattedOptions.watchRenderer ? cwd : [...mainProcessPaths];
  let isRelaunching = false;

  const watcher = chokidar.watch(watchPaths, {
    cwd,
    disableGlobbing: true,
    ignored: [
      /(^|[/\\])\../, // Dotfiles
      'node_modules',
      '**/*.map',
      ...(formattedOptions.ignored || []),
    ],
  });

  if (formattedOptions.debug) {
    watcher.on('ready', () => {
      console.log('Watched paths:', inspect(watcher.getWatched(), { compact: false, colors: true }));
    });
  }

  watcher.on('change', filePath => {
    if (formattedOptions.debug) {
      console.log('File changed:', chalk.bold(filePath), chalk.dim(`(${dateTime().split(' ')[1]})`));
    }

    if (mainProcessPaths.has(path.join(cwd, filePath))) {
      // Prevent multiple instances of Electron from being started due to the change
      // handler being called multiple times before the original instance exits.
      if (!isRelaunching) {
        if (electronPath && fs.existsSync(electronPath)) {
          const args = [...(formattedOptions.argv || []), formattedOptions.appDirectory];
          const child = spawn(electronPath, args, {
            detached: true,
            stdio: 'inherit'
          })
          child.unref()
        } else {
          app.relaunch();
        }
        app.exit(0);
      }

      isRelaunching = true;
    } else {
      BrowserWindow.getAllWindows().forEach(browserWindow => {
        browserWindow.webContents.reloadIgnoringCache();
      });
    }
  });
};

export default reload;
