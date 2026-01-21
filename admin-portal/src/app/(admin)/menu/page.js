'use client';

import React from 'react';
import Link from 'next/link';
import { Quote, Star, ArrowRight, Users, Heart, ChefHat } from 'lucide-react';
// We import styles from the module you created in the previous step
import styles from './page.module.css';

export default function AboutPage() {
  return (
    <div className={styles.pageContainer}>
      
      {/* --- HERO: The "Stolen Tiffin" Hook --- */}
      <div className={styles.heroSection}>
        <div className={styles.maxWidthWrapper}>
            <div className={styles.gridTwo}>
                
                {/* Text Side */}
                <div>
                    <div className={styles.pillBadge}>
                        <Star size={12} fill="currentColor" /> The Origin Story
                    </div>
                    
                    <h1 className={styles.heroTitle}>
                        It started with a <br/>
                        <span className={styles.stolenWrapper}>
                            <span className={styles.stolenText}>stolen</span>
                            <svg className={styles.underlineSvg} viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                            </svg>
                        </span> 
                        tiffin box.
                    </h1>
                    
                    <p className={styles.heroSubtitle}>
                        How a sister&apos;s love and a hungry Ola office turned a simple lunch dabba into Bangalore&apos;s favorite homely meal service.
                    </p>
                </div>

                {/* Image Side - The "Hero" Dabba */}
                <div className={styles.heroImageWrapper}>
                    <div className={styles.heroImageFrame}>
                        {/* FIX: Using standard <img> to prevent 404 upstream errors */}
                        <img 
                            src="https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=1000&auto=format&fit=crop" 
                            alt="Authentic Indian Tiffin" 
                            className={styles.heroImg}
                        />
                        {/* Floating Badge */}
                        <div className={styles.floatingCard}>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">The Catalyst</p>
                            <p className="text-sm font-semibold text-[#2c1810] leading-relaxed">
                                &quot;My colleagues didn&apos;t just want food. They wanted <span style={{color:'#ea580c'}}>this</span> food.&quot;
                            </p>
                        </div>
                    </div>
                    {/* Decorative Blob */}
                    <div className={styles.blob}></div>
                </div>
            </div>
        </div>
      </div>

      {/* --- CHAPTER 1: The Context --- */}
      <div className={styles.chapterSection}>
        <div className={styles.maxWidthWrapper}>
            <div className={styles.gridTwo}>
                
                {/* Visual: Office */}
                <div style={{position:'relative'}}>
                    <div className={styles.officeImageFrame}>
                         {/* FIX: Using standard <img> */}
                         <img 
                            src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop" 
                            alt="Bangalore Office Life" 
                            className={styles.officeImg}
                        />
                    </div>
                    <div className={styles.dateTag}>
                        <p className="font-serif text-3xl italic">2022</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-orange-200 mt-1">Bangalore, Ola Office</p>
                    </div>
                </div>

                {/* Content */}
                <div>
                    <h2 className={styles.sectionHeading}>The 1:00 PM Problem</h2>
                    
                    <div className={styles.textBlock}>
                        <p>
                            I was working at <strong>Ola</strong>. The work was exciting, but lunch was a struggle. It was either greasy fast food, expensive cafes, or &quot;healthy&quot; salads that tasted like cardboard.
                        </p>
                        <p>
                            I was the lucky one. My sister sent me a <strong>fresh, warm dabba</strong> every day. 
                        </p>
                    </div>

                    <div className={styles.quoteBox}>
                        <Quote className="text-orange-300 absolute top-4 left-4 opacity-50" size={32} />
                        <p className={styles.quoteText}>
                            &quot;That dabba rarely stayed mine. The aroma of home-cooked dal and soft rotis would draw my colleagues in like magnets.&quot;
                        </p>
                    </div>
                    
                    <p className="text-lg text-gray-600 font-medium">
                        It started with a &quot;tasting spoon.&quot; Soon, my lunch hour became a community gathering.
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* --- CHAPTER 2: The Timeline --- */}
      <div className={styles.timelineSection}>
        <div className={styles.timelineBg}></div>
        <div className={styles.maxWidthWrapper}>
            <div className={styles.timelineHeader}>
                <h2 className={styles.whiteHeading}>From our Kitchen to Yours</h2>
                <div className={styles.orangeDivider}></div>
            </div>

            <div className={styles.gridThree}>
                {/* Step 1 */}
                <div className={styles.glassCard}>
                    <div className={styles.iconBox}>
                        <Users size={24} />
                    </div>
                    <h3 className={styles.cardTitle}>The &quot;Secret&quot; Pilot</h3>
                    <p className={styles.cardDesc}>
                        We started supplying tiffins to just 10-15 colleagues. The feedback was unanimous: <em>&quot;Don&apos;t change a thing. This is exactly what we missed.&quot;</em>
                    </p>
                </div>

                {/* Step 2 */}
                <div className={styles.glassCard} style={{position:'relative', overflow:'hidden'}}>
                    <div style={{position:'absolute', top:0, right:0, background:'#fbbf24', color:'black', fontSize:'10px', fontWeight:'bold', padding:'4px 10px', borderRadius:'0 0 0 10px'}}>JAN 2023</div>
                    <div className={styles.iconBox}>
                        <Heart size={24} />
                    </div>
                    <h3 className={styles.cardTitle}>Cloud Kitchen</h3>
                    <p className={styles.cardDesc}>
                        We launched from home on Swiggy & Zomato. No ads. Just pure taste. Within a month, we hit <strong>50+ daily orders</strong> purely on word of mouth.
                    </p>
                </div>

                {/* Step 3 - Highlighted */}
                <div className={styles.orangeCard}>
                    <div className={styles.iconBox}>
                        <ChefHat size={28} />
                    </div>
                    <h3 className={styles.cardTitle}>The Restaurant</h3>
                    <p className={styles.cardDesc} style={{color:'#ffedd5'}}>
                        In <strong>July 2023</strong>, we moved to a professional kitchen. Today, we deliver that same &quot;Sister&apos;s Tiffin&quot; love to hundreds across the city.
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* --- FOUNDER'S NOTE --- */}
      <div className={styles.founderSection}>
         <div className={styles.maxWidthWrapper}>
            <div className={styles.avatarWrapper}>
                <div className={styles.avatarBlob}></div>
                <div className={styles.avatar}>H</div>
            </div>
            
            <div style={{marginBottom: '3rem'}}>
                <h3 className="text-xl font-bold text-[#2c1810]">Hanamgond</h3>
                <p className="text-orange-600 text-sm font-bold uppercase tracking-widest">Founder, HomelyKhana</p>
            </div>

            <h2 className={styles.founderQuote}>
                &quot;We don&apos;t just deliver food.<br/>We deliver your daily break.&quot;
            </h2>
            
            <p className={styles.founderText}>
                Join the community of professionals who have stopped compromising on their daily meals. Treat yourself to the warmth of home.
            </p>

            <div className={styles.btnGroup}>
                <Link href="/subscribe" className={styles.primaryBtn}>
                    Start Your Subscription 
                    <ArrowRight size={20} />
                </Link>
                <Link href="/menu" className={styles.secondaryBtn}>
                    See Today&apos;s Menu
                </Link>
            </div>
         </div>
      </div>

    </div>
  );
}