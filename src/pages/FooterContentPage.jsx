import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getFooterPage, submitContactForm } from '../api/client'
import Footer from '../components/Footer'
import { 
  Mail, Phone, User, MessageSquare, Search, 
  ChevronDown, ChevronUp, CheckCircle, Briefcase, 
  ArrowRight, ShieldAlert, Loader2 
} from 'lucide-react'

export default function FooterContentPage({ slug: propSlug }) {
  const { slug: routeSlug } = useParams()
  const slug = propSlug || routeSlug
  const navigate = useNavigate()

  const [pageData, setPageData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // FAQ Search state
  const [faqSearch, setFaqSearch] = useState('')
  const [activeFaqIndex, setActiveFaqIndex] = useState(null)

  // Contact Form state
  const [form, setForm] = useState({ name: '', phone: '', email: '', description: '' })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setActiveFaqIndex(null)
    setSubmitSuccess(false)
    setForm({ name: '', phone: '', email: '', description: '' })
    setFormErrors({})

    getFooterPage(slug)
      .then(res => {
        if (active) {
          if (res.success && res.data) {
            setPageData(res.data)
          } else {
            setError('Page data not available')
          }
          setLoading(false)
        }
      })
      .catch(err => {
        if (active) {
          setError(err.message || 'Failed to load page content')
          setLoading(false)
        }
      })

    return () => { active = false }
  }, [slug])

  // Scroll to top on slug change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [slug])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0A0A0F]">
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="animate-spin text-[#F5C518]" size={40} />
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !pageData) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0A0A0F]">
        <div className="flex flex-1 items-center justify-center px-4 text-center">
          <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 p-8 backdrop-blur-xl">
            <ShieldAlert className="mx-auto mb-4 text-red-500" size={48} />
            <h2 className="text-xl font-bold text-white">Something Went Wrong</h2>
            <p className="mt-2 text-sm text-gray-400">{error || 'Page not found.'}</p>
            <button 
              onClick={() => navigate('/')}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#F5C518] px-6 py-2.5 text-xs font-bold text-black transition-transform hover:scale-105"
            >
              Go Back Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // Handle Contact form validation
  const validateForm = () => {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Name is required'
    if (!form.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!/^\+?[0-9\s-]{8,15}$/.test(form.phone.trim())) {
      errors.phone = 'Invalid phone number format'
    }
    if (!form.email.trim()) {
      errors.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Invalid email address format'
    }
    if (!form.description.trim()) errors.description = 'Message description is required'
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle Contact form submit
  const handleContactSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const res = await submitContactForm(form)
      if (res.success) {
        setSubmitSuccess(true)
        setForm({ name: '', phone: '', email: '', description: '' })
      } else {
        alert(res.message || 'Submission failed')
      }
    } catch (err) {
      alert(err.message || 'An error occurred during submission')
    } finally {
      setSubmitting(false)
    }
  }

  // Filter FAQs based on search
  const filteredFaqs = (pageData.faqs || []).filter(faq => 
    faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
    faq.answer.toLowerCase().includes(faqSearch.toLowerCase())
  )

  const renderPageSpecificContent = () => {
    if (slug === 'help-center') {
      return (
        <div className="mt-12 space-y-8">
          {/* FAQ Search Bar */}
          <div className="relative mx-auto max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search frequently asked questions..." 
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              style={{ borderRadius: 'var(--radius)' }}
              className="w-full bg-[#111118]/80 pl-12 pr-4 py-3 text-sm outline-none transition-all duration-300 border border-[#1E1E2E] text-white focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518]"
            />
          </div>

          {/* Accordion List */}
          <div className="mx-auto max-w-3xl space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, idx) => {
                const isOpen = activeFaqIndex === idx
                return (
                  <div 
                    key={faq._id || idx}
                    style={{ borderRadius: 'var(--radius-lg)' }}
                    className="overflow-hidden border border-[#1E1E2E] bg-[#111118]/50 transition-all hover:border-[#F5C518]/30"
                  >
                    <button
                      onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between px-6 py-4.5 text-left font-semibold text-white transition-colors hover:text-[#F5C518]"
                    >
                      <span className="pr-4 text-[14px] sm:text-base leading-snug">{faq.question}</span>
                      {isOpen ? <ChevronUp size={18} className="text-[#F5C518] flex-shrink-0" /> : <ChevronDown size={18} className="text-gray-500 flex-shrink-0" />}
                    </button>
                    
                    <div 
                      className={`transition-all duration-300 ease-in-out ${
                        isOpen ? 'max-h-[500px] border-t border-[#1E1E2E] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                      }`}
                    >
                      <p className="px-6 py-5 text-sm leading-relaxed text-gray-400">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="py-12 text-center text-gray-500 text-sm">
                No FAQs matched your search term. Try checking spelling or search a different keyword.
              </div>
            )}
          </div>

          {/* Centered bold line & Contact Button */}
          <div className="mx-auto max-w-2xl border-t border-[#1E1E2E] pt-12 text-center">
            <h3 className="text-lg sm:text-xl font-bold text-white font-display tracking-wide">Still have questions or need specialized technical support?</h3>
            <p className="mt-2 text-sm text-gray-400">Our customer success champions are available 24/7 to assist you.</p>
            <button 
              onClick={() => navigate('/contact-us')}
              style={{ borderRadius: 'var(--radius)' }}
              className="mt-6 inline-flex items-center gap-2 bg-[#F5C518] px-8 py-3 text-sm font-bold text-black transition-all hover:scale-105 active:scale-95"
            >
              Contact Support Now <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )
    }

    if (slug === 'contact-us') {
      const contactEmail = pageData.settings?.contactEmail || 'xyz@domain.com'

      return (
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-5">
          {/* Left Info Card */}
          <div style={{ borderRadius: 'var(--radius-xl)' }} className="border border-[#1E1E2E] bg-[#111118]/40 p-8 md:col-span-2 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white font-display tracking-wide">Direct Support</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">
                For direct business requests, press inquiries, or immediate partnerships, please drop us an email anytime.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#F5C518]/10 text-[#F5C518]">
                    <Mail size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold">Email Us</span>
                    <a href={`mailto:${contactEmail}`} className="block truncate text-sm font-bold text-[#F5C518] hover:underline">
                      {contactEmail}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-[#1E1E2E] pt-6">
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                * Form submissions are reviewed by support agents and typically responded to within 12-24 business hours.
              </p>
            </div>
          </div>

          {/* Right Contact Form */}
          <div style={{ borderRadius: 'var(--radius-xl)' }} className="relative border border-[#1E1E2E] bg-[#111118]/60 p-8 md:col-span-3">
            <form onSubmit={handleContactSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input 
                    type="text" 
                    placeholder="Aditya Pandey"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={{ borderRadius: 'var(--radius)' }}
                    className={`w-full bg-[#0A0A0F] pl-10 pr-4 py-2.5 text-sm outline-none border ${formErrors.name ? 'border-red-500/60' : 'border-[#1E1E2E]'} text-white focus:border-[#F5C518]`}
                  />
                </div>
                {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="email" 
                      placeholder="aditya@domain.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      style={{ borderRadius: 'var(--radius)' }}
                      className={`w-full bg-[#0A0A0F] pl-10 pr-4 py-2.5 text-sm outline-none border ${formErrors.email ? 'border-red-500/60' : 'border-[#1E1E2E]'} text-white focus:border-[#F5C518]`}
                    />
                  </div>
                  {formErrors.email && <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                      type="text" 
                      placeholder="+91 93215 43689"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      style={{ borderRadius: 'var(--radius)' }}
                      className={`w-full bg-[#0A0A0F] pl-10 pr-4 py-2.5 text-sm outline-none border ${formErrors.phone ? 'border-red-500/60' : 'border-[#1E1E2E]'} text-white focus:border-[#F5C518]`}
                    />
                  </div>
                  {formErrors.phone && <p className="mt-1 text-xs text-red-500">{formErrors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Message Description</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3.5 top-3.5 text-gray-500" size={16} />
                  <textarea 
                    rows={4}
                    placeholder="Tell us what you need help with..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={{ borderRadius: 'var(--radius)' }}
                    className={`w-full bg-[#0A0A0F] pl-10 pr-4 py-2.5 text-sm outline-none border ${formErrors.description ? 'border-red-500/60' : 'border-[#1E1E2E]'} text-white focus:border-[#F5C518]`}
                  />
                </div>
                {formErrors.description && <p className="mt-1 text-xs text-red-500">{formErrors.description}</p>}
              </div>

              <button 
                type="submit"
                disabled={submitting}
                style={{ borderRadius: 'var(--radius)' }}
                className="w-full bg-[#F5C518] py-3 text-sm font-bold text-black transition-all hover:bg-[#F5C518]/90 disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={16} /> Sending Inquiry...
                  </span>
                ) : 'Submit Inquiry'}
              </button>
            </form>

            {/* Success Overlay */}
            {submitSuccess && (
              <div style={{ borderRadius: 'var(--radius-xl)' }} className="absolute inset-0 flex flex-col items-center justify-center bg-[#111118] p-8 text-center fade-up">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#22c55e]/10 text-[#22c55e]">
                  <CheckCircle size={36} />
                </div>
                <h3 className="mt-4 text-xl font-bold text-white font-display">Inquiry Sent Successfully!</h3>
                <p className="mt-2 text-sm text-gray-400 max-w-xs leading-relaxed">
                  Thank you for reaching out. A StreamVault representative will review your message and respond shortly.
                </p>
                <button 
                  onClick={() => setSubmitSuccess(false)}
                  style={{ borderRadius: 'var(--radius)' }}
                  className="mt-6 border border-[#2a2a35] px-6 py-2 text-xs text-white transition-colors hover:bg-white/5"
                >
                  Submit Another Inquiry
                </button>
              </div>
            )}
          </div>
        </div>
      )
    }

    if (slug === 'careers') {
      const careersText = pageData.settings?.careersText || 'no job openings update soon.'

      return (
        <div className="mx-auto mt-12 max-w-2xl text-center">
          <div style={{ borderRadius: 'var(--radius-xl)' }} className="border border-[#F5C518]/20 bg-[#F5C518]/5 p-10 sm:p-12 backdrop-blur-xl">
            <Briefcase className="mx-auto mb-4 text-[#F5C518]" size={40} />
            <h3 className="text-xl font-bold text-white font-display tracking-wide">Active Positions</h3>
            
            {/* The dynamic editable bold line */}
            <p className="mt-4 text-base sm:text-lg font-semibold text-gray-200 capitalize">
              "{careersText}"
            </p>
            
            <p className="mt-6 text-xs text-gray-500 leading-relaxed max-w-lg mx-auto">
              We appreciate your interest in StreamVault. Even when we don't have active openings, we are always eager to meet outstanding engineers, video quality experts, and product visionaries. Feel free to reach out via our contact page to leave your resume for future considerations.
            </p>
            
            <button 
              onClick={() => navigate('/contact-us')}
              style={{ borderRadius: 'var(--radius)' }}
              className="mt-8 bg-[#F5C518]/10 px-6 py-2.5 text-xs font-semibold text-[#F5C518] border border-[#F5C518]/25 transition-all hover:bg-[#F5C518]/20"
            >
              Drop Your Resume
            </button>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0A0F]">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#1E1E2E] bg-[#0E0E14] pt-24 pb-10">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] to-transparent" />
        <div className="absolute -left-1/4 -top-1/4 h-64 w-64 rounded-full bg-[#F5C518]/5 blur-3xl" />
        
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="inline-block rounded-full bg-[#F5C518]/10 px-3 py-0.5 text-[9px] font-bold text-[#F5C518] uppercase tracking-wider border border-[#F5C518]/20">
            Information
          </span>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl lg:text-5xl text-white tracking-widest font-extrabold uppercase">
            {pageData.title}
          </h1>
          <div className="mt-2 flex items-center justify-center gap-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
            <span>Last Updated</span>
            <span className="text-[#F5C518]">{pageData.lastUpdated}</span>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="flex-1 px-4 py-8 sm:px-6 lg:px-8 flex flex-col items-center">
        <div className="w-full max-w-4xl">
          {/* Page Description paragraph */}
          <div className="w-full mb-8">
            <div 
              style={{ 
                borderRadius: 'var(--radius-xl)', 
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.6) 0%, rgba(10, 10, 15, 0.8) 100%)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }} 
              className="p-6 sm:p-10"
            >
              <p className="text-sm sm:text-base leading-relaxed sm:leading-loose text-gray-200 text-center font-medium whitespace-pre-line select-text">
                {pageData.content}
              </p>
            </div>
          </div>

          {/* Custom Section for Help, Contact, Careers */}
          {renderPageSpecificContent()}
        </div>
      </section>

      <Footer />
    </div>
  )
}