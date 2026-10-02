import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';

// Render the actual Vue components; no browser or additional test dependency needed.
globalThis.localStorage = { getItem: () => null };
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { default: Card } = await server.ssrLoadModule('/src/components/IdentityCard.vue');
  const { default: Controls } = await server.ssrLoadModule('/src/components/FilterControls.vue');
  const { default: Regions } = await server.ssrLoadModule('/src/components/RegionSelector.vue');
  const { generateIdentity } = await server.ssrLoadModule('/src/services/identityGenerator.ts');
  const { COUNTRIES, POPULAR_COUNTRY_CODES } = await server.ssrLoadModule('/src/data/countries.ts');
  const { useI18n } = await server.ssrLoadModule('/src/i18n/index.ts');
  for (const locale of ['zh', 'en']) {
    useI18n().locale.value = locale;
    for (const mode of ['landmark', 'derivation', 'residential', 'sourced']) {
      const filters = { gender: 'random', ageRange: 'random', addressMode: mode };
      const identity = generateIdentity('US', filters);
      const html = await renderToString(createSSRApp(Card, { identity, isFav: true }));
      assert.equal((html.match(/class="[^"]*\bcopy-row\b/g) || []).length, 13);
      assert.ok(html.includes(identity.basic.firstName));
      assert.ok(html.includes(identity.basic.lastName));
      assert.ok(html.includes(identity.address.city));
      assert.ok(html.includes(identity.address.stateFull || identity.address.state));
      assert.ok(html.indexOf('copy-row') < html.indexOf('<iframe'));
      assert.ok(html.indexOf(identity.contact.email) < html.indexOf('<iframe'));
      assert.ok(html.indexOf('<iframe') < html.indexOf(`>${identity.contact.username}<`));
      assert.ok(html.includes('aria-label=') && html.includes('type="button"'));
      const controls = await renderToString(createSSRApp(Controls, { filters, countryCode: 'US', selectedState: '' }));
      assert.equal((controls.match(/class="[^"]*\bmode-button\b/g) || []).length, 4);
      assert.equal((controls.match(/aria-pressed="true"/g) || []).length, 1);
      assert.ok(controls.indexOf('disabled:opacity-70') < controls.indexOf('<details'));
      assert.ok(!/<details[^>]*\bopen\b/.test(controls));
    }
  }
  const regions = await renderToString(createSSRApp(Regions, { selectedCountryCode: 'CA' }));
  const taxFree = await renderToString(createSSRApp(Controls, { filters: { gender: 'random', ageRange: 'random', isTaxFreeOnly: true }, countryCode: 'US', selectedState: '' }));
  assert.ok(taxFree.includes('value="DE"'));
  assert.ok(!taxFree.includes('value="CA"'));
  for (const country of COUNTRIES) {
    const present = regions.includes(`>${country.code}</span>`);
    assert.equal(present, !POPULAR_COUNTRY_CODES.includes(country.code), country.code);
  }
  console.log('Compact UI checks passed: 4 modes, 2 languages, copy fields, map/contact order and all regions.');
} finally {
  await server.close();
}
