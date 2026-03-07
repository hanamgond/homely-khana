'use client';

import styles from './About.module.css';

export default function AboutPage() {
  return (
    <div className={styles.page}>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <h1 className={styles.heroTitle}>
            Food you can eat <span className={styles.heroEmphasis}>every single day.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            That&apos;s the only rule we follow.
          </p>
        </div>
      </section>


      {/* CORE STORY */}
      <section className={styles.core}>
        <div className={styles.container}>
          <p className={styles.coreText}>
            In 2022, we were tired of lunch options that were either too oily, 
            too rich, or too inconsistent for daily eating.
          </p>
          <p className={styles.coreText}>
            So we started sending tiffins from home. Colleagues noticed. 
            Then they asked. Then they wanted the same.
          </p>
          <div className={styles.statement}>
            <span className={styles.statementHighlight}>HomelyKhana</span> prepares everyday Indian meals — 
            responsibly cooked, nutritionally balanced, rooted in familiar tradition.
          </div>
        </div>
      </section>


      {/* DIFFERENCE */}
      <section className={styles.difference}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Food meant for daily eating is different</h2>
          
          <div className={styles.differenceGrid}>
            
            <div className={styles.diffCard}>
              <div className={styles.diffIcon}>⚖️</div>
              <h3>Oil is measured</h3>
              <p>Never poured. Every drop counted. Your body notices the difference.</p>
            </div>

            <div className={styles.diffCard}>
              <div className={styles.diffIcon}>🌶️</div>
              <h3>Spices are balanced</h3>
              <p>For everyday, not occasional indulgence. Flavor you can trust.</p>
            </div>

            <div className={styles.diffCard}>
              <div className={styles.diffIcon}>🌅</div>
              <h3>Fresh every morning</h3>
              <p>Vegetables arrive before sunrise. Prepared the same day.</p>
            </div>

            <div className={styles.diffCard}>
              <div className={styles.diffIcon}>🔄</div>
              <h3>Home taste, every time</h3>
              <p>Consistency you can count on. Monday tastes like Tuesday.</p>
            </div>

          </div>
        </div>
      </section>


      {/* UTTAM */}
      <section className={styles.uttam}>
        <div className={styles.container}>
          <div className={styles.uttamCard}>
            
            <div className={styles.uttamBadge}>
              <span>The heart of our kitchen</span>
            </div>
            
            <div className={styles.uttamContent}>
              <h2 className={styles.uttamName}>Uttam</h2>
              <p className={styles.uttamRole}>Has been cooking since she was twelve.</p>
              
              <div className={styles.uttamStats}>
                <div className={styles.uttamStat}>
                  <span className={styles.uttamStatNumber}>18</span>
                  <span className={styles.uttamStatLabel}>years cooking</span>
                </div>
                <div className={styles.uttamStat}>
                  <span className={styles.uttamStatNumber}>12k+</span>
                  <span className={styles.uttamStatLabel}>meals tasted</span>
                </div>
                <div className={styles.uttamStat}>
                  <span className={styles.uttamStatNumber}>3</span>
                  <span className={styles.uttamStatLabel}>dishes rejected*</span>
                </div>
              </div>
              
              <p className={styles.uttamDesc}>
                She tastes everything before it leaves. Every. Single. Time.
                She adjusts. She corrects. She asks one question:
              </p>
              
              <div className={styles.uttamQuestion}>
                &ldquo;Would I serve this at home?&rdquo;
              </div>
              
              <p className={styles.uttamFootnote}>
                *If the answer is no, the dish doesn&apos;t go out. 
                It&apos;s been that way since day one.
              </p>
              
              <div className={styles.uttamSignature}>
                — Uttam
              </div>
            </div>
            
          </div>
        </div>
      </section>


      {/* FACTS */}
      <section className={styles.facts}>
        <div className={styles.container}>
          <div className={styles.factsGrid}>
            
            <div className={styles.factCard}>
              <div className={styles.factNumber}>500+</div>
              <div className={styles.factLabel}>Daily meals</div>
              <div className={styles.factTrend}>↑ 45% this year</div>
            </div>
            
            <div className={styles.factCard}>
              <div className={styles.factNumber}>2000+</div>
              <div className={styles.factLabel}>Customers in Bangalore</div>
              <div className={styles.factTrend}>all by word of mouth</div>
            </div>
            
            <div className={styles.factCard}>
              <div className={styles.factNumber}>2022</div>
              <div className={styles.factLabel}>Started with one tiffin</div>
              <div className={styles.factTrend}>zero marketing spend</div>
            </div>
            
          </div>
        </div>
      </section>


      {/* AUDIENCE */}
      <section className={styles.audience}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>We cook for people like you</h2>
          
          <div className={styles.audienceCloud}>
            <span className={styles.audienceTag}>👩‍💻 Working professionals</span>
            <span className={styles.audienceTag}>📚 Students & PG</span>
            <span className={styles.audienceTag}>👪 Families</span>
            <span className={styles.audienceTag}>🏢 Corporate offices</span>
            <span className={styles.audienceTag}>🏃 Health-conscious</span>
            <span className={styles.audienceTag}>😩 Tired of oily food</span>
            <span className={styles.audienceTag}>🍛 Love home-style</span>
          </div>
        </div>
      </section>


      {/* TRUST */}
      <section className={styles.trust}>
        <div className={styles.container}>
          
          <div className={styles.trustHeader}>
            <span className={styles.trustBadge}>Trusted by</span>
          </div>
          
          <div className={styles.trustGrid}>
            
            <div className={styles.trustCard}>
              <div className={styles.trustIcon}>🏭</div>
              <h4>FSSAI Certified</h4>
              <p>Licensed kitchen, regular audits</p>
            </div>
            
            <div className={styles.trustCard}>
              <div className={styles.trustIcon}>🗣️</div>
              <h4>100% Word of Mouth</h4>
              <p>Grew because people told people</p>
            </div>
            
            <div className={styles.trustCard}>
              <div className={styles.trustIcon}>📦</div>
              <h4>500+ Daily Meals</h4>
              <p>Every single one is tasted</p>
            </div>
            
            <div className={styles.trustCard}>
              <div className={styles.trustIcon}>⚖️</div>
              <h4>Same Since 2022</h4>
              <p>One standard. Never changed.</p>
            </div>
            
          </div>
        </div>
      </section>


      {/* INVITE */}
      <section className={styles.invite}>
        <div className={styles.container}>
          <div className={styles.inviteCard}>
            
            <h2 className={styles.inviteTitle}>Ready for food you can trust daily?</h2>
            
            <div className={styles.ctaGroup}>
              <a href="#" className={`${styles.ctaButton} ${styles.ctaPrimary}`}>
                <span>Order on Swiggy</span>
              </a>
              <a href="#" className={`${styles.ctaButton} ${styles.ctaSecondary}`}>
                <span>Subscribe for tiffins</span>
              </a>
            </div>
            
            <p className={styles.inviteNote}>
              Available across Bangalore. No minimum order.
            </p>
            
            <div className={styles.inviteFooter}>
              <span className={styles.footerDot}>⬤</span>
              <span>From one tiffin to thousands. Same question. Same standard.</span>
              <span className={styles.footerDot}>⬤</span>
            </div>
            
          </div>
        </div>
      </section>

    </div>
  );
}