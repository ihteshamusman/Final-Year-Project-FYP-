/* ================================================
   AlumniInsight — Job Market Intelligence Scraper
   Scrapes real-world job data, uses Groq AI to 
   summarize trends and compare with alumni skills
   ================================================ */

class JobMarketScraper {
    constructor() {
        this.API_BASE = 'http://localhost:8000';
        this.cachedResults = null;
        this.lastFetchTime = null;
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
        this.isLoading = false;
    }

    // ==================== CORE SCRAPER METHODS ====================

    /**
     * Fetch job market intelligence from backend
     * Backend scrapes real-time data and sends to Groq for analysis
     */
    async fetchJobMarketData(options = {}) {
        const {
            programs = ['Business Analytics', 'Project Management', 'Accounting & Finance', 'Fintech', 'Public Admin', 'Business Admin'],
            location = 'Pakistan',
            forceRefresh = false
        } = options;

        // Return cached data if still fresh
        if (!forceRefresh && this.cachedResults && this.lastFetchTime &&
            (Date.now() - this.lastFetchTime) < this.CACHE_DURATION) {
            return this.cachedResults;
        }

        this.isLoading = true;
        this.updateLoadingState(true);

        try {
            const resp = await fetch(`${this.API_BASE}/scrape-jobs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ programs, location })
            });

            if (!resp.ok) throw new Error(`Scraper API error: ${resp.status}`);
            const data = await resp.json();

            this.cachedResults = data;
            this.lastFetchTime = Date.now();
            this.isLoading = false;
            this.updateLoadingState(false);
            return data;

        } catch (err) {
            console.error('Job scraper error:', err);
            this.isLoading = false;
            this.updateLoadingState(false);
            throw err;
        }
    }

    /**
     * Fetch AI-powered analytics widget data
     * Groq analyzes alumni data and produces actionable insights
     */
    async fetchAnalyticsWidgets() {
        try {
            const resp = await fetch(`${this.API_BASE}/analytics-widgets`);
            if (!resp.ok) throw new Error(`Analytics widget API error: ${resp.status}`);
            return await resp.json();
        } catch (err) {
            console.error('Analytics widget error:', err);
            return null;
        }
    }

    // ==================== UI RENDERING ====================

    /**
     * Render the Job Market Intelligence page
     */
    async renderJobMarketPage() {
        const container = document.getElementById('jobMarketContent');
        if (!container) return;

        container.innerHTML = this.getLoadingHTML();

        try {
            const data = await this.fetchJobMarketData();
            container.innerHTML = this.buildJobMarketHTML(data);
            this.initJobMarketCharts(data);
        } catch (err) {
            container.innerHTML = this.getErrorHTML(err.message);
        }
    }

    /**
     * Render analytics widgets on the dashboard
     */
    async renderAnalyticsWidgets() {
        const widgetContainer = document.getElementById('analyticsWidgetGrid');
        if (!widgetContainer) return;

        widgetContainer.innerHTML = `
            <div class="analytics-widget-loading">
                <div class="widget-skeleton-grid">
                    ${Array(4).fill('<div class="widget-skeleton"><div class="skeleton-pulse"></div></div>').join('')}
                </div>
            </div>
        `;

        try {
            const widgets = await this.fetchAnalyticsWidgets();
            if (!widgets) throw new Error('No data received');
            widgetContainer.innerHTML = this.buildAnalyticsWidgetsHTML(widgets);
            this.animateWidgets();
        } catch (err) {
            widgetContainer.innerHTML = `
                <div class="analytics-widget-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Could not load AI analytics. <button class="btn btn-outline btn-sm" onclick="jobScraper.renderAnalyticsWidgets()">Retry</button></p>
                    <small>Ensure the ML service is running: <code>python ml-service.py</code></small>
                </div>
            `;
        }
    }

    // ==================== HTML BUILDERS ====================

    buildAnalyticsWidgetsHTML(data) {
        const widgets = data.widgets || [];
        return `
            <div class="ai-widgets-header">
                <div class="ai-widgets-title">
                    <div class="ai-widgets-icon"><i class="fas fa-microchip"></i></div>
                    <div>
                        <h3>AI-Powered Insights</h3>
                        <span class="ai-widgets-subtitle">Real-time analysis powered by Groq AI • Updated ${new Date().toLocaleTimeString()}</span>
                    </div>
                </div>
                <button class="btn btn-outline btn-sm" onclick="jobScraper.renderAnalyticsWidgets()" title="Refresh AI Insights">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
            </div>
            <div class="ai-widgets-grid">
                ${widgets.map((w, i) => this.buildWidgetCard(w, i)).join('')}
            </div>
        `;
    }

    buildWidgetCard(widget, index) {
        const icons = ['fa-chart-line', 'fa-bolt', 'fa-shield-alt', 'fa-lightbulb', 'fa-rocket', 'fa-flag'];
        const gradients = [
            'linear-gradient(135deg, #6366f1, #818cf8)',
            'linear-gradient(135deg, #06b6d4, #22d3ee)',
            'linear-gradient(135deg, #f43f5e, #fb7185)',
            'linear-gradient(135deg, #f59e0b, #fbbf24)',
            'linear-gradient(135deg, #10b981, #34d399)',
            'linear-gradient(135deg, #8b5cf6, #a78bfa)'
        ];

        return `
            <div class="ai-widget-card" style="--widget-delay: ${index * 0.1}s">
                <div class="ai-widget-header">
                    <div class="ai-widget-icon" style="background: ${gradients[index % gradients.length]}">
                        <i class="fas ${icons[index % icons.length]}"></i>
                    </div>
                    <span class="ai-widget-badge">AI Insight</span>
                </div>
                <h4 class="ai-widget-title">${this.escapeHtml(widget.title || 'Insight')}</h4>
                <p class="ai-widget-content">${this.escapeHtml(widget.content || '')}</p>
                ${widget.metric ? `
                    <div class="ai-widget-metric">
                        <span class="ai-widget-metric-value">${this.escapeHtml(widget.metric)}</span>
                        ${widget.trend ? `<span class="ai-widget-trend ${widget.trend === 'up' ? 'positive' : widget.trend === 'down' ? 'negative' : ''}">${widget.trend === 'up' ? '↑' : widget.trend === 'down' ? '↓' : '→'} ${this.escapeHtml(widget.trend_label || '')}</span>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    buildJobMarketHTML(data) {
        return `
            <!-- Job Market Summary -->
            <div class="job-market-summary">
                <div class="jm-summary-card">
                    <div class="jm-summary-icon" style="background: linear-gradient(135deg, #6366f1, #818cf8)">
                        <i class="fas fa-search"></i>
                    </div>
                    <div class="jm-summary-content">
                        <span class="jm-summary-value">${data.total_jobs_analyzed || 0}</span>
                        <span class="jm-summary-label">Jobs Analyzed</span>
                    </div>
                </div>
                <div class="jm-summary-card">
                    <div class="jm-summary-icon" style="background: linear-gradient(135deg, #10b981, #34d399)">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="jm-summary-content">
                        <span class="jm-summary-value">${data.skill_match_rate || '—'}%</span>
                        <span class="jm-summary-label">Avg Skill Match</span>
                    </div>
                </div>
                <div class="jm-summary-card">
                    <div class="jm-summary-icon" style="background: linear-gradient(135deg, #f59e0b, #fbbf24)">
                        <i class="fas fa-fire"></i>
                    </div>
                    <div class="jm-summary-content">
                        <span class="jm-summary-value">${data.top_demand_skill || '—'}</span>
                        <span class="jm-summary-label">Most In-Demand</span>
                    </div>
                </div>
                <div class="jm-summary-card">
                    <div class="jm-summary-icon" style="background: linear-gradient(135deg, #f43f5e, #fb7185)">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <div class="jm-summary-content">
                        <span class="jm-summary-value">${data.biggest_gap_skill || '—'}</span>
                        <span class="jm-summary-label">Biggest Skill Gap</span>
                    </div>
                </div>
            </div>

            <!-- AI Analysis Section -->
            <div class="charts-grid">
                <!-- Groq Summary Card -->
                <div class="chart-card large">
                    <div class="chart-header">
                        <h3><i class="fas fa-robot" style="color:#6366f1;margin-right:8px"></i>Groq AI Market Analysis</h3>
                        <span class="chart-badge">Live AI</span>
                    </div>
                    <div class="chart-body">
                        <div class="ai-analysis-content">${this.formatMarkdown(data.ai_summary || 'No analysis available.')}</div>
                    </div>
                </div>

                <!-- Skill Gap Comparison Chart -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3>Alumni Skills vs Market Demand</h3>
                    </div>
                    <div class="chart-body">
                        <canvas id="skillGapChart"></canvas>
                    </div>
                </div>

                <!-- In-Demand Skills Chart -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3>Top In-Demand Skills (Market)</h3>
                    </div>
                    <div class="chart-body">
                        <canvas id="demandSkillsChart"></canvas>
                    </div>
                </div>

                <!-- Program Readiness Radar -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3>Program Market Readiness</h3>
                    </div>
                    <div class="chart-body">
                        <canvas id="programReadinessChart"></canvas>
                    </div>
                </div>

                <!-- Gap Analysis Table -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3><i class="fas fa-crosshairs" style="color:#f43f5e;margin-right:8px"></i>Skill Gap Breakdown</h3>
                    </div>
                    <div class="chart-body">
                        <div class="gap-analysis-list">
                            ${(data.skill_gaps || []).map(gap => `
                                <div class="gap-item">
                                    <div class="gap-info">
                                        <span class="gap-skill">${this.escapeHtml(gap.skill)}</span>
                                        <span class="gap-detail">${this.escapeHtml(gap.detail || '')}</span>
                                    </div>
                                    <div class="gap-bars">
                                        <div class="gap-bar-row">
                                            <span class="gap-bar-label">Alumni</span>
                                            <div class="gap-bar-track">
                                                <div class="gap-bar-fill alumni-fill" style="width: ${gap.alumni_pct || 0}%"></div>
                                            </div>
                                            <span class="gap-bar-pct">${gap.alumni_pct || 0}%</span>
                                        </div>
                                        <div class="gap-bar-row">
                                            <span class="gap-bar-label">Market</span>
                                            <div class="gap-bar-track">
                                                <div class="gap-bar-fill market-fill" style="width: ${gap.market_pct || 0}%"></div>
                                            </div>
                                            <span class="gap-bar-pct">${gap.market_pct || 0}%</span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== CHART INITIALIZATION ====================

    initJobMarketCharts(data) {
        const colors = this.getChartColors();

        // Skill Gap Comparison (Grouped Bar)
        const skillGapCtx = document.getElementById('skillGapChart');
        if (skillGapCtx && data.skill_comparison) {
            new Chart(skillGapCtx, {
                type: 'bar',
                data: {
                    labels: data.skill_comparison.map(s => s.skill),
                    datasets: [{
                        label: 'Alumni Have (%)',
                        data: data.skill_comparison.map(s => s.alumni_pct),
                        backgroundColor: 'rgba(99, 102, 241, 0.7)',
                        borderRadius: 6,
                        borderSkipped: false,
                    }, {
                        label: 'Market Demands (%)',
                        data: data.skill_comparison.map(s => s.market_pct),
                        backgroundColor: 'rgba(244, 63, 94, 0.7)',
                        borderRadius: 6,
                        borderSkipped: false,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top' } },
                    scales: {
                        y: { grid: { color: colors.grid }, beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        // Demand Skills (Horizontal Bar)
        const demandCtx = document.getElementById('demandSkillsChart');
        if (demandCtx && data.demand_skills) {
            new Chart(demandCtx, {
                type: 'bar',
                data: {
                    labels: data.demand_skills.map(s => s.skill),
                    datasets: [{
                        label: 'Demand Score',
                        data: data.demand_skills.map(s => s.score),
                        backgroundColor: data.demand_skills.map((_, i) => {
                            const palette = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#22d3ee'];
                            return palette[i % palette.length];
                        }),
                        borderRadius: 8,
                        borderSkipped: false,
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { color: colors.grid }, beginAtZero: true },
                        y: { grid: { display: false } }
                    }
                }
            });
        }

        // Program Readiness Radar
        const readinessCtx = document.getElementById('programReadinessChart');
        if (readinessCtx && data.program_readiness) {
            const programs = Object.keys(data.program_readiness);
            const readinessColors = ['#06b6d4', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#8b5cf6'];

            new Chart(readinessCtx, {
                type: 'radar',
                data: {
                    labels: ['Technical Skills', 'Soft Skills', 'Certifications', 'Industry Alignment', 'Experience', 'Market Readiness'],
                    datasets: programs.map((prog, i) => ({
                        label: prog,
                        data: data.program_readiness[prog],
                        backgroundColor: `${readinessColors[i % readinessColors.length]}15`,
                        borderColor: readinessColors[i % readinessColors.length],
                        borderWidth: 2,
                        pointBackgroundColor: readinessColors[i % readinessColors.length],
                        pointRadius: 3,
                    }))
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            grid: { color: colors.grid },
                            angleLines: { color: colors.grid },
                            pointLabels: { font: { size: 10, weight: '600' } },
                            ticks: { display: false }
                        }
                    },
                    plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } }
                }
            });
        }
    }

    // ==================== UTILITIES ====================

    getChartColors() {
        const isLight = document.documentElement.hasAttribute('data-theme');
        return {
            text: isLight ? '#1e293b' : '#f1f5f9',
            grid: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(148,163,184,0.1)',
        };
    }

    getLoadingHTML() {
        return `
            <div class="job-market-loading">
                <div class="jm-loading-icon">
                    <i class="fas fa-satellite-dish fa-spin"></i>
                </div>
                <h3>Scanning Job Market...</h3>
                <p>Groq AI is analyzing real-time job postings and comparing them to alumni skills</p>
                <div class="jm-loading-bar">
                    <div class="jm-loading-progress"></div>
                </div>
            </div>
        `;
    }

    getErrorHTML(message) {
        return `
            <div class="job-market-error">
                <div class="jm-error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Scraper Unavailable</h3>
                <p>${this.escapeHtml(message)}</p>
                <button class="btn btn-primary" onclick="jobScraper.renderJobMarketPage()">
                    <i class="fas fa-redo"></i> Retry
                </button>
                <small style="display:block;margin-top:12px;color:var(--text-muted)">Ensure the ML backend is running: <code>python ml-service.py</code></small>
            </div>
        `;
    }

    updateLoadingState(loading) {
        const indicator = document.getElementById('scraperLoadingIndicator');
        if (indicator) {
            indicator.style.display = loading ? 'flex' : 'none';
        }
    }

    animateWidgets() {
        const widgets = document.querySelectorAll('.ai-widget-card');
        widgets.forEach((w, i) => {
            w.style.opacity = '0';
            w.style.transform = 'translateY(20px)';
            setTimeout(() => {
                w.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                w.style.opacity = '1';
                w.style.transform = 'translateY(0)';
            }, i * 120);
        });
    }

    formatMarkdown(text) {
        let html = this.escapeHtml(text);
        html = html.replace(/^###\s(.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^##\s(.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
        html = html.replace(/((<li>.*<\/li>\s*)+)/g, '<ul>$1</ul>');
        html = html.replace(/\n\n/g, '<br><br>');
        html = html.replace(/\n/g, '<br>');
        return html;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global instance
const jobScraper = new JobMarketScraper();
console.log('✅ Job Market Scraper initialized');
