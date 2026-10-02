import type { GeneratedIdentity, CardLanguage } from '../types/identity';
import { presentIdentity, resultLanguage, formatAddress } from './identityPresentation';
import { getCardLabels } from '../data/cardLabels';
import { getQuickLabels } from '../data/quickLabels';
import { translatedText } from '../data/translatedText';

export function formatFullIdentityText(identity: GeneratedIdentity, lang: CardLanguage | string = 'zh'): string {
  identity = presentIdentity(identity, lang === 'local' ? 'local' : lang === 'en' ? 'en' : 'zh');
  const cCode = identity.countryCode;

  if (lang === 'local') {
    const l = getCardLabels(cCode, 'local', '');
    const q = getQuickLabels(cCode, 'local');
    const text = (value: string) => translatedText(value, resultLanguage(cCode, 'local'));
    const rows = [
      [q.firstName, identity.basic.firstName], [q.lastName, identity.basic.lastName],
      [q.gender, identity.basic.gender === 'male' ? l.genderMale : l.genderFemale],
      [q.birthDate, identity.basic.birthDate], [text('Blood Type'), identity.basic.bloodType], [text('Zodiac'), identity.basic.zodiacSign],
      [l.street, identity.address.addressLine1 || identity.address.street], [l.addressLine2, identity.address.addressLine2],
      [q.city, identity.address.city], [q.state, identity.address.stateFull || identity.address.state],
      [l.postcode, identity.address.postcode], [q.country, identity.address.country], [q.address, formatAddress(identity.address)],
      [l.phone, identity.contact.phoneFormatted], [l.email, identity.contact.email], [l.username, identity.contact.username],
      [identity.document.typeNameLocal || identity.document.typeName, identity.document.docNumber],
      [l.company, identity.occupation.company], [l.title, identity.occupation.title], [text('Industry'), identity.occupation.industry],
      [l.university, identity.occupation.university], [text('Education'), identity.occupation.educationDegree], [text('Website'), identity.occupation.website],
      [l.cardNumber, identity.finance.cardFormatted], [l.expDate, `${identity.finance.expMonth}/${identity.finance.expYear}`],
      [l.cvv, identity.finance.cvv], [l.bank, identity.finance.bankName]
    ];
    return rows.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`).join('\n') + '\n' + text('Development test profile. Delivery and AVS unverified.');
  }

  // 2. 中文模式 (Chinese Format)
  const isZh = lang === 'zh';
  if (isZh) {
    const avsTierZh = identity.address.source === 'OpenStreetMap'
      ? 'OSM 住宅建筑门牌 · AVS 未验证 (© OpenStreetMap contributors, ODbL)'
      : identity.address.addressMode === 'residential'
      ? '住宅样本 · AVS 未核验'
      : (identity.address.addressMode === 'derivation' ? '插值门牌 · 未逐条核验' : '内置公寓样本 · AVS 未核验');

    const taxRateZh = (identity.address.isTaxFree || (identity.address.taxRate && identity.address.taxRate.includes('No Sales Tax')))
      ? '0.00% (免消费税)'
      : (identity.address.taxRate || '0.00% (免消费税)');

    const displayName = identity.basic.zhFullName || identity.basic.localFullName || identity.basic.fullName;
    const subName = identity.basic.fullName !== displayName ? identity.basic.fullName : (identity.basic.phoneticName || '');

    return `
=== 个人基本资料 ===
姓名：${displayName} ${subName ? `(${subName})` : ''}
性别：${identity.basic.gender === 'male' ? '男' : '女'}
年龄：${identity.basic.age} 岁
出生日期：${identity.basic.birthDate}
血型：${identity.basic.bloodType}
星座：${identity.basic.zodiacSign}

=== 地址数据 (按来源核对) ===
地址方案模式：${identity.address.source === 'OpenStreetMap' ? 'OSM 来源建筑门牌' : identity.address.addressMode === 'derivation' ? '方案A·插值门牌' : identity.address.addressMode === 'residential' ? '方案B·住宅样本' : '方案C·公寓样本'}
地址核验状态：${avsTierZh}
国家/地区：${identity.address.country} (${identity.address.countryCode})
州/省：${identity.address.stateFull || identity.address.state}
城市：${identity.address.city}
街道地址 (Line 1)：${identity.address.addressLine1 || identity.address.street}
单元/公寓号 (Line 2)：${identity.address.addressLine2 || 'N/A'}
邮政编码：${identity.address.postcode}
消费税率：${taxRateZh}
当地时区：${identity.address.timezone || 'UTC'}
坐标：${identity.address.lat}, ${identity.address.lng}
Google Maps 链接 (需代理·谨防送中)：https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(identity.address.street + ', ' + identity.address.city + ', ' + (identity.address.stateFull || identity.address.state) + ' ' + identity.address.postcode)}
OpenStreetMap 链接 (国内免翻·零送中风险)：https://www.openstreetmap.org/?mlat=${identity.address.lat}&mlon=${identity.address.lng}#map=16/${identity.address.lat}/${identity.address.lng}
Bing Maps 链接 (微软直连·安全)：https://www.bing.com/maps?q=${encodeURIComponent(identity.address.street + ', ' + identity.address.city + ', ' + (identity.address.stateFull || identity.address.state) + ' ' + identity.address.postcode)}

=== 本地联系方式 ===
电话号码：${identity.contact.phoneFormatted} (${identity.contact.phone})
电子邮箱：${identity.contact.email} (邮箱为随机生成不可用邮箱地址)
用户名：${identity.contact.username}

=== 本地合规身份/证件 (测试用) ===
${identity.document.typeNameZh}：${identity.document.docNumber}

=== 职业与教育背景 ===
公司名称：${identity.occupation.company}
职务：${identity.occupation.title}
所属行业：${identity.occupation.industry}
毕业院校：${identity.occupation.university}
学历：${identity.occupation.educationDegree}
公司官网：${identity.occupation.website}

=== 虚拟财务卡片 (Luhn 校验合规) ===
卡类型：${identity.finance.cardType}
卡号：${identity.finance.cardFormatted}
有效期：${identity.finance.expMonth}/${identity.finance.expYear}
安全码 (CVV)：${identity.finance.cvv}
发卡行：${identity.finance.bankName}

=== 法律免责声明 / Legal Disclaimer ===
本档案所有姓名、证件、电话与卡号均为纯前端算法伪随机生成的【虚拟测试数据】，仅供软件开发、表单格式校验与排版测试使用，严禁用于任何商业交易、实名认证、欺诈等非法活动。
`.trim();
  }

  // 3. 英文模式 (English Format)
  const avsTierEn = identity.address.source === 'OpenStreetMap'
    ? 'OSM Residential Building · AVS Unverified (© OpenStreetMap contributors, ODbL)'
    : identity.address.addressMode === 'residential'
    ? 'Residential Sample · AVS Unverified'
    : (identity.address.addressMode === 'derivation' ? 'Interpolated Number (unverified)' : 'Bundled Apartment Sample (AVS unverified)');

  const taxRateEn = (identity.address.isTaxFree || (identity.address.taxRate && identity.address.taxRate.includes('免税')))
    ? '0.00% (No Sales Tax)'
    : (identity.address.taxRate || '0.00% (No Sales Tax)');

  const localCountryName = identity.address.country;

  return `
=== Basic Information ===
Full Name: ${identity.basic.fullName}
Gender: ${identity.basic.gender}
Age: ${identity.basic.age}
Date of Birth: ${identity.basic.birthDate}
Blood Type: ${identity.basic.bloodType}
Zodiac: ${identity.basic.zodiacSign}

=== Address Data (check source) ===
Address Scheme Mode: ${identity.address.source === 'OpenStreetMap' ? 'OSM-sourced building' : identity.address.addressMode === 'derivation' ? 'Scheme A: Interpolated Number' : identity.address.addressMode === 'residential' ? 'Scheme B: Residential Sample' : 'Scheme C: Apartment Sample'}
Address Verification: ${avsTierEn}
Country: ${localCountryName} (${identity.address.countryCode})
State/Province: ${identity.address.stateFull || identity.address.state}
City: ${identity.address.city}
Address Line 1: ${identity.address.addressLine1 || identity.address.street}
Address Line 2: ${identity.address.addressLine2 || 'N/A'}
Postal Code: ${identity.address.postcode}
Sales Tax Rate: ${taxRateEn}
Timezone: ${identity.address.timezone || 'UTC'}
Coordinates: ${identity.address.lat}, ${identity.address.lng}
Google Maps URL (Proxy Required · Geo-Shift Warning): https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(identity.address.street + ', ' + identity.address.city + ', ' + (identity.address.stateFull || identity.address.state) + ' ' + identity.address.postcode)}
OpenStreetMap URL (Direct · Zero Risk): https://www.openstreetmap.org/?mlat=${identity.address.lat}&mlon=${identity.address.lng}#map=16/${identity.address.lat}/${identity.address.lng}
Bing Maps URL (Direct · Safe): https://www.bing.com/maps?q=${encodeURIComponent(identity.address.street + ', ' + identity.address.city + ', ' + (identity.address.stateFull || identity.address.state) + ' ' + identity.address.postcode)}

