'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [devLink, setDevLink] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('sent');
        setMessage(data.message);
        if (data.devLink) setDevLink(data.devLink);
      } else {
        setStatus('error');
        setMessage(data.error);
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-[--color-primary] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">👁</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Comp<span className="text-[--color-primary]">Watch</span></span>
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          {status === 'sent' ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📧</div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Check your email</h1>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">We sent a sign-in link to <strong>{email}</strong></p>
              {devLink && (
                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-xs text-yellow-700 mb-2">Dev mode (no email configured):</p>
                  <a href={devLink} className="text-sm text-[--color-primary] font-mono break-all hover:underline">{devLink}</a>
                </div>
              )}
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-900 mb-2 text-center">Sign in to CompWatch</h1>
              <p className="text-gray-500 text-sm text-center mb-6">Enter your email — we'll send a magic link.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[--color-primary] focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-3 bg-[--color-primary] text-white rounded-xl font-semibold hover:bg-[--color-primary-dark] disabled:opacity-50"
                >
                  {status === 'loading' ? 'Sending...' : 'Send Magic Link →'}
                </button>
              </form>

              {status === 'error' && <p className="mt-4 text-red-500 text-sm text-center">{message}</p>}

              <p className="mt-6 text-center text-xs text-gray-400">
                No account? One will be created automatically.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
