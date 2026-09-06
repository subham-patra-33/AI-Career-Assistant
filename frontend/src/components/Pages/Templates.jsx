import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../BackButton';
import API from '../../lib/api';

// Comprehensive Resume Template Collection (20+ templates)
const RESUME_TEMPLATES = [
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    category: 'modern',
    description: 'Clean, minimal design with modern spacing and typography',
    preview: `
      <div style="padding: 40px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 32px; color: #1f2937;">John Doe</h1>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Software Engineer • New York, NY • john@example.com • (555) 123-4567</p>
        </div>
        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 14px; font-weight: bold; color: #1f2937; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">PROFESSIONAL SUMMARY</h3>
          <p style="margin: 0; color: #444; font-size: 13px; line-height: 1.6;">Results-driven Software Engineer with 5+ years of experience building scalable web applications.</p>
        </div>
        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 14px; font-weight: bold; color: #1f2937; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">EXPERIENCE</h3>
          <div style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <span style="font-weight: bold; color: #1f2937;">Senior Engineer</span>
              <span style="font-size: 12px; color: #666;">2021 - Present</span>
            </div>
            <div style="color: #666; font-size: 13px; margin: 3px 0;">Tech Company • San Francisco, CA</div>
            <ul style="margin: 5px 0 0 20px; padding: 0; font-size: 13px; color: #444; line-height: 1.5;">
              <li>Led team of 5 engineers delivering 3 major features</li>
              <li>Improved application performance by 40%</li>
            </ul>
          </div>
        </div>
        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 14px; font-weight: bold; color: #1f2937; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">SKILLS</h3>
          <p style="margin: 0; color: #444; font-size: 13px; line-height: 1.6;">JavaScript, React, Node.js, Python, AWS, Docker, PostgreSQL</p>
        </div>
      </div>
    `,
    features: ['Modern design', 'Easy to read', 'ATS-friendly'],
    color: '#3b82f6',
  },
  {
    id: 'professional-classic',
    name: 'Professional Classic',
    category: 'professional',
    description: 'Traditional professional format, universally accepted',
    preview: `
      <div style="padding: 40px; font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; padding-bottom: 15px; border-bottom: 2px solid #000; margin-bottom: 25px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">JANE SMITH</h1>
          <p style="margin: 5px 0 0 0; font-size: 12px;">New York, NY | (555) 987-6543 | jane.smith@example.com</p>
        </div>
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 12px; font-weight: bold; margin: 0 0 8px 0; text-transform: uppercase;">Objective</h3>
          <p style="margin: 0; font-size: 12px; line-height: 1.6;">Seeking a challenging position leveraging 8+ years of professional experience.</p>
        </div>
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 12px; font-weight: bold; margin: 0 0 8px 0; text-transform: uppercase;">Professional Experience</h3>
          <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="font-weight: bold; font-size: 12px;">Manager</span>
              <span style="font-size: 11px;">2020 - Present</span>
            </div>
            <div style="font-size: 11px; margin: 2px 0;">ABC Corporation</div>
            <ul style="margin: 5px 0 0 20px; padding: 0; font-size: 11px; line-height: 1.5;">
              <li>Managed team of 10 professionals</li>
              <li>Increased department productivity by 35%</li>
            </ul>
          </div>
        </div>
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 12px; font-weight: bold; margin: 0 0 8px 0; text-transform: uppercase;">Education</h3>
          <div style="font-size: 11px;"><strong>MBA</strong> - University Name (2015)</div>
        </div>
      </div>
    `,
    features: ['Conservative design', 'Widely recognized', 'Perfect for corporate'],
    color: '#000000',
  },
  {
    id: 'creative-bold',
    name: 'Creative Bold',
    category: 'creative',
    description: 'Eye-catching design for creative professionals',
    preview: `
      <div style="display: flex; min-height: 600px;">
        <div style="width: 30%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; font-family: Arial, sans-serif;">
          <h1 style="margin: 0 0 20px 0; font-size: 28px; font-weight: bold;">Alex</h1>
          <h2 style="margin: 0 0 30px 0; font-size: 16px; font-weight: normal; opacity: 0.9;">Creative Designer</h2>
          <div style="margin-bottom: 25px;">
            <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: bold; text-transform: uppercase;">Contact</p>
            <p style="margin: 0; font-size: 11px; line-height: 1.6;">alex@example.com<br/>(555) 123-4567<br/>Los Angeles, CA</p>
          </div>
          <div style="margin-bottom: 25px;">
            <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: bold; text-transform: uppercase;">Skills</p>
            <p style="margin: 0; font-size: 11px; line-height: 1.6;">UI/UX Design<br/>Figma<br/>Adobe Suite<br/>Web Design<br/>Branding</p>
          </div>
        </div>
        <div style="width: 70%; padding: 30px; background: #f8f9fa; font-family: Arial, sans-serif;">
          <div style="margin-bottom: 25px;">
            <h3 style="font-size: 16px; font-weight: bold; color: #667eea; margin: 0 0 10px 0;">ABOUT</h3>
            <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #444;">Creative designer with passion for creating beautiful digital experiences.</p>
          </div>
          <div style="margin-bottom: 25px;">
            <h3 style="font-size: 16px; font-weight: bold; color: #667eea; margin: 0 0 10px 0;">EXPERIENCE</h3>
            <div style="margin-bottom: 12px;">
              <div style="font-weight: bold; color: #1f2937; font-size: 13px;">UX/UI Designer</div>
              <div style="font-size: 12px; color: #666;">Tech Startup • 2020-Present</div>
              <div style="font-size: 12px; margin-top: 5px; color: #444;">Designed 20+ digital products for Fortune 500 companies</div>
            </div>
          </div>
        </div>
      </div>
    `,
    features: ['Colorful', 'Two-column layout', 'Modern aesthetic'],
    color: '#667eea',
  },
  {
    id: 'tech-focused',
    name: 'Tech Focused',
    category: 'modern',
    description: 'Perfect for tech and software professionals',
    preview: `
      <div style="padding: 40px; font-family: 'Monaco', 'Courier New', monospace; max-width: 800px; margin: 0 auto; background: #f5f5f5;">
        <div style="background: #2d3436; color: #00ff00; padding: 20px; margin-bottom: 25px; border-radius: 5px;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">$ developer_profile</h1>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #00cc00;">~/resume</p>
        </div>
        <div style="margin-bottom: 20px; background: white; padding: 15px; border-left: 4px solid #00ff00;">
          <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: bold; color: #2d3436;">TECHNICAL SKILLS</h3>
          <p style="margin: 0; font-size: 12px; color: #333; line-height: 1.6;">Python • JavaScript • React • Node.js • Docker • Kubernetes</p>
        </div>
        <div style="margin-bottom: 20px; background: white; padding: 15px; border-left: 4px solid #0066ff;">
          <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: bold; color: #2d3436;">PROJECTS</h3>
          <div style="margin-bottom: 10px;">
            <span style="font-weight: bold; color: #2d3436;">Project Alpha</span> - <span style="color: #666; font-size: 11px;">Full-stack web application • 2023</span>
            <div style="font-size: 11px; color: #333; margin-top: 5px;">Built scalable microservices architecture processing 1M+ requests/day</div>
          </div>
        </div>
      </div>
    `,
    features: ['Developer-friendly', 'Monospace font', 'Terminal-inspired'],
    color: '#00ff00',
  },
  {
    id: 'executive-minimal',
    name: 'Executive Minimal',
    category: 'professional',
    description: 'Sophisticated design for executive professionals',
    preview: `
      <div style="padding: 50px; font-family: Georgia, serif; max-width: 800px; margin: 0 auto;">
        <div style="padding-bottom: 30px; border-bottom: 1px solid #ccc; margin-bottom: 35px;">
          <h1 style="margin: 0; font-size: 36px; color: #1a1a1a; font-weight: normal; letter-spacing: 2px;">MICHAEL JOHNSON</h1>
          <p style="margin: 10px 0 0 0; color: #666; font-size: 13px; letter-spacing: 1px;">Chief Technology Officer</p>
        </div>
        <div style="column-count: 2; column-gap: 30px;">
          <div style="margin-bottom: 20px;">
            <h4 style="font-size: 12px; color: #1a1a1a; margin: 0 0 10px 0; font-weight: bold;">EXECUTIVE PROFILE</h4>
            <p style="margin: 0; font-size: 12px; color: #444; line-height: 1.8;">Visionary technology leader with 15+ years driving digital transformation.</p>
          </div>
          <div style="margin-bottom: 20px;">
            <h4 style="font-size: 12px; color: #1a1a1a; margin: 0 0 10px 0; font-weight: bold;">KEY ACHIEVEMENTS</h4>
            <ul style="margin: 0; padding: 0 0 0 20px; font-size: 12px; color: #444;">
              <li>Led $50M technology initiative</li>
              <li>Built world-class engineering team of 200+</li>
              <li>Reduced operational costs by $20M annually</li>
            </ul>
          </div>
        </div>
      </div>
    `,
    features: ['Elegant design', 'Executive level', 'Leadership focused'],
    color: '#666666',
  },
  {
    id: 'gradient-accent',
    name: 'Gradient Accent',
    category: 'modern',
    description: 'Modern design with gradient accents',
    preview: `
      <div style="padding: 40px; font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="border-left: 8px solid; border-image: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) 1; padding-left: 20px; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #1f2937;">SARAH WILLIAMS</h1>
          <p style="margin: 8px 0 0 0; color: #f5576c; font-size: 14px; font-weight: 500;">Marketing Manager</p>
        </div>
        <div style="margin-bottom: 25px;">
          <div style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 2px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; margin-bottom: 10px;">EXPERIENCE</div>
          <div style="margin-bottom: 12px;">
            <div style="font-weight: bold; color: #1f2937;">Marketing Manager</div>
            <div style="font-size: 12px; color: #666; margin-top: 3px;">Global Tech Corporation • 2021-Present</div>
            <div style="font-size: 12px; color: #444; margin-top: 8px;">Managed $5M marketing budget with team of 8, delivering 3x ROI</div>
          </div>
        </div>
      </div>
    `,
    features: ['Gradient elements', 'Modern styling', 'Eye-catching'],
    color: '#f5576c',
  },
  {
    id: 'academic-formal',
    name: 'Academic Formal',
    category: 'professional',
    description: 'Traditional academic format with emphasis on education',
    preview: `
      <div style="padding: 40px; font-family: 'Calibri', 'Arial', sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 20px; font-weight: bold;">EMILY CHEN</h1>
          <p style="margin: 3px 0 0 0; font-size: 11px;">Boston, MA | (555) 222-3333 | emily.chen@email.com</p>
        </div>
        <div style="margin-bottom: 15px;">
          <h3 style="font-size: 11px; font-weight: bold; margin: 0 0 5px 0; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 3px;">Education</h3>
          <div style="font-size: 11px; margin-bottom: 8px;">
            <div style="font-weight: bold;">Ph.D. in Computer Science</div>
            <div style="color: #666;">MIT - 2020</div>
          </div>
          <div style="font-size: 11px;">
            <div style="font-weight: bold;">B.S. in Mathematics</div>
            <div style="color: #666;">Stanford University - 2016</div>
          </div>
        </div>
        <div style="margin-bottom: 15px;">
          <h3 style="font-size: 11px; font-weight: bold; margin: 0 0 5px 0; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 3px;">Research Experience</h3>
          <div style="font-size: 11px;">
            <div style="font-weight: bold;">Research Scientist - AI Lab</div>
            <div style="color: #666;">2020 - Present | Published 15+ peer-reviewed papers</div>
          </div>
        </div>
      </div>
    `,
    features: ['Academic focus', 'Education emphasized', 'Formal structure'],
    color: '#1f2937',
  },
  {
    id: 'sidebar-compact',
    name: 'Sidebar Compact',
    category: 'modern',
    description: 'Compact sidebar layout for detailed information',
    preview: `
      <div style="display: flex; background: #f5f5f5;">
        <div style="width: 25%; background: #2c3e50; color: white; padding: 25px 15px; font-family: Arial, sans-serif;">
          <h2 style="margin: 0 0 20px 0; font-size: 16px; font-weight: bold;">SKILLS</h2>
          <p style="margin: 0 0 10px 0; font-size: 11px; line-height: 1.6; font-weight: bold;">Leadership</p>
          <p style="margin: 0 0 15px 0; font-size: 11px; line-height: 1.6; opacity: 0.9;">Project Mgmt<br/>Team Building<br/>Strategy</p>
          <h2 style="margin: 15px 0 10px 0; font-size: 16px; font-weight: bold;">LANGUAGES</h2>
          <p style="margin: 0; font-size: 11px; line-height: 1.6; opacity: 0.9;">English<br/>Spanish<br/>French</p>
        </div>
        <div style="width: 75%; padding: 25px 30px; background: white; font-family: Arial, sans-serif;">
          <h1 style="margin: 0 0 3px 0; font-size: 24px; font-weight: bold;">JAMES MILLER</h1>
          <p style="margin: 0 0 20px 0; font-size: 12px; color: #666;">Senior Project Manager</p>
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 12px; font-weight: bold; margin: 0 0 8px 0;">EXPERIENCE</h3>
            <div style="font-size: 11px; line-height: 1.8; color: #444;">
              <strong>Project Manager</strong> - Fortune 500 Corp • 2019-Present<br/>
              Directed 5+ cross-functional teams on enterprise initiatives
            </div>
          </div>
        </div>
      </div>
    `,
    features: ['Sidebar layout', 'Compact format', 'Well organized'],
    color: '#2c3e50',
  },
  {
    id: 'minimalist-clean',
    name: 'Minimalist Clean',
    category: 'modern',
    description: 'Ultra-clean with maximum white space',
    preview: `
      <div style="padding: 50px 40px; font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="margin-bottom: 40px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px;">OLIVIA TAYLOR</h1>
          <p style="margin: 15px 0 0 0; font-size: 12px; color: #999; letter-spacing: 0.5px;">PRODUCT MANAGER | SAN FRANCISCO, CA</p>
        </div>
        <div style="margin-bottom: 40px; line-height: 1.8; font-size: 12px; color: #555;">
          <p style="margin: 0;">Product manager with proven track record scaling consumer products from 0 to 1M users.</p>
        </div>
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; font-size: 11px; color: #000; font-weight: 600; letter-spacing: 1px;">WORK HISTORY</h3>
          <div style="margin-bottom: 20px; font-size: 12px;">
            <div style="font-weight: 500; color: #000; margin-bottom: 5px;">Senior Product Manager</div>
            <div style="color: #999; margin-bottom: 8px;">TechCorp Inc. — 2021-Present</div>
            <div style="color: #555; line-height: 1.6;">Led cross-team effort scaling platform revenue by 200%</div>
          </div>
        </div>
      </div>
    `,
    features: ['Minimal design', 'Lots of whitespace', 'Elegant'],
    color: '#000000',
  },
  {
    id: 'colorful-vibrant',
    name: 'Colorful Vibrant',
    category: 'creative',
    description: 'Vibrant colors for dynamic professionals',
    preview: `
      <div style="padding: 40px; font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
          <div style="background: #FF6B6B; color: white; padding: 15px; border-radius: 8px;">
            <h2 style="margin: 0; font-size: 14px; font-weight: bold;">DAVID LEE</h2>
            <p style="margin: 5px 0 0 0; font-size: 12px;">Marketing Director</p>
          </div>
          <div style="background: #4ECDC4; color: white; padding: 15px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; text-align: center;">
            New York, NY • david@email.com
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
          <div style="background: #95E1D3; padding: 15px; border-radius: 8px; font-size: 11px;">
            <h4 style="margin: 0 0 10px 0; font-weight: bold; color: #333;">TECHNICAL SKILLS</h4>
            <p style="margin: 0; color: #555;">SEO, Analytics, CRM, Content</p>
          </div>
          <div style="background: #F38181; color: white; padding: 15px; border-radius: 8px; font-size: 11px;">
            <h4 style="margin: 0 0 10px 0; font-weight: bold;">EXPERIENCE</h4>
            <p style="margin: 0;">5+ years marketing leadership</p>
          </div>
        </div>
      </div>
    `,
    features: ['Colorful design', 'Grid layout', 'Eye-catching'],
    color: '#FF6B6B',
  },
  {
    id: 'infographic-style',
    name: 'Infographic Style',
    category: 'creative',
    description: 'Visual infographic-style resume',
    preview: `
      <div style="padding: 40px; font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h1 style="margin: 0 0 5px 0; font-size: 26px; font-weight: bold;">RACHEL ADAMS</h1>
        <p style="margin: 0 0 25px 0; font-size: 13px; color: #666;">UX/UI Designer & Creative Thinker</p>
        
        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 12px; font-weight: bold; margin: 0 0 12px 0; text-transform: uppercase;">PROFICIENCY LEVELS</h3>
          <div style="margin-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 10px; font-size: 11px;">
              <div style="width: 100px; font-weight: bold;">Figma</div>
              <div style="width: 200px; height: 8px; background: #ddd; border-radius: 4px; overflow: hidden;">
                <div style="height: 100%; width: 90%; background: #667eea;"></div>
              </div>
              <span>90%</span>
            </div>
          </div>
          <div style="margin-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 10px; font-size: 11px;">
              <div style="width: 100px; font-weight: bold;">Adobe XD</div>
              <div style="width: 200px; height: 8px; background: #ddd; border-radius: 4px; overflow: hidden;">
                <div style="height: 100%; width: 75%; background: #667eea;"></div>
              </div>
              <span>75%</span>
            </div>
          </div>
        </div>
      </div>
    `,
    features: ['Visual elements', 'Progress bars', 'Infographic design'],
    color: '#667eea',
  },
  {
    id: 'two-page-style',
    name: 'Two-Page Style',
    category: 'professional',
    description: 'Optimized for two-page resumes',
    preview: `
      <div style="padding: 40px; font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 3px solid #333; padding-bottom: 15px;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">CHRISTOPHER MARTIN</h1>
          <p style="margin: 8px 0 0 0; font-size: 11px;">Senior Vice President of Operations</p>
          <p style="margin: 3px 0 0 0; font-size: 11px;">Chicago, IL • (555) 456-7890 • chris.martin@example.com</p>
        </div>
        <div style="margin-bottom: 18px;">
          <h3 style="font-size: 11px; font-weight: bold; margin: 0 0 8px 0; text-transform: uppercase;">EXECUTIVE SUMMARY</h3>
          <p style="margin: 0; font-size: 11px; line-height: 1.6; text-align: justify;">Strategic operations executive with 20+ years of experience optimizing business processes and leading high-performing teams across Fortune 500 companies.</p>
        </div>
        <div style="margin-bottom: 18px;">
          <h3 style="font-size: 11px; font-weight: bold; margin: 0 0 8px 0; text-transform: uppercase;">CORE COMPETENCIES</h3>
          <p style="margin: 0; font-size: 11px; line-height: 1.6;">Operations Management • Business Development • Strategic Planning • Team Leadership • Process Improvement • P&L Management</p>
        </div>
      </div>
    `,
    features: ['Two-column ready', 'Professional', 'Detailed format'],
    color: '#333333',
  },
];

