import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle2, ShieldAlert, ThumbsDown } from 'lucide-react';

import { exclusionService } from '../services/exclusionService';
import { useAuth } from '../context/AuthContext';
import { useT } from '../i18n/useT';
import SignInPrompt from '../components/SignInPrompt';

/**
 * What the kitchen must not put in front of this customer.
 *
 * Two lists, and the difference matters: an allergy is enforced — a week
 * containing one is refused outright — while a dislike only steers the
 * kitchen when it fills a week on the customer's behalf. Presenting them as
 * one list would let someone mark a real allergy as a preference.
 */
export default function Restrictions() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { t, L, isArabic } = useT();

  const [catalog, setCatalog] = useState([]);
  const [forbidden, setForbidden] = useState([]);
  const [disliked, setDisliked] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');


  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([exclusionService.getCatalog(), exclusionService.getMine()])
      .then(([catRes, mineRes]) => {
        setCatalog(catRes.data || []);
        const mine = mineRes.data || {};
        setForbidden(mine.forbidden || []);
        setDisliked(mine.disliked || []);
        setNotes(mine.notes || '');
      })
      .catch((err) => setError(err?.message || 'Could not load your restrictions.'))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const toggle = useCallback((list, setList, otherList, setOther, id) => {
    setSaved('');
    if (list.includes(id)) {
      setList(list.filter((x) => x !== id));
      return;
    }
    // The same food cannot be both an allergy and a mere dislike; marking it
    // as one takes it out of the other rather than leaving both true.
    if (otherList.includes(id)) setOther(otherList.filter((x) => x !== id));
    setList([...list, id]);
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved('');
    try {
      await exclusionService.setMine({ forbidden, disliked, notes });
      setSaved(t('restrictionsSaved'));
    } catch (err) {
      setError(err?.message || 'Could not save your restrictions.');
    } finally {
      setSaving(false);
    }
  };

  // Session first. Only once we know they are a guest can the ask be
  // shown - and it must come before any data gate, because the data these
  // pages load is exactly what a guest never fetches, so `loading` would
  // stay true forever and leave them on a spinner that never resolves.
  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return <SignInPrompt reason={t('authGateGeneric')} />;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bg text-text py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl font-extrabold mb-1">{t('restrictionsTitle')}</h1>
        <p className="text-text-secondary text-sm mb-6">{t('restrictionsGroupHint')}</p>

        {error && (
          <div className="flex items-start gap-2 p-4 mb-5 rounded-xl bg-error/10 text-error text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 p-4 mb-5 rounded-xl bg-success/10 text-success text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saved}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-error/5 border border-error/20">
            <ShieldAlert className="w-4 h-4 text-error mt-0.5 shrink-0" />
            <span>
              <strong className="block text-text">{t('cantEat')}</strong>
              <span className="text-text-secondary">{t('allergyExplain')}</span>
            </span>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-xl bg-surface border border-border">
            <ThumbsDown className="w-4 h-4 text-text-secondary mt-0.5 shrink-0" />
            <span>
              <strong className="block text-text">{t('ratherNot')}</strong>
              <span className="text-text-secondary">{t('dislikeExplain')}</span>
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {catalog.map((group) => (
            <section
              key={group.id}
              className="rounded-2xl border border-border bg-surface overflow-hidden"
            >
              <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
                <h2 className="font-bold text-sm">
                  {isArabic ? group.ar || group.en : group.en}
                </h2>
                <TogglePair
                  id={group.id}
                  forbidden={forbidden}
                  disliked={disliked}
                  onForbid={() =>
                    toggle(forbidden, setForbidden, disliked, setDisliked, group.id)
                  }
                  onDislike={() =>
                    toggle(disliked, setDisliked, forbidden, setForbidden, group.id)
                  }
                  wholeGroup
                />
              </header>

              <ul className="divide-y divide-border">
                {(group.items || []).map((item) => {
                  // A group marked whole covers its items; showing them as
                  // individually unticked would misrepresent what was saved.
                  const covered =
                    forbidden.includes(group.id) || disliked.includes(group.id);
                  return (
                    <li
                      key={item.id}
                      className={`flex items-center justify-between gap-3 px-4 py-2.5 ${
                        covered ? 'opacity-40' : ''
                      }`}
                    >
                      <p className="text-sm truncate min-w-0">
                        {isArabic ? item.ar || item.en : item.en}
                      </p>
                      <TogglePair
                        id={item.id}
                        forbidden={forbidden}
                        disliked={disliked}
                        disabled={covered}
                        onForbid={() =>
                          toggle(forbidden, setForbidden, disliked, setDisliked, item.id)
                        }
                        onDislike={() =>
                          toggle(disliked, setDisliked, forbidden, setForbidden, item.id)
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
          <label className="block text-xs font-semibold mb-1.5">{t('kitchenNotes')}</label>
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setSaved('');
            }}
            rows={3}
            maxLength={500}
            placeholder={t('notesExample')}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-sm focus:outline-none focus:border-primary resize-none"
          />
          <p className="text-xs text-text-secondary mt-1 text-right">
            {notes.length}/500
          </p>
        </div>

        <div className="sticky bottom-4 mt-6">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-on-primary text-sm font-bold transition-colors disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save restrictions
          </button>
        </div>
      </div>
    </div>
  );
}

function TogglePair({
  id,
  forbidden,
  disliked,
  onForbid,
  onDislike,
  disabled = false,
  wholeGroup = false,
}) {
  // This component sits outside the page component, so it needs its own
  // translator. Without it every render of the restrictions list threw
  // "t is not defined" and the whole page came out blank.
  const { t } = useT();
  const isForbidden = forbidden.includes(id);
  const isDisliked = disliked.includes(id);

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        onClick={onForbid}
        disabled={disabled}
        title={wholeGroup ? t('cantEatAny') : t('cantEat')}
        className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors disabled:cursor-not-allowed ${
          isForbidden
            ? 'border-error bg-error/10 text-error'
            : 'border-border text-text-secondary hover:border-error/40'
        }`}
      >{t('cantEat')}</button>
      <button
        type="button"
        onClick={onDislike}
        disabled={disabled}
        title={wholeGroup ? t('ratherNotAny') : t('ratherNot')}
        className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors disabled:cursor-not-allowed ${
          isDisliked
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border text-text-secondary hover:border-primary/40'
        }`}
      >{t('ratherNot')}</button>
    </div>
  );
}
