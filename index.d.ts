export type Options = {
  electronPath?: string;
  hardResetMethod?: 'quit' | 'exit';
  argv?: string[];
  appDirectory?: string;
  watchRenderer?: boolean;
  ignored?: (string | RegExp)[];
  debug?: boolean;
};

declare function reload(moduleObject: NodeModule, options?: Options): void;

export default reload;
