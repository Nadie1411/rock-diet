import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  MessageSquareText,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Headphones,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supportService } from '../services/supportService';
import { useT } from '../i18n/useT';

export default function CustomerService() {
  const { t, L } = useT();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [phone, setPhone] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phone.trim()) {
      setError(t('enterPhoneCallback'));
      return;
    }
    if (query.trim().length < 5) {
      setError(t('describeQuestion'));
      return;
    }

    setLoading(true);
    try {
      await supportService.submitTicket({
        phone: phone.trim(),
        query: query.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      if (err.data?.error?.length) {
        setError(err.data.error.map((e) => e.message).join(' '));
      } else if (err instanceof Error && err.message && !err.message.includes('Failed to fetch')) {
        setError(err.message);
      } else {
        setError(t('networkErrorLong'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-bg text-text py-12">
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />{t('commonBack')}</button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <Headphones className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text">
            {t('headingSupport')}
          </h1>
          <p className="text-text-secondary text-sm mt-1">{t('supportIntro')}</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          {submitted ? (
            /* Success state */
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 text-success mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-extrabold text-text">{t('requestReceived')}</h2>
              <p className="text-text-secondary text-sm mt-2 leading-relaxed">
                Thank you for reaching out. Our customer service team will call
                you on <span className="font-bold text-text">{phone}</span> as
                soon as possible.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setQuery('');
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-bg border border-border text-text text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
                >{t('sendAnotherRequest')}</button>
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-light text-white text-sm font-bold transition-all duration-200 shadow-sm"
                >{t('checkoutBackHome')}</button>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 flex items-start gap-2 bg-error/10 text-error text-xs font-semibold px-4 py-3 rounded-lg border border-error/20">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {!isAuthenticated && (
                <div className="mb-6 flex items-start gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-3 rounded-lg border border-primary/20">
                  <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{t('csNoAccountNeeded')}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-text mb-1.5">{t('yourPhoneNumber')}</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+965 XXXX XXXX"
                      maxLength={20}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bg border border-border text-text text-sm placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Query */}
                <div>
                  <label htmlFor="query" className="block text-xs font-semibold text-text mb-1.5">{t('howCanWeHelp')}</label>
                  <div className="relative">
                    <MessageSquareText className="absolute left-3.5 top-3.5 w-4 h-4 text-text-secondary" />
                    <textarea
                      id="query"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t('writeQuestion')}
                      rows={5}
                      maxLength={1000}
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-bg border border-border text-text text-sm placeholder:text-text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-text-secondary text-right mt-1">
                    {query.length}/1000
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-light text-white text-sm font-bold transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />{t('sending')}</>
                  ) : (
                    <>
                      <Headphones className="w-4 h-4" />{t('requestCallback')}</>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
