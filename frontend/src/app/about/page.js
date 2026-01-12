'use client';
import React from 'react';
import Image from 'next/image';
import { ShieldCheck, Heart, Users, CheckCircle } from 'lucide-react';

export default function AboutPage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      
      {/* 1. Hero Section */}
      <section style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1f2937', marginBottom: '1rem' }}>
          More Than Just a <span style={{ color: '#FF9801' }}>Tiffin Service</span>
        </h1>
        <p style={{ maxWidth: '700px', margin: '0 auto', fontSize: '1.1rem', color: '#4b5563', lineHeight: '1.6' }}>
          HomelyKhana was started with a simple mission: To deliver food that tastes exactly like it was made in your mother’s kitchen—fresh, safe, and full of love.
        </p>
      </section>

      {/* 2. Our Story / Mission */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center', marginBottom: '80px' }}>
        <div style={{ position: 'relative', height: '400px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          {/* Replace with actual image of kitchen/founder */}
          <Image src="/why-us-1.jpg" alt="Our Kitchen" fill style={{ objectFit: 'cover' }} />
        </div>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1.5rem', color: '#111827' }}>The Homely Promise</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={featureStyle}>
              <div style={iconBox('#fee2e2')}><Heart size={24} color="#dc2626" /></div>
              <div>
                <h3 style={featureTitle}>Zero Preservatives</h3>
                <p style={featureText}>We never use artificial colors, tasting salts (MSG), or frozen bases. Freshly chopped vegetables, every single morning.</p>
              </div>
            </div>
            <div style={featureStyle}>
              <div style={iconBox('#ecfccb')}><ShieldCheck size={24} color="#65a30d" /></div>
              <div>
                <h3 style={featureTitle}>FSSAI Certified Kitchen</h3>
                <p style={featureText}>Our kitchen follows strict hygiene protocols. Hairnets, gloves, and daily deep cleaning are mandatory.</p>
              </div>
            </div>
            <div style={featureStyle}>
              <div style={iconBox('#e0f2fe')}><Users size={24} color="#0284c7" /></div>
              <div>
                <h3 style={featureTitle}>Community First</h3>
                <p style={featureText}>We source ingredients from local farmers and employ home-chefs who understand the nuance of Indian cooking.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Stats Section */}
      <section style={{ background: '#fff7ed', padding: '40px', borderRadius: '20px', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px', textAlign: 'center' }}>
        <div>
          <h3 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#FF9801' }}>10k+</h3>
          <p style={{ color: '#666', fontWeight: '600' }}>Happy Meals Delivered</p>
        </div>
        <div>
          <h3 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#FF9801' }}>500+</h3>
          <p style={{ color: '#666', fontWeight: '600' }}>Active Subscribers</p>
        </div>
        <div>
          <h3 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#FF9801' }}>4.8</h3>
          <p style={{ color: '#666', fontWeight: '600' }}>Average Rating</p>
        </div>
      </section>

    </div>
  );
}

// Inline styles for cleaner code
const featureStyle = { display: 'flex', gap: '15px', alignItems: 'flex-start' };
const iconBox = (bg) => ({ minWidth: '50px', height: '50px', background: bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' });
const featureTitle = { fontSize: '1.1rem', fontWeight: '700', color: '#374151', margin: '0 0 5px 0' };
const featureText = { fontSize: '0.95rem', color: '#6b7280', lineHeight: '1.5', margin: 0 };