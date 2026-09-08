import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import Logo from '../components/layout/Logo';

const ContactUs: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Create mailto link with form data
      const subject = encodeURIComponent(`Contact Form: ${formData.subject}`);
      const body = encodeURIComponent(
        `Name: ${formData.name}\n` +
        `Email: ${formData.email}\n` +
        `Subject: ${formData.subject}\n\n` +
        `Message:\n${formData.message}`
      );

      const mailtoLink = `mailto:taksh.nahata37@gmail.com?subject=${subject}&body=${body}`;

      // Open email client
      window.location.href = mailtoLink;

      // Show success message
      setSubmitStatus('success');

      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <div className="border-b border-hairline bg-surface/90 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center text-ink-muted hover:text-ink transition-colors focus-ring rounded-lg p-1 -ml-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('contact.backToHome')}
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <Logo size="lg" showText={false} />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-[-0.02em] text-ink mb-4">{t('contact.title')}</h1>
            <p className="text-lg sm:text-xl text-ink-muted max-w-2xl mx-auto">
              {t('contact.subtitle')}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Form */}
            <div className="surface-card rounded-card p-6 sm:p-8 border border-hairline">
              <div className="bg-brand-soft border border-brand/20 rounded-xl p-4 mb-6">
                <p className="text-brand-strong font-medium text-center text-sm">
                  {t('contact.form.fasterResponse')}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted mb-2">
                    {t('contact.form.name')}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder={t('contact.form.namePlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted mb-2">
                    {t('contact.form.email')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder={t('contact.form.emailPlaceholder')}
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted mb-2">
                    {t('contact.form.subject')}
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="">{t('contact.form.subjectPlaceholder')}</option>
                    <option value="General Inquiry">{t('contact.form.subjects.general')}</option>
                    <option value="Technical Support">{t('contact.form.subjects.techSupport')}</option>
                    <option value="Account Help">{t('contact.form.subjects.account')}</option>
                    <option value="Feature Request">{t('contact.form.subjects.feature')}</option>
                    <option value="Bug Report">{t('contact.form.subjects.bug')}</option>
                    <option value="Feedback">{t('contact.form.subjects.feedback')}</option>
                    <option value="Other">{t('contact.form.subjects.other')}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold uppercase tracking-[0.08em] text-ink-muted mb-2">
                    {t('contact.form.message')}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="input-field resize-vertical"
                    placeholder={t('contact.form.messagePlaceholder')}
                  />
                </div>

                {submitStatus === 'success' && (
                  <div className="bg-[#eef6f0] border border-[#bfe0c6] rounded-xl p-4 flex items-center">
                    <CheckCircle className="w-5 h-5 text-[#2f7a3d] mr-2 shrink-0" />
                    <p className="text-[#2f7a3d] text-sm">{t('contact.form.success')}</p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="bg-[#f9ebe6] border border-[#e8c4b8] rounded-xl p-4 flex items-center">
                    <AlertCircle className="w-5 h-5 text-[#b23a1c] mr-2 shrink-0" />
                    <p className="text-[#b23a1c] text-sm">{t('contact.form.error')}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      {t('contact.form.sending')}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {t('contact.form.submit')}
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <div className="surface-card rounded-card p-6 sm:p-8 border border-hairline">
                <h2 className="font-display text-xl font-bold text-ink mb-6">{t('contact.info.title')}</h2>

                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-brand-soft rounded-xl flex items-center justify-center mr-4 flex-shrink-0">
                      <Mail className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <h3 className="font-medium text-ink mb-1">{t('contact.info.emailLabel')}</h3>
                      <p className="text-ink-muted">taksh.nahata37@gmail.com</p>
                      <p className="text-sm text-ink-muted/70 mt-1">{t('contact.info.responseData')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-card p-6 sm:p-8 border border-hairline bg-subtle">
                <h3 className="font-display text-lg font-bold text-ink mb-4">{t('contact.reasons.title')}</h3>
                <ul className="space-y-3 text-ink-muted">
                  {(t('contact.reasons.items', { returnObjects: true }) as unknown as string[]).map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-brand rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
