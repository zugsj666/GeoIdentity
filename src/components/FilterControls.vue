<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <slot name="switcher" />
      <div v-if="showAddressControls" class="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
        <!-- Gender Filter -->
        <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            @click="updateGender('random')" :aria-pressed="filters.gender === 'random'" :aria-label="t('filter.genderAll')"
            :class="[
              'px-2.5 sm:px-3 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer',
              filters.gender === 'random'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            {{ locale === 'zh' ? '随机' : 'Any' }}
          </button>
          <button
            type="button"
            @click="updateGender('male')" :aria-pressed="filters.gender === 'male'" :aria-label="t('filter.genderMale')"
            :class="[
              'px-2.5 sm:px-3 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer',
              filters.gender === 'male'
                ? 'bg-blue-500 text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            {{ locale === 'zh' ? '男' : 'Male' }}
          </button>
          <button
            type="button"
            @click="updateGender('female')" :aria-pressed="filters.gender === 'female'" :aria-label="t('filter.genderFemale')"
            :class="[
              'px-2.5 sm:px-3 py-1.5 text-sm font-medium rounded-lg transition-all cursor-pointer',
              filters.gender === 'female'
                ? 'bg-rose-500 text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            ]"
          >
            {{ locale === 'zh' ? '女' : 'Female' }}
          </button>
        </div>

        <!-- Age Range Filter -->
        <div class="flex items-center gap-1.5">
          <label for="generator-age" class="sr-only">
            {{ t('filter.age') }}:
          </label>
          <select
            id="generator-age" :value="filters.ageRange"
            @change="updateAge(($event.target as HTMLSelectElement).value as any)"
            class="text-base sm:text-sm font-medium bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 sm:px-3 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer"
          >
            <option value="random">{{ t('filter.ageAll') }}</option>
            <option value="18-25">{{ t('filter.ageYouth') }}</option>
            <option value="26-35">{{ t('filter.ageAdult') }}</option>
            <option value="36-50">{{ t('filter.ageMiddle') }}</option>
            <option value="51-65">{{ t('filter.ageSenior') }}</option>
          </select>
        </div>

        <!-- Tax-Free Only Toggle -->
        <button
          type="button"
          @click="toggleTaxFreeOnly"
          :class="[
            'px-2.5 sm:px-3 py-1.5 text-sm font-semibold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer',
            filters.isTaxFreeOnly
              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-amber-600'
          ]"
        >
          <Zap class="w-3.5 h-3.5" :class="{ 'fill-white': filters.isTaxFreeOnly, 'fill-amber-500 text-amber-500': !filters.isTaxFreeOnly }" />
          <span>{{ locale === 'zh' ? '仅免税地址' : 'Tax-free only' }}</span>
        </button>
      </div>
      <slot name="actions" />
    </div>
  <section v-if="showAddressControls" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
    <div class="flex flex-wrap items-center gap-2">
      <div class="flex items-center gap-2 text-base font-bold"><span>{{ currentCountry.flag }}</span>{{ locale === 'zh' ? currentCountry.nameZh : currentCountry.nameEn }}</div>
      <select :value="selectedState" @change="$emit('update:selectedState', ($event.target as HTMLSelectElement).value)" class="app-select !h-12 !text-sm flex-1 min-w-0 sm:max-w-[280px] sm:ml-auto" :aria-label="t('regions.customState')">
        <option value="">{{ t('regions.selectState') }}</option>
        <option v-for="state in availableStates" :key="state.code" :value="state.code">{{ locale === 'zh' ? state.nameZh : state.nameEn }} ({{ state.code }})</option>
      </select>
        <button
          type="button"
          @click="$emit('generate')"
          :disabled="isGenerating"
          class="w-auto inline-flex items-center justify-center gap-2 min-w-[156px] h-12 px-6 py-3 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-primary-600 via-teal-500 to-emerald-500 hover:from-primary-700 hover:to-emerald-600 shadow-md shadow-primary-500/20 active:scale-95 transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          <Sparkles class="w-5 h-5" :class="{ 'animate-spin': isGenerating }" />
          <span>{{ isGenerating ? t('filter.generating') : (locale === 'zh' ? '生成新资料' : 'Generate') }}</span>
        </button>

    </div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2" :aria-label="t('addressMode.title')">
      <button v-for="mode in modes" :key="mode.id" type="button" @click="updateMode(mode.id)" :aria-pressed="currentMode === mode.id" :title="t('addressMode.' + mode.desc)" class="mode-button" :data-color="mode.color" :class="{ active: currentMode === mode.id }"><component :is="mode.icon" class="w-4 h-4 shrink-0" /><span>{{ t('addressMode.' + mode.label) }}</span></button>
    </div>

  </section>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { Sparkles, MapPin, Zap, Building2, Route, Home } from 'lucide-vue-next';
import type { FilterOptions, AddressMode, CountryCode } from '../types/identity';
import { COUNTRIES } from '../data/countries';
import { useI18n } from '../i18n';

const props = withDefaults(defineProps<{
  filters: FilterOptions;
  countryCode: CountryCode;
  selectedState: string;
  isGenerating?: boolean;
  showAddressControls?: boolean;
}>(), { showAddressControls: true });

const emit = defineEmits<{
  (e: 'update:filters', filters: FilterOptions): void;
  (e: 'generate'): void;
  (e: 'update:selectedState', state: string): void;
}>();

const { locale, t } = useI18n();

const currentCountry = computed(() => COUNTRIES.find(c => c.code === props.countryCode)!);
const availableStates = computed(() => currentCountry.value.popularStates.filter(state => !props.filters.isTaxFreeOnly || state.isTaxFree));
const modes = [
  { id: 'landmark', icon: Building2, label: 'landmarkShort', desc: 'landmarkDesc', color: 'blue' },
  { id: 'derivation', icon: Route, label: 'derivationShort', desc: 'derivationDesc', color: 'emerald' },
  { id: 'residential', icon: Home, label: 'residentialShort', desc: 'residentialDesc', color: 'purple' },
  { id: 'sourced', icon: MapPin, label: 'sourcedShort', desc: 'sourcedDesc', color: 'amber' }
] as const;

const currentMode = computed<AddressMode>(() => props.filters.addressMode || 'residential');

function updateMode(mode: AddressMode) {
  emit('update:filters', { ...props.filters, addressMode: mode });
  emit('generate');
}

function updateGender(gender: FilterOptions['gender']) {
  emit('update:filters', { ...props.filters, gender });
  emit('generate');
}

function updateAge(ageRange: FilterOptions['ageRange']) {
  emit('update:filters', { ...props.filters, ageRange });
  emit('generate');
}

function toggleTaxFreeOnly() {
  emit('update:filters', { ...props.filters, isTaxFreeOnly: !props.filters.isTaxFreeOnly });
  emit('generate');
}
</script>

<style scoped>
.mode-button { @apply inline-flex items-center justify-center gap-1.5 px-2 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 transition-colors; }
.mode-button[data-color="blue"].active { @apply border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300; }
.mode-button[data-color="emerald"].active { @apply border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300; }
.mode-button[data-color="purple"].active { @apply border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300; }
.mode-button[data-color="amber"].active { @apply border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300; }
</style>