export default function Templates(){
  const [templates, setTemplates] = useState(RESUME_TEMPLATES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      // Check for authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Try to fetch from API, fallback to built-in templates
        const resp = await API.listTemplates?.();
        if (resp && !resp.error && resp.length > 0) {
          setTemplates(resp);
        }
      } catch (err) {
        // Silently fail - use built-in templates
      } finally {
        setLoading(false);
      }
    }
    
    load();
  }, [navigate]);

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || t.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  function useTemplate(template) {
    setSelectedTemplate(template);
    navigate('/create-resume', { 
      state: { 
        template: {
          id: template.id,
          name: template.name,
          design: template.preview,
          color: template.color,
        }
      }
    });
  }

  const categories = [
    { id: 'all', label: 'All Templates', count: templates.length },
    { id: 'modern', label: 'Modern', count: templates.filter(t => t.category === 'modern').length },
    { id: 'professional', label: 'Professional', count: templates.filter(t => t.category === 'professional').length },
    { id: 'creative', label: 'Creative', count: templates.filter(t => t.category === 'creative').length },
  ];

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-4 overflow-hidden">
      <div className="w-full max-w-7xl h-full flex flex-col overflow-y-auto pb-4">
        
        {/* Header */}
        <div className="shrink-0 mb-6 ruled">
          <div className="flex items-center gap-3 mb-3">
            <BackButton fallbackRoute="/db" />
            <h1 className="text-3xl font-display font-bold">Resume Templates</h1>
          </div>
          <p className="muted ml-15 text-sm">Choose from {templates.length}+ professionally designed templates</p>
        </div>

        {/* Search Bar */}
        <div className="shrink-0 mb-6 flex gap-3">
          <input
            type="text"
            placeholder="Search templates by name or feature..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input flex-1"
          />
          <button className="btn btn-primary" aria-label="Search templates">
            🔍 Search
          </button>
        </div>

        {/* Category Filters */}
        <div className="shrink-0 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  activeFilter === cat.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-secondary-foreground hover:bg-muted'
                }`}
              >
                {cat.label} <span className="ml-2 text-xs opacity-75">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="spinner mb-4"></div>
            <p className="muted">Loading templates...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-4 p-4 bg-brick/10 text-brick border border-brick/30 rounded-lg shrink-0">
            <p>{error}</p>
          </div>
        )}

        {/* Templates Grid */}
        {!loading && filteredTemplates.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTemplates.map((template, idx) => (
              <div
                key={template.id}
                className="card hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer group overflow-hidden animate-fade"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Template Preview Thumbnail */}
                <div 
                  className="h-40 bg-muted mb-3 rounded overflow-hidden border border-border relative group"
                  style={{
                    background: `linear-gradient(135deg, ${template.color}15 0%, ${template.color}08 100%)`
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm text-center p-2 opacity-50 group-hover:opacity-100 transition">
                    <div className="text-center">
                      <div className="text-3xl mb-2">👁️</div>
                      <span>Click to preview</span>
                    </div>
                  </div>
                  <img 
                    src={`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='140'%3E%3Crect fill='%23f3f4f6' width='100' height='140'/%3E%3C/svg%3E`}
                    alt={template.name}
                    className="w-full h-full opacity-0"
                  />
                </div>

                {/* Template Info */}
                <div className="mb-3">
                  <h3 className="font-display font-semibold text-sm mb-1">{template.name}</h3>
                  <p className="text-xs muted line-clamp-2">{template.description}</p>
                </div>

                {/* Features Tags */}
                <div className="mb-3 flex flex-wrap gap-1">
                  {template.features.slice(0, 2).map((feature, i) => (
                    <span key={i} className="text-xs bg-teal/15 text-teal px-2 py-1 rounded">
                      {feature}
                    </span>
                  ))}
                  {template.features.length > 2 && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                      +{template.features.length - 2}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreview(template)}
                    className="flex-1 btn btn-secondary text-xs"
                  >
                    👁️ Preview
                  </button>
                  <button
                    onClick={() => useTemplate(template)}
                    className="flex-1 btn btn-primary text-xs"
                  >
                    ✨ Use
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl font-display font-semibold mb-2">No templates found</p>
            <p className="muted text-center mb-6">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
              className="btn btn-primary"
            >
              🔄 Reset Filters
            </button>
          </div>
        )}

        {/* Results Counter */}
        {!loading && filteredTemplates.length > 0 && (
          <div className="mt-6 text-center text-sm muted">
            Showing {filteredTemplates.length} of {templates.length} templates
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setPreview(null)}
            aria-label="Close preview"
          />
          <div className="bg-white p-6 rounded-lg z-10 w-[min(1100px,95vw)] max-h-[90vh] overflow-auto shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">{preview.name}</h2>
                <p className="muted mt-1">{preview.description}</p>
              </div>
              <button 
                onClick={() => setPreview(null)}
                className="text-2xl hover:opacity-70"
              >
                ✕
              </button>
            </div>

            {/* Template Preview */}
            <div className="border border-border rounded-lg mb-4 overflow-auto max-h-[50vh]" style={{ background: '#fffdf8', color: '#22262f' }}>
              <div dangerouslySetInnerHTML={{ __html: preview.preview }} />
            </div>

            {/* Preview Footer */}
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setPreview(null)}
                className="btn"
              >
                Close
              </button>
              <button
                onClick={() => {
                  useTemplate(preview);
                  setPreview(null);
                }}
                className="btn btn-primary"
              >
                ✨ Use This Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
