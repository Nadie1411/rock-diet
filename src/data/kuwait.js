/**
 * Kuwait's governorates and their areas.
 *
 * Copied from `admin/src/data/seed.json`, which is generated from the Flutter
 * app's `lib/data/models/kuwait.dart` — so the website, the panel and the app
 * name the same places by the same ids. Delivery zones are built out of these
 * ids, and an order's area is matched by id, which is why they are not edited
 * here by hand.
 *
 * The ids are the ones the API knows. The names are only ever displayed.
 */

export const GOVERNORATES = [
  { id: "asimah", en: "Capital", ar: "العاصمة" },
  { id: "hawalli", en: "Hawalli", ar: "حولي" },
  { id: "farwaniya", en: "Farwaniya", ar: "الفروانية" },
  { id: "mubarakAlKabeer", en: "Mubarak Al-Kabeer", ar: "مبارك الكبير" },
  { id: "ahmadi", en: "Ahmadi", ar: "الأحمدي" },
  { id: "jahra", en: "Jahra", ar: "الجهراء" },
];

export const AREAS = [
  { id: "kuwait-city", governorate: "asimah", en: "Kuwait City", ar: "مدينة الكويت" },
  { id: "sharq", governorate: "asimah", en: "Sharq", ar: "شرق" },
  { id: "mirqab", governorate: "asimah", en: "Mirqab", ar: "المرقاب" },
  { id: "dasman", governorate: "asimah", en: "Dasman", ar: "دسمان" },
  { id: "bneid-al-qar", governorate: "asimah", en: "Bneid Al-Qar", ar: "بنيد القار" },
  { id: "kaifan", governorate: "asimah", en: "Kaifan", ar: "كيفان" },
  { id: "mansouriya", governorate: "asimah", en: "Mansouriya", ar: "المنصورية" },
  { id: "abdullah-al-salem", governorate: "asimah", en: "Abdullah Al-Salem", ar: "عبدالله السالم" },
  { id: "nuzha", governorate: "asimah", en: "Nuzha", ar: "النزهة" },
  { id: "faiha", governorate: "asimah", en: "Faiha", ar: "الفيحاء" },
  { id: "shamiya", governorate: "asimah", en: "Shamiya", ar: "الشامية" },
  { id: "rawda", governorate: "asimah", en: "Rawda", ar: "الروضة" },
  { id: "adailiya", governorate: "asimah", en: "Adailiya", ar: "العديلية" },
  { id: "khaldiya", governorate: "asimah", en: "Khaldiya", ar: "الخالدية" },
  { id: "qadsiya", governorate: "asimah", en: "Qadsiya", ar: "القادسية" },
  { id: "qortuba", governorate: "asimah", en: "Qortuba", ar: "قرطبة" },
  { id: "surra", governorate: "asimah", en: "Surra", ar: "السرة" },
  { id: "yarmouk", governorate: "asimah", en: "Yarmouk", ar: "اليرموك" },
  { id: "shuwaikh", governorate: "asimah", en: "Shuwaikh", ar: "الشويخ" },
  { id: "jaber-al-ahmad", governorate: "asimah", en: "Jaber Al-Ahmad", ar: "جابر الأحمد" },
  { id: "sulaibikhat", governorate: "asimah", en: "Sulaibikhat", ar: "الصليبيخات" },
  { id: "doha", governorate: "asimah", en: "Doha", ar: "الدوحة" },
  { id: "hawalli", governorate: "hawalli", en: "Hawalli", ar: "حولي" },
  { id: "salmiya", governorate: "hawalli", en: "Salmiya", ar: "السالمية" },
  { id: "rumaithiya", governorate: "hawalli", en: "Rumaithiya", ar: "الرميثية" },
  { id: "bayan", governorate: "hawalli", en: "Bayan", ar: "بيان" },
  { id: "mishref", governorate: "hawalli", en: "Mishref", ar: "مشرف" },
  { id: "salwa", governorate: "hawalli", en: "Salwa", ar: "سلوى" },
  { id: "jabriya", governorate: "hawalli", en: "Jabriya", ar: "الجابرية" },
  { id: "shaab", governorate: "hawalli", en: "Shaab", ar: "الشعب" },
  { id: "zahra", governorate: "hawalli", en: "Zahra", ar: "الزهراء" },
  { id: "hitteen", governorate: "hawalli", en: "Hitteen", ar: "حطين" },
  { id: "shuhada", governorate: "hawalli", en: "Shuhada", ar: "الشهداء" },
  { id: "salam", governorate: "hawalli", en: "Salam", ar: "السلام" },
  { id: "siddiq", governorate: "hawalli", en: "Siddiq", ar: "الصديق" },
  { id: "mubarak-al-abdullah", governorate: "hawalli", en: "Mubarak Al-Abdullah", ar: "مبارك العبدالله" },
  { id: "bidaa", governorate: "hawalli", en: "Bidaa", ar: "البدع" },
  { id: "farwaniya", governorate: "farwaniya", en: "Farwaniya", ar: "الفروانية" },
  { id: "khaitan", governorate: "farwaniya", en: "Khaitan", ar: "خيطان" },
  { id: "jleeb", governorate: "farwaniya", en: "Jleeb Al-Shuyoukh", ar: "جليب الشيوخ" },
  { id: "ardiya", governorate: "farwaniya", en: "Ardiya", ar: "العارضية" },
  { id: "rabiya", governorate: "farwaniya", en: "Rabiya", ar: "الرابية" },
  { id: "andalous", governorate: "farwaniya", en: "Andalous", ar: "الأندلس" },
  { id: "rehab", governorate: "farwaniya", en: "Rehab", ar: "الرحاب" },
  { id: "firdous", governorate: "farwaniya", en: "Firdous", ar: "الفردوس" },
  { id: "omariya", governorate: "farwaniya", en: "Omariya", ar: "العمرية" },
  { id: "riggae", governorate: "farwaniya", en: "Riggae", ar: "الرقعي" },
  { id: "abdullah-al-mubarak", governorate: "farwaniya", en: "Abdullah Al-Mubarak", ar: "عبدالله المبارك" },
  { id: "sabah-al-nasser", governorate: "farwaniya", en: "Sabah Al-Nasser", ar: "صباح الناصر" },
  { id: "ishbiliya", governorate: "farwaniya", en: "Ishbiliya", ar: "إشبيلية" },
  { id: "mubarak-al-kabeer", governorate: "mubarakAlKabeer", en: "Mubarak Al-Kabeer", ar: "مبارك الكبير" },
  { id: "sabah-al-salem", governorate: "mubarakAlKabeer", en: "Sabah Al-Salem", ar: "صباح السالم" },
  { id: "adan", governorate: "mubarakAlKabeer", en: "Adan", ar: "العدان" },
  { id: "qurain", governorate: "mubarakAlKabeer", en: "Qurain", ar: "القرين" },
  { id: "qusour", governorate: "mubarakAlKabeer", en: "Qusour", ar: "القصور" },
  { id: "messila", governorate: "mubarakAlKabeer", en: "Messila", ar: "المسيلة" },
  { id: "abu-ftaira", governorate: "mubarakAlKabeer", en: "Abu Ftaira", ar: "أبو فطيرة" },
  { id: "fnaitees", governorate: "mubarakAlKabeer", en: "Fnaitees", ar: "الفنيطيس" },
  { id: "sabhan", governorate: "mubarakAlKabeer", en: "Sabhan", ar: "صبحان" },
  { id: "wista", governorate: "mubarakAlKabeer", en: "Wista", ar: "الوسطى" },
  { id: "ahmadi", governorate: "ahmadi", en: "Ahmadi", ar: "الأحمدي" },
  { id: "fahaheel", governorate: "ahmadi", en: "Fahaheel", ar: "الفحيحيل" },
  { id: "mangaf", governorate: "ahmadi", en: "Mangaf", ar: "المنقف" },
  { id: "abu-halifa", governorate: "ahmadi", en: "Abu Halifa", ar: "أبو حليفة" },
  { id: "fintas", governorate: "ahmadi", en: "Fintas", ar: "الفنطاس" },
  { id: "mahboula", governorate: "ahmadi", en: "Mahboula", ar: "المهبولة" },
  { id: "egaila", governorate: "ahmadi", en: "Egaila", ar: "العقيلة" },
  { id: "sabahiya", governorate: "ahmadi", en: "Sabahiya", ar: "الصباحية" },
  { id: "riqqa", governorate: "ahmadi", en: "Riqqa", ar: "الرقة" },
  { id: "hadiya", governorate: "ahmadi", en: "Hadiya", ar: "هدية" },
  { id: "jaber-al-ali", governorate: "ahmadi", en: "Jaber Al-Ali", ar: "جابر العلي" },
  { id: "wafra", governorate: "ahmadi", en: "Wafra", ar: "الوفرة" },
  { id: "khiran", governorate: "ahmadi", en: "Khiran", ar: "الخيران" },
  { id: "sabah-al-ahmad", governorate: "ahmadi", en: "Sabah Al-Ahmad", ar: "صباح الأحمد" },
  { id: "jahra", governorate: "jahra", en: "Jahra", ar: "الجهراء" },
  { id: "saad-al-abdullah", governorate: "jahra", en: "Saad Al-Abdullah", ar: "سعد العبدالله" },
  { id: "naeem", governorate: "jahra", en: "Naeem", ar: "النعيم" },
  { id: "nasseem", governorate: "jahra", en: "Nasseem", ar: "النسيم" },
  { id: "oyoun", governorate: "jahra", en: "Oyoun", ar: "العيون" },
  { id: "qasr", governorate: "jahra", en: "Qasr", ar: "القصر" },
  { id: "waha", governorate: "jahra", en: "Waha", ar: "الواحة" },
  { id: "taima", governorate: "jahra", en: "Taima", ar: "تيماء" },
  { id: "sulaibiya", governorate: "jahra", en: "Sulaibiya", ar: "الصليبية" },
  { id: "amghara", governorate: "jahra", en: "Amghara", ar: "أمغرة" },
  { id: "kabd", governorate: "jahra", en: "Kabd", ar: "كبد" },
];

const AREA_BY_ID = new Map(AREAS.map((a) => [a.id, a]));
const GOV_BY_ID = new Map(GOVERNORATES.map((g) => [g.id, g]));

export const areaById = (id) => AREA_BY_ID.get(id) || null;

export const governorateById = (id) => GOV_BY_ID.get(id) || null;

/** The governorate an area sits in, for opening an edit on the right one. */
export const governorateOfArea = (areaId) => areaById(areaId)?.governorate || '';

export const areasIn = (governorateId) =>
  AREAS.filter((a) => a.governorate === governorateId);

/** A governorate or an area in the reader's language. */
export const placeName = (place, isArabic) =>
  (isArabic ? place?.ar : place?.en) || place?.en || '';
