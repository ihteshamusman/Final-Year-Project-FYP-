/* ================================================
   AlumniInsight — Agentic AI Assistant
   Autonomous reasoning engine with role-based
   contextual intelligence for Admin & Alumni
   ================================================ */

class AgentManager {
    constructor() {
        this.isOpen = false;
        this.conversationHistory = [];
        this.thinkingSteps = [];
        this.sessionId = 'agent_' + Date.now().toString(36);

        // Knowledge base built from dashboard data — Full FMS Faculty Scope
        this.knowledgeBase = {
            alumniStats: {
                total: 3200,
                employed: 2688,
                selfEmployed: 176,
                furtherStudies: 128,
                unemployed: 208,
                employmentRate: 84.0,
                avgTimeToEmployment: 2.6,
                partnerCompanies: 210
            },
            // FMS Organizational Hierarchy
            departments: [
                {
                    name: 'Business Administration',
                    programs: ['BBA – 2 Years', 'BBA – 4 Years', 'BS Public Administration', 'MS Public Administration', 'PhD Public Administration', 'MBA – 2 Years', 'MBA – Executive'],
                    alumniCount: 1120,
                    employmentRate: 84.5
                },
                {
                    name: 'Accounting, Finance & Commerce',
                    programs: ['BS Accounting & Finance', 'MS Accounting & Finance', 'PhD Accounting & Finance', 'BS Commerce', 'MS Commerce', 'PhD Commerce'],
                    alumniCount: 960,
                    employmentRate: 82.8
                },
                {
                    name: 'Technology & Project Management',
                    programs: ['BS Business Analytics', 'MS Business Analytics', 'PhD Business Analytics', 'BS Fintech & E-Commerce', 'MS Fintech & E-Commerce', 'PhD Fintech & E-Commerce', 'BS Project Management', 'MS Project Management', 'PhD Project Management'],
                    alumniCount: 1120,
                    employmentRate: 86.2
                }
            ],
            topCompanies: [
                { name: 'Systems Limited', count: 152, industry: 'IT & Tech' },
                { name: 'HBL', count: 126, industry: 'Banking & Finance' },
                { name: 'Nestle Pakistan', count: 112, industry: 'FMCG' },
                { name: 'Engro Corporation', count: 101, industry: 'Manufacturing' },
                { name: 'Jazz (PMCL)', count: 94, industry: 'Telecom' },
                { name: 'Deloitte Pakistan', count: 88, industry: 'Consulting' },
                { name: 'TPS Pakistan', count: 81, industry: 'IT & Tech' },
                { name: 'Unilever Pakistan', count: 77, industry: 'FMCG' },
                { name: 'State Bank of Pakistan', count: 69, industry: 'Government' },
                { name: 'McKinsey & Company', count: 62, industry: 'Consulting' }
            ],
            industryDistribution: {
                'IT & Technology': 555, 'Banking & Finance': 512, 'Consulting': 416,
                'FMCG': 331, 'Telecommunications': 256, 'Manufacturing': 213,
                'FinTech': 160, 'Government': 139, 'Energy & Utilities': 117,
                'Education': 107, 'NGO & Development': 96, 'Retail & E-Commerce': 85,
                'Healthcare': 75, 'Textiles': 64, 'Media': 43, 'Other': 31
            },
            skills: {
                topDemand: ['Python', 'SQL', 'Excel', 'Power BI', 'Financial Modeling', 'Data Analysis', 'Tableau', 'Agile/Scrum', 'SAP', 'Communication'],
                programSkills: {
                    'Business Analytics': ['Python', 'SQL', 'Power BI', 'Machine Learning', 'Tableau', 'R', 'Data Analysis', 'Excel'],
                    'Project Management': ['MS Project', 'Agile/Scrum', 'Communication', 'Leadership', 'Risk Management', 'Budgeting', 'PRINCE2'],
                    'Accounting & Finance': ['Financial Modeling', 'Accounting', 'Audit', 'Taxation', 'Excel', 'SAP', 'Corporate Finance', 'Investment Analysis'],
                    'Commerce': ['Supply Chain Management', 'Business Law', 'Marketing', 'Economics', 'Negotiation', 'CRM'],
                    'Fintech & E-Commerce': ['Blockchain', 'Python', 'Digital Payments', 'Data Analysis', 'Cloud Computing', 'Cybersecurity', 'SQL'],
                    'Public Administration': ['Policy Analysis', 'Governance', 'Public Finance', 'Leadership', 'Research Methods', 'Strategic Planning'],
                    'BBA': ['Leadership', 'Strategic Planning', 'Communication', 'Marketing', 'HRM', 'Negotiation', 'CRM', 'Digital Marketing'],
                    'MBA': ['Strategic Management', 'Leadership', 'Finance', 'Marketing', 'Operations', 'Entrepreneurship', 'Business Analytics']
                }
            },
            salaryRanges: {
                entry: { min: 35, max: 70, label: 'PKR 35K-70K' },
                mid: { min: 70, max: 130, label: 'PKR 70K-130K' },
                senior: { min: 130, max: 250, label: 'PKR 130K-250K' },
                executive: { min: 250, max: 500, label: 'PKR 250K+' }
            },
            // Program-level statistics (10 program families)
            programs: {
                bba2yr: { name: 'BBA – 2 Years', employmentRate: 82, avgCgpa: 3.18, dept: 'Business Administration' },
                bba4yr: { name: 'BBA – 4 Years', employmentRate: 84, avgCgpa: 3.25, dept: 'Business Administration' },
                accFin: { name: 'Accounting & Finance', employmentRate: 85, avgCgpa: 3.32, dept: 'Accounting, Finance & Commerce' },
                bizAnalytics: { name: 'Business Analytics', employmentRate: 89, avgCgpa: 3.42, dept: 'Technology & Project Management' },
                fintech: { name: 'Fintech & E-Commerce', employmentRate: 88, avgCgpa: 3.38, dept: 'Technology & Project Management' },
                commerce: { name: 'Commerce', employmentRate: 80, avgCgpa: 3.15, dept: 'Accounting, Finance & Commerce' },
                projMgmt: { name: 'Project Management', employmentRate: 85, avgCgpa: 3.30, dept: 'Technology & Project Management' },
                pubAdmin: { name: 'Public Administration', employmentRate: 81, avgCgpa: 3.20, dept: 'Business Administration' },
                mba2yr: { name: 'MBA – 2 Years', employmentRate: 88, avgCgpa: 3.45, dept: 'Business Administration' },
                mbaExec: { name: 'MBA – Executive', employmentRate: 91, avgCgpa: 3.52, dept: 'Business Administration' }
            },
            trends: {
                employmentGrowth: '+2.8% YoY',
                topGrowthIndustry: 'FinTech (+22%)',
                emergingSkills: ['Generative AI', 'Cloud Computing', 'Data Engineering', 'Blockchain', 'Cybersecurity']
            }
        };

        this.initialize();
    }

