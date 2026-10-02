<template>
  <div class="min-h-screen flex flex-col selection:bg-primary-500 selection:text-white overflow-x-clip w-full max-w-full">
    <!-- Navbar -->
    <Navbar
      :favorite-count="favoritesList.length"
      :current-view="currentView"
      @toggle-view="currentView = $event"
      @open-batch="isBatchModalOpen = true"
      @open-history="isHistoryDrawerOpen = true"
      @open-disclaimer="openDisclaimer('all')"
    >
      <template v-for="country in popularCountries" :key="country.code">
        <button type="button" @click="selectPopularCountry(country.code)" class="region-nav" :class="{ active: currentView === 'generator' && selectedCountryCode === country.code && !(country.code === 'US' && filters.isTaxFreeOnly) }" :aria-pressed="currentView === 'generator' && selectedCountryCode === country.code && !(country.code === 'US' && filters.isTaxFreeOnly)">{{ locale === 'zh' ? country.nameZh.replace('中国', '') + '地址' : country.nameEn }}</button>
        <button v-if="country.code === 'US'" type="button" @click="selectPopularCountry('US', true)" class="region-nav" :class="{ active: currentView === 'generator' && selectedCountryCode === 'US' && filters.isTaxFreeOnly }" :aria-pressed="currentView === 'generator' && selectedCountryCode === 'US' && !!filters.isTaxFreeOnly">{{ locale === 'zh' ? '美国免税州' : 'US tax-free' }}</button>
      </template>
    </Navbar>

    <!-- Main Container -->
    <main class="flex-1 w-full mx-auto px-3 sm:px-6 py-3 space-y-5 sm:space-y-8 min-w-0">
      <!-- Address Radar Monitor View -->
      <AddressMonitorDashboard
        v-if="currentView === 'monitor'"
        @back-to-generator="currentView = 'generator'"
        @jump-to-country="handleJumpToCountry"
      />

      <div v-show="currentView === 'generator'" class="generator-layout">
        <RegionSelector class="region-sidebar" :selected-country-code="selectedCountryCode" @update:selected-country-code="handleCountryChange" />
        <div class="space-y-3 min-w-0">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button type="button" @click="selectGeneratorTab('standard')" class="generator-tab" :class="{ active: activeGeneratorTab === 'standard' }"><Compass class="w-3.5 h-3.5" />{{ locale === 'zh' ? '按地区生成' : 'By region' }}</button>
              <button type="button" @click="selectGeneratorTab('ip')" class="generator-tab" :class="{ active: activeGeneratorTab === 'ip' }"><Globe class="w-3.5 h-3.5" />{{ locale === 'zh' ? '按 IP 生成' : 'By IP' }}</button>
            </div>
            <button type="button" @click="isBatchModalOpen = true" class="text-sm font-medium text-primary-600 dark:text-primary-400 px-3 py-2">{{ t('nav.batch') }} ↗</button>
          </div>
          <FilterControls v-show="activeGeneratorTab === 'standard'" :filters="filters" :country-code="selectedCountryCode" :selected-state="selectedState" :is-generating="isGenerating" @update:filters="handleFiltersChange" @update:selected-state="handleStateChange" @generate="handleGenerate" />
          <p v-if="addressError" role="alert" class="text-sm text-amber-700 dark:text-amber-300">{{ addressError }}</p>
          <IpAddressCard v-if="activeGeneratorTab === 'ip'" @identity-generated="handleIpIdentityGenerated" @no-address="handleIpNoAddress" />
          <IdentityCard v-if="currentIdentity" :identity="currentIdentity" :is-fav="isCurrentFavorite" @copy-field="handleCopyFeedback" @toggle-favorite="handleToggleFav" @open-disclaimer="openDisclaimer('disclaimer')" />
        </div>
      </div>

      <footer class="max-w-5xl mx-auto py-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-400">
        <span>© GeoIdentity</span>
        <button type="button" @click="openDisclaimer('disclaimer')" class="hover:text-primary-600">{{ t('footer.disclaimer') }}</button>
        <a href="/privacy.html" class="hover:text-primary-600">{{ t('footer.privacyPolicy') }}</a>
        <a href="/methodology.html" class="hover:text-primary-600">{{ t('footer.methodology') }}</a>
        <a href="https://github.com/zugsj666/GeoIdentity" target="_blank" rel="noopener noreferrer" class="hover:text-primary-600">GitHub</a>
      </footer>
    </main>

    <!-- Batch Generation Modal -->
    <BatchModal
      :is-open="isBatchModalOpen"
      :country-code="selectedCountryCode"
      :country-name="currentCountryName"
      :filters="filters"
      :selected-state="selectedState"
      @close="isBatchModalOpen = false"
    />

    <!-- History & Favorites Slide Drawer -->
    <HistoryDrawer
      :is-open="isHistoryDrawerOpen"
      :history-list="historyList"
      :favorites-list="favoritesList"
      @close="isHistoryDrawerOpen = false"
      @select-identity="handleSelectIdentity"
      @clear-history="handleClearHistory"
    />

    <!-- Legal Disclaimer Modal -->
    <DisclaimerModal
      :is-open="isDisclaimerModalOpen"
      :initial-tab="disclaimerActiveTab"
      @close="closeDisclaimer"
    />

    <!-- Toast Component -->
    <Toast ref="toastRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { CountryCode, GeneratedIdentity, FilterOptions, AddressMode } from './types/identity';
