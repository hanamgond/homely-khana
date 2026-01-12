'use client';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function ContactClient() {
  return (
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1a1a1a', marginBottom:'2rem' }}>Contact Support</h2>
        
        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {/* Left: Info */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height:'fit-content' }}>
                <h3 style={{fontSize:'1.2rem', marginBottom:'1.5rem'}}>Get in touch</h3>
                <div style={itemStyle}><Mail size={20} color="#FF9801"/> <span>support@homelykhana.in</span></div>
                <div style={itemStyle}><Phone size={20} color="#FF9801"/> <span>+91 98765 43210</span></div>
                <div style={itemStyle}><MapPin size={20} color="#FF9801"/> <span>123 Food Street, Mumbai</span></div>
            </div>

            {/* Right: Form */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <form style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }} onSubmit={(e) => e.preventDefault()}>
                    <div>
                        <label style={labelStyle}>Subject</label>
                        <input type="text" placeholder="I have an issue with..." style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Message</label>
                        <textarea placeholder="Tell us more..." rows="5" style={inputStyle}></textarea>
                    </div>
                    <button style={buttonStyle}> <Send size={18}/> Send Message</button>
                </form>
            </div>
        </div>
      </div>
  );
}

const itemStyle = { display:'flex', gap:'1rem', alignItems:'center', marginBottom:'1rem', color:'#444', fontSize:'1rem' };
const labelStyle = { display:'block', marginBottom:'0.5rem', fontWeight:'600', color:'#333', fontSize:'0.9rem' };
// Matching Profile Page Inputs
const inputStyle = { padding: '0.9rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.95rem', width: '100%', background:'#f8fafc', outline:'none' };
const buttonStyle = { padding: '0.9rem', backgroundColor: '#FF9801', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', fontSize:'1rem' };