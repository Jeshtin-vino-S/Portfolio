import React, { useState, useEffect } from 'react';
import './index.css';
import Admin from './Admin.jsx';

// Profile & Asset Images
import myImage from './assets/my-image.png';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function App() {
  const [isAdminView, setIsAdminView] = useState(
    typeof window !== 'undefined' && window.location.pathname === '/admin'
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Dynamic Portfolio Data directly fetched from MongoDB Database
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState('');

  const contactEmail = 'jestinvino824@gmail.com';

  const copyEmail = () => {
    navigator.clipboard.writeText(contactEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeMenu = () => setMobileMenuOpen(false);

  // Fetch live projects and skills from MongoDB Backend API
  useEffect(() => {
    const fetchLiveContent = async () => {
      setLoadingData(true);
      try {
        const [projRes, skillsRes] = await Promise.all([
          fetch(`${API_BASE}/projects`).catch(() => null),
          fetch(`${API_BASE}/skills`).catch(() => null)
        ]);

        if (projRes && projRes.ok) {
          const pData = await projRes.json();
          if (pData.success && Array.isArray(pData.data)) {
            setProjects(pData.data);
          }
        }

        if (skillsRes && skillsRes.ok) {
          const sData = await skillsRes.json();
          if (sData.success && Array.isArray(sData.data)) {
            setSkills(sData.data);
          }
        }
      } catch (err) {
        console.log('Error fetching live portfolio data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchLiveContent();
  }, [isAdminView]);

  // Clean URL Routing & Smooth Scrolling without '#'
  useEffect(() => {
    // 1. If loaded with #hash (e.g. /#skills), convert to clean /skills
    if (window.location.hash) {
      const hashName = window.location.hash.replace('#', '');
      window.history.replaceState(null, '', hashName === 'hero' ? '/' : `/${hashName}`);
      const el = document.getElementById(hashName);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      // 2. If loaded directly with pathname (e.g. /skills, /work, /admin)
      const path = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
      if (path === 'admin') {
        setIsAdminView(true);
        return;
      }
      if (path && ['hero', 'work', 'skills', 'about', 'contact'].includes(path)) {
        setTimeout(() => {
          const el = document.getElementById(path);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }

    // 3. Browser Back/Forward navigation support
    const handlePopState = () => {
      if (window.location.pathname === '/admin') {
        setIsAdminView(true);
        return;
      } else {
        setIsAdminView(false);
      }
      const path = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
      const targetId = path || 'hero';
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    };
    window.addEventListener('popstate', handlePopState);

    // 4. Update URL as user scrolls naturally through sections
    if (!isAdminView) {
      const sections = document.querySelectorAll('section[id]');
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = entry.target.id;
              const targetPath = id === 'hero' ? '/' : `/${id}`;
              if (window.location.pathname !== targetPath && window.location.pathname !== '/admin') {
                window.history.replaceState(null, '', targetPath);
              }
            }
          });
        },
        { threshold: 0.35 }
      );
      sections.forEach((sec) => observer.observe(sec));

      return () => {
        window.removeEventListener('popstate', handlePopState);
        observer.disconnect();
      };
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAdminView]);

  // Smooth scroll and update URL cleanly to /skills instead of /#skills
  const scrollToSection = (e, sectionId) => {
    if (e) e.preventDefault();
    if (isAdminView) {
      setIsAdminView(false);
    }
    closeMenu();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    const cleanPath = sectionId === 'hero' ? '/' : `/${sectionId}`;
    if (window.location.pathname !== cleanPath) {
      window.history.pushState(null, '', cleanPath);
    }
  };

  const openAdmin = (e) => {
    if (e) e.preventDefault();
    setIsAdminView(true);
    window.history.pushState(null, '', '/admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeAdmin = () => {
    setIsAdminView(false);
    window.history.pushState(null, '', '/');
  };

  // Form Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    let isValid = true;
    const errors = { name: '', email: '', message: '' };

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!formData.message.trim()) {
      errors.message = 'Message cannot be empty';
      isValid = false;
    }

    setFormErrors(errors);

    if (isValid) {
      setIsSubmitting(true);
      try {
        const res = await fetch(`${API_BASE}/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await res.json();
        if (data.success) {
          setSubmitFeedback(data.message || 'Thank you! Your message has been sent successfully.');
        } else {
          setSubmitFeedback(data.message || 'Message received!');
        }
      } catch (err) {
        setSubmitFeedback('Thank you! Your message has been received.');
      } finally {
        setIsSubmitting(false);
        setFormSubmitted(true);
        setFormData({ name: '', email: '', message: '' });
        setTimeout(() => {
          setFormSubmitted(false);
          setSubmitFeedback('');
        }, 6000);
      }
    }
  };

  // Render Admin View if user navigated to /admin
  if (isAdminView) {
    return <Admin onBackToPortfolio={closeAdmin} />;
  }

  // Filter skills by category
  const frontendSkills = skills.filter((s) => s.category === 'Frontend');
  const backendSkills = skills.filter((s) => s.category === 'Backend');
  const dbSkills = skills.filter((s) => s.category === 'Database');
  const langSkills = skills.filter((s) => s.category === 'Languages & Tools');

  return (
    <div className="portfolio-app">
      {/* ================= 1. HEADER ================= */}
      <header className="site-header">
        <div className="container header-inner">
          <a
            href="/"
            className="logo"
            onClick={(e) => scrollToSection(e, 'hero')}
            aria-label="Jeshtin Vino Home"
          >
            JV<span className="lime-dot">.</span>
          </a>

          <div className="header-right">
            <nav className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`} aria-label="Main navigation">
              <a href="/work" onClick={(e) => scrollToSection(e, 'work')}>Work</a>
              <a href="/skills" onClick={(e) => scrollToSection(e, 'skills')}>Skills</a>
              <a href="/about" onClick={(e) => scrollToSection(e, 'about')}>About</a>
              <a href="/contact" onClick={(e) => scrollToSection(e, 'contact')}>Contact</a>
            </nav>

            <div className="status-badge" title="Actively considering full stack development roles">
              <span className="pulse-dot" aria-hidden="true"></span>
              <span>Open to work</span>
            </div>

            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <i className={mobileMenuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'}></i>
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ================= 2. HERO ================= */}
        <section className="hero-section" id="hero">
          <div className="container hero-grid">
            <div className="hero-content">
              <span className="section-label">Full Stack Developer</span>
              <h1 className="hero-headline">
                Jeshtin ships web apps that <span className="highlight">feel alive.</span>
              </h1>
              <p className="hero-subtext">
                Full stack developer specializing in React.js, Node.js, Express.js, and databases (MongoDB, MySQL).
                I build responsive, full-stack web applications powered by JavaScript and Python.
              </p>
              <div className="hero-actions">
                <a
                  href="/contact"
                  className="btn-primary"
                  onClick={(e) => scrollToSection(e, 'contact')}
                >
                  <span>Start a project</span>
                  <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
                </a>
                <a
                  href="/work"
                  className="btn-secondary"
                  onClick={(e) => scrollToSection(e, 'work')}
                >
                  <span>Selected Work</span>
                  <span className="mono">↓</span>
                </a>
              </div>
            </div>

            {/* Code Card - Tech Stack as a JS Object */}
            <div className="code-card" role="region" aria-label="Developer tech stack snippet">
              <div className="code-card-header">
                <div className="code-dots" aria-hidden="true">
                  <span className="code-dot"></span>
                  <span className="code-dot"></span>
                  <span className="code-dot"></span>
                </div>
                <span className="code-card-title">developer.config.js</span>
              </div>
              <pre className="code-card-body">
                <code>
                  <span className="code-keyword">const</span> <span className="code-var">developer</span> = &#123;{'\n'}
                  {'  '}<span className="code-prop">name</span>: <span className="code-str">'Jeshtin Vino S'</span>,{'\n'}
                  {'  '}<span className="code-prop">role</span>: <span className="code-str">'Full Stack Developer'</span>,{'\n'}
                  {'  '}<span className="code-prop">education</span>: <span className="code-str">'MCA (2026)'</span>,{'\n'}
                  {'  '}<span className="code-prop">languages</span>: [<span className="code-str">'JavaScript'</span>, <span className="code-str">'Python'</span>],{'\n'}
                  {'  '}<span className="code-prop">frontend</span>: [<span className="code-str">'HTML'</span>, <span className="code-str">'CSS'</span>, <span className="code-str">'React.js'</span>],{'\n'}
                  {'  '}<span className="code-prop">backend</span>: [<span className="code-str">'Node.js'</span>, <span className="code-str">'Express.js'</span>],{'\n'}
                  {'  '}<span className="code-prop">database</span>: [<span className="code-str">'MongoDB'</span>, <span className="code-str">'MySQL'</span>],{'\n'}
                  {'  '}<span className="code-prop">status</span>: <span className="code-str">'Open to work'</span>,{'\n'}
                  {'  '}<span className="code-prop">shipsCleanCode</span>: <span className="code-bool">true</span>{'\n'}
                  &#125;;
                </code>
              </pre>
            </div>
          </div>
        </section>

        {/* ================= 3. SELECTED WORK ================= */}
        <section className="work-section" id="work">
          <div className="container">
            <span className="section-label">01 // Portfolio</span>
            <h2 className="section-title">My Work</h2>

            <div className="work-list">
              {loadingData && projects.length === 0 ? (
                <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }} className="mono">
                  <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.6rem', color: 'var(--accent-lime)' }}></i>
                  // Loading projects...
                </div>
              ) : projects.length === 0 ? (
                <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }} className="mono">
                  // Currently no projects added yet.
                </div>
              ) : (
                projects.map((project, idx) => (
                  <article className="work-row" key={project._id || idx}>
                    <div className="work-num mono">{String(idx + 1).padStart(2, '0')}</div>

                    <div className="work-meta">
                      <h3 className="work-title">{project.title}</h3>
                      <span className="work-tagline mono">
                        {project.type} · {project.stack} · {project.year}
                      </span>
                    </div>

                    <p className="work-outcome">
                      {project.outcome || project.summary}
                    </p>

                    <div className="work-links">
                      {project.demoUrl && (
                        <a
                          href={project.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="work-link"
                          aria-label={`Live demo for ${project.title}`}
                        >
                          <span>Live Demo</span>
                          <span className="work-arrow" aria-hidden="true">↗</span>
                        </a>
                      )}
                      {project.repoUrl && (
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="work-link"
                          aria-label={`Source code on GitHub for ${project.title}`}
                        >
                          <i className="fa-brands fa-github" aria-hidden="true"></i>
                          <span>Code</span>
                        </a>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ================= 4. SKILLS (4 COLUMNS - DYNAMIC) ================= */}
        <section className="skills-section" id="skills">
          <div className="container">
            <span className="section-label">02 // Capabilities</span>
            <h2 className="section-title">Technical Skills</h2>

            <div className="skills-grid">
              {/* Column 1: Frontend */}
              <div className="skills-col">
                <div className="skills-col-header">
                  <i className="fa-solid fa-code" aria-hidden="true"></i>
                  <h3>Frontend</h3>
                </div>
                <ul className="skills-list">
                  {loadingData && skills.length === 0 ? (
                    <li style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }} className="mono">
                      Loading...
                    </li>
                  ) : frontendSkills.length === 0 ? (
                    <li style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }} className="mono">
                      No skills added yet
                    </li>
                  ) : (
                    frontendSkills.map((sk, i) => (
                      <li key={sk._id || i}>
                        <span className="skill-name">{sk.name}</span>
                        <span className="skill-level">{sk.level}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {/* Column 2: Backend */}
              <div className="skills-col">
                <div className="skills-col-header">
                  <i className="fa-solid fa-server" aria-hidden="true"></i>
                  <h3>Backend</h3>
                </div>
                <ul className="skills-list">
                  {loadingData && skills.length === 0 ? (
                    <li style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }} className="mono">
                      Loading...
                    </li>
                  ) : backendSkills.length === 0 ? (
                    <li style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }} className="mono">
                      No skills added yet
                    </li>
                  ) : (
                    backendSkills.map((sk, i) => (
                      <li key={sk._id || i}>
                        <span className="skill-name">{sk.name}</span>
                        <span className="skill-level">{sk.level}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {/* Column 3: Database */}
              <div className="skills-col">
                <div className="skills-col-header">
                  <i className="fa-solid fa-database" aria-hidden="true"></i>
                  <h3>Database</h3>
                </div>
                <ul className="skills-list">
                  {loadingData && skills.length === 0 ? (
                    <li style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }} className="mono">
                      Loading...
                    </li>
                  ) : dbSkills.length === 0 ? (
                    <li style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }} className="mono">
                      No skills added yet
                    </li>
                  ) : (
                    dbSkills.map((sk, i) => (
                      <li key={sk._id || i}>
                        <span className="skill-name">{sk.name}</span>
                        <span className="skill-level">{sk.level}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {/* Column 4: Languages & Tools */}
              <div className="skills-col">
                <div className="skills-col-header">
                  <i className="fa-solid fa-laptop-code" aria-hidden="true"></i>
                  <h3>Languages & Tools</h3>
                </div>
                <ul className="skills-list">
                  {loadingData && skills.length === 0 ? (
                    <li style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }} className="mono">
                      Loading...
                    </li>
                  ) : langSkills.length === 0 ? (
                    <li style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }} className="mono">
                      No skills added yet
                    </li>
                  ) : (
                    langSkills.map((sk, i) => (
                      <li key={sk._id || i}>
                        <span className="skill-name">{sk.name}</span>
                        <span className="skill-level">{sk.level}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 5. ABOUT ================= */}
        <section className="about-section" id="about">
          <div className="container about-grid">
            <div className="about-photo-wrapper">
              <img
                src={myImage}
                alt="Jeshtin Vino - Full Stack Developer"
                className="about-photo"
                loading="lazy"
              />
            </div>

            <div className="about-text">
              <span className="section-label">03 // Background</span>
              <p className="about-lead">
                I'm Jeshtin Vino, a full stack developer based in Thanjavur, Tamil Nadu, pursuing my MCA (graduating in 2026).
              </p>
              <p className="about-body">
                I build responsive, full-stack web applications using React.js, HTML, and CSS on the frontend,
                complemented by Node.js, Express.js, MongoDB, and MySQL on the backend and database layer. With a solid foundation in JavaScript and Python,
                I focus on delivering clean code, fast loading speeds, and web applications that feel completely alive.
              </p>

              <div className="about-stats">
                <div className="stat-item">
                  <span className="stat-value">2026</span>
                  <span className="stat-label">Graduation (MCA)</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">Full-Stack</span>
                  <span className="stat-label">Development</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">Clean</span>
                  <span className="stat-label">Code Ethos</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 6. CONTACT & FORM ================= */}
        <section className="contact-section" id="contact">
          <div className="container contact-inner">
            <div className="contact-header">
              <span className="section-label">04 // Get In Touch</span>
              <h2 className="section-title">Let's build something alive together.</h2>
              <p>
                Have an upcoming project, open role, or want to collaborate?
                Drop a line directly into my inbox or use the form below.
              </p>
            </div>

            {/* Giant Clickable Email */}
            <div className="giant-email-wrap">
              <a
                href={`mailto:${contactEmail}`}
                className="giant-email"
                aria-label={`Send email to ${contactEmail}`}
              >
                <span>{contactEmail}</span>
                <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
              </a>

              <button
                type="button"
                className="copy-btn"
                onClick={copyEmail}
                aria-label="Copy email address to clipboard"
              >
                <i className={copied ? 'fa-solid fa-check' : 'fa-regular fa-copy'} aria-hidden="true"></i>
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Email'}</span>
              </button>
            </div>

            {/* Interactive Contact Form (Saved to MongoDB) */}
            <div className="contact-form-wrap">
              <div className="contact-form-header">
                <h3 className="contact-form-title">
                  Send a <span className="highlight">Message</span>
                </h3>
                <p className="contact-form-desc">
                  Message sent successfully!
                </p>
              </div>

              {formSubmitted ? (
                <div className="form-success-msg" role="status">
                  <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
                  <span>{submitFeedback || 'Thank you! Your message has been sent successfully.'}</span>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleFormSubmit} noValidate>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name" className="form-label">
                        <span>Your Name</span>
                        {formErrors.name && <span className="form-error">{formErrors.name}</span>}
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        className="form-input"
                        value={formData.name}
                        onChange={handleInputChange}
                        aria-invalid={!!formErrors.name}
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email" className="form-label">
                        <span>Your Email</span>
                        {formErrors.email && <span className="form-error">{formErrors.email}</span>}
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="john@example.com"
                        className="form-input"
                        value={formData.email}
                        onChange={handleInputChange}
                        aria-invalid={!!formErrors.email}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="message" className="form-label">
                      <span>Your Message</span>
                      {formErrors.message && <span className="form-error">{formErrors.message}</span>}
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows="5"
                      placeholder="Tell me about your project or opportunity..."
                      className="form-textarea"
                      value={formData.message}
                      onChange={handleInputChange}
                      aria-invalid={!!formErrors.message}
                      disabled={isSubmitting}
                    ></textarea>
                  </div>

                  <button type="submit" className="btn-submit" disabled={isSubmitting}>
                    <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                    <i className="fa-solid fa-paper-plane" aria-hidden="true"></i>
                  </button>
                </form>
              )}
            </div>

            {/* Social & Location Footer */}
            <div className="contact-bottom">
              <div className="social-links">
                <a
                  href="https://github.com/jeshtin-vino-s"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  <i className="fa-brands fa-github" aria-hidden="true"></i>
                  <span>GitHub</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/jeshtin-vino-s-b70935280?utm_source=share_via&utm_content=profile&utm_medium=member_android"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  <i className="fa-brands fa-linkedin-in" aria-hidden="true"></i>
                  <span>LinkedIn</span>
                </a>
                <a
                  href={`mailto:${contactEmail}`}
                  className="social-link"
                >
                  <i className="fa-solid fa-envelope" aria-hidden="true"></i>
                  <span>Email</span>
                </a>
              </div>

              <div className="location-tag">
                <span>📍 Thanjavur, Tamil Nadu, India</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="site-footer">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
          <span>© {new Date().getFullYear()} Jeshtin Vino. All rights reserved.</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>Fullstack MERN Portfolio</span>
            <a
              href="/admin"
              onClick={openAdmin}
              className="mono"
              style={{
                color: 'var(--lime)',
                fontSize: '11px',
                border: '1px solid rgba(198, 255, 61, 0.3)',
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'var(--lime-dim)'
              }}
            >
              🔒 Admin CMS
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
