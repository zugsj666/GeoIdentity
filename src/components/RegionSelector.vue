<template>
  <aside class="min-w-0 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 lg:sticky lg:top-20">
    <h2 class="flex items-center gap-2 px-1 mb-3 text-xs font-bold text-slate-500 dark:text-slate-400"><Globe2 class="w-4 h-4 text-primary-500" />{{ locale === 'zh' ? '更多地区' : 'More regions' }}</h2>
    <label class="relative block mb-2">
      <Search class="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400" />
      <input v-model="searchQuery" type="search" :aria-label="t('regions.searchPlaceholder')" :placeholder="locale === 'zh' ? '搜索地区' : 'Search'" class="app-input !pl-8 !text-xs" />
    </label>
    <nav class="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible scrollbar-none" :aria-label="locale === 'zh' ? '其他地区' : 'Other regions'">
      <button v-for="country in filteredCountries" :key="country.code" type="button" @click="$emit('update:selectedCountryCode', country.code)" :aria-pressed="selectedCountryCode === country.code" class="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-left whitespace-nowrap transition-colors" :class="selectedCountryCode === country.code ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'">
        <span>{{ country.flag }}</span><span>{{ locale === 'zh' ? country.nameZh : country.nameEn }}</span><span class="hidden lg:block ml-auto text-[10px] text-slate-400">{{ country.code }}</span>
      </button>
      <p v-if="!filteredCountries.length" class="p-3 text-xs text-slate-400">{{ locale === 'zh' ? '未找到地区' : 'No regions found' }}</p>
    </nav>
  </aside>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { Globe2, Search } from 'lucide-vue-next';
import { COUNTRIES, POPULAR_COUNTRY_CODES } from '../data/countries';
import type { CountryCode } from '../types/identity';
import { useI18n } from '../i18n';
defineProps<{ selectedCountryCode: CountryCode }>();
defineEmits<{ (e: 'update:selectedCountryCode', code: CountryCode): void }>();
const { locale, t } = useI18n();
const searchQuery = ref('');
const filteredCountries = computed(() => COUNTRIES.filter(c => {
  const q = searchQuery.value.trim().toLowerCase();
  return q ? [c.code, c.nameZh, c.nameEn, c.dialCode].some(v => v.toLowerCase().includes(q)) : !POPULAR_COUNTRY_CODES.some(code => code === c.code);
}));
</script>
