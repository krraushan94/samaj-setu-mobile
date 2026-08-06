import { TRANSLATIONS } from '../src/i18n';

// Guards against the exact kind of gap that caused visible truncation/missing
// text in one language while another looked fine: every key that exists in
// English must exist (non-empty) in Hindi and Bengali too, and vice versa.
describe('i18n key parity across en/hi/bn', () => {
  const languages = Object.keys(TRANSLATIONS);

  const collectKeys = (obj, prefix = '') =>
    Object.entries(obj).flatMap(([k, v]) => {
      const path = prefix ? `${prefix}.${k}` : k;
      return typeof v === 'object' && v !== null ? collectKeys(v, path) : [path];
    });

  const keysByLang = Object.fromEntries(languages.map((l) => [l, new Set(collectKeys(TRANSLATIONS[l]))]));

  it('has the same set of namespaces in every language', () => {
    const namespacesByLang = languages.map((l) => Object.keys(TRANSLATIONS[l]).sort().join(','));
    namespacesByLang.forEach((ns) => expect(ns).toBe(namespacesByLang[0]));
  });

  languages.forEach((lang) => {
    languages.filter((l) => l !== lang).forEach((other) => {
      it(`every key present in "${lang}" also exists in "${other}"`, () => {
        const missing = [...keysByLang[lang]].filter((k) => !keysByLang[other].has(k));
        expect(missing).toEqual([]);
      });
    });
  });

  languages.forEach((lang) => {
    it(`no empty/blank string values in "${lang}"`, () => {
      const empties = [];
      const walk = (obj, prefix = '') =>
        Object.entries(obj).forEach(([k, v]) => {
          const path = prefix ? `${prefix}.${k}` : k;
          if (typeof v === 'object' && v !== null) walk(v, path);
          else if (typeof v === 'string' && v.trim() === '') empties.push(path);
        });
      walk(TRANSLATIONS[lang]);
      expect(empties).toEqual([]);
    });
  });
});