import { COUNTRIES, POPULAR_COUNTRY_CODES } from './data/countries';
import { generateIdentity } from './services/identityGenerator';
import {
  getHistory,
  saveToHistory,
  clearHistory,
  getFavorites,
  toggleFavorite
} from './services/storageService';
import { useI18n } from './i18n';

import Navbar from './components/Navbar.vue';
import RegionSelector from './components/RegionSelector.vue';
import FilterControls from './components/FilterControls.vue';
import IdentityCard from './components/IdentityCard.vue';
import BatchModal from './components/BatchModal.vue';
import HistoryDrawer from './components/HistoryDrawer.vue';
import DisclaimerModal from './components/DisclaimerModal.vue';
import Toast from './components/Toast.vue';
import IpAddressCard from './components/IpAddressCard.vue';
import AddressMonitorDashboard from './components/AddressMonitor/AddressMonitorDashboard.vue';
import { Compass, Globe } from 'lucide-vue-next';

const { locale, t } = useI18n();

const popularCountries = POPULAR_COUNTRY_CODES.map(code => COUNTRIES.find(c => c.code === code)!);

const currentView = ref<'generator' | 'monitor'>('generator');
const activeGeneratorTab = ref<'standard' | 'ip'>('standard');
const selectedCountryCode = ref<CountryCode>('US');
const selectedState = ref<string>('');

const savedMode = localStorage.getItem('geo_address_mode') as AddressMode | null;
const filters = ref<FilterOptions>({
  gender: 'random',
  ageRange: 'random',
  addressMode: savedMode && ['sourced', 'landmark', 'derivation', 'residential'].includes(savedMode) ? savedMode : 'residential'
});

const currentIdentity = ref<GeneratedIdentity | null>(null);
const historyList = ref<GeneratedIdentity[]>([]);
const favoritesList = ref<GeneratedIdentity[]>([]);

const isBatchModalOpen = ref(false);
const isHistoryDrawerOpen = ref(false);
const isDisclaimerModalOpen = ref(false);
const disclaimerActiveTab = ref('all');
const isGenerating = ref(false);
const addressError = ref('');
const toastRef = ref<InstanceType<typeof Toast> | null>(null);

const currentCountryName = computed(() => {
  const c = COUNTRIES.find(item => item.code === selectedCountryCode.value);
  return c ? (locale.value === 'zh' ? c.nameZh : c.nameEn) : 'Global';
});

const isCurrentFavorite = computed(() => {
  return favoritesList.value.some(item => item.id === currentIdentity.value?.id);
});

function openDisclaimer(tab = 'all') {
  disclaimerActiveTab.value = tab;
  isDisclaimerModalOpen.value = true;
  if (tab === 'privacy') {
    window.location.hash = 'privacy';
  } else if (tab === 'terms') {
    window.location.hash = 'terms';
  } else if (tab === 'finance') {
    window.location.hash = 'finance';
  } else if (tab === 'disclaimer') {
    window.location.hash = 'disclaimer';
  }
}

