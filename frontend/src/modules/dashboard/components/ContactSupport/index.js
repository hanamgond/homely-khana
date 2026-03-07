'use client';

import { useState } from 'react';
import { Mail, Phone, MessageSquare, Clock, Send, CheckCircle } from 'lucide-react';
import styles from './Contact.module.css';

export default function ContactSupport() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const contactMethods = [
    {
      icon: <Phone size={24} />,
      title: 'Phone Support',
      description: 'Call us for immediate assistance',
      details: '+91 78159 84631',
      action: 'Call Now',
      link: 'tel:+917815984631'
    },
    {
      icon: <Mail size={24} />,
      title: 'Email Us',
      description: 'Send us an email for detailed inquiries',
      details: 'contact@homelykhana.in',
      action: 'Send Email',
      link: 'mailto:contact@homelykhana.in'
    },
    {
      icon: <MessageSquare size={24} />,
      title: 'Live Chat',
      description: 'Chat with our support team on WhatsApp',
      details: 'Available 9 AM - 9 PM',
      action: 'Start Chat',
      link: 'https://wa.me/917815984631?text=Hi%20HomelyKhana!%20I%20have%20a%20question.'
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Contact Support</h1>
        <p className={styles.subtitle}>We&apos;re here to help! Choose your preferred way to get in touch.</p>
      </div>

      {submitted && (
        <div className={styles.successMessage}>
          <CheckCircle size={20} />
          <div>
            <strong>Message sent successfully!</strong>
            <p>Our support team will get back to you within 24 hours.</p>
          </div>
        </div>
      )}

      <div className={styles.contactGrid}>
        {/* Contact Methods */}
        <div className={styles.contactMethods}>
          {contactMethods.map((method, index) => (
            <div key={index} className={styles.contactCard}>
              <div className={styles.contactIcon}>{method.icon}</div>
              <h3>{method.title}</h3>
              <p className={styles.contactDescription}>{method.description}</p>
              <p className={styles.contactDetails}>{method.details}</p>
              <a href={method.link} className={styles.contactAction} target="_blank" rel="noopener noreferrer">
                {method.action}
              </a>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className={styles.formSection}>
          <div className={styles.formHeader}>
            <h2>
              <MessageSquare size={24} />
              Send us a Message
            </h2>
            <p>Fill out the form below and we&apos;ll respond as soon as possible.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="What is this regarding?"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Please describe your issue or question in detail..."
                rows={5}
                required
              />
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className={styles.spinner} />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Support Hours (Now outside the grid for a clean footer feel) */}
      <div className={styles.supportHours}>
        <Clock size={20} />
        <div>
          <strong>Support Hours:</strong>
          <p>Monday - Saturday: 9:00 AM - 9:00 PM</p>
          <p>Sunday: 10:00 AM - 6:00 PM</p>
        </div>
      </div>
    </div>
  );
}