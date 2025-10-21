// frontend/src/components/Hero.jsx
import Link from "next/link";

export default function Hero(){
  return (
    <section className="hero" style={{ backgroundImage: `url('/hero-banner.jpg')` }}>
      <div className="hero__overlay" />
      <div className="hero__content">
        <h1>
          Order Healthy &nbsp;
          <span className="accent">Homely Food</span>
        </h1>
        <p style={{color:'rgba(255,255,255,0.92)', maxWidth:760, margin:'12px auto 0'}}>
          Fresh, home-cooked meals delivered to your doorstep. Subscribe now and never worry about meal planning again.
        </p>

        <div className="cta-group" style={{marginTop:18}}>
          <Link href="/subscribe" legacyBehavior><a className="btn-primary">Start Your Subscription</a></Link>
          <Link href="/subscribe?trial=3" legacyBehavior><a className="btn-ghost">Try 3-Day Trial</a></Link>
        </div>
      </div>
    </section>
  );
}
