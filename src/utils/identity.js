/**
 * Signing in with whichever of the two a customer has.
 *
 * Accounts entered by the office have a phone number and, very often, no
 * email at all — Rock Diet takes most of its orders on WhatsApp. So the sign-in
 * box asks for "email or phone" and works out which was typed, rather than
 * making someone pick a tab before they can start.
 *
 * An "@" is the whole test. It cannot appear in a phone number and cannot be
 * missing from an email address, so nothing subtler is needed or wanted: a
 * rule that guesses can only guess wrong, and being told "no such account"
 * when you typed your own number is indistinguishable from a broken password.
 */
export function identityOf(value) {
  const typed = String(value ?? '').trim();
  if (!typed) return null;

  return typed.includes('@')
    ? { email: typed.toLowerCase() }
    : { phone: typed };
}
