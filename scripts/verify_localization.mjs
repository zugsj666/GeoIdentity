import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const load = path => server.ssrLoadModule(`/src/${path}`);
  const { ADDRESS_MAP, OSM_APARTMENTS } = await load('data/addresses/index.ts');
  const { RESIDENTIAL_ADDRESSES } = await load('data/addresses/schemes/residentialAddresses.ts');
  const { STREET_DERIVATION_RULES, deriveStreetAddress } = await load('data/addresses/schemes/derivationRules.ts');
  const { NAMES_BY_COUNTRY, getNameParts } = await load('data/names/index.ts');
  const { generateIdentityFromAddress } = await load('services/identityGenerator.ts');
  const { presentIdentity } = await load('services/identityPresentation.ts');
  const { selectLanguageText } = await load('data/translatedText.ts');
  const { formatFullIdentityText } = await load('services/exportService.ts');
  const { formatForwarderShippingText } = await load('data/cardLabels.ts');
  const nonLatin = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Thai}]/u;
  const chineseNumber = value => {
    const digit = c => '零一二三四五六七八九'.indexOf(c);
    if (!value.includes('十')) return [...value].map(digit).join('');
    const [tens, ones] = value.split('十');
    return String((tens ? digit(tens) : 1) * 10 + (ones ? digit(ones) : 0));
  };
  const addresses = [...Object.values(ADDRESS_MAP).flat(), ...RESIDENTIAL_ADDRESSES, ...OSM_APARTMENTS, ...STREET_DERIVATION_RULES.map(deriveStreetAddress)];
  for (const address of addresses) {
    const identity = generateIdentityFromAddress(address);
    const original = JSON.stringify(identity);
    for (const lang of ['zh', 'en', 'local']) {
      const shown = presentIdentity(identity, lang);
      const label = `${address.countryCode} ${lang} ${address.street}`;
      for (const key of ['street', 'city', 'stateFull']) {
        const value = shown.address[key] || '';
        assert.ok(value, `${label}: ${key} is empty`);
        if (lang === 'en') assert.ok(!nonLatin.test(value), `${label}: ${value}`);
        if (lang === 'zh') assert.ok(!/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Thai}]/u.test(value), `${label}: ${value}`);
        if (lang === 'zh' || (lang === 'local' && ['JP', 'KR', 'HK', 'TW', 'TH'].includes(address.countryCode))) {
          assert.ok(!/[A-Za-z]{3}/.test(value), `${label}: untranslated ${value}`);
        }
      }
      const sourceNumbers = selectLanguageText(identity.address.street, lang).match(/\d+/g) || [];
      const translatedNumbers = (shown.address.street.replace(/[零一二三四五六七八九十]+/g, chineseNumber).match(/\d+/g) || []).map(Number);
      for (const number of sourceNumbers) assert.ok(translatedNumbers.includes(Number(number)), `${label}: lost number ${number}`);
      assert.equal(shown.address.postcode, identity.address.postcode);
      assert.equal(shown.address.lat, identity.address.lat);
      assert.equal(shown.address.lng, identity.address.lng);
      assert.deepEqual(shown.contact, identity.contact);
      assert.equal(shown.basic.birthDate, identity.basic.birthDate);
      const shipping = formatForwarderShippingText(identity, lang);
      const all = formatFullIdentityText(identity, lang);
      for (const value of [shown.address.addressLine1, shown.address.city, shown.address.stateFull]) {
        assert.ok(shipping.includes(value) && all.includes(value), `${label}: copy differs from display`);
      }
      if (lang === 'en') assert.ok(!nonLatin.test(all), `${label}: native text in English export`);
      assert.equal(JSON.stringify(identity), original, `${label}: stored profile mutated`);
    }
  }
  for (const [code, data] of Object.entries(NAMES_BY_COUNTRY)) {
    for (const gender of ['male', 'female']) {
      const firstNames = data.localData?.[gender].map(n => n.romaji) || data[`${gender}FirstNames`];
      const lastNames = data.localData?.last.map(n => n.romaji) || data.lastNames;
      for (const firstName of firstNames) for (const lastName of lastNames) {
        const basic = { gender, firstName, lastName, fullName: `${firstName} ${lastName}` };
        const chinese = getNameParts(code, basic, 'zh');
        assert.ok(!/[A-Za-z\p{Script=Hangul}\p{Script=Thai}]/u.test(chinese.fullName), `${code}: ${chinese.fullName}`);
        assert.equal(getNameParts(code, basic, 'en').fullName, basic.fullName);
        if (['JP', 'KR', 'HK', 'TW', 'TH'].includes(code)) {
          const native = getNameParts(code, basic, 'local');
          assert.ok(nonLatin.test(native.firstName) && nonLatin.test(native.lastName), `${code}: ${native.fullName}`);
        }
      }
    }
  }
  assert.equal(selectLanguageText('中西区 (Central and Western)', 'en'), 'Central and Western');
  assert.equal(selectLanguageText('HSBC Hong Kong (匯豐銀行)', 'en'), 'HSBC Hong Kong');
  assert.equal(selectLanguageText('MIT (US)', 'en'), 'MIT (US)');
  console.log(`Localization checks passed: ${Object.keys(ADDRESS_MAP).length} regions, ${addresses.length} addresses/rules, 3 languages, all name combinations, copy consistency and number preservation.`);
} finally {
  await server.close();
}
