/**
 * Whether a meal contains something this customer must not eat.
 *
 * The server owns this decision — `weekplan.service.js` refuses a week that
 * contains an allergen. This mirrors the same rule on the client so a customer
 * is told while they are still choosing, rather than being refused at the end.
 *
 * Two details matter, and getting either wrong makes the answer worse than
 * useless:
 *
 * 1. Ingredients are *ids* (`['chicken', 'rice', 'onion']`), not prose. They
 *    are matched exactly. Substring matching would call "egg" a match inside
 *    "eggplant" — a false alarm on an allergy warning teaches people to
 *    ignore it.
 *
 * 2. A customer may exclude a whole group. Someone who cannot tolerate dairy
 *    ticks "dairy", not milk and laban and cheese and yoghurt one at a time.
 *    The group has to be expanded to its members or the exclusion silently
 *    matches nothing, which is the most dangerous way to be wrong.
 */

/** Every ingredient id a customer's selection covers, groups expanded. */
export const expandExclusions = (ids = [], catalog = []) => {
  const members = new Map(
    catalog.map((g) => [g.id, (g.items || []).map((i) => i.id)]),
  );

  const out = new Set();
  for (const id of ids) {
    out.add(id);
    for (const member of members.get(id) || []) out.add(member);
  }
  return out;
};

/**
 * The ingredient ids in this product that the customer excluded.
 *
 * `known: false` means nobody recorded what is in the meal — which is "we
 * cannot tell", not "safe". Saying a meal is safe on the strength of a
 * missing field is the one answer here that can hurt somebody.
 */
export const conflictsFor = (product, excluded) => {
  const list = Array.isArray(product?.ingredients) ? product.ingredients : [];
  if (!list.length) return { known: false, hits: [] };
  if (!excluded || !excluded.size) return { known: true, hits: [] };

  return { known: true, hits: list.filter((i) => excluded.has(i)) };
};

/** The customer's own word for an ingredient, in the language they are reading. */
export const labelOf = (id, catalog = [], lang = 'en') => {
  for (const group of catalog) {
    if (group.id === id) return (lang === 'ar' ? group.ar : group.en) || id;
    for (const item of group.items || []) {
      if (item.id === id) return (lang === 'ar' ? item.ar : item.en) || id;
    }
  }
  return id;
};

/** "chicken, milk" in the reader's language, for a one-line warning. */
export const labelList = (ids = [], catalog = [], lang = 'en') =>
  ids
    .map((id) => labelOf(id, catalog, lang))
    .join(lang === 'ar' ? '، ' : ', ');