    // ==================== INITIALIZATION ====================
    initialize() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.fab = document.getElementById('aiAssistantFab');
        this.panel = document.getElementById('aiAssistantPanel');
        this.chatContainer = document.getElementById('aiChatMessages');
        this.inputField = document.getElementById('aiChatInput');
        this.sendBtn = document.getElementById('aiSendBtn');
        this.closeBtn = document.getElementById('aiClosePanel');
        this.quickActions = document.getElementById('aiQuickActions');
        this.clearBtn = document.getElementById('aiClearChat');

        if (!this.fab || !this.panel) return;

        // Event listeners
        this.fab.addEventListener('click', () => this.togglePanel());
        this.closeBtn.addEventListener('click', () => this.closePanel());
        this.sendBtn.addEventListener('click', () => this.handleSend());
        this.clearBtn.addEventListener('click', () => this.clearChat());

        this.inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });

        // Close panel on outside click only on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && this.isOpen &&
                !this.panel.contains(e.target) && !this.fab.contains(e.target)) {
                this.closePanel();
            }
        });

        // Listen for auth changes to refresh suggestions
        window.addEventListener('auth:login', () => this.refreshSuggestions());
        window.addEventListener('auth:logout', () => {
            this.closePanel();
            this.conversationHistory = [];
        });

        this.refreshSuggestions();
    }

    // ==================== PANEL TOGGLE ====================
    togglePanel() {
        if (this.isOpen) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }

    openPanel() {
        this.isOpen = true;
        this.panel.classList.add('open');
        this.fab.classList.add('active');
        this.inputField.focus();

        // Show welcome message on first open
        if (this.conversationHistory.length === 0) {
            this.showWelcomeMessage();
        }
    }

    closePanel() {
        this.isOpen = false;
        this.panel.classList.remove('open');
        this.fab.classList.remove('active');
    }

    // ==================== CONTEXT GATHERING ====================
    getContext() {
        const session = typeof authManager !== 'undefined' ? authManager.getCurrentSession() : null;
        const user = typeof authManager !== 'undefined' ? authManager.getCurrentUser() : null;
        const activePage = document.querySelector('.page.active');
        const currentPage = activePage ? activePage.id.replace('page-', '') : 'dashboard';

        return {
            role: session?.role || 'unknown',
            userName: session?.fullName || 'User',
            userEmail: session?.email || '',
            currentPage,
            user,
            isAdmin: session?.role === 'admin',
            isAlumni: session?.role === 'alumni'
        };
    }

    // ==================== WELCOME MESSAGE ====================
    showWelcomeMessage() {
        const ctx = this.getContext();
        let greeting;

        if (ctx.isAdmin) {
            greeting = `Welcome, **${ctx.userName}**! 👋\n\nI'm your **Strategic AI Assistant** for AlumniInsight. I can help you:\n\n🔍 **Analyze** alumni employment patterns & trends\n📊 **Compare** program performance and identify gaps\n🎯 **Identify** at-risk segments and recommend interventions\n💡 **Generate** actionable insights from the data\n\nAsk me anything or try a quick action below.`;
        } else if (ctx.isAlumni) {
            greeting = `Hi **${ctx.userName}**! 🎓\n\nI'm your **Career Navigator AI**. I can help you:\n\n🗺️ **Map** your ideal career path based on successful alumni\n📈 **Identify** skill gaps and recommend learning paths\n🏢 **Discover** which companies match your profile\n💰 **Estimate** earning potential as you grow\n\nAsk me anything or try a quick action below.`;
        } else {
            greeting = `Hello! I'm the **AlumniInsight AI Assistant**. Please log in to get personalized insights.`;
        }

        this.addMessage('agent', greeting);
    }

    // ==================== QUICK ACTION SUGGESTIONS ====================
    refreshSuggestions() {
        if (!this.quickActions) return;
        const ctx = this.getContext();
        let chips = [];

        if (ctx.isAdmin) {
            chips = [
                { icon: 'fa-chart-line', label: 'Employment trend analysis', query: 'Give me a full employment trend analysis across programs' },
                { icon: 'fa-exclamation-triangle', label: 'At-risk segments', query: 'Which alumni segments are most at risk of unemployment?' },
                { icon: 'fa-lightbulb', label: 'Curriculum recommendations', query: 'Based on industry demand, what curriculum changes do you recommend?' },
                { icon: 'fa-building', label: 'Industry breakdown', query: 'Break down alumni placement by industry and identify growth areas' },
                { icon: 'fa-users', label: 'Program comparison', query: 'Compare Business Analytics vs Project Management performance' },
                { icon: 'fa-star', label: 'Top performers', query: 'Profile the top-performing alumni and identify common success factors' }
            ];
        } else if (ctx.isAlumni) {
            chips = [
                { icon: 'fa-route', label: 'My career path', query: 'Based on my profile, what career path do you recommend?' },
                { icon: 'fa-code', label: 'Skill gap analysis', query: 'What skills am I missing compared to top earners in my field?' },
                { icon: 'fa-building', label: 'Company matches', query: 'Which companies would be the best fit for my profile?' },
                { icon: 'fa-money-bill-trend-up', label: 'Salary growth plan', query: 'How can I maximize my earning potential over the next 3 years?' },
                { icon: 'fa-certificate', label: 'Certifications', query: 'What certifications should I get to boost my employability?' },
                { icon: 'fa-user-group', label: 'Find mentors', query: 'Can you identify alumni mentors who followed a similar path to mine?' }
            ];
        }

        this.quickActions.innerHTML = chips.map(chip =>
            `<button class="ai-chip" data-query="${this.escapeHtml(chip.query)}">
                <i class="fas ${chip.icon}"></i>
                <span>${chip.label}</span>
            </button>`
        ).join('');

        // Attach click handlers
        this.quickActions.querySelectorAll('.ai-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                const query = btn.dataset.query;
                this.inputField.value = query;
                this.handleSend();
            });
        });
    }

    // ==================== SEND HANDLER ====================
    async handleSend() {
        const input = this.inputField.value.trim();
        if (!input) return;

        this.inputField.value = '';
        this.addMessage('user', input);

        // Show thinking indicator
        const thinkingId = this.showThinking();

        // Simulate agentic reasoning with delay
        const response = await this.generateResponse(input);

        // Remove thinking indicator and show response
        this.removeThinking(thinkingId);
        this.addMessage('agent', response.answer, response.reasoning);
    }

    // ==================== REASONING ENGINE (LIVE BACKEND) ====================
    async generateResponse(userInput) {
        const ctx = this.getContext();
        const host = window.location.hostname || 'localhost';
        const API_URL = `http://${host}:8000/ask-agent`;

        try {
            const resp = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: userInput,
                    role: ctx.role || 'admin',
                    user_name: ctx.userName || 'User',
                    current_page: ctx.currentPage || 'dashboard'
                })
            });

            if (!resp.ok) throw new Error(`API error: ${resp.status}`);
            const data = await resp.json();

            return {
                answer: data.answer || 'No response received.',
                reasoning: data.reasoning || ['🤖 Response generated via Groq AI']
            };
        } catch (err) {
            console.error('Agent API error:', err);
            // Fallback: return basic stats from the knowledge base
            const kb = this.knowledgeBase;
            return {
                answer: `## ⚠️ AI Service Unavailable\n\nI couldn't reach the AI backend. Here are cached stats:\n\n` +
                    `- **Total Alumni**: ${kb.alumniStats.total}\n` +
                    `- **Employment Rate**: ${kb.alumniStats.employmentRate}%\n\n` +
                    `> Please ensure the ML service is running: \`python ml-service.py\``,
                reasoning: ['⚠️ Backend unreachable — using cached data']
            };
        }
    }

    // ==================== PAGE-CONTEXT RESPONSES ====================
    getPageContextResponse(page, input) {
        const kb = this.knowledgeBase;

        if (page === 'dashboard' && (input.includes('dashboard') || input.includes('overview') || input.includes('summary'))) {
            return `## 📊 Dashboard Insights Summary\n\n` +
                `Here's what the current dashboard data tells us:\n\n` +
                `### Health Check ✅\n` +
                `- Employment rate at **${kb.alumniStats.employmentRate}%** — above national average\n` +
                `- Time to employment improved by **0.8 months** YoY\n` +
                `- **23 new** partner companies added this year\n\n` +
                `### ⚠️ Watch Items\n` +
                `- ${kb.alumniStats.unemployed} alumni still unemployed\n` +
                `- PM program employment lags BA by 5pp\n` +
                `- Self-employment rate is only ${((kb.alumniStats.selfEmployed / kb.alumniStats.total) * 100).toFixed(1)}% — entrepreneurship programs needed?\n\n` +
                `### 💡 Actionable Insight\n` +
                `Focus on the **${kb.alumniStats.unemployed} unemployed alumni** — targeted intervention could lift overall rate to **91%+**.`;
        }

        if (page === 'predictor' && (input.includes('predict') || input.includes('score') || input.includes('model'))) {
            return `## 🧠 About the Predictor Models\n\n` +
                `The Employability Predictor uses **3 ML/DL models**:\n\n` +
                `| Model | Accuracy | Best For |\n|-------|----------|----------|\n` +
                `| XGBoost | 94.2% | Overall prediction |\n` +
                `| Random Forest | 91.8% | Feature importance |\n` +
                `| Neural Network | 93.5% | Complex patterns |\n\n` +
                `### Key Prediction Factors (by weight)\n` +
                `1. 🎯 **CGPA** — 35% weight\n` +
                `2. 💼 **Internships** — 20% weight\n` +
                `3. 📚 **Skills count** — 15% weight\n` +
                `4. 📜 **Certifications** — 15% weight\n` +
                `5. 🔬 **Projects** — 15% weight\n\n` +
                `> *Tip: Students who score 80+ on the predictor have a **96% actual employment rate** based on historical data.*`;
        }

        return null;
    }

    // ==================== SKILL RECOMMENDATION HELPER ====================
    getSkillRecommendation(skill) {
        const recommendations = {
            'Python': 'Start with Kaggle "Python for Data Science" → Complete a real project → Target: 4-6 weeks',
            'SQL': 'Take "SQL for Data Analysis" on Coursera → Practice on LeetCode SQL → Target: 3-4 weeks',
            'Power BI': 'Microsoft Learn free path → Build 2 dashboards → Get certified → Target: 4 weeks',
            'R': 'DataCamp R track → Apply to a Statistics project → Target: 6 weeks',
            'Machine Learning': 'Andrew Ng\'s course on Coursera → 3 mini projects → Target: 8-10 weeks',
            'Excel': 'Advanced Excel / VBA course → Automate a real workflow → Target: 2-3 weeks',
            'Data Analysis': 'Google Data Analytics certificate → Portfolio project → Target: 8 weeks',
            'MS Project': 'LinkedIn Learning MS Project course → Apply in team setting → Target: 3 weeks',
            'Agile/Scrum': 'Scrum.org PSM I prep → Scrum Master certification → Target: 4-6 weeks',
            'Communication': 'Join Toastmasters or similar → Present at 3 meetups → Ongoing',
            'Leadership': 'Take on team lead responsibilities → Feedback-driven growth → Ongoing',
            'Risk Management': 'PMI-RMP prep materials → Apply in project context → Target: 6 weeks'
        };
        return recommendations[skill] || `Research top courses for ${skill} → Build a portfolio piece → Target: 4-6 weeks`;
    }

    // ==================== MESSAGE RENDERING ====================
    addMessage(role, content, reasoning = null) {
        const msg = document.createElement('div');
        msg.className = `ai-message ai-message-${role}`;

        if (role === 'agent' && reasoning && reasoning.length > 0) {
            // Add collapsible reasoning section
            const reasoningHtml = `
                <div class="ai-reasoning">
                    <button class="ai-reasoning-toggle" onclick="this.parentElement.classList.toggle('expanded')">
                        <i class="fas fa-microchip"></i>
                        <span>View reasoning (${reasoning.length} steps)</span>
                        <i class="fas fa-chevron-down ai-reasoning-arrow"></i>
                    </button>
                    <div class="ai-reasoning-steps">
                        ${reasoning.map(step => `<div class="ai-reasoning-step">${step}</div>`).join('')}
                    </div>
                </div>
            `;

            msg.innerHTML = `
                <div class="ai-message-avatar"><i class="fas fa-robot"></i></div>
                <div class="ai-message-body">
                    ${reasoningHtml}
                    <div class="ai-message-content">${this.formatMarkdown(content)}</div>
                    <div class="ai-message-time">${this.getTimeString()}</div>
                </div>
            `;
        } else if (role === 'agent') {
            msg.innerHTML = `
                <div class="ai-message-avatar"><i class="fas fa-robot"></i></div>
                <div class="ai-message-body">
                    <div class="ai-message-content">${this.formatMarkdown(content)}</div>
                    <div class="ai-message-time">${this.getTimeString()}</div>
                </div>
            `;
        } else {
            msg.innerHTML = `
                <div class="ai-message-body">
                    <div class="ai-message-content">${this.escapeHtml(content)}</div>
                    <div class="ai-message-time">${this.getTimeString()}</div>
                </div>
            `;
        }

        this.chatContainer.appendChild(msg);
        // Scroll to show the start of the new message, not the very bottom
        this.scrollToNewMessage(msg);
        this.conversationHistory.push({ role, content });
    }

    // ==================== THINKING INDICATOR ====================
    showThinking() {
        const id = 'thinking_' + Date.now();
        const el = document.createElement('div');
        el.className = 'ai-message ai-message-agent ai-thinking';
        el.id = id;
        el.innerHTML = `
            <div class="ai-message-avatar"><i class="fas fa-robot"></i></div>
            <div class="ai-message-body">
                <div class="ai-thinking-indicator">
                    <div class="ai-thinking-dots">
                        <span></span><span></span><span></span>
                    </div>
                    <span class="ai-thinking-text">Reasoning...</span>
                </div>
            </div>
        `;
        this.chatContainer.appendChild(el);
        this.scrollToBottom();
        return id;
    }

    removeThinking(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // ==================== CLEAR CHAT ====================
    clearChat() {
        this.chatContainer.innerHTML = '';
        this.conversationHistory = [];
        this.showWelcomeMessage();
    }

    // ==================== HELPERS ====================
    formatMarkdown(text) {
        // Simple markdown-to-HTML for chat
        let html = this.escapeHtml(text);

        // Headers
        html = html.replace(/^######\s(.+)$/gm, '<h6>$1</h6>');
        html = html.replace(/^#####\s(.+)$/gm, '<h5>$1</h5>');
        html = html.replace(/^####\s(.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^###\s(.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^##\s(.+)$/gm, '<h2>$1</h2>');

        // Code blocks
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

        // Bold and italic
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Blockquotes
        html = html.replace(/^&gt;\s(.+)$/gm, '<blockquote>$1</blockquote>');

        // Tables
        html = html.replace(/\|(.+)\|/g, (match) => {
            const cells = match.split('|').filter(c => c.trim());
            if (cells.every(c => /^[\s\-:]+$/.test(c))) return ''; // separator row
            const tag = cells.some(c => /^[\s\-:]+$/.test(c)) ? 'td' : 'td';
            return '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
        });

        // Wrap consecutive <tr> in <table>
        html = html.replace(/((<tr>.*<\/tr>\s*)+)/g, '<div class="ai-table-wrapper"><table class="ai-table">$1</table></div>');

        // First row of each table becomes header
        html = html.replace(/<table class="ai-table"><tr>(.*?)<\/tr>/g, (match, cells) => {
            const headerCells = cells.replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>');
            return `<table class="ai-table"><thead><tr>${headerCells}</tr></thead><tbody>`;
        });
        html = html.replace(/<\/table>/g, '</tbody></table>');

        // Lists
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
        html = html.replace(/^(\d+)\.\s(.+)$/gm, '<li>$2</li>');
        html = html.replace(/((<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');

        // Line breaks
        html = html.replace(/\n\n/g, '<br><br>');
        html = html.replace(/\n/g, '<br>');

        // Remove excessive breaks
        html = html.replace(/(<br>)+(<\/?(h[1-6]|ul|table|div|pre|blockquote))/g, '$2');
        html = html.replace(/(<\/?(h[1-6]|ul|table|div|pre|blockquote)>)(<br>)+/g, '$1');

        return html;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getTimeString() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    scrollToBottom() {
        if (this.chatContainer) {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        }
    }

    scrollToNewMessage(msgEl) {
        if (this.chatContainer && msgEl) {
            // Wait for the DOM to render, then scroll the message into view at the top
            requestAnimationFrame(() => {
                msgEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create global instance
const agentManager = new AgentManager();
