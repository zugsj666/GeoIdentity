import translations from './translations.json';

const dictionaries: Record<string, Record<string, string>> = translations;
const nativeScript = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Thai}]/u;

export function selectLanguageText(value: string, lang: string): string {
  const pair = value.match(/^(.*?)\s*[（(]([^()（）]+)[）)]\s*$/);
  // Split bilingual aliases only; retain meaningful parentheses in single-language names.
  if (pair && nativeScript.test(pair[1]) && /[A-Za-z]/.test(pair[2]) && !nativeScript.test(pair[2])) {
    return (lang === 'en' ? pair[2] : pair[1]).trim();
  }
  if (pair && !nativeScript.test(pair[1]) && nativeScript.test(pair[2])) {
    return (lang === 'en' ? pair[1] : pair[2]).trim();
  }
  return value;
}

// Bundled translations of source vocabulary. No profile data leaves the browser.
// ponytail: vocabulary snapshot; extend the dictionary when bundled address datasets change.
export function translatedText(value: string, language: string): string {
  const lang = language === 'zh' ? 'zh-CN' : language === 'zh-HK' ? 'zh-TW' : language;
  const selected = selectLanguageText(value, lang);
  return dictionaries[lang]?.[selected] || selected;
}
