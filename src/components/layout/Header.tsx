'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[--color-primary] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">👁</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Comp<span className="text-[--color-primary]">Watch</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/pricing" className="hover:text-[--color-primary]">Pricing</Link>
          <Link href="/blog" className="hover:text-[--color-primary]">Blog</Link>
          <Link href="/about" className="hover:text-[--color-primary]">About</Link>
          <Link href="/login" className="hover:text-[--color-primary]">Sign In</Link>
          <Link href="/dashboard" className="px-4 py-2 bg-[--color-primary] text-white rounded-lg hover:bg-[--color-primary-dark] font-semibold">Dashboard →</Link>
        </nav>
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} /></svg>
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-3">
          <Link href="/pricing" className="block text-gray-700" onClick={() => setOpen(false)}>Pricing</Link>
          <Link href="/blog" className="block text-gray-700" onClick={() => setOpen(false)}>Blog</Link>
          <Link href="/about" className="block text-gray-700" onClick={() => setOpen(false)}>About</Link>
          <Link href="/login" className="block text-gray-700" onClick={() => setOpen(false)}>Sign In</Link>
          <Link href="/dashboard" className="block bg-[--color-primary] text-white text-center rounded-lg py-2 font-semibold" onClick={() => setOpen(false)}>Dashboard →</Link>
        </div>
      )}
    </header>
  );
}
