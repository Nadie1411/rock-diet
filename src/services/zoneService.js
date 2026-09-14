import { api } from './api';

/**
 * Delivery zones.
 *
 * Public — the app needs to know where deliveries go, and what they cost,
 * before anyone signs in. An area belongs to exactly one zone, so an address
 * always resolves to a single fee with no precedence rules.
 */
export const zoneService = {
  getZones: () => api.get('zone'),
};
