export interface RuntimeHandle {
  pid: number;
  baseUrl: string;
  apiBaseUrl: string;
  ownedProcess: true;
  shutdownVerified: boolean;
  close: () => Promise<void>;
}

export function startSyntheticRuntime(options?: { host?: string; port?: number }): Promise<RuntimeHandle>;
