'use client';

import { useState, useEffect } from 'react';
import { 
  Mail, Phone, MapPin, Send, MessageCircle, 
  Clock, HelpCircle, FileText, Paperclip, 
  CheckCircle, XCircle, AlertCircle, ExternalLink,
  Zap, Shield, Headphones, Download, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import styles from './DashboardContact.module.css';

export default function ContactClient() {
  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    message: '',
    priority: 'normal'
  });
  
  // File upload state
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  // FAQ state
  const [openFaq, setOpenFaq] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [liveChatStatus, setLiveChatStatus] = useState('available');
  const [stats, setStats] = useState(null);

  // Categories for contact form
  const categories = [
    { value: 'meal_skipping', label: 'Meal Skipping' },
    { value: 'address_change', label: 'Address Change' },
    { value: 'billing', label: 'Billing & Payments' },
    { value: 'meal_quality', label: 'Meal Quality' },
    { value: 'subscription', label: 'Subscription Issues' },
    { value: 'delivery', label: 'Delivery Problems' },
    { value: 'general', label: 'General Inquiry' },
  ];

  // Priority levels
  const priorities = [
    { 
      id: 'low', 
      name: 'Low', 
      description: 'General question',
      icon: '📋'
    },
    { 
      id: 'normal', 
      name: 'Normal', 
      description: 'Standard request',
      icon: '📝'
    },
    { 
      id: 'high', 
      name: 'High', 
      description: 'Urgent issue',
      icon: '🚨'
    }
  ];

  // FAQ data
  const faqData = [
    {
      id: 1,
      question: 'How do I skip a meal?',
      answer: 'You can skip meals from your Dashboard or My Subscription page. Go to the upcoming meal and click "Skip". You can skip up to 24 hours before delivery time.'
    },
    {
      id: 2,
      question: 'Can I change my delivery address?',
      answer: 'Yes, go to Profile Settings → Saved Addresses. Add a new address or edit existing ones. Changes made before 10 AM will apply to same-day deliveries.'
    },
    {
      id: 3,
      question: 'What if I\'m not satisfied with my meal?',
      answer: 'We offer a satisfaction guarantee! Contact us within 2 hours of delivery, and we\'ll credit your account or replace the meal on your next delivery.'
    },
    {
      id: 4,
      question: 'How do I update my payment method?',
      answer: 'Navigate to Profile Settings → Payment Methods. You can add, remove, or update your payment details there.'
    },
    {
      id: 5,
      question: 'Can I pause my subscription?',
      answer: 'Yes, you can pause your subscription for up to 30 days. Go to My Subscription → Manage Plan → Pause Subscription.'
    }
  ];

  // Mock recent tickets (in production, fetch from API)
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setRecentTickets([
        {
          id: 'TICK-4561',
          subject: 'Meal skipping request',
          date: 'Dec 5, 2023',
          status: 'resolved',
          category: 'meal_skipping'
        },
        {
          id: 'TICK-4560',
          subject: 'Address update needed',
          date: 'Dec 3, 2023',
          status: 'in_progress',
          category: 'address_change'
        },
        {
          id: 'TICK-4559',
          subject: 'Billing question',
          date: 'Nov 28, 2023',
          status: 'resolved',
          category: 'billing'
        }
      ]);
      
      setStats({
        avgResponseTime: '4 hours',
        resolutionRate: '98%',
        activeAgents: '12',
        satisfactionScore: '4.8/5'
      });
    }, 500);
  }, []);

  // Handle file upload
  const handleFileUpload = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 3) {
      toast.error('Maximum 3 files allowed');
      return;
    }
    
    const newFiles = selectedFiles.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type
    }));
    
    setFiles([...files, ...newFiles]);
  };

  // Remove file
  const removeFile = (id) => {
    setFiles(files.filter(file => file.id !== id));
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle priority selection
  const handlePrioritySelect = (priority) => {
    setFormData(prev => ({
      ...prev,
      priority
    }));
  };

  // Toggle FAQ
  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    
    // Validation
    if (!formData.subject.trim()) {
      setSubmitError('Please enter a subject');
      setIsSubmitting(false);
      return;
    }
    
    if (!formData.message.trim()) {
      setSubmitError('Please enter your message');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In production: Send to backend API
      // const response = await fetchWithToken('/api/support/tickets', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...formData,
      //     attachments: files.map(f => f.name)
      //   })
      // });
      
      // const data = await response.json();
      
      // if (data.success) {
        toast.success('Support ticket submitted successfully!');
        setSubmitSuccess(true);
        
        // Reset form
        setFormData({
          subject: '',
          category: 'general',
          message: '',
          priority: 'normal'
        });
        setFiles([]);
        
        // Add to recent tickets
        const newTicket = {
          id: `TICK-${Date.now().toString().slice(-4)}`,
          subject: formData.subject,
          date: new Date().toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }),
          status: 'pending',
          category: formData.category
        };
        
        setRecentTickets([newTicket, ...recentTickets.slice(0, 2)]);
      // } else {
      //   throw new Error(data.error || 'Failed to submit ticket');
      // }
      
    } catch (error) {
      console.error('Error submitting ticket:', error);
      setSubmitError(error.message || 'Failed to submit ticket. Please try again.');
      toast.error('Failed to submit ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start live chat
  const startLiveChat = () => {
    if (liveChatStatus === 'available') {
      toast.info('Connecting you with a support agent...');
      // In production: Open chat widget
    } else {
      toast.info('Live chat is currently offline. Please submit a ticket.');
    }
  };

  // Get status display
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'resolved':
        return { text: 'Resolved', className: styles.statusResolved };
      case 'in_progress':
        return { text: 'In Progress', className: styles.statusInProgress };
      case 'pending':
        return { text: 'Pending', className: styles.statusPending };
      default:
        return { text: 'Open', className: styles.statusPending };
    }
  };

  // Get category label
  const getCategoryLabel = (category) => {
    const found = categories.find(c => c.value === category);
    return found ? found.label : 'General';
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div>
        <h2 className={styles.headerTitle}>Contact Support</h2>
        <p className={styles.headerSubtitle}>We&apos;re here to help with any questions or concerns</p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsCards}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#e0f2fe' }}>
            <Clock color="#0284c7" size={24} />
          </div>
          <div className={styles.statValue}>{stats?.avgResponseTime || '4 hours'}</div>
          <div className={styles.statLabel}>Avg. Response Time</div>
          <div className={styles.statSubtext}>Mon-Sat, 9AM-9PM</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#dcfce7' }}>
            <CheckCircle color="#16a34a" size={24} />
          </div>
          <div className={styles.statValue}>{stats?.resolutionRate || '98%'}</div>
          <div className={styles.statLabel}>Resolution Rate</div>
          <div className={styles.statSubtext}>Issues resolved</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef3c7' }}>
            <Headphones color="#d97706" size={24} />
          </div>
          <div className={styles.statValue}>{stats?.activeAgents || '12'}</div>
          <div className={styles.statLabel}>Active Agents</div>
          <div className={styles.statSubtext}>Ready to help</div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fce7f3' }}>
            <Zap color="#db2777" size={24} />
          </div>
          <div className={styles.statValue}>{stats?.satisfactionScore || '4.8/5'}</div>
          <div className={styles.statLabel}>Satisfaction Score</div>
          <div className={styles.statSubtext}>Customer rating</div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className={styles.twoColumnLayout}>
        {/* Left Column: FAQ */}
        <div className={styles.faqSection}>
          <h3 className={styles.faqTitle}>
            <HelpCircle size={20} />
            Frequently Asked Questions
          </h3>
          
          <div className={styles.faqList}>
            {faqData.map((faq) => (
              <div key={faq.id} className={styles.faqItem}>
                <div 
                  className={styles.faqQuestion}
                  onClick={() => toggleFaq(faq.id)}
                >
                  <span>{faq.question}</span>
                  {openFaq === faq.id ? 
                    <ChevronUp size={18} /> : 
                    <ChevronDown size={18} />
                  }
                </div>
                
                {openFaq === faq.id && (
                  <div className={styles.faqAnswer}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <button className={styles.viewAllButton}>
            <ExternalLink size={16} />
            View Help Center
          </button>
        </div>

        {/* Right Column: Contact Form */}
        <div className={styles.contactSection}>
          <h3 className={styles.formTitle}>
            <MessageCircle size={20} />
            Send us a Message
          </h3>
          
          {/* Success/Error Messages */}
          {submitSuccess && (
            <div className={`${styles.message} ${styles.messageSuccess}`}>
              <CheckCircle size={20} />
              <div>
                <strong>Ticket submitted successfully!</strong>
                <p>We&apos;ll get back to you within {stats?.avgResponseTime || '4 hours'}.</p>
              </div>
            </div>
          )}
          
          {submitError && (
            <div className={`${styles.message} ${styles.messageError}`}>
              <XCircle size={20} />
              <div>
                <strong>Error submitting ticket</strong>
                <p>{submitError}</p>
              </div>
            </div>
          )}
          
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* Subject */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Subject <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="subject"
                placeholder="Briefly describe your issue..."
                className={styles.formInput}
                value={formData.subject}
                onChange={handleInputChange}
                required
              />
            </div>
            
            {/* Category */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Category <span className={styles.required}>*</span>
              </label>
              <select
                name="category"
                className={styles.formSelect}
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Message */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Message <span className={styles.required}>*</span>
              </label>
              <textarea
                name="message"
                placeholder="Please provide detailed information about your issue..."
                className={styles.formTextarea}
                value={formData.message}
                onChange={handleInputChange}
                required
              />
            </div>
            
            {/* File Upload */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Attachments (Optional)
              </label>
              <div className={styles.fileUpload}>
                <label htmlFor="file-upload">
                  <div className={styles.fileContent}>
                    <Paperclip size={24} />
                    <span>Click to upload files or drag and drop</span>
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                      Max 3 files, 5MB each
                    </span>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                  />
                </label>
              </div>
              
              {files.length > 0 && (
                <div className={styles.fileList}>
                  {files.map((file) => (
                    <div key={file.id} className={styles.fileItem}>
                      <span>{file.name}</span>
                      <button
                        type="button"
                        className={styles.fileRemove}
                        onClick={() => removeFile(file.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Priority */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Priority Level
              </label>
              <div className={styles.priorityGroup}>
                {priorities.map((priority) => (
                  <button
                    key={priority.id}
                    type="button"
                    className={`${styles.priorityButton} ${
                      formData.priority === priority.id ? styles.selected : ''
                    }`}
                    onClick={() => handlePrioritySelect(priority.id)}
                  >
                    <span className={styles.priorityIcon}>{priority.icon}</span>
                    <span className={styles.priorityName}>{priority.name}</span>
                    <span className={styles.priorityDesc}>{priority.description}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className={styles.spinner} style={{ borderTopColor: 'white' }} />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Submit Ticket
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Contact Information */}
      <div className={styles.contactInfoSection}>
        <h3 className={styles.faqTitle}>
          <Headphones size={20} />
          Contact Information
        </h3>
        
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon} style={{ background: '#e0f2fe' }}>
              <Mail color="#0284c7" size={20} />
            </div>
            <div className={styles.infoContent}>
              <h4>Email Support</h4>
              <p>support@homelykhana.in</p>
              <div className={styles.infoMeta}>
                Response time: {stats?.avgResponseTime || '4 hours'}
              </div>
            </div>
          </div>
          
          <div className={styles.infoItem}>
            <div className={styles.infoIcon} style={{ background: '#dcfce7' }}>
              <Phone color="#16a34a" size={20} />
            </div>
            <div className={styles.infoContent}>
              <h4>Phone Support</h4>
              <p>+91 98765 43210</p>
              <div className={styles.infoMeta}>
                Mon-Sat, 9:00 AM - 9:00 PM
              </div>
            </div>
          </div>
          
          <div className={styles.infoItem}>
            <div className={styles.infoIcon} style={{ background: '#fef3c7' }}>
              <MapPin color="#d97706" size={20} />
            </div>
            <div className={styles.infoContent}>
              <h4>Office Address</h4>
              <p>123 Food Street, Mumbai, 400001</p>
              <div className={styles.infoMeta}>
                Visit by appointment only
              </div>
            </div>
          </div>
        </div>
        
        {/* Live Chat Section */}
        <div className={styles.liveChat}>
          <div className={styles.chatHeader}>
            <h4 className={styles.chatTitle}>Live Chat Support</h4>
            <div className={styles.chatStatus}>
              <div className={styles.statusDot} />
              <span>{liveChatStatus === 'available' ? 'Available Now' : 'Offline'}</span>
            </div>
          </div>
          <p style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '1rem' }}>
            Chat with our support agents in real-time for immediate assistance.
          </p>
          <button 
            className={styles.chatButton}
            onClick={startLiveChat}
            disabled={liveChatStatus !== 'available'}
          >
            <MessageCircle size={18} />
            Start Live Chat
          </button>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className={styles.ticketsSection}>
        <h3 className={styles.ticketsTitle}>
          <FileText size={20} />
          Recent Support Tickets
        </h3>
        
        {recentTickets.length === 0 ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Loading your tickets...</p>
          </div>
        ) : (
          <>
            <div className={styles.ticketsList}>
              {recentTickets.map((ticket) => {
                const status = getStatusDisplay(ticket.status);
                return (
                  <div key={ticket.id} className={styles.ticketItem}>
                    <div className={styles.ticketInfo}>
                      <h4>{ticket.subject}</h4>
                      <p>
                        {ticket.id} • {ticket.date} • {getCategoryLabel(ticket.category)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span className={`${styles.ticketStatus} ${status.className}`}>
                        {status.text}
                      </span>
                      <button className={styles.viewTicketButton}>
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <button className={styles.viewAllButton}>
              <ExternalLink size={16} />
              View All Tickets
            </button>
          </>
        )}
      </div>
    </div>
  );
}