import type { CardLanguage, CountryCode } from '../types/identity';
import { COUNTRY_LOCAL_META } from './names';

const words: Record<string, string[]> = {
  zh: ['名', '姓', '性别', '城市', '州 / 省', '完整地址', '生日', '国家 / 地区'],
  en: ['First Name', 'Last Name', 'Gender', 'City', 'State / Province', 'Full Address', 'Birthday', 'Country / Region'],
  ja: ['名', '姓', '性別', '市区町村', '都道府県', '住所', '生年月日', '国・地域'],
  ko: ['이름', '성', '성별', '시·군·구', '시·도', '전체 주소', '생년월일', '국가·지역'],
  'zh-HK': ['名', '姓', '性別', '地區', '區域', '完整地址', '出生日期', '國家 / 地區'],
  'zh-TW': ['名', '姓', '性別', '鄉鎮市區', '縣市', '完整地址', '出生日期', '國家 / 地區'],
  de: ['Vorname', 'Nachname', 'Geschlecht', 'Ort', 'Bundesland / Kanton', 'Vollständige Adresse', 'Geburtsdatum', 'Land / Region'],
  fr: ['Prénom', 'Nom', 'Genre', 'Ville', 'Région', 'Adresse complète', 'Date de naissance', 'Pays / Région'],
  it: ['Nome', 'Cognome', 'Genere', 'Città', 'Provincia', 'Indirizzo completo', 'Data di nascita', 'Paese / Regione'],
  es: ['Nombre', 'Apellidos', 'Género', 'Ciudad', 'Provincia', 'Dirección completa', 'Fecha de nacimiento', 'País / Región'],
  nl: ['Voornaam', 'Achternaam', 'Geslacht', 'Plaats', 'Provincie', 'Volledig adres', 'Geboortedatum', 'Land / Regio'],
  ms: ['Nama pertama', 'Nama keluarga', 'Jantina', 'Bandar', 'Negeri', 'Alamat penuh', 'Tarikh lahir', 'Negara / Wilayah'],
  th: ['ชื่อ', 'นามสกุล', 'เพศ', 'อำเภอ / เขต', 'จังหวัด', 'ที่อยู่เต็ม', 'วันเกิด', 'ประเทศ / ภูมิภาค'],
  vi: ['Tên', 'Họ', 'Giới tính', 'Thành phố', 'Tỉnh', 'Địa chỉ đầy đủ', 'Ngày sinh', 'Quốc gia / Khu vực'],
  fil: ['Pangalan', 'Apelyido', 'Kasarian', 'Lungsod', 'Lalawigan', 'Buong tirahan', 'Petsa ng kapanganakan', 'Bansa / Rehiyon']
};

export function getQuickLabels(code: CountryCode, lang: CardLanguage) {
  const [firstName, lastName, gender, city, state, address, birthDate, country] = words[lang === 'local' ? COUNTRY_LOCAL_META[code].langCode : lang] || words.en;
  return { firstName, lastName, gender, city, state, address, birthDate, country };
}
