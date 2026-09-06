import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BackButton from '../BackButton';
import AuthGate from '../AuthGate';
import { isAuthed } from '../../lib/auth';
import API from '../../lib/api';

export default function TemplateBuilder(){
  const location = useLocation();
  const navigate = useNavigate();
  const templateFromState = location.state?.template;

  const [template, setTemplate] = useState(templateFromState || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state with comprehensive resume fields
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    title: '',
    summary: '',
    
    // Experience (multiple entries)
    experience: [
      { company: '', position: '', duration: '', description: '' }
    ],
    
    // Education (multiple entries)
    education: [
      { school: '', degree: '', field: '', year: '' }
    ],
    
    // Skills
    skills: '',
    
    // Certifications
    certifications: '',
  });

  useEffect(() => {
    async function init() {
      if (!templateFromState) {
        setError('No template selected. Please choose a template.');
        return;
      }
      
      if (templateFromState && templateFromState.id && !templateFromState.preview) {
        setLoading(true);
        setError(null);
        try {
          const resp = await API.getTemplate?.(templateFromState.id);
          if (resp && !resp.error) {
            setTemplate(resp);
          } else {
            setTemplate(templateFromState);
          }
        } catch (err) {
          setTemplate(templateFromState);
        }
        setLoading(false);
      }
    }
    init();
  }, [templateFromState, navigate]);

  // Update preview when form changes
  const previewHtml = useMemo(() => {
    if (!template) return '<div style="padding: 20px; text-align: center; color: #999;">Select a template to preview</div>';
    
    let html = template.preview || template.design || '';
    
    // Replace placeholder text with form values
    html = html.replace(/John Doe|JOHN DOE|john doe/gi, form.fullName || 'Your Name');
    html = html.replace(/Software Engineer|SOFTWAREEER|software engineer/gi, form.title || 'Your Title');
    html = html.replace(/john@example\.com/gi, form.email || 'email@example.com');
    html = html.replace(/\(\d{3}\)\s*\d{3}-\d{4}|\(555\)\s*123-4567/gi, form.phone || '(555) 123-4567');
    html = html.replace(/New York, NY|SAN FRANCISCO|Los Angeles|Boston/gi, form.location || 'City, State');
    
    // Replace experience placeholder
    if (form.experience[0]?.company) {
      html = html.replace(/Tech Company|ABC Corporation|TechCorp|Tech Startup/gi, form.experience[0].company);
    }
    if (form.experience[0]?.position) {
      html = html.replace(/Senior Engineer|Manager|Designer|Project Manager/gi, form.experience[0].position);
    }
    
    return html;
  }, [template, form]);

  async function handleSave() {
    // Check for authentication token
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to save this resume.');
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      if (!form.fullName.trim()) {
        setError('Please enter your full name');
        setSaving(false);
        return;
      }

      const payload = {
        templateId: template?.id,
        templateName: template?.name,
        templateColor: template?.color,
        title: form.title || `${form.fullName}'s Resume`,
        content: form,
        design: template?.preview,
      };

      const resp = await API.createResume?.(payload);
      if (resp && resp.error) throw new Error(resp.message || 'Failed to save');

      // Notify other components
      try { 
        window.dispatchEvent(new CustomEvent('resumes:changed')); 
      } catch(e) {}

      // Navigate to the new resume
      navigate(`/resume?id=${resp?.id || resp?._id}`, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to save resume');
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload() {
    try {
      // Create a printable version
      const printWindow = window.open('', '', 'width=900,height=1000');
      printWindow.document.write(previewHtml);
      printWindow.document.close();
      printWindow.print();
    } catch (err) {
      setError('Failed to prepare download');
    }
  }

  const updateFormField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addExperience = () => {
    setForm(prev => ({
      ...prev,
      experience: [...prev.experience, { company: '', position: '', duration: '', description: '' }]
    }));
  };

  const updateExperience = (idx, field, value) => {
    setForm(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === idx ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (idx) => {
    if (form.experience.length > 1) {
      setForm(prev => ({
        ...prev,
        experience: prev.experience.filter((_, i) => i !== idx)
      }));
    }
  };

  const addEducation = () => {
    setForm(prev => ({
      ...prev,
      education: [...prev.education, { school: '', degree: '', field: '', year: '' }]
    }));
  };

  const updateEducation = (idx, field, value) => {
    setForm(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === idx ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (idx) => {
    if (form.education.length > 1) {
      setForm(prev => ({
        ...prev,
        education: prev.education.filter((_, i) => i !== idx)
      }));
    }
  };

  if (loading && !template) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="muted">Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-4 overflow-hidden">
      <div className="w-full max-w-7xl h-full flex flex-col overflow-y-auto pb-4">
        {/* Header */}
        <div className="shrink-0 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton fallbackRoute="/templates" />
            <div>
              <h1 className="text-3xl font-display font-bold">Resume Builder</h1>
              {template && (
                <p className="text-muted-foreground mt-1">Using: <span className="font-semibold">{template.name}</span></p>
              )}
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-4 bg-brick/10 text-brick border border-brick/30 rounded-lg shrink-0 flex justify-between items-center">
            {error}
            <button onClick={() => setError(null)} className="font-semibold">×</button>
          </div>
        )}

        {/* Toggle Preview Button */}
        <div className="shrink-0 mb-4 flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`btn ${showPreview ? 'btn-primary' : ''}`}
          >
            {showPreview ? '👁️ Hide Preview' : '👁️ Show Preview'}
          </button>
          <button
            onClick={handleDownload}
            className="btn"
          >
            📥 Download PDF
          </button>
        </div>

        {/* Main Layout */}
        <div className="flex gap-6 flex-1 overflow-hidden">
          {/* Form Section */}
          <div className={`${showPreview ? 'w-1/2' : 'w-full'} overflow-y-auto pb-4 pr-4`}>
            <div className="card p-6">
              <h2 className="text-2xl font-display font-bold mb-6">Your information</h2>

              {/* Contact Info Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Contact Information</h3>
                
                <label className="block font-medium text-sm mb-1">Full Name *</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => updateFormField('fullName', e.target.value)}
                  className="input w-full mb-3"
                  placeholder="John Doe"
                />

                <label className="block font-medium text-sm mb-1">Professional Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateFormField('title', e.target.value)}
                  className="input w-full mb-3"
                  placeholder="Software Engineer, Marketing Manager, etc."
                />

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block font-medium text-sm mb-1">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateFormField('email', e.target.value)}
                      className="input w-full"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-sm mb-1">Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateFormField('phone', e.target.value)}
                      className="input w-full"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>

                <label className="block font-medium text-sm mb-1">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => updateFormField('location', e.target.value)}
                  className="input w-full mb-3"
                  placeholder="New York, NY"
                />
              </div>

              {/* Professional Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Professional Summary</h3>
                <textarea
                  value={form.summary}
                  onChange={(e) => updateFormField('summary', e.target.value)}
                  className="textarea w-full mb-3"
                  rows={3}
                  placeholder="Brief overview of your professional background and goals..."
                />
              </div>

              {/* Experience Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3 pb-2 border-b">
                  <h3 className="text-lg font-semibold">Work Experience</h3>
                  <button onClick={addExperience} className="btn text-sm">+ Add</button>
                </div>

                {form.experience.map((exp, idx) => (
                  <div key={idx} className="mb-4 p-4 bg-muted rounded-lg">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block font-medium text-sm mb-1">Company</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                          className="input w-full text-sm"
                          placeholder="Company Name"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-sm mb-1">Position</label>
                        <input
                          type="text"
                          value={exp.position}
                          onChange={(e) => updateExperience(idx, 'position', e.target.value)}
                          className="input w-full text-sm"
                          placeholder="Job Title"
                        />
                      </div>
                    </div>
                    <label className="block font-medium text-sm mb-1">Duration</label>
                    <input
                      type="text"
                      value={exp.duration}
                      onChange={(e) => updateExperience(idx, 'duration', e.target.value)}
                      className="input w-full text-sm mb-3"
                      placeholder="e.g., Jan 2020 - Present"
                    />
                    <label className="block font-medium text-sm mb-1">Description</label>
                    <textarea
                      value={exp.description}
                      onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                      className="textarea w-full text-sm mb-2"
                      rows={2}
                      placeholder="Key responsibilities and achievements..."
                    />
                    {form.experience.length > 1 && (
                      <button
                        onClick={() => removeExperience(idx)}
                        className="text-brick text-sm font-medium hover:opacity-75"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Education Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3 pb-2 border-b">
                  <h3 className="text-lg font-semibold">Education</h3>
                  <button onClick={addEducation} className="btn text-sm">+ Add</button>
                </div>

                {form.education.map((edu, idx) => (
                  <div key={idx} className="mb-4 p-4 bg-muted rounded-lg">
                    <label className="block font-medium text-sm mb-1">School/University</label>
                    <input
                      type="text"
                      value={edu.school}
                      onChange={(e) => updateEducation(idx, 'school', e.target.value)}
                      className="input w-full text-sm mb-3"
                      placeholder="University Name"
                    />
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block font-medium text-sm mb-1">Degree</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                          className="input w-full text-sm"
                          placeholder="B.S., M.A., Ph.D."
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-sm mb-1">Field of Study</label>
                        <input
                          type="text"
                          value={edu.field}
                          onChange={(e) => updateEducation(idx, 'field', e.target.value)}
                          className="input w-full text-sm"
                          placeholder="Computer Science"
                        />
                      </div>
                    </div>
                    <label className="block font-medium text-sm mb-1">Graduation Year</label>
                    <input
                      type="text"
                      value={edu.year}
                      onChange={(e) => updateEducation(idx, 'year', e.target.value)}
                      className="input w-full text-sm mb-2"
                      placeholder="2022"
                    />
                    {form.education.length > 1 && (
                      <button
                        onClick={() => removeEducation(idx)}
                        className="text-brick text-sm font-medium hover:opacity-75"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Skills Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Skills</h3>
                <textarea
                  value={form.skills}
                  onChange={(e) => updateFormField('skills', e.target.value)}
                  className="textarea w-full mb-3"
                  rows={2}
                  placeholder="JavaScript, React, Python, Project Management (comma separated)..."
                />
              </div>

              {/* Certifications Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 pb-2 border-b">Certifications</h3>
                <textarea
                  value={form.certifications}
                  onChange={(e) => updateFormField('certifications', e.target.value)}
                  className="textarea w-full mb-3"
                  rows={2}
                  placeholder="AWS Certified Solutions Architect, PMP (Project Management Professional)..."
                />
              </div>

              {!isAuthed() && (
                <div className="pt-4">
                  <AuthGate action="save this resume" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={handleSave}
                  disabled={saving || !isAuthed()}
                  className="btn btn-primary flex-1"
                >
                  {saving ? 'Saving…' : 'Save resume'}
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="w-1/2 overflow-hidden flex flex-col">
              <h3 className="font-display font-semibold mb-2">Live preview</h3>
              <div className="flex-1 border border-border rounded-lg overflow-auto" style={{ background: '#fffdf8', color: '#22262f' }}>
                <div 
                  className="p-6"
                  dangerouslySetInnerHTML={{ __html: previewHtml || '<div style="padding: 20px; color: #999;">No preview available</div>' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
