import { useEffect, useState } from 'react';

import { settingsService } from '../services/settingsService';

/**
 * How to reach the kitchen, as configured in the admin panel.
 *
 * The API has carried a support phone, WhatsApp number and email for a while,
 * and the panel has had a field for each — but the website never read them,
 * so the only door was a call-back form. This is the missing read.
 *
 * WhatsApp gets a ready-made `wa.me` link. Those want the number as bare
 * digits with the country code and nothing else, while a number typed into a
 * settings form arrives however a person writes it — "+965 9558 9850",
 * "9558 9850", "00965…". Normalised here once, so every button agrees.
 */
const KUWAIT = '965';

export const whatsappLink = (raw, message = '') => {
  let digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('00')) digits = digits.slice(2);
  // A local Kuwaiti mobile is eight digits; anything that short has no
  // country code on it yet.
  if (digits.length === 8) digits = KUWAIT + digits;

  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${text}`;
};

let cached = null;

export function useSupportContact() {
  const [contact, setContact] = useState(cached);

  useEffect(() => {
    if (cached) return;
    let mounted = true;

    settingsService
      .getPublicSettings()
      .then((res) => {
        const s = res?.data || {};
        cached = {
          phone: s.supportPhone || '',
          whatsapp: s.supportWhatsapp || '',
          email: s.supportEmail || '',
        };
        if (mounted) setContact(cached);
      })
      .catch(() => {
        // No settings, no contact details — the call-back form still works.
        if (mounted) setContact({ phone: '', whatsapp: '', email: '' });
      });

    return () => {
      mounted = false;
    };
  }, []);

  const whatsapp = contact?.whatsapp || '';

  return {
    ...(contact || { phone: '', whatsapp: '', email: '' }),
    loaded: contact !== null,
    whatsappUrl: whatsapp ? whatsappLink(whatsapp) : null,
  };
}
