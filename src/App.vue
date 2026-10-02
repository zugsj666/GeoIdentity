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
    <main class="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-5 sm:space-y-8 min-w-0">
      <!-- Address Radar Monitor View -->
      <AddressMonitorDashboard
        v-if="currentView === 'monitor'"
        @back-to-generator="currentView = 'generator'"
        @jump-to-country="handleJumpToCountry"
      />

      <div v-show="currentView === 'generator'" class="grid grid-cols-1 lg:grid-cols-[180px_minmax(0,1fr)] gap-5 items-start">
        <RegionSelector :selected-country-code="selectedCountryCode" @update:selected-country-code="handleCountryChange" />
        <div class="space-y-3 min-w-0">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button type="button" @click="selectGeneratorTab('standard')" class="generator-tab" :class="{ active: activeGeneratorTab === 'standard' }"><Compass class="w-3.5 h-3.5" />{{ locale === 'zh' ? '按地区生成' : 'By region' }}</button>
              <button type="button" @click="selectGeneratorTab('ip')" class="generator-tab" :class="{ active: activeGeneratorTab === 'ip' }"><Globe class="w-3.5 h-3.5" />{{ locale === 'zh' ? '按 IP 生成' : 'By IP' }}</button>
            </div>
            <button type="button" @click="isBatchModalOpen = true" class="text-xs font-medium text-primary-600 dark:text-primary-400 px-3 py-2">{{ t('nav.batch') }} ↗</button>
          </div>
          <FilterControls v-show="activeGeneratorTab === 'standard'" :filters="filters" :country-code="selectedCountryCode" :selected-state="selectedState" :is-generating="isGenerating" @update:filters="handleFiltersChange" @update:selected-state="handleStateChange" @generate="handleGenerate" />
          <p v-if="addressError" role="alert" class="text-sm text-amber-700 dark:text-amber-300">{{ addressError }}</p>
          <IpAddressCard v-if="activeGeneratorTab === 'ip'" @identity-generated="handleIpIdentityGenerated" @no-address="handleIpNoAddress" />
          <IdentityCard v-if="currentIdentity" :identity="currentIdentity" :is-fav="isCurrentFavorite" @copy-field="handleCopyFeedback" @toggle-favorite="handleToggleFav" @open-disclaimer="openDisclaimer('disclaimer')" />
        </div>
      </div>

      <section aria-labelledby="data-method-heading" class="pt-8 border-t border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed">
        <div class="max-w-4xl space-y-4">
          <h2 id="data-method-heading" class="text-lg font-semibold text-slate-900 dark:text-white">{{ locale === 'zh' ? '这些地址样本能证明什么？' : 'What do these address samples establish?' }}</h2>
          <p v-if="locale === 'zh'">GeoIdentity 有三类不同的地址数据：带 OpenStreetMap 对象链接的建筑门牌、仓库内置的多地区住宅及公寓样本，以及按街道区间计算的插值门牌。只有第一类可以直接查看对应的 OSM 建筑对象；地图上的建筑门牌不等于有效房号、住户身份、可投递地址或账单地址验证（AVS）。插值门牌甚至不代表该号码存在建筑。</p>
          <p v-else>GeoIdentity includes three distinct types of address data: building addresses with OpenStreetMap object links, bundled residential and apartment samples, and interpolated street numbers. Only the first type links to an OSM building object. A mapped building does not establish a valid unit, resident, delivery address, or address verification (AVS). An interpolated number does not even establish that a building exists.</p>
          <p v-if="locale === 'zh'">例如，公开的 <a class="underline text-teal-700 dark:text-teal-300" href="https://www.openstreetmap.org/way/104186213" target="_blank" rel="noopener noreferrer">Portland 公寓建筑 OSM 对象</a>包含建筑类型和门牌标签，适合核对表单的街道、城市、州和邮编格式；不能拿它验证某个人是否居住在该处。地址快照按日尝试从 OSM 更新，网页显示的是最近一次成功部署的数据，并非实时地图查询。</p>
          <p v-else>For example, the public <a class="underline text-teal-700 dark:text-teal-300" href="https://www.openstreetmap.org/way/104186213" target="_blank" rel="noopener noreferrer">Portland apartment building object</a> lists a building type and address tags suitable for checking form layouts. It says nothing about who lives there. The OSM snapshot is refreshed when the scheduled import succeeds and a new release is deployed; the site is not a live map query.</p>
          <p><a class="underline font-medium text-teal-700 dark:text-teal-300" href="/methodology.html">{{ locale === 'zh' ? '阅读数据来源、筛选条件与测试示例' : 'Read about sources, filters and test cases' }}</a> <span aria-hidden="true">·</span> <a class="underline font-medium text-teal-700 dark:text-teal-300" href="/privacy.html">{{ locale === 'zh' ? '隐私与第三方服务说明' : 'Privacy and third-party services' }}</a></p>
        </div>
      </section>

      <!-- Comprehensive Legal Disclaimer & Policy Footer -->
      <footer class="pt-8 pb-16 space-y-6 border-t border-slate-200/80 dark:border-slate-800/80">
        <!-- Prominent Legal Callout Card -->
        <div class="p-4 sm:p-7 rounded-3xl bg-slate-100/90 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800/80">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <ShieldAlert class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span>{{ t('footer.disclaimerBadge') }}</span>
                  <span class="px-2 py-0.5 text-[10px] font-semibold rounded-full shrink-0 whitespace-nowrap bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {{ t('card.complianceSafetyBadge') }}
                  </span>
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {{ t('footer.disclaimerSubtitle') }}
                </p>
              </div>
            </div>

            <button
              type="button"
              @click="openDisclaimer('all')"
              class="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-primary-600 dark:hover:bg-primary-500 text-white shadow-sm transition-all cursor-pointer whitespace-nowrap self-start md:self-auto"
            >
              <Scale class="w-4 h-4" />
              <span>{{ t('footer.viewFullBtn') }}</span>
            </button>
          </div>

          <!-- Data use and limitations -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
            <!-- 1. Synthetic Data -->
            <div
              @click="openDisclaimer('disclaimer')"
              class="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between cursor-pointer hover:border-blue-400 transition-all"
            >
              <div>
                <div class="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 mb-1.5">
                  <FileText class="w-4 h-4" />
                  <span>{{ t('footer.syntheticTitle') }}</span>
                </div>
                <p class="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {{ t('footer.syntheticDesc') }}
                </p>
              </div>
            </div>

            <!-- 2. Illegal Use Forbidden -->
            <div
              @click="openDisclaimer('terms')"
              class="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between cursor-pointer hover:border-rose-400 transition-all"
            >
              <div>
                <div class="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 mb-1.5">
                  <AlertTriangle class="w-4 h-4" />
                  <span>{{ t('footer.illegalTitle') }}</span>
                </div>
                <p class="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {{ t('footer.illegalDesc') }}
                </p>
              </div>
            </div>

            <!-- 3. Financial Test Cards -->
            <div
              @click="openDisclaimer('finance')"
              class="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between cursor-pointer hover:border-amber-400 transition-all"
            >
              <div>
                <div class="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 mb-1.5">
                  <CreditCard class="w-4 h-4" />
                  <span>{{ t('footer.financeTitle') }}</span>
                </div>
                <p class="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {{ t('footer.financeDesc') }}
                </p>
              </div>
            </div>

            <!-- 4. Client-side Privacy & Ads -->
            <a
              href="/privacy.html"
              class="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between cursor-pointer hover:border-emerald-400 transition-all"
            >
              <div>
                <div class="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1.5">
                  <ShieldCheck class="w-4 h-4" />
                  <span>{{ t('footer.privacyTitle') }}</span>
                </div>
                <p class="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {{ t('footer.privacyDesc') }}
                </p>
              </div>
            </a>
          </div>
        </div>

        <!-- Footnote & Distinct Legal Anchors -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 dark:text-slate-500 px-1">
          <div class="flex items-center gap-2">
            <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{{ t('footer.cloudflareNotice') }}</span>
          </div>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 justify-center sm:justify-end">
            <a
              href="#disclaimer"
              @click.prevent="openDisclaimer('disclaimer')"
              class="hover:text-primary-600 dark:hover:text-primary-400 underline underline-offset-4 transition-colors cursor-pointer"
            >
              {{ t('footer.disclaimer') }}
            </a>
            <span>•</span>
            <a
              href="#terms"
              @click.prevent="openDisclaimer('terms')"
              class="hover:text-primary-600 dark:hover:text-primary-400 underline underline-offset-4 transition-colors cursor-pointer"
            >
              {{ t('footer.termsOfService') }}
            </a>
            <span>•</span>
            <a
              href="/privacy.html"
              class="hover:text-primary-600 dark:hover:text-primary-400 underline underline-offset-4 transition-colors cursor-pointer font-medium text-slate-600 dark:text-slate-300"
            >
              {{ t('footer.privacyPolicy') }}
            </a>
            <span>•</span>
            <a
              href="/methodology.html"
              class="hover:text-primary-600 dark:hover:text-primary-400 underline underline-offset-4 transition-colors cursor-pointer font-medium text-slate-600 dark:text-slate-300"
            >
              {{ t('footer.methodology') }}
            </a>
            <span>•</span>
            <a
              href="https://github.com/AiLi1337/GeoIdentity"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-primary-600 dark:hover:text-primary-400 underline underline-offset-4 transition-colors cursor-pointer font-medium"
            >
              GitHub 源码
            </a>
            <span>•</span>
            <span>{{ t('footer.copyright') }}</span>
          </div>
        </div>
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
import {
  ShieldAlert,
  Scale,
  FileText,
  AlertTriangle,
  CreditCard,
  ShieldCheck,
  Compass,
  Globe
} from 'lucide-vue-next';

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
.region-nav { @apply px-3 py-2 text-xs font-medium whitespace-nowrap rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors; }
.region-nav.active { @apply bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300; }
.generator-tab { @apply inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-500 dark:text-slate-400; }
.generator-tab.active { @apply bg-white dark:bg-slate-700 text-primary-700 dark:text-primary-300 shadow-sm; }
</style>
