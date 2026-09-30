import aliasData from '../data/aliases_raw.json';

export const findLanguage = (language: string): boolean => {
  const search = language.toLowerCase();
  return aliasData.aliases.some((alias: string) => alias === search);
};
