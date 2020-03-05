import fs from 'fs';
import { spawn } from 'child_process';
import { inspect } from 'util';

import chalk from 'chalk';
import dateTime from 'date-time';
import isDev from 'electron-is-dev';
import chokidar from 'chokidar';
import { app } from 'electron';

/**
 *
 * @param watchedPath {string} - The directory of watched files
 * @param appDirectory {string} - App directory used for hard reset
 * @param electronPath {string} - Electron binary path
 * @param options {Object?} - Options
 * @param options.argv {string[]?} - Gracefully exit or not
 * @param options.ignored {(string | RegExp)[]?} - Ignored globs
 * @param options.debug {boolean?} - True to display debug logs
 */
const reload = (watchedPath, appDirectory, electronPath, options = {}) => {
  /* This module should be a dev dependency, but this in case the user included it as a dependency. */
  if (!isDev) {
    return;
  }

  if (!watchedPath) {
    throw new Error('You have to pass the `watchedPath` string');
  }

  if (!electronPath || !appDirectory) {
    throw new Error('You cannot hot reload your Electron binary without specifying your application directory or binary.')
  }
  let isRelaunching = false;

  /* For the moment, this module will restart even if a change is made on the renderer process. That will change in the future */
  const watcher = chokidar.watch([watchedPath], {
    cwd: appDirectory,
    disableGlobbing: true,
    ignored: [
      /(^|[/\\])\../, // Dotfiles
      'node_modules',
      '**/*.map',
      ...(options.ignored || []),
    ],
  });

  if (options.debug) {
    watcher.on('ready', () => {
      console.log('Watched paths:', inspect(watcher.getWatched(), { compact: false, colors: true }));
    });
  }

  watcher.on('change', filePath => {
    if (options.debug) {
      console.log('File changed:', chalk.bold(filePath), chalk.dim(`(${dateTime().split(' ')[1]})`));
    }
    if (!isRelaunching) {
      if (electronPath && fs.existsSync(electronPath)) {
        const args = [...(options.argv || []), appDirectory];
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
  });
};

export default reload;
