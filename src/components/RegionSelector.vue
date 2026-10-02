<template>
  <aside class="min-w-0 w-full px-1 py-2">
    <h2 class="flex items-center gap-2 mb-3 px-2 text-sm font-semibold text-slate-600 dark:text-slate-300"><Globe2 class="w-4 h-4 text-primary-500" />{{ locale === 'zh' ? '更多地区' : 'More regions' }}</h2>
    <label class="relative block mb-2">
      <Search class="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400" />
      <input v-model="searchQuery" type="search" :aria-label="t('regions.searchPlaceholder')" :placeholder="locale === 'zh' ? '搜索地区' : 'Search'" class="app-input !pl-8 !text-sm" />
    </label>
    <nav class="region-grid" :aria-label="locale === 'zh' ? '其他地区' : 'Other regions'">
      <section v-for="group in countryGroups" :key="group.continent" class="shrink-0 xl:shrink min-w-[140px]">
        <h3 class="px-2 pt-3 pb-1 text-xs font-medium text-slate-400">{{ t('continents.' + group.continent) }}</h3>
        <button v-for="country in group.countries" :key="country.code" type="button" @click="$emit('update:selectedCountryCode', country.code)" :aria-pressed="selectedCountryCode === country.code" class="country-tile" :class="selectedCountryCode === country.code ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-primary-600'">
          <span class="text-sm">{{ locale === 'zh' ? country.nameZh.replace('中国', '') : country.nameEn }}</span><span class="ml-auto text-[11px] text-slate-400">{{ country.code }}</span>
        </button>
      </section>
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
const categories: Continent[] = ['north_america', 'europe', 'asia_pacific', 'southeast_asia'];
const filteredCountries = computed(() => COUNTRIES.filter(c => {
  const q = searchQuery.value.trim().toLowerCase();
  return q ? [c.code, c.nameZh, c.nameEn, c.dialCode].some(v => v.toLowerCase().includes(q)) : !POPULAR_COUNTRY_CODES.some(code => code === c.code);
}));
const countryGroups = computed(() => categories.map(continent => ({ continent, countries: filteredCountries.value.filter(country => country.continent === continent) })).filter(group => group.countries.length));
</script>
<style scoped>
.region-grid { @apply flex gap-3 overflow-x-auto xl:block xl:overflow-y-auto xl:overflow-x-hidden; scrollbar-width: thin; }
.country-tile { @apply flex w-full items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-left; }
@media (min-width: 1280px) { .region-grid { max-height: calc(100svh - 170px); } }
</style>
