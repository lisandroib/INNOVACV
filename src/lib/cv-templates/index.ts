import { CVTemplate } from './types';
import { harvardTemplate } from './harvard';

export const templates: Record<string, CVTemplate> = {
  [harvardTemplate.id]: harvardTemplate,
};

export const getTemplateById = (id: string): CVTemplate => {
  return templates[id] || harvardTemplate;
};

export const getAllTemplates = (): CVTemplate[] => {
  return Object.values(templates);
};
