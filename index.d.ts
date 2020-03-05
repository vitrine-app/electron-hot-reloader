export type Options = {
  argv?: string[];
  ignored?: (string | RegExp)[];
  debug?: boolean;
};

declare function reload(watchedPath: string, appDirectory: string, electronPath: string, options?: Options): void;

export default reload;
