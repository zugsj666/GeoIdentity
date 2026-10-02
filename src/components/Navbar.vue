<template>
  <header class="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800" style="padding-top: env(safe-area-inset-top, 0px)">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
      <a href="/" class="flex items-center gap-2.5 shrink-0" aria-label="GeoIdentity">
        <span class="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-primary-500/20"><MapPin class="w-5 h-5" /></span>
        <span class="font-bold tracking-tight bg-gradient-to-r from-slate-900 via-primary-800 to-primary-600 dark:from-white dark:to-primary-400 bg-clip-text text-transparent">GeoIdentity</span>
      </a>
      <nav class="hidden lg:flex items-center gap-1" :aria-label="locale === 'zh' ? '常用地区' : 'Popular regions'"><slot /></nav>
      <div class="flex items-center gap-1.5">
        <button type="button" @click="$emit('open-history')" class="nav-action" :aria-label="t('nav.history')" :title="t('nav.history')"><Bookmark class="w-4 h-4" /><span class="hidden sm:inline">{{ locale === 'zh' ? '历史 / 收藏' : 'Saved' }}</span><span v-if="favoriteCount" class="text-primary-600 dark:text-primary-400">{{ favoriteCount }}</span></button>
        <button type="button" @click="toggleLang" class="nav-action" :aria-label="locale === 'zh' ? 'Switch to English' : '切换中文'"><Languages class="w-4 h-4" /><span class="hidden sm:inline">{{ locale === 'zh' ? 'EN' : '中' }}</span></button>
        <button type="button" @click="toggleTheme" class="nav-action" :aria-label="isDark ? t('nav.themeLight') : t('nav.themeDark')"><Sun v-if="isDark" class="w-4 h-4 text-amber-400" /><Moon v-else class="w-4 h-4" /></button>
        <div class="relative" ref="mobileMenuRef">
          <button type="button" @click="isMobileMenuOpen = !isMobileMenuOpen" class="nav-action" :aria-expanded="isMobileMenuOpen" :aria-label="locale === 'zh' ? '更多工具' : 'More tools'"><MoreVertical class="w-4 h-4" /></button>
          <div v-if="isMobileMenuOpen" class="absolute right-0 top-12 w-48 p-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <button class="menu-action" @click="handleMobileAction('batch')">{{ t('nav.batch') }}</button>
            <button class="menu-action" @click="$emit('toggle-view', currentView === 'monitor' ? 'generator' : 'monitor'); isMobileMenuOpen = false">{{ currentView === 'monitor' ? t('monitor.backToGenerator') : t('monitor.navTitle') }}</button>
            <button class="menu-action" @click="handleMobileAction('disclaimer')">{{ t('nav.disclaimer') }}</button>
            <button class="menu-action" @click="handleMobilePwaInstall">{{ t('nav.installPwa') }}</button>
          </div>
        </div>
      </div>
    </div>
    <nav class="lg:hidden flex gap-1 px-4 pb-2 overflow-x-auto scrollbar-none" :aria-label="locale === 'zh' ? '常用地区' : 'Popular regions'"><slot /></nav>
  </header>
  <!-- iOS Safari PWA Install Guidance Modal -->
  <Teleport to="body">
    <div
      v-if="showIosGuide"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      @click.self="showIosGuide = false"
    >
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative text-left">
        <button
          type="button"
          @click="showIosGuide = false"
          class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
        >
          ✕
        </button>
        <div class="flex items-center gap-2 mb-3 text-teal-600 dark:text-teal-400 font-bold text-base">
          <Smartphone class="w-5 h-5" />
          <span>{{ t('nav.iosInstallGuideTitle') }}</span>
        </div>
        <div class="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div class="flex items-start gap-2">
            <span class="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
            <p>{{ t('nav.iosInstallGuideStep1') }}</p>
          </div>
          <div class="flex items-start gap-2">
            <span class="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
            <p>{{ t('nav.iosInstallGuideStep2') }}</p>
          </div>
          <div class="flex items-start gap-2">
            <span class="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
            <p>{{ t('nav.iosInstallGuideStep3') }}</p>
          </div>
        </div>
        <button
          type="button"
          @click="showIosGuide = false"
          class="w-full mt-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors cursor-pointer"
        >
          {{ locale === 'zh' ? '我知道了' : 'Got it' }}
        </button>
      </div>
    </div>

    <!-- Android & Universal Mobile PWA Install Guidance Modal -->
    <div
      v-if="showAndroidGuide"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      @click.self="showAndroidGuide = false"
    >
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative text-left">
        <button
          type="button"
          @click="showAndroidGuide = false"
          class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
        >
          ✕
        </button>
        <div class="flex items-center gap-2 mb-3 text-teal-600 dark:text-teal-400 font-bold text-base">
          <Smartphone class="w-5 h-5" />
          <span>{{ locale === 'zh' ? '添加到手机桌面 (PWA)' : 'Add to Home Screen (PWA)' }}</span>
        </div>
        <div class="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div class="flex items-start gap-2">
            <span class="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
            <p>{{ locale === 'zh' ? '点击浏览器右上角或底部的菜单图标（通常为 ⋮ 或 ≡）' : 'Tap browser menu icon (usually ⋮ or ≡ on top/bottom bar)' }}</p>
          </div>
          <div class="flex items-start gap-2">
            <span class="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
            <p>{{ locale === 'zh' ? '在菜单中找到并点击「安装应用」或「添加到主屏幕」' : 'Select "Install app" or "Add to Home screen"' }}</p>
          </div>
          <div class="flex items-start gap-2">
            <span class="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
            <p>{{ locale === 'zh' ? '确认添加后，即可像原生 App 一样从桌面离线秒开！' : 'Confirm to add, then launch instantly from your home screen like a native app!' }}</p>
          </div>
        </div>
        <button
          type="button"
          @click="showAndroidGuide = false"
          class="w-full mt-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors cursor-pointer"
        >
          {{ locale === 'zh' ? '我知道了' : 'Got it' }}
        </button>
      </div>
    </div>
  </Teleport>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import {
  MapPin,
  Bookmark,
  Languages,
  Sun,
  Moon,
  MoreVertical,
  Smartphone
} from 'lucide-vue-next';
import { useI18n } from '../i18n';
import { usePwaInstall } from '../composables/usePwaInstall';

