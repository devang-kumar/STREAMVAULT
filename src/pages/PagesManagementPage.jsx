import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, MessageSquare, Edit3, Trash2, X, Check, Save,
  RefreshCw, AlertCircle, Loader2, ArrowRight, Mail, Phone, User, Calendar
} from 'lucide-react';
import {
  adminGetFooterPages,
  adminGetFooterPage,
  adminUpdateFooterPage,
  adminGetContactSubmissions,
  adminDeleteContactSubmission
} from '../api/client';

export default function PagesManagementPage() {
  const [activeTab, setActiveTab] = useState('pages'); // 'pages' | 'submissions'
  const [pages, setPages] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Edit Modal State
  const [editingPage, setEditingPage] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editCareersText, setEditCareersText] = useState('');
  const [editFaqs, setEditFaqs] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError('');
    try {
      if (activeTab === 'pages') {
        const res = await adminGetFooterPages();
        setPages(res?.data || []);
      } else {
        const res = await adminGetContactSubmissions();
        setSubmissions(res?.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const handleOpenEdit = async (page) => {
    try {
      setSaving(true);
      setError('');
      const res = await adminGetFooterPage(page.slug);
      const fullPage = res?.data;
      if (fullPage) {
        setEditingPage(fullPage);
        setEditTitle(fullPage.title || '');
        setEditContent(fullPage.content || '');
        setEditContactEmail(fullPage.settings?.contactEmail || '');
        setEditCareersText(fullPage.settings?.careersText || '');
        setEditFaqs(fullPage.faqs || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load page details');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePage = async () => {
    if (!editingPage) return;
    setSaving(true);
    setError('');
    try {
      const data = {
        title: editTitle,
        content: editContent,
        faqs: editFaqs,
        settings: {
          contactEmail: editContactEmail,
          careersText: editCareersText
        }
      };
      await adminUpdateFooterPage(editingPage.slug, data);
      setEditingPage(null);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update page');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubmission = async (id) => {
    if (!confirm('Are you sure you want to delete this contact submission?')) return;
    try {
      setError('');
      await adminDeleteContactSubmission(id);
      setSubmissions(prev => prev.filter(sub => sub._id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete submission');
    }
  };

  // FAQ CRUD Helpers inside Modal
  const handleAddFaq = () => {
    setEditFaqs(prev => [...prev, { question: '', answer: '' }]);
  };

  const handleUpdateFaq = (index, field, value) => {
    setEditFaqs(prev => prev.map((faq, i) => i === index ? { ...faq, [field]: value } : faq));
  };

  const handleDeleteFaq = (index) => {
    setEditFaqs(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 28,
            letterSpacing: '0.06em', marginBottom: 4,
            color: 'var(--text-primary)',
          }}>
            PAGES & <span style={{ color: 'var(--accent)' }}>SUBMISSIONS</span>
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Manage public footer pages, edit FAQ lists, and view client inquiry submissions.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-secondary)',
            fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px 16px', marginBottom: 16,
          background: 'var(--red-dim)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius)',
          fontSize: 12, color: 'var(--red)',
        }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Tabs Nav */}
      <div style={{
        display: 'flex',
        gap: 6,
        background: 'var(--bg-card)',
        padding: 4,
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        width: 'fit-content',
        marginBottom: 28
      }}>
        <button
          onClick={() => setActiveTab('pages')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 18px',
            borderRadius: 'var(--radius)',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: activeTab === 'pages' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'pages' ? '#000' : 'var(--text-secondary)'
          }}
        >
          <FileText size={15} /> Footer Pages
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 18px',
            borderRadius: 'var(--radius)',
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: activeTab === 'submissions' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'submissions' ? '#000' : 'var(--text-secondary)'
          }}
        >
          <MessageSquare size={15} /> Contact Submissions
        </button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, gap: 12 }}>
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading...</span>
        </div>
      ) : activeTab === 'pages' ? (
        /* Footer Pages List */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {pages.map(page => (
            <div
              key={page._id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-subtle)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>
                  {page.title}
                </h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  <span style={{ fontSize: 10, background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 99, color: 'var(--accent)', border: '1px solid var(--border)' }}>
                    /{page.slug}
                  </span>
                  {page.faqs?.length > 0 && (
                    <span style={{ fontSize: 10, background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 99, color: 'var(--text-secondary)' }}>
                      {page.faqs.length} FAQs
                    </span>
                  )}
                </div>
                <p style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  lineHeight: '1.5',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  marginBottom: 20
                }}>
                  {page.content || '(No text content configured.)'}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  Updated: {page.lastUpdated && !isNaN(Date.parse(page.lastUpdated)) ? new Date(page.lastUpdated).toLocaleDateString() : page.lastUpdated || 'Never'}
                </span>
                <button
                  onClick={() => handleOpenEdit(page)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px',
                    background: 'var(--accent)',
                    color: '#000',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    fontSize: 11, fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Edit3 size={12} /> Edit Page
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Contact Submissions List */
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          {submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <MessageSquare size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontSize: 14 }}>No contact inquiries or feedback forms submitted yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>User Info</th>
                    <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Message Description</th>
                    <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Submitted At</th>
                    <th style={{ padding: '16px 20px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(sub => (
                    <tr
                      key={sub._id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <User size={13} color="var(--accent)" /> {sub.name}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Mail size={12} /> {sub.email}
                          </span>
                          {sub.phone && (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Phone size={12} /> {sub.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'top', maxWidth: 400 }}>
                        <p style={{
                          fontSize: 13,
                          color: 'var(--text-secondary)',
                          lineHeight: '1.5',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}>
                          {sub.description}
                        </p>
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'top', fontSize: 12, color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <Calendar size={13} /> {new Date(sub.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'top', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteSubmission(sub._id)}
                          style={{
                            padding: '6px 10px',
                            background: 'none',
                            color: 'var(--text-muted)',
                            border: 'none',
                            borderRadius: 'var(--radius)',
                            cursor: 'pointer',
                            transition: 'color 0.2s ease',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--red)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Full Modal */}
      {editingPage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: 24, zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: editingPage.slug === 'help-center' ? 800 : 600,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderBottom: '1px solid var(--border)'
            }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={18} color="var(--accent)" /> Edit: {editingPage.title}
                </h3>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Slug identifier: {editingPage.slug}
                </span>
              </div>
              <button
                onClick={() => setEditingPage(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Common Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Page Title</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Main Paragraph Text</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  style={{ width: '100%', minHeight: 120, resize: 'vertical' }}
                />
              </div>

              {/* Special Contextual Settings */}
              {editingPage.slug === 'contact-us' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, border: '1px solid var(--border)', padding: 14, borderRadius: 'var(--radius)', background: 'var(--bg-card)' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>Contact Support Email</label>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>This email address is displayed publicly on the contact information card.</p>
                  <input
                    type="email"
                    value={editContactEmail}
                    onChange={(e) => setEditContactEmail(e.target.value)}
                    placeholder="e.g. support@streamvault.com"
                  />
                </div>
              )}

              {editingPage.slug === 'careers' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, border: '1px solid var(--border)', padding: 14, borderRadius: 'var(--radius)', background: 'var(--bg-card)' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>Careers Announcement Banner Text</label>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>A secondary call-out string detailing active openings or job listings.</p>
                  <input
                    value={editCareersText}
                    onChange={(e) => setEditCareersText(e.target.value)}
                    placeholder="e.g. We are looking for Fullstack Devs!"
                  />
                </div>
              )}

              {/* FAQ Accordion Editor for Help Center Page */}
              {editingPage.slug === 'help-center' && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18, marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Frequently Asked Questions</h4>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Configure collapsible accordion Q/A cards on the Help Center page.</p>
                    </div>
                    <button
                      onClick={handleAddFaq}
                      type="button"
                      style={{
                        padding: '6px 12px',
                        background: 'var(--bg-elevated)',
                        color: 'var(--accent)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        fontSize: 11, fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      + Add FAQ Item
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {editFaqs.map((faq, index) => (
                      <div
                        key={index}
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-lg)',
                          padding: 14,
                          position: 'relative'
                        }}
                      >
                        <button
                          onClick={() => handleDeleteFaq(index)}
                          style={{
                            position: 'absolute', top: 12, right: 12,
                            background: 'none', border: 'none', color: 'var(--text-muted)',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--red)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <X size={14} />
                        </button>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginRight: 20 }}>
                          <input
                            value={faq.question}
                            onChange={(e) => handleUpdateFaq(index, 'question', e.target.value)}
                            placeholder={`Question #${index + 1}`}
                            style={{ fontSize: 13, fontWeight: 600 }}
                          />
                          <textarea
                            value={faq.answer}
                            onChange={(e) => handleUpdateFaq(index, 'answer', e.target.value)}
                            placeholder="Detailed explanation..."
                            style={{ fontSize: 12, minHeight: 60, resize: 'vertical' }}
                          />
                        </div>
                      </div>
                    ))}
                    {editFaqs.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-muted)', fontSize: 12 }}>
                        No FAQs created. Click "+ Add FAQ Item" to begin.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12,
              padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)'
            }}>
              <button
                onClick={() => setEditingPage(null)}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  background: 'none',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  borderRadius: 'var(--radius)',
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePage}
                disabled={saving}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 22px',
                  background: 'var(--accent)',
                  color: '#000',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  fontSize: 13, fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}