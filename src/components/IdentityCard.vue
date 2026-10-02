<template>
  <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden transition-colors duration-200">
    <div class="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-7 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50/90 to-white dark:from-slate-800/40 dark:to-slate-900">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">{{ locale === 'zh' ? '生成结果' : 'Generated result' }}</h1>
      <div class="flex items-center gap-2">
        <div class="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium">
          <button v-for="language in (['zh', 'en', 'local'] as const)" :key="language" type="button" @click="cardLang = language" class="px-2 py-1 rounded-md" :class="cardLang === language ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-300' : 'text-slate-500 dark:text-slate-400'" :aria-pressed="cardLang === language">{{ language === 'zh' ? '中文' : language === 'en' ? 'EN' : localLangButtonText }}</button>
        </div>
        <button type="button" @click="handleCopyAll" class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900"><Check v-if="copiedAll" class="w-4 h-4 text-emerald-400" /><Copy v-else class="w-3.5 h-3.5" />{{ locale === 'zh' ? '复制全部' : 'Copy all' }}</button>
        <button type="button" @click="handleToggleFav" class="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700" :aria-label="isFav ? t('card.unfavorite') : t('card.favorite')"><Star class="w-4 h-4" :class="isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-400'" /></button>
      </div>
    </div>
    <section class="p-5 sm:p-7 space-y-4" :aria-label="locale === 'zh' ? '生成结果，点击字段复制' : 'Generated result, click a field to copy'">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button v-for="field in quickFields" :key="field.key" type="button" @click="copyField(field.value, field.key)" class="copy-row primary-row group" :class="{ 'sm:col-span-2': field.key === 'address' || field.key === 'email' }" :aria-label="(locale === 'zh' ? '复制' : 'Copy ') + field.label + ': ' + field.value">
          <span class="text-base text-slate-500 dark:text-slate-400 text-left shrink-0">{{ field.label }}<span v-if="field.key === 'email'" class="ml-1 text-[10px] text-amber-600 dark:text-amber-400">{{ labels.emailNotice }}</span></span>
          <span class="min-w-0 flex-1 text-right text-xl font-semibold text-slate-800 dark:text-slate-100 break-words">{{ field.value || '—' }}</span>
          <Check v-if="copiedKey === field.key" class="w-3.5 h-3.5 text-emerald-500 shrink-0" /><Copy v-else class="w-3.5 h-3.5 text-slate-400 group-hover:text-primary-500 shrink-0" />
        </button>
      </div>
      <div class="flex items-center justify-between gap-3">
        <span class="text-xs text-slate-400">{{ t('card.syntheticBadge') }} · {{ locale === 'zh' ? '投递与 AVS 未核验' : 'Delivery & AVS unverified' }}</span>
        <button type="button" @click="scrollToMap" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-teal-500 text-white text-sm font-semibold shrink-0"><MapPin class="w-3.5 h-3.5" />{{ locale === 'zh' ? '查看地图' : 'View map' }} ↓</button>
      </div>
    </section>
    <div class="p-4 sm:p-5 space-y-6 border-t border-slate-200 dark:border-slate-800">
      <!-- Section 1: Real Address on Google Maps -->
      <div ref="mapSection" class="min-w-0 max-w-full scroll-mt-24">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <MapPin class="w-4 h-4" />
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">
              {{ identity.address.source === 'OpenStreetMap' ? t('card.addressTitle') : t('card.sampleAddressTitle') }}
            </h3>
            <span
              v-if="identity.address.isTaxFree"
              class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            >
              {{ labels.taxFreeTag }}
            </span>
            <a v-if="identity.address.sourceId" :href="`https://www.openstreetmap.org/${identity.address.sourceId}`"
              target="_blank" rel="noopener noreferrer" class="text-xs text-primary-600 dark:text-primary-400 underline">
              {{ t('addressMode.viewSource') }}
            </a>
          </div>
          <button
            type="button"
            @click="copyField(fullAddressString, 'address')"
            class="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 font-medium"
          >
            <Copy class="w-3 h-3" />
            <span>{{ t('card.copyAll') }}</span>
          </button>
        </div>

        <!-- Address Mode Info Banner -->
        <div
          class="mb-4 px-4 py-2.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 text-xs"
          :class="[
            identity.address.addressMode === 'residential'
              ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-200/80 dark:border-purple-800/50 text-purple-900 dark:text-purple-200'
              : identity.address.addressMode === 'derivation'
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200'
                : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200/80 dark:border-blue-800/50 text-blue-900 dark:text-blue-200'
          ]"
        >
          <div class="flex items-center gap-2 font-semibold">
            <component :is="modeIcon" class="w-4 h-4 shrink-0" />
            <span>{{ modeBadgeText }}</span>
            <span class="text-[11px] font-normal opacity-85 hidden sm:inline">
              · {{ localizedRuleSummary }}
            </span>
          </div>
          <span
            class="text-[10px] font-bold px-2.5 py-0.5 rounded-md tracking-wide shrink-0 whitespace-nowrap"
            :class="[
              identity.address.addressMode === 'residential'
                ? 'bg-purple-200/80 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200'
                : identity.address.addressMode === 'derivation'
                  ? 'bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                  : 'bg-blue-200/80 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200'
            ]"
          >
            {{ localizedAvsTier }}
          </span>
        </div>

        <!-- Google Maps Live Embed Viewer -->
        <div class="min-w-0 max-w-full overflow-hidden">
          <GoogleMapEmbed :address="identity.address" />
        </div>
      </div>

        <!-- Dedicated eCommerce / Forwarder Standard Format Card -->
        <div class="mb-4 p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
              <PackageCheck class="w-4 h-4" />
              <span>{{ t('card.forwarderTitle') }}</span>
            </div>
            <div class="text-xs font-mono text-slate-600 dark:text-slate-400 line-clamp-1">
              {{ displayFullName }} · {{ identity.address.addressLine1 || identity.address.street }}{{ identity.address.addressLine2 ? ` · ${identity.address.addressLine2}` : '' }} · {{ identity.address.city }}, {{ identity.address.state }} {{ identity.address.postcode }}
            </div>
          </div>
          <button
            type="button"
            @click="copyField(forwarderShippingText, 'forwarder')"
            class="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-xs active:scale-95 transition-all whitespace-nowrap cursor-pointer"
          >
            <Check v-if="copiedKey === 'forwarder'" class="w-3.5 h-3.5" />
            <Copy v-else class="w-3.5 h-3.5" />
            <span>{{ copiedKey === 'forwarder' ? t('card.copiedField') : t('card.copyForwarder') }}</span>
          </button>
        </div>

    <!-- Top Identity Hero Header -->
    <div class="p-4 sm:p-5 bg-gradient-to-b from-slate-50/90 to-white dark:from-slate-800/40 dark:to-slate-900 border-b border-slate-200/80 dark:border-slate-800">
      <div class="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 sm:gap-6">
        <!-- Left: Avatar and Names -->
        <div class="flex items-center gap-3.5 sm:gap-5 min-w-0 w-full sm:w-auto">
          <div class="relative group shrink-0">
            <img
              :src="identity.basic.avatar"
              :alt="identity.basic.fullName"
              class="w-12 h-12 sm:w-12 sm:h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/60 p-1 border-2 border-primary-500/20 dark:border-primary-500/30 object-cover shadow-md shadow-primary-500/10"
            />
            <span
              :class="[
                'absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs font-bold rounded-full text-white shadow-sm ring-2 ring-white dark:ring-slate-900',
                identity.basic.gender === 'male' ? 'bg-blue-500' : 'bg-rose-500'
              ]"
              :title="identity.basic.gender === 'male' ? labels.genderMale : labels.genderFemale"
            >
              {{ displayGenderBadge }}
            </span>
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h1 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight break-words">
                {{ displayFullName }}
              </h1>

              <!-- Phonetic, Latin or Native transcription if exists -->
              <span
                v-if="displaySubName"
                class="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400"
              >
                ({{ displaySubName }})
              </span>

              <!-- Country Flag Tag -->
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <span>{{ countryFlag }}</span>
                <span>{{ displayCountryName }}</span>
              </span>

              <!-- Tax Free Tag if applicable -->
              <span
                v-if="identity.address.isTaxFree"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700 "
              >
                <Zap class="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>{{ displayTaxRate }}</span>
              </span>

              <!-- Synthetic Test Profile Badge -->
              <button
                type="button"
                @click="$emit('open-disclaimer')"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
                :title="t('card.syntheticBadgeTip')"
              >
                <ShieldCheck class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{{ t('card.syntheticBadge') }}</span>
              </button>
            </div>

            <!-- Meta Badges -->
            <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2">
              <span class="px-2 py-0.5 text-[11px] sm:text-xs rounded-lg bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 font-medium">
                {{ identity.basic.age }} {{ labels.ageUnit }} ({{ identity.basic.birthDate }})
              </span>
              <span class="px-2 py-0.5 text-[11px] sm:text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                {{ identity.basic.zodiacSign }}
              </span>
              <span class="px-2 py-0.5 text-[11px] sm:text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                {{ identity.basic.bloodType }}
              </span>
              <!-- Timezone & Local Time -->
              <span class="px-2 py-0.5 text-[11px] sm:text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
                <Clock class="w-3 h-3 text-slate-400" />
                <span>{{ identity.address.timezoneCode || 'UTC' }} · {{ currentTimeStr }}</span>
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <button v-for="field in extraFields" :key="field.key" type="button" @click="copyField(field.value, field.key)" class="copy-row group" :aria-label="(locale === 'zh' ? '复制' : 'Copy ') + field.label + ': ' + field.value"><span class="text-xs text-slate-400">{{ field.label }}</span><span class="text-sm font-semibold break-words min-w-0">{{ field.value || '—' }}</span><Copy class="w-3.5 h-3.5 text-slate-400 shrink-0 ml-auto" /></button>
      </div>
      <!-- Section 2: Contact & Document Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Contact Details -->
        <div class="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div class="space-y-3">
            <div class="flex items-center gap-2 mb-3">
              <div class="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Phone class="w-4 h-4" />
              </div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">
                {{ labels.contactTitle }}
              </h3>
            </div>

            <!-- Phone -->
            <div
              @click="copyField(identity.contact.phoneFormatted, 'phone')"
              class="group flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
            >
              <div>
                <div class="text-xs text-slate-400 dark:text-slate-500">{{ labels.phone }}</div>
                <div class="text-sm font-semibold text-slate-800 dark:text-slate-200 font-mono">
                  {{ identity.contact.phoneFormatted }}
                </div>
              </div>
              <Check v-if="copiedKey === 'phone'" class="w-4 h-4 text-emerald-500" />
              <Copy v-else class="w-4 h-4 opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
            </div>

            <!-- Email -->
            <div
              @click="copyField(identity.contact.email, 'email')"
              class="group flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
            >
              <div class="min-w-0 flex-1 mr-2">
                <div class="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                  <span>{{ labels.email }}</span>
                  <span class="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/50">
                    {{ labels.emailNotice }}
                  </span>
                </div>
                <div class="text-sm font-semibold text-slate-800 dark:text-slate-200 break-all">
                  {{ identity.contact.email }}
                </div>
              </div>
              <Check v-if="copiedKey === 'email'" class="w-4 h-4 text-emerald-500 shrink-0" />
              <Copy v-else class="w-4 h-4 opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity shrink-0" />
            </div>

            <!-- Username -->
            <div
              @click="copyField(identity.contact.username, 'username')"
              class="group flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
            >
              <div class="min-w-0 flex-1 mr-2">
                <div class="text-xs text-slate-400 dark:text-slate-500">{{ labels.username }}</div>
                <div class="text-sm font-mono font-medium text-slate-700 dark:text-slate-300 break-all">
                  {{ identity.contact.username }}
                </div>
              </div>
              <Check v-if="copiedKey === 'username'" class="w-4 h-4 text-emerald-500 shrink-0" />
              <Copy v-else class="w-4 h-4 opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity shrink-0" />
            </div>
          </div>

          <!-- Email / Contact Disclaimer Tip -->
          <div class="mt-3 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200/80 dark:border-amber-900/50 flex items-start gap-1.5">
            <Info class="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <span>{{ labels.emailTip }}</span>
          </div>
        </div>

        <!-- Compliance Document / Tax ID -->
        <div class="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 mb-3">
              <div class="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <FileText class="w-4 h-4" />
              </div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">
                {{ labels.docTitle }}
              </h3>
            </div>

            <div
              @click="copyField(identity.document.docNumber, 'docNumber')"
              class="group p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer hover:border-purple-400 transition-all mb-3"
            >
              <div class="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 mb-1">
                <span class="font-medium">{{ displayDocTypeName }}</span>
                <Check v-if="copiedKey === 'docNumber'" class="w-4 h-4 text-emerald-500" />
                <Copy v-else class="w-4 h-4 opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
              </div>
              <div class="text-lg font-mono font-bold text-purple-600 dark:text-purple-400 tracking-wider">
                {{ identity.document.docNumber }}
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <div class="text-xs text-slate-500 dark:text-slate-400 bg-purple-50/50 dark:bg-purple-950/30 p-2.5 rounded-lg border border-purple-100 dark:border-purple-900/40">
              ℹ️ {{ identity.document.description }}
            </div>
            <div class="text-[11px] text-slate-400 dark:text-slate-500 px-1">
              * {{ labels.docNotice }}
            </div>
          </div>
        </div>
      </div>

      <!-- Section 3: Occupation & Higher Education -->
      <div class="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div class="flex items-center gap-2 mb-2">
          <div class="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Briefcase class="w-4 h-4" />
          </div>
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">
            {{ labels.occupationTitle }}
          </h3>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <!-- Company -->
          <div
            @click="copyField(identity.occupation.company, 'company')"
            class="group p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 cursor-pointer"
          >
            <div class="flex items-center justify-between text-xs text-slate-400 mb-0.5">
              <span>{{ labels.company }}</span>
              <Check v-if="copiedKey === 'company'" class="w-3.5 h-3.5 text-emerald-500" />
              <Copy v-else class="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-slate-400" />
            </div>
            <div class="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {{ identity.occupation.company }}
            </div>
          </div>

          <!-- Title -->
          <div
            @click="copyField(identity.occupation.title, 'title')"
            class="group p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 cursor-pointer"
          >
            <div class="flex items-center justify-between text-xs text-slate-400 mb-0.5">
              <span>{{ labels.title }}</span>
              <Check v-if="copiedKey === 'title'" class="w-3.5 h-3.5 text-emerald-500" />
              <Copy v-else class="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-slate-400" />
            </div>
            <div class="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {{ identity.occupation.title }}
            </div>
          </div>

          <!-- University -->
          <div
            @click="copyField(identity.occupation.university, 'university')"
            class="group p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 cursor-pointer"
          >
            <div class="flex items-center justify-between text-xs text-slate-400 mb-0.5">
              <span>{{ labels.university }}</span>
              <Check v-if="copiedKey === 'university'" class="w-3.5 h-3.5 text-emerald-500" />
              <Copy v-else class="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-slate-400" />
            </div>
            <div class="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {{ identity.occupation.university }}
            </div>
          </div>
        </div>
      </div>

      <!-- Section 4: Finance Virtual Card (Luhn Validated) -->
      <div class="p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-xl relative overflow-hidden">
        <!-- Ambient Card Graphic -->
        <div class="absolute -top-12 right-0 w-48 h-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"></div>

        <div class="relative z-10 space-y-4">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <CreditCard class="w-5 h-5 text-teal-400 shrink-0" />
              <span class="text-sm font-bold tracking-wide text-slate-200 truncate">
                {{ labels.financeTitle }}
              </span>
            </div>
            <span class="px-2.5 py-0.5 text-xs font-bold rounded-md bg-white/10 text-slate-200 border border-white/20 shrink-0 whitespace-nowrap">
              {{ identity.finance.cardType }}
            </span>
          </div>

          <!-- Card Number -->
          <div
            @click="copyField(identity.finance.cardNumber, 'cardNumber')"
            class="group p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-colors"
          >
            <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>{{ labels.cardNumber }}</span>
              <Check v-if="copiedKey === 'cardNumber'" class="w-4 h-4 text-emerald-400" />
              <Copy v-else class="w-4 h-4 opacity-0 group-hover:opacity-100 text-slate-300 transition-opacity" />
            </div>
            <div class="text-lg sm:text-2xl font-mono font-bold tracking-wider sm:tracking-widest text-teal-300 break-all">
              {{ identity.finance.cardFormatted }}
            </div>
          </div>

          <!-- Expiry & CVV Row (2-Column Grid) -->
          <div class="grid grid-cols-2 gap-2.5 sm:gap-3">
            <!-- Expiry Date (MM/YY) -->
            <div
              @click="copyField(`${identity.finance.expMonth}/${identity.finance.expYear}`, 'exp')"
              class="group p-2.5 sm:p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-colors"
            >
              <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <div class="flex items-center gap-1.5">
                  <span>{{ labels.expDate }}</span>
                  <span class="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 font-mono">MM/YY</span>
                </div>
                <Check v-if="copiedKey === 'exp'" class="w-3.5 h-3.5 text-emerald-400" />
                <Copy v-else class="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-slate-300 transition-opacity" />
              </div>
              <div class="text-base sm:text-lg font-mono font-bold text-slate-100 whitespace-nowrap flex items-baseline gap-1.5">
                <span>{{ identity.finance.expMonth }} / {{ identity.finance.expYear.slice(-2) }}</span>
                <span class="text-xs font-normal text-slate-400">({{ identity.finance.expYear }})</span>
              </div>
            </div>

            <!-- Security Code (CVV / CID) with dynamic 3-digit vs 4-digit AmEx indicator -->
            <div
              @click="copyField(identity.finance.cvv, 'cvv')"
              class="group p-2.5 sm:p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-colors"
            >
              <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span class="truncate">{{ labels.cvv.replace(/\s*\(CVV\)/i, '') }}</span>
                  <span
                    class="text-[9px] px-1.5 py-0.2 rounded font-mono font-medium shrink-0 whitespace-nowrap"
                    :class="identity.finance.cardType === 'American Express' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/10 text-slate-300'"
                  >
                    {{ identity.finance.cardType === 'American Express' ? (cardLang === 'zh' ? '运通 4位 CID' : 'AmEx 4位 CID') : '3位 CVV' }}
                  </span>
                </div>
                <Check v-if="copiedKey === 'cvv'" class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <Copy v-else class="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-slate-300 transition-opacity shrink-0" />
              </div>
              <div class="text-base sm:text-lg font-mono font-bold text-slate-100 whitespace-nowrap">
                {{ identity.finance.cvv }}
              </div>
            </div>
          </div>

          <!-- Issuing Bank Row (新起独立完整行，杜绝截断省略号) -->
          <div
            @click="copyField(identity.finance.bankName, 'bank')"
            class="group p-2.5 sm:p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-colors flex items-center justify-between gap-3"
          >
            <div class="flex items-center gap-2.5 min-w-0 flex-1">
              <div class="p-2 rounded-lg bg-white/10 text-slate-300 shrink-0">
                <Building2 class="w-4 h-4 text-teal-400" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1.5 mb-0.5">
                  <span>{{ labels.bank }}</span>
                  <span class="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                    {{ cardLang === 'zh' ? '结算发卡机构' : 'Card Issuer' }}
                  </span>
                </div>
                <div class="text-xs sm:text-sm font-semibold text-slate-100 break-words leading-tight">
                  {{ identity.finance.bankName }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1 text-slate-400 shrink-0">
              <Check v-if="copiedKey === 'bank'" class="w-4 h-4 text-emerald-400" />
              <Copy v-else class="w-4 h-4 opacity-0 group-hover:opacity-100 text-slate-300 transition-opacity" />
            </div>
          </div>

          <!-- Card Compliance / Safety Notice -->
          <div class="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] sm:text-[11px] text-slate-300">
            <ShieldAlert class="w-4 h-4 text-amber-400 shrink-0" />
            <span class="leading-tight">{{ labels.financeNotice }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  MapPin,
  Phone,
  FileText,
  Briefcase,
  CreditCard,
  Copy,
  Check,
  Star,
  Zap,
  Clock,
  PackageCheck,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Route,
  Home,
  Info
} from 'lucide-vue-next';
import type { GeneratedIdentity, CardLanguage } from '../types/identity';
import { COUNTRIES } from '../data/countries';
import { COUNTRY_LOCAL_META } from '../data/names';
import { getCardLabels, formatForwarderShippingText } from '../data/cardLabels';
import GoogleMapEmbed from './GoogleMapEmbed.vue';
import { useI18n } from '../i18n';
import { formatFullIdentityText } from '../services/exportService';

const props = defineProps<{
  identity: GeneratedIdentity;
  isFav?: boolean;
}>();

const emit = defineEmits<{
  (e: 'copy-field', text: string, label: string): void;
  (e: 'toggle-favorite', identity: GeneratedIdentity): void;
  (e: 'open-disclaimer'): void;
}>();

const { locale, t } = useI18n();

// 3-segment card profile display language ('zh' | 'en' | 'local')
const cardLang = ref<CardLanguage>(locale.value === 'en' ? 'en' : 'zh');

watch(locale, (newLoc) => {
  cardLang.value = newLoc === 'en' ? 'en' : 'zh';
});

const localMeta = computed(() => COUNTRY_LOCAL_META[props.identity.countryCode]);

const labels = computed(() => {
  return getCardLabels(props.identity.countryCode, cardLang.value, locale.value);
});

const localLangButtonText = computed(() => {
  return localMeta.value?.langLabel || t('card.langLocal');
});

const displayGenderBadge = computed(() => {
  if (cardLang.value === 'zh') {
    return props.identity.basic.gender === 'male' ? '男' : '女';
  }
  return props.identity.basic.gender === 'male' ? 'M' : 'F';
});

const displayFullName = computed(() => {
  const i = props.identity;
  if (cardLang.value === 'zh') {
    return i.basic.zhFullName || i.basic.localFullName || i.basic.fullName;
  }
  if (cardLang.value === 'local') {
    return i.basic.localFullName || i.basic.fullName;
  }
  return i.basic.fullName;
});

const displaySubName = computed(() => {
  const i = props.identity;
  const main = displayFullName.value;
  if (cardLang.value === 'zh') {
    if (i.basic.zhFullName && i.basic.fullName !== main) {
      return i.basic.fullName;
    }
    return i.basic.phoneticName || (i.basic.fullName !== main ? i.basic.fullName : '');
  }
  if (cardLang.value === 'en') {
    if (i.basic.localFullName && i.basic.localFullName !== i.basic.fullName) {
      return i.basic.localFullName;
    }
    return '';
  }
  // cardLang === 'local'
  if (i.countryCode === 'JP') {
    return i.basic.phoneticName || (i.basic.fullName !== main ? i.basic.fullName : '');
  }
  if (i.countryCode === 'KR') {
    return i.basic.fullName;
  }
  if (i.countryCode === 'HK' || i.countryCode === 'TW') {
    return i.basic.fullName;
  }
  if (i.basic.fullName !== main) {
    return i.basic.fullName;
  }
  return '';
});

const displayCountryName = computed(() => {
  if (cardLang.value === 'zh') {
    return props.identity.countryName;
  }
  if (cardLang.value === 'local') {
    return localMeta.value?.countryLocalName || props.identity.address.country;
  }
  return props.identity.address.country;
});

const displayDocTypeName = computed(() => {
  if (cardLang.value === 'zh') {
    return props.identity.document.typeNameZh;
  }
  if (cardLang.value === 'local') {
    return props.identity.document.typeNameLocal || props.identity.document.typeName;
  }
  return props.identity.document.typeName;
});

const mapSection = ref<HTMLElement | null>(null);
function scrollToMap() {
  mapSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
const quickFields = computed(() => {
  const i = props.identity;
  const zh = cardLang.value === 'zh';
  return [
    { key: 'firstName', label: zh ? '名 / First Name' : 'First Name', value: i.basic.firstName },
    { key: 'lastName', label: zh ? '姓 / Last Name' : 'Last Name', value: i.basic.lastName },
    { key: 'gender', label: zh ? '性别 / Gender' : 'Gender', value: i.basic.gender === 'male' ? labels.value.genderMale : labels.value.genderFemale },
    { key: 'phone', label: labels.value.phone, value: i.contact.phoneFormatted },
    { key: 'email', label: labels.value.email, value: i.contact.email },
    { key: 'street', label: labels.value.street, value: i.address.addressLine1 || i.address.street },
    { key: 'city', label: zh ? '城市 / City' : 'City', value: i.address.city },
    { key: 'state', label: zh ? '州 / State' : 'State / Province', value: i.address.stateFull || i.address.state },
    { key: 'postcode', label: labels.value.postcode, value: i.address.postcode },
    { key: 'address', label: zh ? '完整地址' : 'Full Address', value: fullAddressString.value }
  ];
});

const extraFields = computed(() => [
  { key: 'birthDate', label: cardLang.value === 'zh' ? '生日' : 'Birthday', value: props.identity.basic.birthDate },
  { key: 'suite', label: labels.value.addressLine2, value: props.identity.address.addressLine2 || '' },
  { key: 'country', label: cardLang.value === 'zh' ? '国家' : 'Country', value: displayCountryName.value }
]);

const copiedKey = ref<string | null>(null);
const copiedAll = ref(false);

const modeIcon = computed(() => {
  const mode = props.identity.address.addressMode;
  if (mode === 'derivation') return Route;
  if (mode === 'residential') return Home;
  return Building2;
});

const modeBadgeText = computed(() => {
  const mode = props.identity.address.addressMode;
  if (props.identity.address.source === 'OpenStreetMap') return t('addressMode.sourcedShort');
  if (mode === 'sourced') return t('addressMode.sourcedShort');
  if (mode === 'derivation') return t('addressMode.derivationBadge');
  if (mode === 'residential') return t('addressMode.residentialBadge');
  return t('addressMode.landmarkBadge');
});

const displayTaxRate = computed(() => {
  const raw = props.identity.address.taxRate;
  const isTaxFree = props.identity.address.isTaxFree;
  if (locale.value === 'zh') {
    if (isTaxFree || (raw && raw.includes('No Sales Tax'))) {
      return '0.00% (免消费税)';
    }
    if (raw && raw.includes('Standard Tax')) {
      return '标准消费税率';
    }
    return raw || '0.00% (免消费税)';
  } else {
    if (isTaxFree || (raw && raw.includes('免税'))) {
      return '0.00% (No Sales Tax)';
    }
    if (raw && raw.includes('标准')) {
      return 'Standard Tax';
    }
    return raw || '0.00% (No Sales Tax)';
  }
});

const localizedAvsTier = computed(() => {
  const mode = props.identity.address.addressMode;
  const rawTier = props.identity.address.derivationMeta?.avsTier;
  if (props.identity.address.source === 'OpenStreetMap') {
    const building = props.identity.address.sourceBuildingType;
    if (building === 'apartments') return locale.value === 'zh' ? '公寓建筑 · AVS 未核验' : 'Apartment Building · AVS Unverified';
    if (['house', 'detached', 'semidetached_house', 'terrace'].includes(building || '')) {
      return locale.value === 'zh' ? '独栋/联排住宅 · AVS 未核验' : 'House / Townhouse · AVS Unverified';
    }
    return locale.value === 'zh' ? '住宅建筑 · AVS 未核验' : 'Residential Building · AVS Unverified';
  }
  if (locale.value === 'zh') {
    if (mode === 'residential') return '住宅样本 · AVS 未核验';
    if (rawTier === 'Residential Condominium / Apartment' || mode === 'landmark') return '内置公寓样本 · 未核验';
    if (rawTier === 'Residential Street (GIS Validated)' || rawTier === 'Unique Synthetic AVS' || mode === 'derivation') return '插值门牌 · 未逐条核验';
    return '地址样本 · 未核验';
  } else {
    if (mode === 'residential') return 'Residential Sample · AVS Unverified';
    if (rawTier === 'Residential Condominium / Apartment' || mode === 'landmark') return 'Apartment Sample · Unverified';
    if (rawTier === 'Residential Street (GIS Validated)' || rawTier === 'Unique Synthetic AVS' || mode === 'derivation') return 'Interpolated Number · Unverified';
    return 'Address Sample · Unverified';
  }
});

const localizedRuleSummary = computed(() => {
  const mode = props.identity.address.addressMode;
  if (props.identity.address.source === 'OpenStreetMap') {
    return locale.value === 'zh'
      ? '© OpenStreetMap contributors (ODbL) · 建筑门牌，无房号或投递认证'
      : '© OpenStreetMap contributors (ODbL) · Building address, no verified unit or delivery';
  }
  if (locale.value === 'zh') {
    return mode === 'derivation' ? '街道门牌插值 · 未逐条核验' : '内置地址样本 · 投递与 AVS 未核验';
  } else {
    if (mode === 'derivation') return 'Interpolated street number · not individually verified';
    return 'Bundled address sample · delivery and AVS unverified';
  }
});

const countryFlag = computed(() => {
  const c = COUNTRIES.find(item => item.code === props.identity.countryCode);
  return c ? c.flag : '🌐';
});

const fullAddressString = computed(() => {
  const a = props.identity.address;
  const line2 = a.addressLine2 ? ` ${a.addressLine2},` : '';
  return `${a.addressLine1 || a.street},${line2} ${a.city}, ${a.stateFull || a.state} ${a.postcode}, ${a.country}`;
});

const forwarderShippingText = computed(() => {
  return formatForwarderShippingText(
    props.identity,
    cardLang.value,
    displayFullName.value,
    displayCountryName.value
  );
});

const currentTimeStr = computed(() => {
  try {
    const tz = props.identity.address.timezone;
    if (tz && tz.includes('/')) {
      const iana = tz.split(' ')[0];
      return new Intl.DateTimeFormat('zh-CN', {
        timeZone: iana,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(new Date());
    }
  } catch (_e) {}
  return new Date().toLocaleTimeString();
});

function fallbackCopy(text: string) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    if (!document.execCommand('copy')) throw new Error('Clipboard unavailable');
  } finally {
    textArea.remove();
  }
}

async function copyField(text: string, key: string): Promise<boolean> {
  if (!text) return false;
  try {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else fallbackCopy(text);
    } catch {
      fallbackCopy(text);
    }
  } catch {
    emit('copy-field', text, locale.value === 'zh' ? '复制失败，请检查浏览器剪贴板权限' : 'Copy failed. Check clipboard permissions.');
    return false;
  }
  copiedKey.value = key;
  emit('copy-field', text, t('card.copiedField'));
  setTimeout(() => { if (copiedKey.value === key) copiedKey.value = null; }, 1800);
  return true;
}

async function handleCopyAll() {
  if (await copyField(formatFullIdentityText(props.identity, cardLang.value), 'all')) {
    copiedAll.value = true;
    setTimeout(() => { copiedAll.value = false; }, 2000);
  }
}

function handleToggleFav() {
  emit('toggle-favorite', props.identity);
}
</script>

<style scoped>
.copy-row { @apply flex items-center gap-3 w-full min-w-0 min-h-[50px] px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500; }
  .primary-row { @apply min-h-[68px] px-4 py-4 gap-4; }
@media (max-width: 639px) { .copy-row { @apply flex-wrap gap-2; } .copy-row > span:nth-child(2) { @apply text-sm; } .primary-row > span:nth-child(2) { @apply text-lg; } }
</style>
