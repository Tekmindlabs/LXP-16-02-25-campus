import { BaseConfiguration, UnifiedActivity } from '@/types/class-activity';

export const activityCache = {
  templates: new Map<string, UnifiedActivity>(),
  commonConfigs: new Map<string, BaseConfiguration>(),

  async getOrFetch<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    if (this.templates.has(key)) {
      return this.templates.get(key) as T;
    }

    const data = await fetchFn();
    this.templates.set(key, data as UnifiedActivity);
    return data;
  },

  invalidate(key: string) {
    this.templates.delete(key);
    this.commonConfigs.delete(key);
  }
};
