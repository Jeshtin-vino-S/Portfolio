import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function Admin({ onBackToPortfolio }) {
  const [token, setToken] = useState(localStorage.getItem('portfolio_admin_token') || '');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('messages'); // 'messages' | 'projects' | 'skills' | 'security'

  // Data states
  const [messages, setMessages] = useState([]);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [stats, setStats] = useState({ messagesCount: 0, projectsCount: 0, skillsCount: 0, dbConnected: false });
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState({ text: '', type: '' });

  // Password Visibility States (Eye icon)
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // Password Change Form State
  const [pwdChange, setPwdChange] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // New Project Form State
  const [newProject, setNewProject] = useState({
    title: '',
    type: 'Web Application',
    stack: '',
    year: new Date().getFullYear().toString(),
    outcome: '',
    demoUrl: '',
    repoUrl: ''
  });

  // New Skill Form State
  const [newSkill, setNewSkill] = useState({
    category: 'Frontend',
    name: '',
    level: ''
  });

  const showNotification = (text, type = 'success') => {
    setActionMsg({ text, type });
    setTimeout(() => setActionMsg({ text: '', type: '' }), 4000);
  };

  // Login handler - Verifies against MongoDB Atlas via /api/admin/login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem('portfolio_admin_token', data.token);
        setToken(data.token);
        setPassword('');
        showNotification('Logged in successfully! Authenticated via MongoDB.');
      } else {
        setLoginError(data.message || 'Invalid admin credentials');
      }
    } catch (err) {
      setLoginError('Cannot reach backend server. Make sure backend is running on port 5000.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('portfolio_admin_token');
    setToken('');
  };

  // Fetch Admin Data
  const fetchData = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Stats
      const statsRes = await fetch(`${API_BASE}/admin/stats`, { headers });
      if (statsRes.status === 401) {
        handleLogout();
        return;
      }
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.data);

      // Messages
      const msgRes = await fetch(`${API_BASE}/admin/messages`, { headers });
      const msgData = await msgRes.json();
      if (msgData.success) setMessages(msgData.data);

      // Projects
      const projRes = await fetch(`${API_BASE}/projects`);
      const projData = await projRes.json();
      if (projData.success) setProjects(projData.data);

      // Skills
      const skillsRes = await fetch(`${API_BASE}/skills`);
      const skillsData = await skillsRes.json();
      if (skillsData.success) setSkills(skillsData.data);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // Change Password in MongoDB Atlas
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwdChange.currentPassword || !pwdChange.newPassword) {
      showNotification('Current and new password are required', 'error');
      return;
    }
    if (pwdChange.newPassword !== pwdChange.confirmPassword) {
      showNotification('New passwords do not match', 'error');
      return;
    }
    if (pwdChange.newPassword.length < 6) {
      showNotification('New password must be at least 6 characters', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: pwdChange.currentPassword,
          newPassword: pwdChange.newPassword
        })
      });
      const data = await res.json();

      if (data.success) {
        showNotification('Password updated successfully in MongoDB Atlas!');
        setPwdChange({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showNotification(data.message || 'Error updating password', 'error');
      }
    } catch (err) {
      showNotification('Server communication error', 'error');
    }
  };

  // Delete message
  const handleDeleteMessage = async (id) => {
    if (!window.confirm('Delete this message permanently?')) return;

    try {
      const res = await fetch(`${API_BASE}/admin/messages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.filter((m) => m._id !== id));
        showNotification('Message deleted');
      } else {
        showNotification(data.message || 'Error deleting message', 'error');
      }
    } catch (err) {
      showNotification('Server communication error', 'error');
    }
  };

  // Add project
  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProject.title.trim() || !newProject.outcome.trim()) {
      showNotification('Title and outcome are required', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newProject)
      });
      const data = await res.json();

      if (data.success) {
        setProjects((prev) => [...prev, data.data]);
        setNewProject({
          title: '',
          type: 'Web Application',
          stack: '',
          year: new Date().getFullYear().toString(),
          outcome: '',
          demoUrl: '',
          repoUrl: ''
        });
        showNotification('Project added! It is now live on the portfolio.');
      } else {
        showNotification(data.message || 'Failed to add project', 'error');
      }
    } catch (err) {
      showNotification('Server communication error', 'error');
    }
  };

  // Delete project
  const handleDeleteProject = async (id) => {
    if (!window.confirm('Delete this project from your portfolio?')) return;

    try {
      const res = await fetch(`${API_BASE}/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setProjects((prev) => prev.filter((p) => p._id !== id));
        showNotification('Project deleted from portfolio.');
      } else {
        showNotification(data.message || 'Failed to delete project', 'error');
      }
    } catch (err) {
      showNotification('Server communication error', 'error');
    }
  };

  // Add skill
  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.name.trim()) {
      showNotification('Skill name is required', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newSkill)
      });
      const data = await res.json();

      if (data.success) {
        setSkills((prev) => [...prev, data.data]);
        setNewSkill({ category: newSkill.category, name: '', level: '' });
        showNotification('Skill added! It is now live on the portfolio.');
      } else {
        showNotification(data.message || 'Failed to add skill', 'error');
      }
    } catch (err) {
      showNotification('Server communication error', 'error');
    }
  };

  // Delete skill
  const handleDeleteSkill = async (id) => {
    if (!window.confirm('Delete this skill?')) return;

    try {
      const res = await fetch(`${API_BASE}/skills/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setSkills((prev) => prev.filter((s) => s._id !== id));
        showNotification('Skill deleted from portfolio.');
      } else {
        showNotification(data.message || 'Failed to delete skill', 'error');
      }
    } catch (err) {
      showNotification('Server communication error', 'error');
    }
  };

  // ================= LOGIN SCREEN =================
  if (!token) {
    return (
      <div className="admin-page login-page">
        <div className="admin-login-card">
          <div className="admin-header-badge">
            <span className="pulse-dot"></span>
            <span className="mono">MONGODB AUTHENTICATION</span>
          </div>
          <h2 className="admin-login-title">Portfolio Control Center</h2>
          <p className="admin-login-desc">
            Login credentials are encrypted and verified directly through your MongoDB Atlas database.
          </p>

          {loginError && <div className="admin-error-box">{loginError}</div>}

          <form onSubmit={handleLogin} className="admin-login-form">
            <div className="form-group">
              <label htmlFor="admin-user" className="form-label">
                Username or Email
              </label>
              <input
                type="text"
                id="admin-user"
                className="form-input"
                placeholder="admin or jestinvino824@gmail.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-pass" className="form-label">
                Password
              </label>
              <div className="password-input-wrap">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  id="admin-pass"
                  className="form-input"
                  placeholder="Enter database password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  title={showLoginPassword ? 'Hide password' : 'Show password'}
                  tabIndex="-1"
                >
                  <i className={showLoginPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <span>Verify & Unlock Dashboard</span>
              <i className="fa-solid fa-lock-open" aria-hidden="true"></i>
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={onBackToPortfolio}
              className="btn-secondary"
              style={{ fontSize: '13px', padding: '8px 16px' }}
            >
              ← Back to Live Portfolio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= ADMIN DASHBOARD =================
  return (
    <div className="admin-page dashboard-page">
      {/* Top Navbar */}
      <header className="admin-navbar">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="logo">JV<span className="lime-dot">.</span></span>
            <span className="admin-tag mono">ADMIN CMS</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              onClick={onBackToPortfolio}
              className="btn-secondary"
              style={{ fontSize: '13px', padding: '8px 16px' }}
            >
              ← View Live Site
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="btn-secondary"
              style={{ fontSize: '13px', padding: '8px 14px', borderColor: '#ff6b6b', color: '#ff6b6b' }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container" style={{ padding: '40px 24px 80px' }}>
        {/* Notification Toast */}
        {actionMsg.text && (
          <div
            className="form-success-msg"
            style={{
              marginBottom: '24px',
              backgroundColor: actionMsg.type === 'error' ? 'rgba(255, 107, 107, 0.15)' : 'var(--lime-dim)',
              borderColor: actionMsg.type === 'error' ? '#ff6b6b' : 'var(--lime)',
              color: actionMsg.type === 'error' ? '#ff6b6b' : 'var(--lime)'
            }}
          >
            <i className={`fa-solid ${actionMsg.type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check'}`}></i>
            <span>{actionMsg.text}</span>
          </div>
        )}

        {/* Stats Bar */}
        <div className="admin-stats-bar">
          <div className="admin-stat-card">
            <span className="mono admin-stat-label">Messages Received</span>
            <span className="admin-stat-num">{messages.length}</span>
          </div>
          <div className="admin-stat-card">
            <span className="mono admin-stat-label">Live Projects</span>
            <span className="admin-stat-num">{projects.length}</span>
          </div>
          <div className="admin-stat-card">
            <span className="mono admin-stat-label">Total Skills</span>
            <span className="admin-stat-num">{skills.length}</span>
          </div>
          <div className="admin-stat-card">
            <span className="mono admin-stat-label">Database Status</span>
            <span className="admin-stat-status" style={{ color: stats.dbConnected ? 'var(--lime)' : '#FFA657' }}>
              <span
                className="pulse-dot"
                style={{
                  display: 'inline-block',
                  background: stats.dbConnected ? 'var(--lime)' : '#FFA657',
                  boxShadow: stats.dbConnected ? '0 0 10px var(--lime)' : 'none'
                }}
              ></span>
              {stats.dbConnected ? 'MongoDB Atlas Connected' : 'Local / Pending URI'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="admin-tabs">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <i className="fa-solid fa-inbox"></i>
            <span>Messages ({messages.length})</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <i className="fa-solid fa-diagram-project"></i>
            <span>Manage Projects ({projects.length})</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            <i className="fa-solid fa-code"></i>
            <span>Manage Skills ({skills.length})</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <i className="fa-solid fa-shield-halved"></i>
            <span>Security & Password</span>
          </button>
        </div>

        {/* TAB 1: MESSAGES INBOX */}
        {activeTab === 'messages' && (
          <div className="admin-tab-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600' }}>Contact Form Submissions</h2>
              <button onClick={fetchData} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 14px' }}>
                <i className="fa-solid fa-arrows-rotate"></i> Refresh
              </button>
            </div>

            {messages.length === 0 ? (
              <div className="admin-empty-state">
                <i className="fa-regular fa-envelope-open" style={{ fontSize: '40px', color: 'var(--text-dim)' }}></i>
                <p>No messages received yet. Submit a message from the live portfolio contact form to test!</p>
              </div>
            ) : (
              <div className="messages-grid">
                {messages.map((msg) => (
                  <div key={msg._id || Math.random()} className="admin-message-card">
                    <div className="msg-card-top">
                      <div>
                        <h4 className="msg-sender-name">{msg.name}</h4>
                        <a href={`mailto:${msg.email}`} className="msg-sender-email mono">
                          {msg.email}
                        </a>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="msg-date mono">
                          {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : 'Just now'}
                        </span>
                        <div>
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg._id)}
                            className="msg-del-btn"
                            title="Delete message"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="msg-card-body">
                      <p>{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROJECTS MANAGER */}
        {activeTab === 'projects' && (
          <div className="admin-tab-content">
            <div className="admin-manager-layout">
              {/* Add Project Form */}
              <div className="admin-form-panel">
                <h3 className="panel-title">Add New Project</h3>
                <p className="panel-desc">Any project added here immediately updates on the live website.</p>

                <form onSubmit={handleAddProject} className="admin-create-form">
                  <div className="form-group">
                    <label className="form-label">Project Title *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. AI Content Studio"
                      value={newProject.title}
                      onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Type</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Web Application"
                        value={newProject.type}
                        onChange={(e) => setNewProject({ ...newProject, type: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Year</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="2025"
                        value={newProject.year}
                        onChange={(e) => setNewProject({ ...newProject, year: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tech Stack</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. React.js · Node.js · MongoDB"
                      value={newProject.stack}
                      onChange={(e) => setNewProject({ ...newProject, stack: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">One-Line Measurable Outcome *</label>
                    <textarea
                      rows="2"
                      className="form-textarea"
                      placeholder="e.g. Reduced payload size 50% through dynamic code-splitting"
                      value={newProject.outcome}
                      onChange={(e) => setNewProject({ ...newProject, outcome: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Live Demo URL</label>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="https://..."
                        value={newProject.demoUrl}
                        onChange={(e) => setNewProject({ ...newProject, demoUrl: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">GitHub Repo URL</label>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="https://github.com/..."
                        value={newProject.repoUrl}
                        onChange={(e) => setNewProject({ ...newProject, repoUrl: e.target.value })}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    <i className="fa-solid fa-plus"></i>
                    <span>Publish Project to Website</span>
                  </button>
                </form>
              </div>

              {/* Existing Projects List */}
              <div className="admin-list-panel">
                <h3 className="panel-title">Existing Projects ({projects.length})</h3>
                <div className="admin-items-list">
                  {projects.map((proj, idx) => (
                    <div key={proj._id || idx} className="admin-item-card">
                      <div className="item-card-left">
                        <span className="mono item-num">#{proj.num || String(idx + 1).padStart(2, '0')}</span>
                        <div>
                          <h4 className="item-title">{proj.title}</h4>
                          <span className="mono item-sub">{proj.type} · {proj.stack} · {proj.year}</span>
                          <p className="item-desc">{proj.outcome}</p>
                        </div>
                      </div>
                      <div className="item-card-right">
                        {proj._id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(proj._id)}
                            className="item-del-btn"
                            title="Delete project"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SKILLS MANAGER */}
        {activeTab === 'skills' && (
          <div className="admin-tab-content">
            <div className="admin-manager-layout">
              {/* Add Skill Form */}
              <div className="admin-form-panel">
                <h3 className="panel-title">Add New Skill</h3>
                <p className="panel-desc">Add a skill to any category to display on your portfolio.</p>

                <form onSubmit={handleAddSkill} className="admin-create-form">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-input"
                      value={newSkill.category}
                      onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                      style={{ background: '#0E0F13', color: 'var(--text)' }}
                    >
                      <option value="Frontend">Frontend</option>
                      <option value="Backend">Backend</option>
                      <option value="Database">Database</option>
                      <option value="Languages & Tools">Languages & Tools</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Skill Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Next.js, Redis, Docker"
                      value={newSkill.name}
                      onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Level / Descriptor</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Production Ready, Core Framework"
                      value={newSkill.level}
                      onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    <i className="fa-solid fa-plus"></i>
                    <span>Add Skill to Portfolio</span>
                  </button>
                </form>
              </div>

              {/* Existing Skills List */}
              <div className="admin-list-panel">
                <h3 className="panel-title">Current Skills ({skills.length})</h3>

                {['Frontend', 'Backend', 'Database', 'Languages & Tools'].map((cat) => {
                  const catSkills = skills.filter((s) => s.category === cat);
                  return (
                    <div key={cat} style={{ marginBottom: '24px' }}>
                      <h4 className="mono" style={{ color: 'var(--lime)', fontSize: '13px', marginBottom: '12px', letterSpacing: '0.05em' }}>
                        // {cat.toUpperCase()} ({catSkills.length})
                      </h4>
                      <div className="skills-badge-list">
                        {catSkills.map((sk, i) => (
                          <div key={sk._id || i} className="admin-skill-badge">
                            <span className="skill-badge-name">{sk.name}</span>
                            <span className="mono skill-badge-level">{sk.level}</span>
                            {sk._id && (
                              <button
                                type="button"
                                onClick={() => handleDeleteSkill(sk._id)}
                                className="skill-del-btn"
                                title="Remove skill"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SECURITY & PASSWORD (STORED IN MONGODB) */}
        {activeTab === 'security' && (
          <div className="admin-tab-content" style={{ maxWidth: '600px' }}>
            <div className="admin-form-panel">
              <h3 className="panel-title">Admin Account Security</h3>
              <p className="panel-desc">
                Your credentials are encrypted using <strong>bcrypt</strong> and securely stored in MongoDB Atlas collection <code>admins</code>.
              </p>

              <form onSubmit={handleChangePassword} className="admin-create-form">
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <div className="password-input-wrap">
                    <input
                      type={showCurrentPwd ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Enter your current password"
                      value={pwdChange.currentPassword}
                      onChange={(e) => setPwdChange({ ...pwdChange, currentPassword: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      aria-label={showCurrentPwd ? 'Hide password' : 'Show password'}
                      title={showCurrentPwd ? 'Hide password' : 'Show password'}
                      tabIndex="-1"
                    >
                      <i className={showCurrentPwd ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div className="password-input-wrap">
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      className="form-input"
                      placeholder="At least 6 characters"
                      value={pwdChange.newPassword}
                      onChange={(e) => setPwdChange({ ...pwdChange, newPassword: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      aria-label={showNewPwd ? 'Hide password' : 'Show password'}
                      title={showNewPwd ? 'Hide password' : 'Show password'}
                      tabIndex="-1"
                    >
                      <i className={showNewPwd ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <div className="password-input-wrap">
                    <input
                      type={showConfirmPwd ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Re-enter new password"
                      value={pwdChange.confirmPassword}
                      onChange={(e) => setPwdChange({ ...pwdChange, confirmPassword: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      aria-label={showConfirmPwd ? 'Hide password' : 'Show password'}
                      title={showConfirmPwd ? 'Hide password' : 'Show password'}
                      tabIndex="-1"
                    >
                      <i className={showConfirmPwd ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'}></i>
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  <i className="fa-solid fa-key"></i>
                  <span>Update Password in MongoDB</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
