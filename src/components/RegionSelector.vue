<template>
  <aside class="min-w-0 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
    <h2 class="flex items-center gap-2 mb-3 text-base font-bold text-slate-700 dark:text-slate-200"><Globe2 class="w-5 h-5 text-primary-500" />{{ locale === 'zh' ? '更多地区' : 'More regions' }}</h2>
    <label class="relative block mb-2">
      <Search class="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400" />
      <input v-model="searchQuery" type="search" :aria-label="t('regions.searchPlaceholder')" :placeholder="locale === 'zh' ? '搜索地区' : 'Search'" class="app-input !pl-8 !text-sm" />
    </label>
    <div class="flex xl:grid xl:grid-cols-2 gap-1.5 overflow-x-auto scrollbar-none mb-3" :aria-label="locale === 'zh' ? '地区分类' : 'Region categories'">
      <button v-for="category in categories" :key="category" type="button" @click="activeContinent = category" class="px-2 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors" :class="activeContinent === category ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'" :aria-pressed="activeContinent === category">{{ category === 'tax_free' ? (locale === 'zh' ? '免税 / 低税' : 'Low tax') : t('continents.' + category) }}</button>
    </div>
    <nav class="region-grid" :aria-label="locale === 'zh' ? '其他地区' : 'Other regions'">
      <button v-for="country in filteredCountries" :key="country.code" type="button" @click="$emit('update:selectedCountryCode', country.code)" :aria-pressed="selectedCountryCode === country.code" class="country-tile" :class="selectedCountryCode === country.code ? 'bg-primary-50 dark:bg-primary-950/50 border-primary-500 text-primary-700 dark:text-primary-300 ring-1 ring-primary-500/30' : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-primary-400'">
        <span class="text-lg font-semibold">{{ country.code }}</span><span class="text-sm leading-tight">{{ locale === 'zh' ? country.nameZh.replace('中国', '') : country.nameEn }}</span><span class="text-xs text-slate-400">{{ country.dialCode }}</span>
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
.region-grid { @apply flex gap-2 overflow-x-auto xl:grid xl:grid-cols-2 xl:overflow-y-auto xl:overflow-x-hidden; }
.country-tile { @apply flex flex-col items-center justify-center gap-1 px-2 py-2.5 min-w-[100px] xl:min-w-0 rounded-xl border transition-colors text-center; }
@media (min-width: 1280px) { .region-grid { max-height: calc(100svh - 310px); } }
</style>