=== Contact Information ===
Phone: ${identity.contact.phoneFormatted} (${identity.contact.phone})
Email: ${identity.contact.email} (Synthetic placeholder, unusable email)
Username: ${identity.contact.username}

=== Compliance Document / Tax ID (Test) ===
${identity.document.typeName}: ${identity.document.docNumber}

=== Employment & Education ===
Company: ${identity.occupation.company}
Job Title: ${identity.occupation.title}
Industry: ${identity.occupation.industry}
University: ${identity.occupation.university}
Education: ${identity.occupation.educationDegree}
Website: ${identity.occupation.website}

=== Test Payment Card (Luhn Validated) ===
Card Brand: ${identity.finance.cardType}
Card Number: ${identity.finance.cardFormatted}
Expiry: ${identity.finance.expMonth}/${identity.finance.expYear}
CVV: ${identity.finance.cvv}
Issuing Bank: ${identity.finance.bankName}

=== Legal Disclaimer & Terms of Use ===
All generated personal data, identification numbers, and cards are 100% synthetic test data produced by client-side algorithms for software testing and UI layout only. Strictly prohibited for real transactions, unauthorized registrations, or fraudulent activities.
`.trim();
}

export function buildCSVContent(identities: GeneratedIdentity[]): string {
  const headers = [
    'Country',
    'Address Mode',
    'Address Verification',
    'Full Name',
    'Local Name',
    'Gender',
    'Age',
    'Birth Date',
    'Phone',
    'Email',
    'Address Line 1',
    'Address Line 2',
    'City',
    'State',
    'Postcode',
    'Tax Rate',
    'Timezone',
    'Latitude',
    'Longitude',
    'Document Type',
    'Document Number',
    'Company',
    'Job Title',
    'University',
    'Card Brand',
    'Card Number',
    'Card Expiry',
    'CVV',
    'OpenStreetMap Source URL',
    'Google Maps URL'
  ];

  const rows = identities.map(id => [
    id.address.country,
    id.address.source === 'OpenStreetMap' ? 'OSM-sourced building' : id.address.addressMode === 'derivation' ? 'Scheme A: Interpolated Number' : id.address.addressMode === 'residential' ? 'Scheme B: Residential Sample' : 'Scheme C: Apartment Sample',
    id.address.source === 'OpenStreetMap'
      ? 'Residential Building (AVS unverified) © OpenStreetMap contributors (ODbL)'
      : id.address.addressMode === 'derivation' ? 'Interpolated Number (unverified)' : id.address.addressMode === 'residential' ? 'Residential Sample (delivery and AVS unverified)' : 'Apartment Sample (delivery and AVS unverified)',
    id.basic.fullName,
    id.basic.localFullName || '',
    id.basic.gender,
    id.basic.age.toString(),
    id.basic.birthDate,
    id.contact.phoneFormatted,
    id.contact.email,
    id.address.addressLine1 || id.address.street,
    id.address.addressLine2 || '',
    id.address.city,
    id.address.stateFull || id.address.state,
    id.address.postcode,
    id.address.taxRate || '',
    id.address.timezone || '',
    id.address.lat.toString(),
    id.address.lng.toString(),
    id.document.typeName,
    id.document.docNumber,
    id.occupation.company,
    id.occupation.title,
    id.occupation.university,
    id.finance.cardType,
    `="${id.finance.cardNumber}"`, // escape for Excel
    `${id.finance.expMonth}/${id.finance.expYear}`,
    id.finance.cvv,
    id.address.sourceId ? `https://www.openstreetmap.org/${id.address.sourceId}` : '',
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(id.address.street + ', ' + id.address.city + ', ' + (id.address.stateFull || id.address.state) + ' ' + id.address.postcode)}`
  ]);

  return '\uFEFF' + [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))
  ].join('\r\n');
}

export function exportToCSV(identities: GeneratedIdentity[], filename = 'identities.csv') {
  const csvContent = buildCSVContent(identities);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

export function exportToJSON(identities: GeneratedIdentity[], filename = 'identities.json') {
  const jsonContent = JSON.stringify(identities, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  downloadBlob(blob, filename);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
