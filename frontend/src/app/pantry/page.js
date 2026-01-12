'use client';
import React from 'react';
import Link from 'next/link';

export default function PantryPage() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', background: '#fffaf0' }}>
      
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🫙 🌶️ 🥨</div>
      
      <h1 style={{ fontSize: '3rem', fontWeight: '800', color: '#1f2937', marginBottom: '1rem' }}>
        The Pantry is <span style={{ color: '#FF9801' }}>Coming Soon!</span>
      </h1>
      
      <p style={{ maxWidth: '600px', fontSize: '1.2rem', color: '#666', marginBottom: '2rem', lineHeight: '1.6' }}>
        We are crafting a special range of homemade <strong>Pickles, Chutney Podis, and Healthy Snacks</strong>. No preservatives, just like grandma's recipe.
      </p>

      {/* Waitlist Form */}
      <div style={{ display: 'flex', gap: '10px', maxWidth: '400px', width: '100%', marginBottom: '2rem' }}>
        <input type="email" placeholder="Enter your email for early access" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
        <button style={{ background: '#1f2937', color: 'white', padding: '12px 20px', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Notify Me</button>
      </div>

      <Link href="/" style={{ color: '#FF9801', fontWeight: '600', textDecoration: 'none' }}>
        ← Return to Meal Plans
      </Link>
    </div>
  );
}