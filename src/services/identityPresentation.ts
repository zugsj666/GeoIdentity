import type { CardLanguage, CountryCode, GeneratedIdentity, RealAddress } from '../types/identity';
import { COUNTRIES } from '../data/countries';
import { COUNTRY_LOCAL_META, getNameParts } from '../data/names';

import { translatedText } from '../data/translatedText';
export { selectLanguageText } from '../data/translatedText';

export function resultLanguage(code: CountryCode, lang: CardLanguage): string {
  return lang === 'local' ? COUNTRY_LOCAL_META[code].langCode : lang;
}

function addressText(value: string, address: RealAddress, lang: CardLanguage): string {
  const language = resultLanguage(address.countryCode, lang);
  const base = address.derivationMeta?.baseStreet;
  if (base && value.includes(base)) {
    if (language === 'en' && address.countryCode === 'TW') {
      return `No. ${value.slice(base.length).replace(/號$/, '')}, ${translatedText(base, language)}`;
    }
    return value.replace(base, translatedText(base, language));
  }
  return translatedText(value, language);
}

export function localizeAddress(address: RealAddress, lang: CardLanguage): RealAddress {
  const code = address.countryCode;
  const country = COUNTRIES.find(item => item.code === code)!;
  const language = resultLanguage(code, lang);
  const unitNames: Record<string, string> = { zh: '$1室', en: 'Unit $1', ja: '$1号室', ko: '$1호', 'zh-HK': '$1室', 'zh-TW': '$1室', de: 'Wohnung $1', fr: 'Appartement $1', it: 'Appartamento $1', es: 'Apartamento $1', nl: 'Appartement $1', ms: 'Unit $1', th: 'ห้อง $1', vi: 'Căn hộ $1', fil: 'Yunit $1' };
  let line2 = address.addressLine2 || '';
  line2 = line2.replace(/^(?:Apt|Unit|Rm\.?|Room)\s*([\w-]+)$|^(\d+)号室$/g, (_match, latin, japanese) => (unitNames[language] || 'Unit $1').replace('$1', latin || japanese));
  if (language === 'zh' || language.startsWith('zh-')) line2 = line2.replace(/^Flat ([A-Z]), (\d+)\/F$/, '$2楼$1室');
  if (language.startsWith('zh-')) line2 = line2.replace('楼', '樓');
  return { ...address,
    street: addressText(address.street, address, lang),
    addressLine1: addressText(address.addressLine1 || address.street, address, lang),
    addressLine2: line2,
    taxRate: translatedText(address.taxRate || "", language),
    city: addressText(address.city, address, lang),
    stateFull: addressText(address.stateFull || address.state, address, lang),
    country: lang === 'zh' ? country.nameZh : lang === 'local' ? COUNTRY_LOCAL_META[code].countryLocalName : country.nameEn
  };
}

export function formatAddress(address: RealAddress): string {
  return [address.addressLine1 || address.street, address.addressLine2, address.city, `${address.stateFull || address.state} ${address.postcode}`.trim(), address.country].filter(Boolean).join(', ');
}

// Project without mutating stored records or the original map/source address.
export function presentIdentity(identity: GeneratedIdentity, lang: CardLanguage): GeneratedIdentity {
  const names = getNameParts(identity.countryCode, identity.basic, lang);
  const text = (value: string) => translatedText(value, resultLanguage(identity.countryCode, lang));
  return { ...identity,
    basic: { ...identity.basic, ...names, localFullName: names.fullName, zhFullName: names.fullName, zodiacSign: text(identity.basic.zodiacSign) },
    address: localizeAddress(identity.address, lang),
    document: { ...identity.document, typeName: text(identity.document.typeName) },
    finance: { ...identity.finance, bankName: text(identity.finance.bankName) },
    occupation: { ...identity.occupation,
      company: text(identity.occupation.company), university: text(identity.occupation.university),
      title: text(identity.occupation.title),
      industry: text(identity.occupation.industry), educationDegree: text(identity.occupation.educationDegree)
    }
  };
}
