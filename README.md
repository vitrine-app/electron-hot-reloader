# Vitrine electron-hot-reloader

> Simple auto-reloading for Electron apps during development using webpack

It *just works*. When files used in the main process are changed, the app is restarted, and when files used in the browser window are changed, the page is reloaded.

Note that it will only work if you bundle your codebase in a single file using webpack or another bundler.

## Install

```
$ npm install --save-dev electron-reloader
```

*Requires Electron 5 or later.*

## Usage

The following must be included in the app entry file, usually named `index.js`:

```js
try {
	require('@vitrine/electron-hot-reloader')(module);
} catch (_) {}
```

You have to pass the `module` object so we can read the module graph and figure out which files belong to the main process.

The `try/catch` is needed so it doesn't throw `Cannot find module '@vitrine/electron-hot-reloader'` in production.

## API

### reloader(watchedPath, appDirectory, electronPath, options?)

#### watchedPath

Type: `string`

The path of files that are watched for reloading.

#### appDirectory

Type: `string`

The directory where your `package.json` is.

#### electronPath

Type: `string`

The path of the Electron binary used to spawn child processes.

#### options

Type: `object`

##### debug

Type: `boolean`\
Default: `false`

Prints watched paths and when files change. Can be useful to make sure you set it up correctly.

##### ignore

Type: `Array<string | RegExp>`

Ignore patterns passed to [`chokidar`](https://github.com/paulmillr/chokidar#path-filtering). By default, files/directories starting with a `.`, `.map` files, and `node_modules` directories are ignored. This option is additive to those.

##### argv

Type: `Array<string>`

Args passed to Electron child process when spawned.
