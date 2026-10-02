<template>
  <aside class="min-w-0 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
    <h2 class="flex items-center gap-2 mb-3 text-base font-bold text-slate-700 dark:text-slate-200"><Globe2 class="w-5 h-5 text-primary-500" />{{ locale === 'zh' ? '更多地区' : 'More regions' }}</h2>
    <label class="relative block mb-2">
      <Search class="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400" />
      <input v-model="searchQuery" type="search" :aria-label="t('regions.searchPlaceholder')" :placeholder="locale === 'zh' ? '搜索地区' : 'Search'" class="app-input !pl-8 !text-sm" />
    </label>
    <select v-model="activeContinent" class="app-select w-full !text-sm mb-2" :aria-label="locale === 'zh' ? '地区分类' : 'Region categories'">
      <option v-for="category in categories" :key="category" :value="category">{{ category === 'tax_free' ? (locale === 'zh' ? '免税 / 低税' : 'Low tax') : t('continents.' + category) }}</option>
    </select>
    <nav class="region-grid" :aria-label="locale === 'zh' ? '其他地区' : 'Other regions'">
      <button v-for="country in filteredCountries" :key="country.code" type="button" @click="$emit('update:selectedCountryCode', country.code)" :aria-pressed="selectedCountryCode === country.code" class="country-tile" :class="selectedCountryCode === country.code ? 'bg-primary-50 dark:bg-primary-950/50 border-primary-500 text-primary-700 dark:text-primary-300 ring-1 ring-primary-500/30' : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-primary-400'">
        <span class="w-7 shrink-0 text-xs font-semibold text-slate-400">{{ country.code }}</span><span class="text-sm">{{ locale === 'zh' ? country.nameZh.replace('中国', '') : country.nameEn }}</span>
      </button>
      <p v-if="!filteredCountries.length" class="p-3 text-xs text-slate-400">{{ locale === 'zh' ? '未找到地区' : 'No regions found' }}</p>
    </nav>
  </aside>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { Globe2, Search } from 'lucide-vue-next';
import { COUNTRIES, POPULAR_COUNTRY_CODES } from '../data/countries';
import type { CountryCode, Continent } from '../types/identity';
import { useI18n } from '../i18n';
defineProps<{ selectedCountryCode: CountryCode }>();
defineEmits<{ (e: 'update:selectedCountryCode', code: CountryCode): void }>();
const { locale, t } = useI18n();
const searchQuery = ref('');
const activeContinent = ref<Continent>('all');
const categories: Continent[] = ['all', 'tax_free', 'north_america', 'europe', 'asia_pacific', 'southeast_asia'];
const filteredCountries = computed(() => COUNTRIES.filter(c => {
  const q = searchQuery.value.trim().toLowerCase();
  const matchesCategory = activeContinent.value === 'all' || (activeContinent.value === 'tax_free' ? c.isTaxFreeZone || c.popularStates.some(state => state.isTaxFree) : c.continent === activeContinent.value);
  return matchesCategory && (q ? [c.code, c.nameZh, c.nameEn, c.dialCode].some(v => v.toLowerCase().includes(q)) : !POPULAR_COUNTRY_CODES.some(code => code === c.code));
}));
</script>
<style scoped>
.region-grid { @apply flex gap-1 overflow-x-auto xl:flex-col xl:overflow-y-auto xl:overflow-x-hidden; }
.country-tile { @apply flex items-center gap-2 px-3 py-2 rounded-lg border border-transparent transition-colors text-left shrink-0; }
@media (min-width: 1280px) { .region-grid { max-height: calc(100svh - 240px); } }
</style>
