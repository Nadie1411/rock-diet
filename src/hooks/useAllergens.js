import { useCallback, useEffect, useState } from 'react';

import { exclusionService } from '../services/exclusionService';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/useT';
import { conflictsFor, expandExclusions, labelList } from '../utils/allergens';

/**
 * The customer's allergies, ready to test a meal against.
 *
 * The catalogue is the same for everybody and never changes within a session,
 * so it is fetched once and shared — every menu card asking for it separately
 * would be a request per render for a list of ingredient names.
 *
 * Everything fails quiet: an allergy warning that cannot load must not take
 * the menu down with it. `known` on each verdict says whether the answer is
 * trustworthy, so a page can tell "no allergens" apart from "we could not
 * check".
 */
let catalogCache = null;
let catalogPromise = null;

const loadCatalog = () => {
  if (catalogCache) return Promise.resolve(catalogCache);
  if (!catalogPromise) {
    catalogPromise = exclusionService
      .getCatalog()
      .then((res) => {
        catalogCache = res.data || [];
        return catalogCache;
      })
      .catch(() => {
        catalogPromise = null;
        return [];
      });
  }
  return catalogPromise;
};

export function useAllergens() {
  const { isAuthenticated } = useAuth();
  const { lang } = useT();

  const [catalog, setCatalog] = useState(catalogCache || []);
  const [excluded, setExcluded] = useState(() => new Set());
  const [avoided, setAvoided] = useState(() => new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const cat = await loadCatalog();
      if (cancelled) return;
      setCatalog(cat);

      if (!isAuthenticated) {
        setExcluded(new Set());
        setAvoided(new Set());
        setReady(true);
        return;
      }

      try {
        const res = await exclusionService.getMine();
        if (cancelled) return;
        // Kept apart on purpose. `forbidden` is an allergy and warns in red;
        // `disliked` is only a preference. Showing them the same way would
        // blunt the one that means "this could hurt me".
        setExcluded(expandExclusions(res.data?.forbidden || [], cat));
        setAvoided(expandExclusions(res.data?.disliked || [], cat));
      } catch {
        if (!cancelled) {
          setExcluded(new Set());
          setAvoided(new Set());
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  /** What this meal contains that the customer excluded. */
  const check = useCallback(
    (product) => {
      const { known, hits } = conflictsFor(product, excluded);
      const soft = conflictsFor(product, avoided).hits;
      return {
        known,
        hits,
        unsafe: hits.length > 0,
        label: labelList(hits, catalog, lang),
        disliked: soft,
        dislikedLabel: labelList(soft, catalog, lang),
      };
    },
    [excluded, avoided, catalog, lang],
  );

  return { check, ready, hasAllergies: excluded.size > 0 };
}