defineProps<{
  favoriteCount: number;
  currentView?: 'generator' | 'monitor';
}>();

const emit = defineEmits<{
  (e: 'open-batch'): void;
  (e: 'open-history'): void;
  (e: 'open-disclaimer'): void;
  (e: 'toggle-view', view: 'generator' | 'monitor'): void;
}>();

const { locale, setLocale, t } = useI18n();

const isDark = ref(false);
const isMobileMenuOpen = ref(false);
const mobileMenuRef = ref<HTMLElement | null>(null);

const { showIosGuide, showAndroidGuide, promptInstall } = usePwaInstall();

async function handleMobilePwaInstall() {
  isMobileMenuOpen.value = false;
  await promptInstall();
}

function toggleLang() {
  setLocale(locale.value === 'zh' ? 'en' : 'zh');
}

function updateMetaThemeColor(dark: boolean) {
  const metaThemeColors = document.querySelectorAll('meta[name="theme-color"]');
  const targetColor = dark ? '#020617' : '#f8fafc';
  metaThemeColors.forEach(el => {
    el.setAttribute('content', targetColor);
  });
}

function toggleTheme() {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
  updateMetaThemeColor(isDark.value);
}

function handleMobileAction(action: 'batch' | 'lang' | 'disclaimer') {
  isMobileMenuOpen.value = false;
  if (action === 'batch') {
    emit('open-batch');
  } else if (action === 'lang') {
    toggleLang();
  } else if (action === 'disclaimer') {
    emit('open-disclaimer');
  }
}

function handleClickOutside(event: MouseEvent) {
  if (mobileMenuRef.value && !mobileMenuRef.value.contains(event.target as Node)) {
    isMobileMenuOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    isDark.value = true;
    document.documentElement.classList.add('dark');
  } else {
    isDark.value = false;
    document.documentElement.classList.remove('dark');
  }
  updateMetaThemeColor(isDark.value);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.nav-action { @apply inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 text-xs font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors; }
.menu-action { @apply block w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800; }
</style>
