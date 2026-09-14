/**
 * What a delivery costs, and whether we deliver there at all.
 *
 * The server is the authority — `POST /order` refuses an unserved area and a
 * basket under the zone's minimum, and adds the fee to the total itself. This
 * mirrors those same rules on the client so the customer learns about them
 * while they can still act on it, rather than as a refusal after pressing
 * "place order".
 *
 * An area belongs to exactly one zone, enforced when zones are saved, so an
 * address always resolves to a single fee with no precedence rules.
 */

/** The zone serving an area id, or null when nothing covers it. */
export const zoneForArea = (zones, areaId) => {
  if (!areaId) return null;
  return (zones || []).find((z) => (z.areas || []).includes(areaId)) || null;
};

/**
 * Delivery for this basket in this zone.
 *
 * Returns `fee: 0` with `free: true` once the subtotal clears the zone's
 * free-delivery threshold, so the UI can say why it is free instead of just
 * showing nothing.
 */
export const deliveryFor = (zone, subtotal = 0) => {
  if (!zone) return { fee: 0, free: true, threshold: 0 };

  const threshold = Number(zone.freeDeliveryAbove) || 0;
  const fee = Number(zone.deliveryFee) || 0;
  const free = threshold > 0 && subtotal >= threshold;

  return { fee: free ? 0 : fee, free, threshold };
};

/**
 * Why this basket cannot be ordered yet, if anything.
 *
 * `unserved` only applies once zones exist: until the kitchen configures any,
 * every Kuwaiti address is accepted and delivery is free — the server behaves
 * the same way, so an unconfigured deployment must not start refusing orders.
 */
export const blockingIssue = ({ zones, areaId, subtotal = 0 }) => {
  const configured = (zones || []).length > 0;
  if (!configured) return null;

  // No address picked yet is not a verdict about an area. Treating it as one
  // told a customer with an empty address book "we don't deliver to that area
  // yet" before they had named an area at all — an answer to a question
  // nobody asked, and a discouraging one. Callers block an empty address on
  // its own terms.
  if (!areaId) return null;

  const zone = zoneForArea(zones, areaId);
  if (!zone) return { kind: 'unserved' };

  const min = Number(zone.minOrder) || 0;
  if (min > 0 && subtotal < min) {
    return { kind: 'belowMinimum', zone, minimum: min, short: min - subtotal };
  }

  return null;
};