function closeDisclaimer() {
  isDisclaimerModalOpen.value = false;
  const h = window.location.hash.toLowerCase();
  if (h === '#privacy' || h === '#terms' || h === '#disclaimer' || h === '#finance') {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

function handleHashChange() {
  const hash = window.location.hash.toLowerCase();
  if (hash === '#privacy') {
    disclaimerActiveTab.value = 'privacy';
    isDisclaimerModalOpen.value = true;
  } else if (hash === '#terms') {
    disclaimerActiveTab.value = 'terms';
    isDisclaimerModalOpen.value = true;
  } else if (hash === '#finance') {
    disclaimerActiveTab.value = 'finance';
    isDisclaimerModalOpen.value = true;
  } else if (hash === '#disclaimer') {
    disclaimerActiveTab.value = 'disclaimer';
    isDisclaimerModalOpen.value = true;
  }
}

function handleGenerate() {
  isGenerating.value = true;
  currentIdentity.value = null;
  addressError.value = '';
  if (filters.value.addressMode) {
    try {
      localStorage.setItem('geo_address_mode', filters.value.addressMode);
    } catch (error) {
      console.warn('Could not save address mode preference', error);
    }
  }
  try {
    const newId = generateIdentity(selectedCountryCode.value, {
      ...filters.value,
      state: selectedState.value || undefined
    });
    currentIdentity.value = newId;
    saveToHistory(newId);
    historyList.value = getHistory();
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    if (error.message.startsWith('No sourced address')) addressError.value = t('addressMode.noSourcedAddress');
    else if (error.message.startsWith('No matching address')) addressError.value = t('addressMode.noMatchingAddress');
    else throw error;
  } finally {
    isGenerating.value = false;
  }
}

function selectPopularCountry(code: CountryCode, taxFree = false) {
  currentView.value = 'generator';
  filters.value.isTaxFreeOnly = taxFree;
  handleCountryChange(code);
}

function handleCountryChange(code: CountryCode) {
  activeGeneratorTab.value = 'standard';
  if (code !== 'US') filters.value.isTaxFreeOnly = false;
  selectedCountryCode.value = code;
  selectedState.value = '';
  filters.value.state = undefined;
  handleGenerate();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleStateChange(state: string) {
  selectedState.value = state;
  filters.value.state = state || undefined;
  handleGenerate();
}

function handleFiltersChange(next: FilterOptions) {
  filters.value = next;
  const state = COUNTRIES.find(c => c.code === selectedCountryCode.value)?.popularStates.find(s => s.code === selectedState.value);
  if (next.isTaxFreeOnly && selectedState.value && !state?.isTaxFree) {
    selectedState.value = '';
    filters.value.state = undefined;
  }
}

function handleIpIdentityGenerated(identity: GeneratedIdentity) {
  if (activeGeneratorTab.value !== 'ip') return;
  currentIdentity.value = identity;
  selectedCountryCode.value = identity.countryCode;
  selectedState.value = identity.address.state;
  saveToHistory(identity);
  historyList.value = getHistory();
  if (toastRef.value) {
    toastRef.value.show(locale.value === 'zh' ? '已匹配地址样本（投递与 AVS 未核验）' : 'Matched an address sample (delivery and AVS unverified)');
  }
}

function handleIpNoAddress() {
  if (activeGeneratorTab.value === 'ip') currentIdentity.value = null;
}

function selectGeneratorTab(tab: 'standard' | 'ip') {
  if (activeGeneratorTab.value === tab) return;
  activeGeneratorTab.value = tab;
  currentIdentity.value = null;
  addressError.value = '';
  if (tab === 'standard') handleGenerate();
}

function handleJumpToCountry(code: CountryCode) {
  selectPopularCountry(code);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const countryName = COUNTRIES.find(c => c.code === code)?.nameZh || code;
  if (toastRef.value) {
    toastRef.value.show(t('monitor.jumpSuccess', { name: countryName }));
  }
}

function handleToggleFav(identity: GeneratedIdentity) {
  const isNowFav = toggleFavorite(identity);
  favoritesList.value = getFavorites();
  if (toastRef.value) {
    toastRef.value.show(isNowFav ? t('card.favorite') : t('card.unfavorite'));
  }
}

function handleSelectIdentity(identity: GeneratedIdentity) {
  activeGeneratorTab.value = 'standard';
  currentIdentity.value = identity;
  selectedCountryCode.value = identity.countryCode;
  selectedState.value = identity.address.state;
  filters.value = { ...filters.value, state: identity.address.state, addressMode: identity.address.addressMode || 'residential', isTaxFreeOnly: false };
  if (toastRef.value) {
    toastRef.value.show(t('history.apply'));
  }
}

function handleClearHistory() {
  clearHistory();
  historyList.value = [];
  if (toastRef.value) {
    toastRef.value.show(t('history.cleared'));
  }
}

function handleCopyFeedback(_text: string, label: string) {
  if (toastRef.value) {
    toastRef.value.show(label);
  }
}

onMounted(() => {
  historyList.value = getHistory();
  favoritesList.value = getFavorites();

  // URL Hash deep link check
  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();

  // Load first identity
  if (historyList.value.length > 0 && historyList.value[0].address.addressMode === filters.value.addressMode) {
    currentIdentity.value = historyList.value[0];
    selectedCountryCode.value = currentIdentity.value.countryCode;
    selectedState.value = currentIdentity.value.address.state;
  } else {
    handleGenerate();
  }
});

onUnmounted(() => {
  window.removeEventListener('hashchange', handleHashChange);
});
</script>

<style scoped>
.generator-layout { @apply w-full max-w-[960px] mx-auto space-y-4; }
@media (min-width: 1280px) {
  .generator-layout { @apply space-y-0; position: relative; width: min(960px, calc(100% - 568px)); }
  .region-sidebar { position: absolute; width: 260px; right: calc(100% + 24px); top: 0; }
}

.region-nav { @apply px-3 py-2 text-sm font-medium whitespace-nowrap rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors; }
.region-nav.active { @apply bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300; }
.generator-tab { @apply inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg text-slate-500 dark:text-slate-400; }
.generator-tab.active { @apply bg-white dark:bg-slate-700 text-primary-700 dark:text-primary-300 shadow-sm; }
</style>
