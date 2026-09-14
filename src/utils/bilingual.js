/**
 * Names and descriptions come from the kitchen as one bilingual string,
 * "English || العربية" — one field rather than two, so a record can't be
 * saved with a name in one language and not the other.
 *
 * Rendering it raw puts "Weight loss || نزول وزن" on screen, which reads as a
 * bug in either language. `pick` returns the half matching the reader's
 * language, which is what the app shows.
 */

const SEPARATOR = '||';

/** The English half, or the whole string when there is no Arabic. */
export const en = (value) => {
  if (typeof value !== 'string') return '';
  const [first] = value.split(SEPARATOR);
  return first.trim();
};

/** The Arabic half, or "" when the string carries only one language. */
export const ar = (value) => {
  if (typeof value !== 'string') return '';
  const parts = value.split(SEPARATOR);
  return parts.length > 1 ? parts.slice(1).join(SEPARATOR).trim() : '';
};

/**
 * The half this reader wants.
 *
 * Falls back to the other language rather than showing nothing: a dish the
 * kitchen only named in English is still a dish an Arabic reader is being
 * offered, and a blank line on the menu helps nobody.
 */
export const pick = (value, lang) => {
  if (lang === 'ar') return ar(value) || en(value);
  return en(value) || ar(value);
};

/** Both halves at once, for the rare place that shows the pair together. */
export const split = (value) => ({ en: en(value), ar: ar(value) });
