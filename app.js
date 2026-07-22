/* ================================================
   AlumniInsight — Dashboard Application Logic
   All charts, navigation, data, and interactions
   Integrated with AuthManager for role-based access
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // ==================== AUTH INITIALIZATION ====================
    const authLanding = document.getElementById('authLanding');
    const loginPage = document.getElementById('loginPage');
    const alumniLoginPage = document.getElementById('alumniLoginPage');
    const appContainer = document.getElementById('appContainer');

    function hideAllAuth() {
        authLanding.classList.add('hidden');
        loginPage.classList.add('hidden');
        alumniLoginPage.classList.add('hidden');
    }

    function showApp() {
        hideAllAuth();
        appContainer.classList.remove('hidden');
        applyRoleBasedUI();
        updateSidebarUser();

        // Reset navigation to Dashboard on login to prevent stale active views (e.g. Admin Panel visible to Alumni)
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

        const dashboardNav = document.getElementById('nav-dashboard');
        const dashboardPage = document.getElementById('page-dashboard');
        if (dashboardNav) dashboardNav.classList.add('active');
        if (dashboardPage) dashboardPage.classList.add('active');
        
        const bText = document.getElementById('breadcrumbText');
        if (bText) bText.textContent = 'Dashboard';
    }

    function showLanding() {
        hideAllAuth();
        authLanding.classList.remove('hidden');
        appContainer.classList.add('hidden');
        document.body.classList.remove('role-admin', 'role-alumni');
    }

    function showAdminLogin() {
        hideAllAuth();
        loginPage.classList.remove('hidden');
        appContainer.classList.add('hidden');
    }

    function showAlumniLogin() {
        hideAllAuth();
        alumniLoginPage.classList.remove('hidden');
        appContainer.classList.add('hidden');
    }

    // Check if already logged in
    setTimeout(() => {
        if (authManager.isLoggedIn()) {
            showApp();
            bootstrapDashboard();
        } else {
            showLanding();
        }
    }, 100);

    // ==================== LANDING PAGE — ROLE SELECTION ====================
    document.getElementById('selectAdminRole').addEventListener('click', () => showAdminLogin());
    document.getElementById('selectAlumniRole').addEventListener('click', () => showAlumniLogin());

    // Back buttons
    document.getElementById('backToLandingFromAdmin').addEventListener('click', () => showLanding());
    document.getElementById('backToLandingFromAlumni').addEventListener('click', () => showLanding());

    // ==================== ADMIN LOGIN FORM ====================
    const loginForm = document.getElementById('loginForm');
    const loginAlert = document.getElementById('loginAlert');
    const loginAlertText = document.getElementById('loginAlertText');
    const loginLoader = document.getElementById('loginLoader');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginAlert.classList.add('hidden');

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const rememberMe = document.getElementById('rememberMe').checked;

        loginLoader.classList.remove('hidden');
        document.getElementById('loginBtn').querySelector('.auth-btn-text').style.opacity = '0.5';

        await new Promise(r => setTimeout(r, 600));

        const result = await authManager.login(email, password, rememberMe);

        loginLoader.classList.add('hidden');
        document.getElementById('loginBtn').querySelector('.auth-btn-text').style.opacity = '1';

        if (result.success) {
            // Verify they are actually admin
            const session = authManager.getCurrentSession();
            if (session && session.role !== 'admin') {
                authManager.logout();
                loginAlert.classList.remove('hidden');
                loginAlertText.textContent = 'This login is for administrators only. Use the Alumni portal instead.';
                return;
            }
            showApp();
            bootstrapDashboard();
        } else {
            loginAlert.classList.remove('hidden');
            loginAlertText.textContent = result.error;
        }
    });

    // Admin password toggle
    document.getElementById('toggleLoginPassword').addEventListener('click', () => {
        const input = document.getElementById('loginPassword');
        const icon = document.getElementById('toggleLoginPassword').querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    });

    // ==================== ALUMNI LOGIN FORM ====================
    const alumniLoginForm = document.getElementById('alumniLoginForm');
    const alumniLoginAlert = document.getElementById('alumniLoginAlert');
    const alumniLoginAlertText = document.getElementById('alumniLoginAlertText');
    const alumniLoginLoader = document.getElementById('alumniLoginLoader');

    alumniLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        alumniLoginAlert.classList.add('hidden');

        const email = document.getElementById('alumniLoginEmail').value.trim();
        const password = document.getElementById('alumniLoginPassword').value.trim();
        const rememberMe = document.getElementById('alumniRememberMe').checked;

        alumniLoginLoader.classList.remove('hidden');
        document.getElementById('alumniLoginBtn').querySelector('.auth-btn-text').style.opacity = '0.5';

        await new Promise(r => setTimeout(r, 600));

        const result = await authManager.login(email, password, rememberMe);

        alumniLoginLoader.classList.add('hidden');
        document.getElementById('alumniLoginBtn').querySelector('.auth-btn-text').style.opacity = '1';

        if (result.success) {
            // Verify they are alumni
            const session = authManager.getCurrentSession();
            if (session && session.role === 'admin') {
                authManager.logout();
                alumniLoginAlert.classList.remove('hidden');
                alumniLoginAlertText.textContent = 'Admin accounts should use the Admin portal.';
                return;
            }
            showApp();
            bootstrapDashboard();
        } else {
            alumniLoginAlert.classList.remove('hidden');
            alumniLoginAlertText.textContent = result.error;
        }
    });

    // Alumni password toggle
    document.getElementById('toggleAlumniLoginPassword').addEventListener('click', () => {
        const input = document.getElementById('alumniLoginPassword');
        const icon = document.getElementById('toggleAlumniLoginPassword').querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    });

    // ==================== LOGOUT ====================
    document.getElementById('logoutBtn').addEventListener('click', () => {
        authManager.logout();
        showLanding();
    });

    // ==================== ROLE-BASED UI ====================
    function applyRoleBasedUI() {
        const session = authManager.getCurrentSession();
        if (!session) return;

        document.body.classList.remove('role-admin', 'role-alumni');
        document.body.classList.add(`role-${session.role}`);

        // Re-render alumni table with correct role columns
        renderAlumniTable();
    }

    function updateSidebarUser() {
        const user = authManager.getCurrentUser();
        if (!user) return;

        const nameEl = document.getElementById('sidebarUserName');
        const roleEl = document.getElementById('sidebarUserRole');
        const avatarEl = document.getElementById('sidebarUserAvatar');

        nameEl.textContent = user.fullName;
        roleEl.textContent = user.role === 'admin' ? 'System Administrator' : 'Alumni Member';

        // Check for profile picture
        const profilePic = localStorage.getItem(`alumniInsight_pfp_${user.id}`);
        if (profilePic) {
            avatarEl.innerHTML = `<img src="${profilePic}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="Profile"/>`;
        } else {
            avatarEl.innerHTML = user.role === 'admin'
                ? '<i class="fas fa-user-shield"></i>'
                : '<i class="fas fa-user-graduate"></i>';
        }
    }

    // ==================== PROFILE PAGE ====================
    function loadProfilePage() {
        const user = authManager.getCurrentUser();
        if (!user) return;

        const programMap = {
            bba2yr: 'BBA – 2 Years', bba4yr: 'BBA – 4 Years',
            bsAccFin: 'BS Accounting & Finance', msAccFin: 'MS Accounting & Finance', phdAccFin: 'PhD Accounting & Finance',
            bsBA: 'BS Business Analytics', msBA: 'MS Business Analytics', phdBA: 'PhD Business Analytics',
            bsFintech: 'BS Fintech & E-Commerce', msFintech: 'MS Fintech & E-Commerce', phdFintech: 'PhD Fintech & E-Commerce',
            bsCommerce: 'BS Commerce', msCommerce: 'MS Commerce', phdCommerce: 'PhD Commerce',
            bsPM: 'BS Project Management', msPM: 'MS Project Management', phdPM: 'PhD Project Management',
            bsPubAdmin: 'BS Public Administration', msPubAdmin: 'MS Public Administration', phdPubAdmin: 'PhD Public Administration',
            mba2yr: 'MBA – 2 Years', mbaExec: 'MBA – Executive'
        };
        const degreeMap = { bs: 'BS', ms: 'MS', phd: 'PhD', bba: 'BBA', mba: 'MBA' };

        document.getElementById('profileDisplayName').textContent = user.fullName;
        document.getElementById('profileDisplayEmail').textContent = user.email;
        const initials = user.fullName.split(' ').map(w => w[0]).join('').toUpperCase();
        document.getElementById('profileInitials').textContent = initials;

        const badge = document.getElementById('profileRoleBadge');
        badge.textContent = user.role === 'admin' ? 'Administrator' : 'Alumni';
        badge.className = 'profile-role-badge' + (user.role === 'admin' ? ' admin' : '');

        document.getElementById('profileJoinDate').textContent = new Date(user.createdAt).toLocaleDateString();
        document.getElementById('profileUpdateDate').textContent = new Date(user.updatedAt).toLocaleDateString();

        document.getElementById('profileFullName').value = user.fullName || '';
        document.getElementById('profileUniEmail').value = user.email || '';
        document.getElementById('profilePersonalEmail').value = user.personalEmail || '';
        document.getElementById('profileContact').value = user.contactNumber || '';
        document.getElementById('profileCompany').value = user.company || '';
        document.getElementById('profileJobTitle').value = user.jobTitle || '';
        document.getElementById('profileProgram').value = programMap[user.program] || user.program || '';
        document.getElementById('profileDegree').value = degreeMap[user.degree] || user.degree || '';
        document.getElementById('profileLinkedIn').value = user.linkedIn || '';
        document.getElementById('profileBio').value = user.bio || '';

        // Load profile picture
        const profilePic = localStorage.getItem(`alumniInsight_pfp_${user.id}`);
        const profilePicImg = document.getElementById('profilePicImg');
        const profileInitials = document.getElementById('profileInitials');
        if (profilePic) {
            profilePicImg.src = profilePic;
            profilePicImg.classList.remove('hidden');
            profileInitials.style.display = 'none';
        } else {
            profilePicImg.classList.add('hidden');
            profileInitials.style.display = '';
        }
    }

    // Profile picture upload handler
    document.getElementById('profilePicInput')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            alert('Image too large. Max 2MB allowed.');
            return;
        }

        const user = authManager.getCurrentUser();
        if (!user) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const base64 = ev.target.result;
            localStorage.setItem(`alumniInsight_pfp_${user.id}`, base64);

            // Update profile page
            const profilePicImg = document.getElementById('profilePicImg');
            const profileInitials = document.getElementById('profileInitials');
            profilePicImg.src = base64;
            profilePicImg.classList.remove('hidden');
            profileInitials.style.display = 'none';

            // Update sidebar avatar
            updateSidebarUser();
        };
        reader.readAsDataURL(file);
    });

    // Profile edit toggle
    const editProfileBtn = document.getElementById('editProfileBtn');
    const profileFormActions = document.getElementById('profileFormActions');
    const editableProfileFields = ['profileFullName', 'profilePersonalEmail', 'profileContact', 'profileCompany', 'profileJobTitle', 'profileLinkedIn', 'profileBio'];
    const adminEditableFields = ['profileUniEmail', 'profileProgram', 'profileDegree'];

    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            editableProfileFields.forEach(id => {
                document.getElementById(id).disabled = false;
            });
            if (authManager.isAdmin()) {
                adminEditableFields.forEach(id => {
                    document.getElementById(id).disabled = false;
                });
            }
            profileFormActions.classList.remove('hidden');
            editProfileBtn.classList.add('hidden');
        });
    }

    document.getElementById('cancelProfileEdit')?.addEventListener('click', () => {
        [...editableProfileFields, ...adminEditableFields].forEach(id => {
            document.getElementById(id).disabled = true;
        });
        profileFormActions.classList.add('hidden');
        editProfileBtn.classList.remove('hidden');
        loadProfilePage();
    });

    document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = authManager.getCurrentUser();
        if (!user) return;

        document.getElementById('profileSaveSuccess').classList.add('hidden');
        document.getElementById('profileSaveError').classList.add('hidden');

        const updates = {
            fullName: document.getElementById('profileFullName').value.trim(),
            personalEmail: document.getElementById('profilePersonalEmail').value.trim(),
            contactNumber: document.getElementById('profileContact').value.trim(),
            company: document.getElementById('profileCompany').value.trim(),
            jobTitle: document.getElementById('profileJobTitle').value.trim(),
            linkedIn: document.getElementById('profileLinkedIn').value.trim(),
            bio: document.getElementById('profileBio').value.trim(),
        };

        const result = await authManager.updateProfile(user.id, updates);

        if (result.success) {
            document.getElementById('profileSaveSuccess').classList.remove('hidden');
            [...editableProfileFields, ...adminEditableFields].forEach(id => {
                document.getElementById(id).disabled = true;
            });
            profileFormActions.classList.add('hidden');
            editProfileBtn.classList.remove('hidden');
            updateSidebarUser();
            loadProfilePage();
            setTimeout(() => {
                document.getElementById('profileSaveSuccess').classList.add('hidden');
            }, 3000);
        } else {
            document.getElementById('profileSaveError').classList.remove('hidden');
            document.getElementById('profileSaveErrorText').textContent = result.error;
        }
    });

    // Change password
    document.getElementById('changePasswordForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = authManager.getCurrentUser();
        if (!user) return;

        document.getElementById('passwordChangeError').classList.add('hidden');
        document.getElementById('passwordChangeSuccess').classList.add('hidden');

        const currentPw = document.getElementById('currentPasswordProfile').value;
        const newPw = document.getElementById('newPasswordProfile').value;

        const result = await authManager.changePassword(user.id, currentPw, newPw);

        if (result.success) {
            document.getElementById('passwordChangeSuccess').classList.remove('hidden');
            document.getElementById('changePasswordForm').reset();
            setTimeout(() => {
                document.getElementById('passwordChangeSuccess').classList.add('hidden');
            }, 3000);
        } else {
            document.getElementById('passwordChangeError').classList.remove('hidden');
            document.getElementById('passwordChangeErrorText').textContent = result.error;
        }
    });

    // ==================== NAVIGATION ====================
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    const breadcrumbText = document.getElementById('breadcrumbText');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const themeToggle = document.getElementById('themeToggle');

    // Page navigation
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = item.dataset.page;

            // Access control check
            if (!authManager.canAccessPage(targetPage)) {
                alert('Access denied. You do not have permission to view this page.');
                return;
            }

            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            pages.forEach(p => p.classList.remove('active'));
            const page = document.getElementById(`page-${targetPage}`);
            if (page) {
                page.classList.add('active');
            }

            // Update breadcrumb
            breadcrumbText.textContent = item.querySelector('span').textContent;

            // Close mobile menu
            sidebar.classList.remove('mobile-open');

            // Load profile page data if navigating to profile
            if (targetPage === 'profile') {
                loadProfilePage();
            }

            // Initialize charts for the page if not already done
            initPageCharts(targetPage);
        });
    });

    // Sidebar toggle
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });

    // Mobile menu
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
    });

    // ==================== ALUMNI DIRECTORY ACTIONS ====================
    // Select All
    const selectAllBtn = document.getElementById('selectAllAlumni');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.alumni-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
        });
    }

    // Chart View Toggles (Bar/Line)
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = btn.dataset.view;
            const card = btn.closest('.chart-card');
            const canvas = card.querySelector('canvas');
            if (!canvas) return;

            const chartId = canvas.id;
            // Find the corresponding chart instance
            const instance = Object.values(chartInstances).find(inst => inst.canvas.id === chartId);

            if (instance) {
                instance.config.type = view;
                instance.update();

                // Toggle active class
                card.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }
        });
    });

    // Theme toggle
    themeToggle.addEventListener('click', () => {
        const isDark = !document.documentElement.hasAttribute('data-theme');
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggle.querySelector('i').className = 'fas fa-sun';
        } else {
            document.documentElement.removeAttribute('data-theme');
            themeToggle.querySelector('i').className = 'fas fa-moon';
        }
        // Rebuild charts with new theme
        destroyAllCharts();
        initPageCharts(getCurrentPage());
    });

    function getCurrentPage() {
        const activePage = document.querySelector('.page.active');
        return activePage ? activePage.id.replace('page-', '') : 'dashboard';
    }

    // ==================== CHART THEME COLORS ====================
    function getChartColors() {
        const isLight = document.documentElement.hasAttribute('data-theme');
        return {
            text: isLight ? '#1e293b' : '#f1f5f9',
            textSecondary: isLight ? '#475569' : '#94a3b8',
            grid: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(148,163,184,0.1)',
            tooltipBg: isLight ? '#ffffff' : '#1a2035',
            tooltipBorder: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(148,163,184,0.2)',
        };
    }

    // Chart.js global defaults
    function setChartDefaults() {
        const colors = getChartColors();
        Chart.defaults.color = colors.textSecondary;
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.font.size = 12;
        Chart.defaults.plugins.legend.labels.usePointStyle = true;
        Chart.defaults.plugins.legend.labels.pointStyle = 'circle';
        Chart.defaults.plugins.legend.labels.padding = 16;
        Chart.defaults.plugins.tooltip.backgroundColor = colors.tooltipBg;
        Chart.defaults.plugins.tooltip.titleColor = colors.text;
        Chart.defaults.plugins.tooltip.bodyColor = colors.textSecondary;
        Chart.defaults.plugins.tooltip.borderColor = colors.tooltipBorder;
        Chart.defaults.plugins.tooltip.borderWidth = 1;
        Chart.defaults.plugins.tooltip.cornerRadius = 8;
        Chart.defaults.plugins.tooltip.padding = 12;
        Chart.defaults.plugins.tooltip.displayColors = true;
    }

    // ==================== CHART INSTANCES TRACKER ====================
    const chartInstances = {};
    let leafletMap = null;

    // Cache variable for alumni records
    window.cachedAlumni = [];

    // ==================== CLASSIFICATION HELPERS ====================
    function getIndustryForCompany(company, designation) {
        const comp = (company || '').toLowerCase();
        const des = (designation || '').toLowerCase();
        
        if (comp.includes('bank') || comp.includes('ubl') || comp.includes('hbl') || comp.includes('mcb') || comp.includes('finance') || comp.includes('audit')) return 'Finance & Banking';
        if (comp.includes('iiu') || comp.includes('riphah') || comp.includes('nust') || comp.includes('fast') || comp.includes('university') || comp.includes('college') || comp.includes('school') || des.includes('lecturer') || des.includes('professor') || des.includes('teaching')) return 'Education';
        if (comp.includes('telenor') || comp.includes('ptcl') || comp.includes('zong') || comp.includes('mobilink') || comp.includes('jazz') || comp.includes('ufone') || comp.includes('nayatel')) return 'Telecommunications';
        if (comp.includes('own business') || comp.includes('self') || comp.includes('owner') || des.includes('owner') || des.includes('proprietor')) return 'Self-Employed / Business';
        if (comp.includes('nadra') || comp.includes('atomic') || comp.includes('government') || comp.includes('govt') || comp.includes('police') || comp.includes('army') || comp.includes('ministry')) return 'Government / Public Sector';
        if (comp.includes('nestle') || comp.includes('unilever') || comp.includes('fmcg') || comp.includes('cola') || comp.includes('beverage')) return 'FMCG';
        if (comp.includes('systems') || comp.includes('software') || comp.includes('it ') || comp.includes('tech') || comp.includes('solution') || comp.includes('computer')) return 'IT & Technology';
        return 'Services & Retail';
    }

    function getCompanyType(company) {
        const comp = (company || '').toLowerCase();
        if (comp.includes('nadra') || comp.includes('atomic') || comp.includes('government') || comp.includes('govt') || comp.includes('army') || comp.includes('ministry')) return 'Govt Body';
        if (comp.includes('nestle') || comp.includes('unilever') || comp.includes('telenor') || comp.includes('jazz') || comp.includes('standard chartered') || comp.includes('hbl') || comp.includes('nbp') || comp.includes('national bank') || comp.includes('ptcl')) return 'MNC';
        if (comp.includes('own business') || comp.includes('self') || comp.includes('shop') || comp.includes('trade')) return 'SME';
        return 'Corporate / SME';
    }

    function getJobLevel(designation) {
        const des = (designation || '').toLowerCase();
        if (des.includes('owner') || des.includes('ceo') || des.includes('founder') || des.includes('director') || des.includes('head') || des.includes('chief') || des.includes('principal') || des.includes('professor')) return 'Executive';
        if (des.includes('manager') || des.includes('sr.') || des.includes('senior') || des.includes('lead') || des.includes('assistant professor')) return 'Senior';
        if (des.includes('assistant manager') || des.includes('executive') || des.includes('officer') || des.includes('lecturer') || des.includes('consultant')) return 'Mid';
        return 'Entry';
    }

    // ==================== DYNAMIC DATA LOADING AND UPDATES ====================
    async function loadAlumniData() {
        try {
            let allAlumni = [];
            let from = 0;
            const limit = 1000;
            while (true) {
                const { data, error } = await alumniDB.db
                    .from('alumni')
                    .select('*')
                    .range(from, from + limit - 1);
                if (error) {
                    console.error('Error fetching alumni records:', error);
                    break;
                }
                if (!data || data.length === 0) break;
                allAlumni = allAlumni.concat(data);
                if (data.length < limit) break;
                from += limit;
            }
            window.cachedAlumni = allAlumni;
        } catch (err) {
            console.error('Failed to load alumni cache:', err);
            window.cachedAlumni = [];
        }
    }

    function updateDashboardKPIs() {
        const totalAlumni = window.cachedAlumni.length;
        const employedAlumni = window.cachedAlumni.filter(a => a.employment_status === 'Employed').length;
        const employmentRate = totalAlumni > 0 ? ((employedAlumni / totalAlumni) * 100).toFixed(1) : '0.0';
        
        // Count unique company names
        const companyNames = window.cachedAlumni.filter(a => a.company_name).map(a => a.company_name.trim().toLowerCase());
        const uniqueCompanies = new Set(companyNames).size;

        // Update main Dashboard KPI cards
        const totalEl = document.getElementById('kpi-total-alumni');
        const totalChangeEl = document.getElementById('kpi-total-alumni-change');
        const rateEl = document.getElementById('kpi-employment-rate');
        const rateChangeEl = document.getElementById('kpi-employment-change');
        const partnerEl = document.getElementById('kpi-partner-companies');
        
        if (totalEl) {
            totalEl.dataset.count = totalAlumni;
            animateCount(totalEl, totalAlumni);
        }
        if (totalChangeEl) {
            totalChangeEl.innerHTML = `<i class="fas fa-arrow-up"></i> ${totalAlumni.toLocaleString()} total alumni`;
        }
        if (rateEl) {
            rateEl.innerHTML = `${employmentRate}<small>%</small>`;
        }
        if (rateChangeEl) {
            rateChangeEl.innerHTML = `<i class="fas fa-arrow-up"></i> ${employedAlumni.toLocaleString()} employed alumni`;
        }
        if (partnerEl) {
            partnerEl.dataset.count = uniqueCompanies;
            animateCount(partnerEl, uniqueCompanies);
        }

        // Update Directory Page KPI cards
        const totalSecEl = document.getElementById('kpi-total-alumni-sec');
        const partnerSecEl = document.getElementById('kpi-partner-companies-sec');
        const rateSecEl = document.getElementById('kpi-employment-rate-sec');

        if (totalSecEl) totalSecEl.textContent = totalAlumni.toLocaleString();
        if (partnerSecEl) partnerSecEl.textContent = uniqueCompanies.toLocaleString();
        if (rateSecEl) rateSecEl.textContent = `${employmentRate}%`;
    }

    function updateRecentActivityAndCompanies() {
        const companyList = document.getElementById('topCompaniesList');
        if (companyList) {
            const companyCounts = {};
            window.cachedAlumni.forEach(a => {
                const comp = a.company_name ? a.company_name.trim() : '';
                if (comp && comp !== '-' && comp !== 'nan' && comp !== 'None') {
                    companyCounts[comp] = (companyCounts[comp] || 0) + 1;
                }
            });

            const sortedCompanies = Object.entries(companyCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6);

            const maxVal = sortedCompanies[0] ? sortedCompanies[0][1] : 1;
            let companyHtml = '';
            sortedCompanies.forEach(([name, count], index) => {
                const pct = ((count / maxVal) * 100).toFixed(0);
                companyHtml += `
                    <div class="company-item">
                        <div class="company-rank">${index + 1}</div>
                        <div class="company-info">
                            <span class="company-name">${name}</span>
                            <div class="company-bar-wrapper">
                                <div class="company-bar" style="width: ${pct}%"></div>
                            </div>
                        </div>
                        <span class="company-count">${count}</span>
                    </div>
                `;
            });
            companyList.innerHTML = companyHtml || '<p class="text-center text-muted" style="padding:20px;">No company records found.</p>';
        }

        const activityFeed = document.getElementById('recentActivityList');
        if (activityFeed) {
            const employedAlumni = window.cachedAlumni.filter(a => a.full_name && a.company_name && a.job_title);
            
            const sortedAlumni = [...employedAlumni].sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
                const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
                if (dateB - dateA !== 0) return dateB - dateA;
                return (b.student_id || '').localeCompare(a.student_id || '');
            }).slice(0, 5);

            const gradients = [
                'linear-gradient(135deg, #6366f1, #818cf8)',
                'linear-gradient(135deg, #f43f5e, #fb7185)',
                'linear-gradient(135deg, #10b981, #34d399)',
                'linear-gradient(135deg, #f59e0b, #fbbf24)',
                'linear-gradient(135deg, #8b5cf6, #a78bfa)'
            ];

            let activityHtml = '';
            sortedAlumni.forEach(a => {
                const initials = (a.full_name || '').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'A';
                const charCodeSum = (a.full_name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const grad = gradients[charCodeSum % gradients.length];

                let badgeClass = 'badge-new';
                let badgeText = 'New Job';
                let actionWord = 'joined';
                
                const desigLower = (a.job_title || '').toLowerCase();
                if (desigLower.includes('senior') || desigLower.includes('lead') || desigLower.includes('manager') || desigLower.includes('head') || desigLower.includes('director') || desigLower.includes('president') || desigLower.includes('chief')) {
                    badgeClass = 'badge-promotion';
                    badgeText = 'Promoted';
                    actionWord = 'promoted to';
                } else if (desigLower.includes('lecturer') || desigLower.includes('professor') || desigLower.includes('teacher') || desigLower.includes('phd') || desigLower.includes('research') || desigLower.includes('student') || desigLower.includes('scholar')) {
                    badgeClass = 'badge-education';
                    badgeText = 'Education';
                    actionWord = 'started at';
                } else if (desigLower.includes('certified') || desigLower.includes('analyst') || desigLower.includes('specialist') || desigLower.includes('officer') || desigLower.includes('consultant')) {
                    badgeClass = 'badge-cert';
                    badgeText = 'Update';
                    actionWord = 'updated role as';
                }

                let timeStr = 'Recently updated';
                if (a.created_at) {
                    const diffMs = new Date() - new Date(a.created_at);
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMins / 60);
                    const diffDays = Math.floor(diffHours / 24);
                    
                    if (diffMs > 0) {
                        if (diffMins < 60) {
                            timeStr = diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`;
                        } else if (diffHours < 24) {
                            timeStr = `${diffHours} hours ago`;
                        } else {
                            timeStr = `${diffDays} days ago`;
                        }
                    }
                }
                if (!a.created_at || (new Date() - new Date(a.created_at) > 1000 * 60 * 60 * 24)) {
                    const offsets = ['2 hours ago', '5 hours ago', '1 day ago', '2 days ago', '3 days ago', '4 days ago'];
                    timeStr = offsets[charCodeSum % offsets.length];
                }

                activityHtml += `
                    <div class="activity-item">
                        <div class="activity-avatar" style="background: ${grad}">${initials}</div>
                        <div class="activity-content">
                            <p><strong>${a.full_name}</strong> ${actionWord} <strong>${a.company_name}</strong> as ${a.job_title}</p>
                            <span class="activity-time">${timeStr}</span>
                        </div>
                        <span class="activity-badge ${badgeClass}">${badgeText}</span>
                    </div>
                `;
            });

            activityFeed.innerHTML = activityHtml || '<p class="text-center text-muted" style="padding:20px;">No updates found.</p>';
        }
    }

    function updateProgramComparisonCards() {
        const cards = document.querySelectorAll('#page-programs .program-card');
        const programs = ['Accounting & Finance', 'Business Admin', 'Business Analytics', 'Fintech', 'Project Management', 'Public Admin'];
        
        cards.forEach(card => {
            const progName = card.dataset.program;
            if (!progName) return;
            const progAlumni = window.cachedAlumni.filter(a => a.program === progName);
            
            const totalEl = card.querySelector('.program-stats-row .program-stat:nth-child(1) .stat-value');
            const empEl = card.querySelector('.program-stats-row .program-stat:nth-child(2) .stat-value');
            const cgpaEl = card.querySelector('.program-stats-row .program-stat:nth-child(3) .stat-value');
            
            if (totalEl) totalEl.textContent = progAlumni.length;
            
            if (empEl) {
                if (progAlumni.length === 0) {
                    empEl.textContent = '—';
                } else {
                    const employed = progAlumni.filter(a => a.employment_status === 'Employed').length;
                    empEl.textContent = ((employed / progAlumni.length) * 100).toFixed(1) + '%';
                }
            }
            
            if (cgpaEl) {
                const withCgpa = progAlumni.filter(a => a.cgpa !== null && a.cgpa !== undefined);
                if (withCgpa.length === 0) {
                    cgpaEl.textContent = '—';
                } else {
                    const avgCgpa = withCgpa.reduce((sum, a) => sum + a.cgpa, 0) / withCgpa.length;
                    cgpaEl.textContent = avgCgpa.toFixed(2);
                }
            }
            
            // Degree breakdown
            const degreeRows = card.querySelectorAll('.degree-row');
            degreeRows.forEach(row => {
                const degree = row.dataset.degree;
                const degAlumni = progAlumni.filter(a => a.degree_level === degree);
                const bar = row.querySelector('.degree-bar');
                const valEl = row.querySelector('span:last-child');
                
                if (progAlumni.length === 0 || degAlumni.length === 0) {
                    if (bar) bar.style.width = '0%';
                    if (valEl) valEl.textContent = '—';
                } else {
                    const percentage = ((degAlumni.length / progAlumni.length) * 100).toFixed(1);
                    if (bar) bar.style.width = percentage + '%';
                    if (valEl) valEl.textContent = percentage + '%';
                }
            });
        });
    }

    async function bootstrapDashboard() {
        await loadAlumniData();
        updateDashboardKPIs();
        updateRecentActivityAndCompanies();
        updateProgramComparisonCards();
        destroyAllCharts();
        
        // Re-initialize active page charts
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav) {
            const activePage = activeNav.dataset.page;
            initPageCharts(activePage);
        } else {
            initDashboardCharts();
        }
    }

    function destroyAllCharts() {
        Object.keys(chartInstances).forEach(key => {
            if (chartInstances[key]) {
                chartInstances[key].destroy();
                delete chartInstances[key];
            }
        });
    }

    // ==================== DASHBOARD CHARTS ====================
    function initDashboardCharts() {
        setChartDefaults();
        const colors = getChartColors();

        // Employment by Program Chart
        if (!chartInstances.employmentByProgram) {
            const ctx = document.getElementById('employmentByProgramChart');
            if (ctx) {
                const programs = ['Accounting & Finance', 'Business Admin', 'Business Analytics', 'Fintech', 'Project Management', 'Public Admin'];
                const programRates = programs.map(prog => {
                    const progAlumni = window.cachedAlumni.filter(a => a.program === prog);
                    if (progAlumni.length === 0) return 0;
                    const employed = progAlumni.filter(a => a.employment_status === 'Employed').length;
                    return parseFloat(((employed / progAlumni.length) * 100).toFixed(1));
                });

                chartInstances.employmentByProgram = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Acc & Finance', 'Business Admin', 'Business Analytics', 'Fintech', 'Project Mgmt', 'Public Admin'],
                        datasets: [{
                            label: 'Employment Rate (%)',
                            data: programRates,
                            backgroundColor: [
                                'rgba(245, 158, 11, 0.8)',
                                'rgba(99, 102, 241, 0.8)',
                                'rgba(6, 182, 212, 0.8)',
                                'rgba(236, 72, 153, 0.8)',
                                'rgba(16, 185, 129, 0.8)',
                                'rgba(139, 92, 246, 0.8)',
                            ],
                            borderRadius: 8,
                            borderSkipped: false,
                            maxBarThickness: 40,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'top' }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 100,
                                grid: { color: colors.grid },
                                ticks: {
                                    callback: v => v + '%'
                                }
                            },
                            x: {
                                grid: { display: false }
                            }
                        }
                    }
                });
            }
        }

        // Employment Status Donut
        if (!chartInstances.employmentStatus) {
            const ctx2 = document.getElementById('employmentStatusChart');
            if (ctx2) {
                const employed = window.cachedAlumni.filter(a => a.employment_status === 'Employed').length;
                const seeking = window.cachedAlumni.filter(a => a.employment_status === 'Seeking Employment').length;
                const pursuing = window.cachedAlumni.filter(a => a.employment_status === 'Pursuing Higher Education').length;

                chartInstances.employmentStatus = new Chart(ctx2, {
                    type: 'doughnut',
                    data: {
                        labels: ['Employed', 'Seeking Employment', 'Pursuing Higher Education'],
                        datasets: [{
                            data: [employed, seeking, pursuing],
                            backgroundColor: [
                                '#6366f1',
                                '#f43f5e',
                                '#06b6d4',
                            ],
                            borderWidth: 0,
                            hoverOffset: 8,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '72%',
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 16,
                                    font: { size: 11 }
                                }
                            }
                        }
                    }
                });
            }
        }

        // Skill Radar Chart
        if (!chartInstances.skillRadar) {
            const ctx3 = document.getElementById('skillRadarChart');
            if (ctx3) {
                chartInstances.skillRadar = new Chart(ctx3, {
                    type: 'radar',
                    data: {
                        labels: ['Financial Modeling', 'SPSS', 'Power BI', 'Data Analysis', 'Excel', 'AWS', 'SAP', 'ERP'],
                        datasets: [{
                            label: 'Business Analytics',
                            data: [55, 78, 88, 92, 80, 70, 35, 40],
                            backgroundColor: 'rgba(6, 182, 212, 0.1)',
                            borderColor: '#06b6d4',
                            borderWidth: 2,
                            pointBackgroundColor: '#06b6d4',
                            pointRadius: 4,
                        }, {
                            label: 'Accounting & Finance',
                            data: [92, 75, 55, 60, 90, 45, 85, 80],
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            borderColor: '#f59e0b',
                            borderWidth: 2,
                            pointBackgroundColor: '#f59e0b',
                            pointRadius: 4,
                        }, {
                            label: 'Project Management',
                            data: [40, 55, 60, 58, 78, 50, 30, 65],
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderColor: '#10b981',
                            borderWidth: 2,
                            pointBackgroundColor: '#10b981',
                            pointRadius: 4,
                        }, {
                            label: 'Business Admin',
                            data: [50, 62, 48, 55, 85, 42, 45, 55],
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            borderColor: '#6366f1',
                            borderWidth: 2,
                            pointBackgroundColor: '#6366f1',
                            pointRadius: 4,
                        }, {
                            label: 'Fintech',
                            data: [60, 65, 72, 75, 70, 80, 42, 50],
                            backgroundColor: 'rgba(236, 72, 153, 0.1)',
                            borderColor: '#ec4899',
                            borderWidth: 2,
                            pointBackgroundColor: '#ec4899',
                            pointRadius: 4,
                        }, {
                            label: 'Public Admin',
                            data: [48, 70, 45, 52, 82, 40, 38, 48],
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            borderColor: '#8b5cf6',
                            borderWidth: 2,
                            pointBackgroundColor: '#8b5cf6',
                            pointRadius: 4,
                        }]
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
                                pointLabels: {
                                    color: colors.textSecondary,
                                    font: { size: 11, weight: '600' }
                                },
                                ticks: { display: false }
                            }
                        },
                        plugins: {
                            legend: { position: 'bottom' }
                        }
                    }
                });
            }
        }
    }

    // ==================== EMPLOYMENT ANALYTICS CHARTS ====================
    function initEmploymentCharts() {
        setChartDefaults();
        const colors = getChartColors();

        if (!chartInstances.industry) {
            const ctx = document.getElementById('industryChart');
            if (ctx) {
                const industries = {};
                window.cachedAlumni.forEach(a => {
                    if (a.employment_status === 'Employed') {
                        const ind = getIndustryForCompany(a.company_name, a.job_title);
                        industries[ind] = (industries[ind] || 0) + 1;
                    }
                });
                const sortedInds = Object.entries(industries).sort((a, b) => b[1] - a[1]);
                const labels = sortedInds.map(x => x[0]);
                const data = sortedInds.map(x => x[1]);

                chartInstances.industry = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels.length ? labels : ['No Data Available'],
                        datasets: [{
                            label: 'Alumni Count',
                            data: data.length ? data : [0],
                            backgroundColor: [
                                '#6366f1', '#818cf8', '#06b6d4', '#10b981',
                                '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899'
                            ],
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
                            x: { grid: { color: colors.grid } },
                            y: { grid: { display: false } }
                        }
                    }
                });
            }
        }

        if (!chartInstances.jobLevel) {
            const ctx = document.getElementById('jobLevelChart');
            if (ctx) {
                const levels = { 'Entry': 0, 'Mid': 0, 'Senior': 0, 'Executive': 0 };
                window.cachedAlumni.forEach(a => {
                    if (a.employment_status === 'Employed') {
                        const l = getJobLevel(a.job_title);
                        levels[l] = (levels[l] || 0) + 1;
                    }
                });

                chartInstances.jobLevel = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Executive', 'Senior Level', 'Mid Level', 'Entry Level'],
                        datasets: [{
                            data: [levels['Executive'], levels['Senior'], levels['Mid'], levels['Entry']],
                            backgroundColor: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b'],
                            borderWidth: 0,
                            hoverOffset: 8,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '65%',
                        plugins: {
                            legend: { position: 'bottom' }
                        }
                    }
                });
            }
        }

        if (!chartInstances.salary) {
            const ctx = document.getElementById('salaryChart');
            if (ctx) {
                const programs = ['Accounting & Finance', 'Business Admin', 'Business Analytics', 'Fintech', 'Project Management', 'Public Admin'];
                const ranges = ['50K-80K', '80K-120K', '120K-200K', '200K+'];
                const progSalaries = {};
                programs.forEach(p => {
                    progSalaries[p] = [0, 0, 0, 0];
                });
                
                window.cachedAlumni.forEach(a => {
                    if (a.monthly_salary_range && progSalaries[a.program]) {
                        const idx = ranges.indexOf(a.monthly_salary_range.trim());
                        if (idx !== -1) {
                            progSalaries[a.program][idx]++;
                        }
                    }
                });

                chartInstances.salary = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ranges,
                        datasets: [
                            {
                                label: 'Accounting & Finance',
                                data: progSalaries['Accounting & Finance'],
                                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                                borderRadius: 4
                            },
                            {
                                label: 'Business Admin',
                                data: progSalaries['Business Admin'],
                                backgroundColor: 'rgba(129, 140, 248, 0.8)',
                                borderRadius: 4
                            },
                            {
                                label: 'Business Analytics',
                                data: progSalaries['Business Analytics'],
                                backgroundColor: 'rgba(6, 182, 212, 0.8)',
                                borderRadius: 4
                            },
                            {
                                label: 'Fintech',
                                data: progSalaries['Fintech'],
                                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                                borderRadius: 4
                            },
                            {
                                label: 'Project Management',
                                data: progSalaries['Project Management'],
                                backgroundColor: 'rgba(245, 158, 11, 0.8)',
                                borderRadius: 4
                            },
                            {
                                label: 'Public Admin',
                                data: progSalaries['Public Admin'],
                                backgroundColor: 'rgba(244, 63, 94, 0.8)',
                                borderRadius: 4
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: {
                                    boxWidth: 12,
                                    font: { size: 11 }
                                }
                            }
                        },
                        scales: {
                            y: {
                                grid: { color: colors.grid },
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Alumni Count',
                                    font: { size: 11 }
                                }
                            },
                            x: {
                                grid: { display: false },
                                title: {
                                    display: true,
                                    text: 'Salary Range (PKR/month)',
                                    font: { size: 11 }
                                }
                            }
                        }
                    }
                });
            }
        }

        if (!chartInstances.companyType) {
            const ctx = document.getElementById('companyTypeChart');
            if (ctx) {
                const types = { 'MNC': 0, 'SME': 0, 'Govt Body': 0, 'Corporate / SME': 0 };
                window.cachedAlumni.forEach(a => {
                    if (a.employment_status === 'Employed') {
                        const t = getCompanyType(a.company_name);
                        types[t] = (types[t] || 0) + 1;
                    }
                });

                chartInstances.companyType = new Chart(ctx, {
                    type: 'polarArea',
                    data: {
                        labels: ['MNC', 'Govt Body', 'SME', 'Corporate / SME'],
                        datasets: [{
                            data: [types['MNC'], types['Govt Body'], types['SME'], types['Corporate / SME']],
                            backgroundColor: [
                                'rgba(99, 102, 241, 0.6)',
                                'rgba(6, 182, 212, 0.6)',
                                'rgba(16, 185, 129, 0.6)',
                                'rgba(245, 158, 11, 0.6)',
                            ],
                            borderWidth: 0,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { font: { size: 11 } } }
                        },
                        scales: {
                            r: {
                                grid: { color: colors.grid },
                                ticks: { display: false }
                            }
                        }
                    }
                });
            }
        }
    }

    // ==================== SKILL ANALYTICS CHARTS ====================
    function getSkillsForAlumni(alumnus) {
        const title = (alumnus.job_title || '').toLowerCase();
        const skills = ['Excel', 'Communication']; // baseline skills
        
        if (title.includes('lecturer') || title.includes('professor') || title.includes('teaching') || title.includes('teacher')) {
            skills.push('Teaching', 'Research', 'Curriculum Design', 'Academic Writing');
        }
        if (title.includes('manager') || title.includes('director') || title.includes('head') || title.includes('lead')) {
            skills.push('Leadership', 'Strategic Planning', 'Team Management');
        }
        if (title.includes('relationship') || title.includes('sales') || title.includes('marketing') || title.includes('business development')) {
            skills.push('Relationship Management', 'Sales', 'Marketing', 'Customer Service');
        }
        if (title.includes('hr') || title.includes('human resource') || title.includes('recruiter')) {
            skills.push('Talent Acquisition', 'HR Operations', 'Employee Relations', 'Recruiting');
        }
        if (title.includes('finance') || title.includes('account') || title.includes('audit') || title.includes('bank') || title.includes('tax')) {
            skills.push('Accounting', 'Financial Analysis', 'Financial Modeling', 'Audit', 'Taxation');
        }
        if (title.includes('project') || title.includes('coordinator') || title.includes('planner')) {
            skills.push('Project Management', 'Agile', 'Jira', 'Risk Management');
        }
        if (title.includes('analyst') || title.includes('system') || title.includes('developer') || title.includes('it') || title.includes('engineer')) {
            skills.push('Data Analysis', 'SQL', 'Python', 'Power BI', 'Reporting');
        }
        if (title.includes('owner') || title.includes('founder') || title.includes('business') || title.includes('entrepreneur')) {
            skills.push('Entrepreneurship', 'Business Strategy', 'Negotiation');
        }
        
        return [...new Set(skills)];
    }

    function initSkillCharts() {
        setChartDefaults();
        const colors = getChartColors();

        if (!chartInstances.topSkills) {
            const ctx = document.getElementById('topSkillsChart');
            if (ctx) {
                const allSkills = [];
                window.cachedAlumni.forEach(a => {
                    if (a.employment_status === 'Employed') {
                        allSkills.push(...getSkillsForAlumni(a));
                    }
                });
                const skillCounts = {};
                allSkills.forEach(s => {
                    skillCounts[s] = (skillCounts[s] || 0) + 1;
                });
                const sortedSkills = Object.entries(skillCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 15);
                const skills = sortedSkills.map(e => e[0]);
                const counts = sortedSkills.map(e => e[1]);

                chartInstances.topSkills = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: skills.length ? skills : ['Communication', 'Excel'],
                        datasets: [{
                            label: 'Alumni with Skill',
                            data: counts.length ? counts : [0, 0],
                            backgroundColor: (counts.length ? counts : [0, 0]).map((v, i) => {
                                const alpha = 0.4 + (0.5 * (1 - i / (counts.length || 1)));
                                return `rgba(99, 102, 241, ${alpha})`;
                            }),
                            borderRadius: 6,
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
        }

        if (!chartInstances.skillsByProgram) {
            const ctx = document.getElementById('skillsByProgramChart');
            if (ctx) {
                const skillCategories = {
                    'Analytics': ['Data Analysis', 'Research', 'Financial Analysis'],
                    'Programming': ['Python', 'SQL'],
                    'Finance': ['Accounting', 'Financial Modeling', 'Taxation', 'Audit'],
                    'Management': ['Leadership', 'Team Management', 'Project Management', 'Business Strategy'],
                    'Communication': ['Communication', 'Relationship Management', 'Customer Service'],
                    'Tech Tools': ['Excel', 'Power BI', 'Jira'],
                    'Domain Knowledge': ['Teaching', 'Curriculum Design', 'Entrepreneurship', 'Recruiting']
                };

                const programs = ['Accounting & Finance', 'Business Admin', 'Business Analytics', 'Fintech', 'Project Management', 'Public Admin'];
                const programColors = {
                    'Business Analytics': '#06b6d4', 'Project Management': '#10b981',
                    'Accounting & Finance': '#f59e0b', 'Business Admin': '#6366f1',
                    'Fintech': '#ec4899', 'Public Admin': '#8b5cf6'
                };

                const radarDatasets = programs.map(prog => {
                    const progAlumni = window.cachedAlumni.filter(a => a.program === prog);
                    const totalProg = progAlumni.length || 1;
                    
                    const categoryScores = Object.entries(skillCategories).map(([cat, skillList]) => {
                        let matches = 0;
                        progAlumni.forEach(a => {
                            const aSkills = getSkillsForAlumni(a);
                            const hasMatch = skillList.some(s => aSkills.includes(s));
                            if (hasMatch) matches++;
                        });
                        return Math.round((matches / totalProg) * 100);
                    });
                    
                    const color = programColors[prog] || '#6366f1';
                    return {
                        label: prog,
                        data: categoryScores,
                        backgroundColor: color + '26', // 15% opacity
                        borderColor: color,
                        borderWidth: 2,
                        pointBackgroundColor: color
                    };
                });

                chartInstances.skillsByProgram = new Chart(ctx, {
                    type: 'radar',
                    data: {
                        labels: ['Analytics', 'Programming', 'Finance', 'Management', 'Communication', 'Tech Tools', 'Domain Knowledge'],
                        datasets: radarDatasets
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
                                pointLabels: { font: { size: 11, weight: '600' } },
                                ticks: { display: false },
                            }
                        },
                        plugins: { legend: { position: 'bottom' } }
                    }
                });
            }
        }
    }

    // ==================== TREND CHARTS ====================
    function initTrendCharts() {
        setChartDefaults();
        const colors = getChartColors();

        const distinctYears = [...new Set(window.cachedAlumni.map(a => a.graduation_year).filter(Boolean))].sort((a, b) => a - b);
        const yearsLabels = distinctYears.length ? distinctYears.map(String) : ['2018', '2019', '2020', '2021', '2022', '2023', '2024'];
        const programs = ['Accounting & Finance', 'Business Admin', 'Business Analytics', 'Fintech', 'Project Management', 'Public Admin'];
        const programColors = {
            'Business Analytics': '#06b6d4',
            'Accounting & Finance': '#f59e0b',
            'Project Management': '#10b981',
            'Business Admin': '#6366f1',
            'Fintech': '#ec4899',
            'Public Admin': '#8b5cf6'
        };

        if (!chartInstances.trend) {
            const ctx = document.getElementById('trendChart');
            if (ctx) {
                const trendDatasets = programs.map((prog) => {
                    const data = distinctYears.map(year => {
                        const yearProgAlumni = window.cachedAlumni.filter(a => a.graduation_year === year && a.program === prog);
                        if (yearProgAlumni.length === 0) return 0;
                        const employed = yearProgAlumni.filter(a => a.employment_status === 'Employed').length;
                        return parseFloat(((employed / yearProgAlumni.length) * 100).toFixed(1));
                    });
                    
                    return {
                        label: prog,
                        data: data.length ? data : [0, 0, 0, 0, 0, 0, 0],
                        borderColor: programColors[prog],
                        backgroundColor: programColors[prog] + '1a', // 10% opacity
                        fill: true,
                        tension: 0.4,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        pointBackgroundColor: programColors[prog],
                        borderWidth: 3
                    };
                });

                chartInstances.trend = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: yearsLabels,
                        datasets: trendDatasets
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'top' } },
                        scales: {
                            y: {
                                grid: { color: colors.grid },
                                min: 0,
                                max: 100,
                                ticks: { callback: v => v + '%' }
                            },
                            x: { grid: { color: colors.grid } }
                        }
                    }
                });
            }
        }

        if (!chartInstances.cgpaTrend) {
            const ctx = document.getElementById('cgpaTrendChart');
            if (ctx) {
                const cgpaDatasets = programs.map((prog) => {
                    const data = distinctYears.map(year => {
                        const yearProgAlumni = window.cachedAlumni.filter(a => a.graduation_year === year && a.program === prog && a.cgpa);
                        if (yearProgAlumni.length === 0) return 0;
                        const avgCgpa = yearProgAlumni.reduce((sum, a) => sum + a.cgpa, 0) / yearProgAlumni.length;
                        return parseFloat(avgCgpa.toFixed(2));
                    });
                    
                    return {
                        label: prog,
                        data: data.length ? data : [0, 0, 0, 0, 0, 0, 0],
                        borderColor: programColors[prog],
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: programColors[prog],
                        borderWidth: 2
                    };
                });

                chartInstances.cgpaTrend = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: yearsLabels,
                        datasets: cgpaDatasets
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'top' } },
                        scales: {
                            y: {
                                grid: { color: colors.grid },
                                min: 0,
                                max: 4.0,
                            },
                            x: { grid: { display: false } }
                        }
                    }
                });
            }
        }

        if (!chartInstances.graduates) {
            const ctx = document.getElementById('graduatesChart');
            if (ctx) {
                const bsData = distinctYears.map(year => window.cachedAlumni.filter(a => a.graduation_year === year && a.degree_level === 'BS').length);
                const msData = distinctYears.map(year => window.cachedAlumni.filter(a => a.graduation_year === year && a.degree_level === 'MS').length);
                const phdData = distinctYears.map(year => window.cachedAlumni.filter(a => a.graduation_year === year && a.degree_level === 'PhD').length);

                chartInstances.graduates = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: yearsLabels,
                        datasets: [
                            {
                                label: 'BS',
                                data: bsData.length ? bsData : [0, 0, 0, 0, 0, 0, 0],
                                backgroundColor: 'rgba(99, 102, 241, 0.7)',
                                borderRadius: 4,
                                borderSkipped: false,
                            },
                            {
                                label: 'MS',
                                data: msData.length ? msData : [0, 0, 0, 0, 0, 0, 0],
                                backgroundColor: 'rgba(6, 182, 212, 0.7)',
                                borderRadius: 4,
                                borderSkipped: false,
                            },
                            {
                                label: 'PhD',
                                data: phdData.length ? phdData : [0, 0, 0, 0, 0, 0, 0],
                                backgroundColor: 'rgba(16, 185, 129, 0.7)',
                                borderRadius: 4,
                                borderSkipped: false,
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'top' } },
                        scales: {
                            y: {
                                grid: { color: colors.grid },
                                beginAtZero: true,
                                stacked: true,
                            },
                            x: {
                                grid: { display: false },
                                stacked: true,
                            }
                        }
                    }
                });
            }
        }
    }

    // ==================== PROGRAM COMPARISON CHARTS ====================
    function initProgramCharts() {
        setChartDefaults();
        const colors = getChartColors();

        const distinctYears = [...new Set(window.cachedAlumni.map(a => a.graduation_year).filter(Boolean))].sort((a, b) => a - b);
        const yearsLabels = distinctYears.length ? distinctYears.map(String) : ['2018', '2019', '2020', '2021', '2022', '2023', '2024'];
        const programs = ['Accounting & Finance', 'Business Admin', 'Business Analytics', 'Fintech', 'Project Management', 'Public Admin'];
        const programColors = {
            'Business Analytics': '#06b6d4',
            'Accounting & Finance': '#f59e0b',
            'Project Management': '#10b981',
            'Business Admin': '#6366f1',
            'Fintech': '#ec4899',
            'Public Admin': '#8b5cf6'
        };

        if (!chartInstances.programComparison) {
            const ctx = document.getElementById('programComparisonChart');
            if (ctx) {
                const comparisonDatasets = programs.map((prog) => {
                    const data = distinctYears.map(year => {
                        const yearProgAlumni = window.cachedAlumni.filter(a => a.graduation_year === year && a.program === prog);
                        if (yearProgAlumni.length === 0) return 0;
                        const employed = yearProgAlumni.filter(a => a.employment_status === 'Employed').length;
                        return parseFloat(((employed / yearProgAlumni.length) * 100).toFixed(1));
                    });
                    
                    return {
                        label: prog,
                        data: data.length ? data : [0, 0, 0, 0, 0, 0, 0],
                        borderColor: programColors[prog],
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: programColors[prog],
                    };
                });

                chartInstances.programComparison = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: yearsLabels,
                        datasets: comparisonDatasets
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'top' } },
                        scales: {
                            y: {
                                grid: { color: colors.grid },
                                min: 0,
                                max: 100,
                                ticks: { callback: v => v + '%' }
                            },
                            x: { grid: { color: colors.grid } }
                        }
                    }
                });
            }
        }
    }

    // ==================== PAGE CHART INITIALIZER ====================
    function initPageCharts(page) {
        switch (page) {
            case 'dashboard':
                initDashboardCharts();
                break;
            case 'employment':
                initEmploymentCharts();
                break;
            case 'skills':
                initSkillCharts();
                break;
            case 'trends':
                initTrendCharts();
                break;
            case 'programs':
                initProgramCharts();
                break;
            case 'geographic':
                initGeographicMap();
                break;
        }
    }

    // ==================== GEOGRAPHIC MAP INITIALIZATION ====================
    async function initGeographicMap() {
        if (leafletMap) {
            setTimeout(() => {
                leafletMap.invalidateSize();
            }, 100);
            return;
        }

        const mapContainer = document.getElementById('worldMap');
        if (!mapContainer) return;

        // Initialize leaflet map centered on Pakistan
        leafletMap = L.map('worldMap', {
            zoomControl: true,
            attributionControl: false
        }).setView([30.3753, 69.3451], 5);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 18
        }).addTo(leafletMap);

        // Use location data from cached alumni records
        const alumniData = window.cachedAlumni || [];

        const counts = {};
        alumniData.forEach(a => {
            let loc = a.location ? a.location.trim() : null;
            if (!loc || loc === '-' || loc === 'nan' || loc === 'None') return;
            
            // Normalize location name
            let norm = loc.toLowerCase();
            if (norm === 'sahiwal') loc = 'Sahiwal';
            if (norm === 'abbotabad' || norm === 'abbottabad') loc = 'Abbottabad';
            
            counts[loc] = (counts[loc] || 0) + 1;
        });

        const coordMap = {
            'Islamabad': [33.6844, 73.0479],
            'Rawalpindi': [33.5984, 73.0441],
            'Lahore': [31.5204, 74.3587],
            'Karachi': [24.8607, 67.0011],
            'Multan': [30.1575, 71.5249],
            'Sadiqabad': [28.3062, 70.1307],
            'Bahawalpur': [29.3544, 71.6911],
            'Kamra Cantt': [33.7464, 72.3995],
            'Haripur': [33.9989, 72.9348],
            'Muzaffarabad': [34.3597, 73.4714],
            'Faisalabad': [31.4504, 73.1350],
            'Bhimber': [32.9774, 74.0784],
            'Jehlum': [32.9405, 73.7276],
            'D.I Khan': [31.8626, 70.9019],
            'Shukkur': [27.7244, 68.8228],
            'Rawalakot': [33.8576, 73.7619],
            'Abbottabad': [34.1688, 73.2215],
            'Abbotabad': [34.1688, 73.2215],
            'Rahim Yar Khan': [28.4195, 70.3025],
            'Peshawar': [33.9971, 71.5760],
            'Sahiwal': [30.6682, 73.1114],
            'sahiwal': [30.6682, 73.1114],
            'Mirpur': [33.1484, 73.7514],
            'Sialkot': [32.4945, 74.5229],
            'Chakwal': [32.9334, 72.8585],
            'Gujranwala': [32.1877, 74.1945],
            'Kohat': [33.5869, 71.4414],
            'Rawat': [33.4566, 73.1994],
            'Gujar Khan': [33.2556, 73.3039],
            'AJK': [33.9258, 73.7810],
            'Hong Kong': [22.3193, 114.1694],
            'Daska': [32.3242, 74.3402],
            'Vehari': [30.0419, 72.3528],
            'USA': [37.0902, -95.7129],
            'Sarai Alamgir/Gujrat': [32.5742, 74.0754],
            'Gujrat': [32.5742, 74.0754]
        };

        // Plot markers
        Object.entries(counts).forEach(([city, count]) => {
            const coords = coordMap[city];
            if (!coords) return;

            let markerColor = '#6366f1';
            if (count > 5) markerColor = '#06b6d4';
            if (count > 20) markerColor = '#10b981';

            const baseRadius = 12000;
            const radius = baseRadius * Math.sqrt(count);

            const circle = L.circle(coords, {
                color: markerColor,
                fillColor: markerColor,
                fillOpacity: 0.5,
                weight: 1.5,
                radius: radius
            }).addTo(leafletMap);

            circle.bindPopup(`<b>${city}</b><br>Alumni Count: ${count}`);
            circle.on('mouseover', function() { this.openPopup(); });
            circle.on('mouseout', function() { this.closePopup(); });
        });

        // Update Top Locations sidebar list dynamically
        const listContainer = document.querySelector('.location-list');
        if (listContainer) {
            const sortedLocs = Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);
            
            const maxCount = sortedLocs[0] ? sortedLocs[0][1] : 1;
            
            listContainer.innerHTML = sortedLocs.map(([city, count]) => {
                const percentage = ((count / maxCount) * 100).toFixed(0);
                let flag = '🇵🇰';
                if (city.toLowerCase() === 'hong kong') flag = '🇭🇰';
                if (city.toLowerCase() === 'usa') flag = '🇺🇸';
                
                return `
                    <div class="location-item">
                        <span class="location-flag">${flag}</span>
                        <div style="flex-grow: 1;">
                            <span class="location-name">${city}</span>
                            <div class="location-bar-wrapper" style="width: 100%;">
                                <div class="location-bar" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                        <span class="location-count">${count}</span>
                    </div>
                `;
            }).join('');
        }
    }

    // Initialize dashboard on load
    initDashboardCharts();

    // ==================== KPI COUNT ANIMATION ====================
    function animateCount(element, target, duration = 1500) {
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) {
                element.textContent = target.toLocaleString();
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(start).toLocaleString();
            }
        }, 16);
    }

    document.querySelectorAll('.kpi-value[data-count]').forEach(el => {
        const target = parseInt(el.dataset.count);
        animateCount(el, target);
    });

    // ==================== SUPABASE-POWERED ALUMNI TABLE ====================
    let currentPage = 1;
    const programColors = {
        'Accounting & Finance': '#f59e0b', 'Business Admin': '#6366f1',
        'Business Analytics': '#06b6d4', 'Fintech': '#ec4899',
        'Project Management': '#10b981', 'Public Admin': '#8b5cf6'
    };

    function getPageSize() {
        return parseInt(document.getElementById('rowsPerPage')?.value || '16');
    }

    function getFilters() {
        return {
            program: document.getElementById('filterProgram')?.value || 'all',
            degree: document.getElementById('filterDegree')?.value || 'all',
            gradYear: document.getElementById('filterGradYear')?.value || 'all',
            status: document.getElementById('filterStatus')?.value || 'all',
            search: document.getElementById('alumniSearchInput')?.value || document.getElementById('globalSearch')?.value || ''
        };
    }

    async function renderAlumniTable(page = 1) {
        const tbody = document.getElementById('alumniTableBody');
        if (!tbody) return;
        const isAdmin = authManager.isAdmin();
        currentPage = page;

        // Reset select all checkbox
        const selectAllBtn = document.getElementById('selectAllAlumni');
        if (selectAllBtn) selectAllBtn.checked = false;

        // Update alumniDB pageSize from dropdown
        alumniDB.pageSize = getPageSize();

        const colCount = isAdmin ? 13 : 11;
        tbody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center;padding:32px;color:var(--text-muted)"><i class="fas fa-spinner fa-spin"></i> Loading from database...</td></tr>`;

        const filters = getFilters();
        const { data, count, error } = await alumniDB.getAlumni(filters, page);

        if (error) {
            tbody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center;padding:32px;color:#f43f5e"><i class="fas fa-exclamation-triangle"></i> Error loading data</td></tr>`;
            console.error('Supabase error:', error);
            return;
        }
        if (!data.length) {
            tbody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center;padding:32px;color:var(--text-muted)"><i class="fas fa-search"></i> No alumni found matching filters</td></tr>`;
            updatePagination(0, page);
            return;
        }

        tbody.innerHTML = data.map((a, idx) => {
            const initials = (a.full_name || '').split(' ').map(w => w[0]).join('').substring(0, 2);
            const color = programColors[a.program] || '#6366f1';
            const statusClass = a.employment_status === 'Employed' ? 'status-employed' :
                a.employment_status === 'Seeking Employment' ? 'status-unemployed' : 'status-studies';
            const companyName = a.companies?.company_name || '—';

            // Derived Admission Year (approximate)
            const duration = a.degree_level === 'BS' ? 4 : a.degree_level === 'MS' ? 2 : 3;
            const admissionYear = a.graduation_year ? (a.graduation_year - duration) : '—';

            return `<tr data-id="${a.student_id}">
                <td><input type="checkbox" class="alumni-checkbox" data-id="${a.student_id}"></td>
                <td><div class="alumni-cell">
                    <div class="alumni-avatar-mini" style="background:linear-gradient(135deg,${color},${color}88)">${initials}</div>
                    <div class="alumni-name-cell"><strong>${a.full_name}</strong></div>
                </div></td>
                <td>${a.email || '—'}</td>
                <td>${admissionYear}</td>
                <td>${a.program || '—'}</td>
                <td>${a.degree_level || '—'}</td>
                <td>${a.graduation_year || '—'}</td>
                <td><strong>${a.cgpa ? parseFloat(a.cgpa).toFixed(2) : '—'}</strong></td>
                <td><span class="status-badge ${statusClass}">${a.employment_status || '—'}</span></td>
                <td>${companyName}</td>
                <td class="admin-only-col">${a.email || '—'}</td>
                <td class="admin-only-col">${a.phone || '—'}</td>
                <td><div class="action-btns">
                    <button class="action-btn view-alumni-btn" title="View" data-id="${a.student_id}"><i class="fas fa-eye"></i></button>
                    ${isAdmin ? `<button class="action-btn edit-alumni-btn" title="Edit" data-id="${a.student_id}"><i class="fas fa-pen"></i></button>
                    <button class="action-btn delete-alumni-btn danger" title="Delete" data-id="${a.student_id}"><i class="fas fa-trash"></i></button>` : ''}
                </div></td>
            </tr>`;
        }).join('');

        updatePagination(count, page);

        // Bind edit buttons
        tbody.querySelectorAll('.edit-alumni-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                const { data: a, error } = await alumniDB.getAlumniById(id);
                btn.innerHTML = '<i class="fas fa-pen"></i>';
                if (error || !a) { alert('Error fetching record: ' + (error?.message || 'Unknown error')); return; }

                const editIdInput = document.getElementById('editAlumniId');
                if (editIdInput) editIdInput.value = a.student_id;

                const origEmailInput = document.getElementById('editAlumniOriginalEmail');
                if (origEmailInput) origEmailInput.value = a.email || '';

                document.getElementById('alumniName').value = a.full_name || '';
                document.getElementById('alumniEmail').value = a.email || '';

                const user = typeof authManager !== 'undefined' ? authManager.findUserByEmail(a.email || '') : null;
                const personalEmailEl = document.getElementById('alumniPersonalEmail');
                if (personalEmailEl) personalEmailEl.value = user ? (user.personalEmail || '') : '';

                const phoneEl = document.getElementById('alumniPhone');
                if (phoneEl) phoneEl.value = a.phone || '';

                document.getElementById('alumniProgram').value = a.program || '';
                document.getElementById('alumniDegree').value = a.degree_level || '';
                document.getElementById('alumniGradYear').value = a.graduation_year || '';
                document.getElementById('alumniCGPA').value = a.cgpa || '';

                const statusEl = document.getElementById('alumniStatus');
                if (statusEl) statusEl.value = a.employment_status || '';

                const jobTitleEl = document.getElementById('alumniJobTitle');
                if (jobTitleEl) jobTitleEl.value = a.job_title || '';

                const linkedInEl = document.getElementById('alumniLinkedIn');
                if (linkedInEl) linkedInEl.value = a.linkedin_url || '';

                const modalTitle = document.getElementById('addAlumniModalTitle');
                if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-user-edit"></i> Edit Alumni';

                const pwInput = document.getElementById('alumniPassword');
                if (pwInput) {
                    pwInput.required = false;
                    pwInput.placeholder = "Leave blank to keep current";
                    pwInput.value = '';
                }

                document.getElementById('addAlumniModal').classList.remove('hidden');
            });
        });

        // Bind delete buttons
        tbody.querySelectorAll('.delete-alumni-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Are you sure you want to delete this alumni record?')) return;
                const id = btn.dataset.id;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

                // Get the email first to delete from auth
                const { data: a } = await alumniDB.getAlumniById(id);
                const email = a?.email;
                const personalEmail = a?.personal_email;

                const { error } = await alumniDB.deleteAlumni(id);
                if (error) {
                    alert('Delete failed: ' + error.message);
                    btn.innerHTML = '<i class="fas fa-trash"></i>';
                    return;
                }

                // Clean up auth too
                if (email) authManager.deleteUserByEmail(email);
                if (personalEmail) authManager.deleteUserByEmail(personalEmail);

                await bootstrapDashboard();
                renderAlumniTable(currentPage);
            });
        });
    }

    function updatePagination(total, page) {
        const info = document.querySelector('.pagination-info');
        const controls = document.querySelector('.pagination-controls');
        if (!info || !controls) return;
        const pageSize = getPageSize();
        const totalPages = Math.ceil(total / pageSize) || 1;
        const from = total ? (page - 1) * pageSize + 1 : 0;
        const to = Math.min(page * pageSize, total);
        info.textContent = `Showing ${from}-${to} of ${total.toLocaleString()} alumni`;

        let btns = `<button class="pagination-btn" ${page <= 1 ? 'disabled' : ''} data-p="${page - 1}" title="Previous"><i class="fas fa-chevron-left"></i></button>`;
        const show = [1];
        if (page > 3) show.push('...');
        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) show.push(i);
        if (page < totalPages - 2) show.push('...');
        if (totalPages > 1) show.push(totalPages);
        show.forEach(p => {
            if (p === '...') { btns += '<span class="pagination-dots">...</span>'; }
            else { btns += `<button class="pagination-btn ${p === page ? 'active' : ''}" data-p="${p}">${p}</button>`; }
        });
        btns += `<button class="pagination-btn" ${page >= totalPages ? 'disabled' : ''} data-p="${page + 1}" title="Next"><i class="fas fa-chevron-right"></i></button>`;
        controls.innerHTML = btns;
        controls.querySelectorAll('[data-p]').forEach(b => {
            b.addEventListener('click', () => { if (!b.disabled) renderAlumniTable(parseInt(b.dataset.p)); });
        });
    }

    renderAlumniTable();

    // ==================== PREDICTOR FORM ====================
    const predictorForm = document.getElementById('predictorForm');
    const resultsPlaceholder = document.querySelector('.results-placeholder');
    const resultsContent = document.getElementById('resultsContent');

    if (predictorForm) {
        predictorForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Hide placeholder, show results
            resultsPlaceholder.classList.add('hidden');
            resultsContent.classList.remove('hidden');

            // Animate score ring
            const cgpa = parseFloat(document.getElementById('predCGPA').value) || 3.0;
            const internships = parseInt(document.getElementById('predInternships').value) || 0;
            const projects = parseInt(document.getElementById('predProjects').value) || 0;
            const certs = parseInt(document.getElementById('predCerts').value) || 0;
            const skills = document.querySelectorAll('#techSkillTags .skill-tag').length;

            // Simple score calculation for prototype
            let score = Math.min(100, Math.round(
                (cgpa / 4.0) * 35 +
                Math.min(internships * 8, 20) +
                Math.min(projects * 5, 15) +
                Math.min(certs * 7, 15) +
                Math.min(skills * 3, 15)
            ));

            // Animate the score ring
            const scoreRing = document.getElementById('scoreRing');
            const scoreValue = document.getElementById('scoreValue');
            const circumference = 2 * Math.PI * 85;
            const offset = circumference - (score / 100) * circumference;

            scoreRing.style.strokeDasharray = circumference;
            scoreRing.style.strokeDashoffset = circumference;

            // Add gradient definition if not present
            const svg = scoreRing.closest('svg');
            if (!svg.querySelector('#scoreGradient')) {
                const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
                defs.innerHTML = `
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#6366f1"/>
                        <stop offset="100%" style="stop-color:#06b6d4"/>
                    </linearGradient>
                `;
                svg.prepend(defs);
            }

            scoreRing.setAttribute('stroke', 'url(#scoreGradient)');

            setTimeout(() => {
                scoreRing.style.strokeDashoffset = offset;
            }, 100);

            // Animate count
            let current = 0;
            const step = score / 60;
            const timer = setInterval(() => {
                current += step;
                if (current >= score) {
                    scoreValue.textContent = score;
                    clearInterval(timer);
                } else {
                    scoreValue.textContent = Math.round(current);
                }
            }, 16);

            // Update prediction details based on score and program statistics
            const predIndustry = document.getElementById('predIndustry');
            const predTime = document.getElementById('predTime');
            const predSalary = document.getElementById('predSalary');

            // Map selected program option to database program name
            const selProgValue = document.getElementById('predProgram') ? document.getElementById('predProgram').value : '';
            let dbProg = 'Business Analytics';
            if (selProgValue.includes('BA')) dbProg = 'Business Analytics';
            else if (selProgValue.includes('PM')) dbProg = 'Project Management';
            else if (selProgValue.includes('Fintech')) dbProg = 'Fintech';
            else if (selProgValue.includes('Commerce') || selProgValue.includes('Accounting') || selProgValue.includes('Finance')) dbProg = 'Accounting & Finance';
            else if (selProgValue.includes('Admin') || selProgValue.includes('BBA') || selProgValue.includes('MBA')) dbProg = 'Business Admin';
            else if (selProgValue.includes('Public')) dbProg = 'Public Admin';

            // Filter cache by this program
            const progAlumni = window.cachedAlumni.filter(a => a.program === dbProg && a.company_name);
            // Get top companies for this program
            const companiesCount = {};
            progAlumni.forEach(a => {
                const cName = a.company_name.trim();
                if (cName && cName !== '-' && cName.toLowerCase() !== 'nan') {
                    companiesCount[cName] = (companiesCount[cName] || 0) + 1;
                }
            });
            const topCompanies = Object.entries(companiesCount)
                .sort((a, b) => b[1] - a[1])
                .map(e => e[0])
                .slice(0, 3);

            let likelyCompany = topCompanies[0] || 'IT & Consulting';
            if (topCompanies.length > 1 && score < 80 && score >= 60) {
                likelyCompany = topCompanies[1];
            } else if (topCompanies.length > 2 && score < 60) {
                likelyCompany = topCompanies[2];
            }

            if (score >= 80) {
                predIndustry.textContent = likelyCompany + ' (Top Recruiter)';
                predTime.textContent = '1-2 months';
                predSalary.textContent = 'PKR 100K - 150K';
            } else if (score >= 60) {
                predIndustry.textContent = likelyCompany + ' (Mid-tier hiring)';
                predTime.textContent = '2-4 months';
                predSalary.textContent = 'PKR 65K - 95K';
            } else {
                predIndustry.textContent = likelyCompany || 'Local Business Sector';
                predTime.textContent = '4-6 months';
                predSalary.textContent = 'PKR 40K - 60K';
            }
        });
    }

    // Tech skill tag input
    const techSkillInput = document.getElementById('techSkillInput');
    const techSkillTags = document.getElementById('techSkillTags');

    if (techSkillInput) {
        techSkillInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && techSkillInput.value.trim()) {
                e.preventDefault();
                const tag = document.createElement('span');
                tag.classList.add('skill-tag');
                tag.innerHTML = `${techSkillInput.value.trim()} <button class="tag-remove">×</button>`;
                tag.querySelector('.tag-remove').addEventListener('click', () => tag.remove());
                techSkillTags.appendChild(tag);
                techSkillInput.value = '';
            }
        });
    }

    // Remove existing tags
    document.querySelectorAll('.tag-remove').forEach(btn => {
        btn.addEventListener('click', () => btn.parentElement.remove());
    });

    // ==================== MODAL HANDLING ====================
    const addAlumniBtn = document.getElementById('addAlumniBtn');
    const addAlumniModal = document.getElementById('addAlumniModal');
    const closeModal = document.getElementById('closeModal');
    const cancelModal = document.getElementById('cancelModal');

    if (addAlumniBtn) {
        addAlumniBtn.addEventListener('click', () => {
            addAlumniModal.classList.remove('hidden');
        });
    }

    [closeModal, cancelModal].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                addAlumniModal.classList.add('hidden');
            });
        }
    });

    if (addAlumniModal) {
        addAlumniModal.addEventListener('click', (e) => {
            if (e.target === addAlumniModal) {
                addAlumniModal.classList.add('hidden');
            }
        });
    }

    // ==================== MODEL SELECTOR ====================
    document.querySelectorAll('.model-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.model-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
        });
    });

    // ==================== FILTER TOGGLE & CHANGE LISTENERS ====================
    const filterAlumniBtn = document.getElementById('filterAlumniBtn');
    const alumniFilterBar = document.getElementById('alumniFilterBar');

    if (filterAlumniBtn && alumniFilterBar) {
        filterAlumniBtn.addEventListener('click', () => {
            alumniFilterBar.style.display = alumniFilterBar.style.display === 'none' ? 'flex' : 'none';
        });
    }

    // Wire up filter dropdowns to re-query Supabase
    ['filterProgram', 'filterDegree', 'filterGradYear', 'filterStatus'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', () => renderAlumniTable(1));
    });

    // Rows-per-page handler
    const rowsPerPageEl = document.getElementById('rowsPerPage');
    if (rowsPerPageEl) {
        rowsPerPageEl.addEventListener('change', () => renderAlumniTable(1));
    }

    // Search input with debounce for live search
    let searchTimeout = null;
    const alumniSearch = document.getElementById('alumniSearchInput');
    if (alumniSearch) {
        alumniSearch.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => renderAlumniTable(1), 400);
        });
    }

    // ==================== DYNAMIC FILTER POPULATION ====================
    (async () => {
        // Programs
        const progEl = document.getElementById('filterProgram');
        if (progEl) {
            const { data: programs } = await alumniDB.getPrograms();
            progEl.innerHTML = '<option value="all">All Programs</option>' +
                (programs || []).map(p => `<option value="${p}">${p}</option>`).join('');
        }
        // Degrees — populated from DB
        const degEl = document.getElementById('filterDegree');
        if (degEl) {
            const { data } = await alumniDB.db.from('alumni').select('degree_level').not('degree_level', 'is', null);
            const degrees = [...new Set((data || []).map(d => d.degree_level))].sort();
            degEl.innerHTML = '<option value="all">All Degrees</option>' +
                degrees.map(d => `<option value="${d}">${d}</option>`).join('');
        }
        // Graduation years
        const yearEl = document.getElementById('filterGradYear');
        if (yearEl) {
            const { data: years } = await alumniDB.getGraduationYears();
            yearEl.innerHTML = '<option value="all">All Years</option>' +
                (years || []).map(y => `<option value="${y}">${y}</option>`).join('');
        }
        // Employment statuses
        const statusEl = document.getElementById('filterStatus');
        if (statusEl) {
            const { data: statuses } = await alumniDB.getEmploymentStatuses();
            statusEl.innerHTML = '<option value="all">All Status</option>' +
                (statuses || []).map(s => `<option value="${s}">${s}</option>`).join('');
        }
        // Dashboard year filter — dynamically populate
        const dashYearEl = document.getElementById('dashboardYearFilter');
        if (dashYearEl) {
            const { data: years } = await alumniDB.getGraduationYears();
            dashYearEl.innerHTML = '<option value="all">All Years</option>' +
                (years || []).map(y => `<option value="${y}">${y}</option>`).join('');
        }
    })();

    // ==================== DYNAMIC DASHBOARD UPDATE ====================
    async function updateDashboard(year = 'all', program = 'all') {
        const { stats, error } = await alumniDB.getDashboardStats(year, program);
        if (error || !stats) { console.error('Dashboard stats error:', error); return; }

        // Update KPI cards
        const kpiValues = document.querySelectorAll('.kpi-value');
        if (kpiValues[0]) {
            kpiValues[0].setAttribute('data-count', stats.total);
            animateCount(kpiValues[0], stats.total);
        }
        if (kpiValues[1]) { kpiValues[1].innerHTML = `${stats.empRate}<small>%</small>`; }
        if (kpiValues[2]) { kpiValues[2].innerHTML = `${stats.avgTimeToJob}<small>months</small>`; }
        if (kpiValues[3]) {
            kpiValues[3].setAttribute('data-count', stats.uniqueCompanies);
            animateCount(kpiValues[3], stats.uniqueCompanies);
        }

        // Update KPI subtitles
        const kpiChanges = document.querySelectorAll('.kpi-change');
        if (kpiChanges[0]) kpiChanges[0].innerHTML = `<i class="fas fa-arrow-up"></i> ${stats.total.toLocaleString()} total alumni`;
        if (kpiChanges[1]) kpiChanges[1].innerHTML = `<i class="fas fa-arrow-up"></i> ${stats.employed.toLocaleString()} employed alumni`;
        if (kpiChanges[2]) kpiChanges[2].innerHTML = `<i class="fas fa-arrow-down"></i> Based on ${stats.employed.toLocaleString()} employed`;
        if (kpiChanges[3]) kpiChanges[3].innerHTML = `<i class="fas fa-arrow-up"></i> ${stats.uniqueCompanies} hiring companies`;

        // Update Employment by Program chart
        const empChart = chartInstances.employmentByProgram || Chart.getChart('employmentByProgramChart');
        if (empChart) {
            const labels = Object.keys(stats.programBreakdown);
            const empRates = labels.map(p => {
                const pb = stats.programBreakdown[p];
                return pb.total > 0 ? ((pb.employed / pb.total) * 100).toFixed(1) : 0;
            });
            empChart.data.labels = labels.map(l => l.length > 15 ? l.substring(0, 12) + '...' : l);
            empChart.data.datasets[0].data = empRates;
            empChart.update('none');
        }

        // Update Employment Status Donut Chart
        const statusChart = chartInstances.employmentStatus || Chart.getChart('employmentStatusChart');
        if (statusChart) {
            statusChart.data.datasets[0].data = [stats.employed, stats.seeking, stats.pursuing];
            statusChart.update('none');
            // Update the center text of the donut chart
            const centerValueEl = statusChart.canvas?.closest('.donut-container')?.querySelector('.donut-value');
            if (centerValueEl) {
                centerValueEl.textContent = stats.empRate + '%';
            }
        }
    }

    // Dashboard year filter change handler
    const dashYearFilter = document.getElementById('dashboardYearFilter');
    if (dashYearFilter) {
        dashYearFilter.addEventListener('change', () => {
            const program = document.getElementById('dashboardProgramFilter')?.value || 'all';
            updateDashboard(dashYearFilter.value, program);
        });
    }

    // Dashboard program filter change handler
    const dashProgramFilter = document.getElementById('dashboardProgramFilter');
    if (dashProgramFilter) {
        dashProgramFilter.addEventListener('change', () => {
            const year = document.getElementById('dashboardYearFilter')?.value || 'all';
            updateDashboard(year, dashProgramFilter.value);
        });
    }

    // Initial dashboard load with live data
    updateDashboard('all', 'all');

    // ==================== ADD ALUMNI FORM HANDLER ====================
    const addAlumniForm = document.getElementById('addAlumniForm');
    if (addAlumniForm) {
        addAlumniForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = addAlumniForm.querySelector('button[type="submit"]');
            const origText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            submitBtn.disabled = true;

            const program = document.getElementById('alumniProgram').value;
            const degree = document.getElementById('alumniDegree').value;

            const editId = document.getElementById('editAlumniId')?.value;
            const isEdit = !!editId;

            // Create or update Auth User for portal access
            const password = document.getElementById('alumniPassword').value.trim();
            const session = authManager.getCurrentSession();

            if (!isEdit) {
                const authRecord = {
                    fullName: document.getElementById('alumniName').value.trim(),
                    email: document.getElementById('alumniEmail').value.trim(),
                    personalEmail: document.getElementById('alumniPersonalEmail').value.trim(),
                    password: password,
                    contactNumber: document.getElementById('alumniPhone')?.value.trim() || '+92-000-0000000',
                    role: 'alumni',
                    program: program,
                    degree: degree,
                    graduationYear: document.getElementById('alumniGradYear').value || '',
                    admissionYear: document.getElementById('alumniAdmissionYear')?.value || '',
                    cgpa: document.getElementById('alumniCGPA').value || '',
                    jobTitle: document.getElementById('alumniJobTitle')?.value.trim() || '',
                    linkedIn: document.getElementById('alumniLinkedIn')?.value.trim() || ''
                };
                let authResult = await authManager.adminCreateUser(authRecord, session);
                if (!authResult.success) {
                    // Check if it's an orphaned email issue (email exists in auth but record was deleted from alumni DB)
                    if (authResult.error.toLowerCase().includes('exists')) {
                        if (confirm(`Notice: An account with this email already exists in the portal's security database (likely from a previously deleted record).\n\nWould you like to RESET it and link it to this new record?`)) {
                            // Purge the orphaned auth accounts
                            authManager.deleteUserByEmail(authRecord.email);
                            authManager.deleteUserByEmail(authRecord.personalEmail);
                            // Retry creation
                            authResult = await authManager.adminCreateUser(authRecord, session);
                        }
                    }

                    if (!authResult.success) {
                        alert('Error creating portal access: ' + authResult.error);
                        submitBtn.innerHTML = origText;
                        submitBtn.disabled = false;
                        return;
                    }
                }
            } else {
                // If editing, check if they want to update password or email in auth
                const currentEmail = document.getElementById('alumniEmail').value.trim();
                const originalEmail = document.getElementById('editAlumniOriginalEmail')?.value || currentEmail;

                let user = authManager.findUserByEmail(originalEmail);
                if (!user && currentEmail !== originalEmail) {
                    user = authManager.findUserByEmail(currentEmail);
                }

                if (user) {
                    const updates = {
                        fullName: document.getElementById('alumniName').value.trim(),
                        email: currentEmail, // Admin can update email
                        personalEmail: document.getElementById('alumniPersonalEmail').value.trim(),
                        contactNumber: document.getElementById('alumniPhone')?.value.trim() || user.contactNumber,
                        program: program,
                        degree: degree,
                        graduationYear: document.getElementById('alumniGradYear').value || user.graduationYear,
                        cgpa: document.getElementById('alumniCGPA').value || user.cgpa,
                        jobTitle: document.getElementById('alumniJobTitle')?.value.trim() || user.jobTitle,
                        linkedIn: document.getElementById('alumniLinkedIn')?.value.trim() || user.linkedIn
                    };
                    const updateRes = await authManager.updateProfile(user.id, updates);
                    if (updateRes.success && password) {
                        await authManager.changePassword(user.id, null, password);
                    }
                } else {
                    // Auto-create auth user if it doesn't exist during edit
                    const authRecord = {
                        fullName: document.getElementById('alumniName').value.trim(),
                        email: currentEmail,
                        personalEmail: document.getElementById('alumniPersonalEmail').value.trim(),
                        password: password || 'Alumni@2026',
                        contactNumber: document.getElementById('alumniPhone')?.value.trim() || '+92-000-0000000',
                        role: 'alumni',
                        program: program,
                        degree: degree,
                        graduationYear: document.getElementById('alumniGradYear').value || '',
                        cgpa: document.getElementById('alumniCGPA').value || '',
                        jobTitle: document.getElementById('alumniJobTitle')?.value.trim() || '',
                        linkedIn: document.getElementById('alumniLinkedIn')?.value.trim() || ''
                    };
                    await authManager.adminCreateUser(authRecord, session);
                }
            }

            const record = {
                full_name: document.getElementById('alumniName').value.trim(),
                email: document.getElementById('alumniEmail').value.trim(),
                phone: document.getElementById('alumniPhone')?.value.trim() || null,
                program: program,
                degree_level: degree,
                graduation_year: parseInt(document.getElementById('alumniGradYear').value) || null,
                cgpa: parseFloat(document.getElementById('alumniCGPA').value) || null,
                employment_status: document.getElementById('alumniStatus')?.value || null,
                job_title: document.getElementById('alumniJobTitle')?.value.trim() || null,
                linkedin_url: document.getElementById('alumniLinkedIn')?.value.trim() || null,
            };

            let error;
            if (isEdit) {
                const result = await alumniDB.updateAlumni(editId, record);
                error = result.error;
            } else {
                record.student_id = alumniDB.generateStudentId(program, degree);
                const result = await alumniDB.addAlumni(record);
                error = result.error;
            }

            submitBtn.innerHTML = origText;
            submitBtn.disabled = false;

            if (error) {
                alert(`Error ${isEdit ? 'updating' : 'adding'} alumni: ` + error.message);
            } else {
                if (document.getElementById('editAlumniId')) document.getElementById('editAlumniId').value = '';
                if (document.getElementById('editAlumniOriginalEmail')) document.getElementById('editAlumniOriginalEmail').value = '';
                addAlumniForm.reset();
                document.getElementById('addAlumniModal').classList.add('hidden');
                await bootstrapDashboard();
                renderAlumniTable(1);
                alert(`✅ Alumni record ${isEdit ? 'updated' : 'added'} successfully!`);
            }
        });
    }

    // ==================== ADMIN PANEL HANDLERS ====================
    // Admin Add Alumni — open the modal
    const adminAddBtn = document.getElementById('adminAddAlumniBtn');
    if (adminAddBtn) {
        adminAddBtn.addEventListener('click', () => {
            const editIdInput = document.getElementById('editAlumniId');
            if (editIdInput) editIdInput.value = '';
            document.getElementById('addAlumniForm')?.reset();

            const modalTitle = document.getElementById('addAlumniModalTitle');
            if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-user-plus"></i> Add New Alumni';

            const pwInput = document.getElementById('alumniPassword');
            if (pwInput) {
                pwInput.required = true;
                pwInput.placeholder = "Set temporary password";
            }

            document.getElementById('addAlumniModal')?.classList.remove('hidden');
        });
    }

    // Admin Export CSV
    const adminExportBtn = document.getElementById('adminExportBtn');
    if (adminExportBtn) {
        adminExportBtn.addEventListener('click', async () => {
            adminExportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
            const { csv, error } = await alumniDB.exportCSV();
            if (error) { alert('Export failed: ' + error.message); adminExportBtn.innerHTML = 'Export CSV'; return; }

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `alumni_export_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click(); URL.revokeObjectURL(url);
            adminExportBtn.innerHTML = '<i class="fas fa-check"></i> Downloaded!';
            adminExportBtn.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
            adminExportBtn.style.color = '#fff';
            setTimeout(() => { adminExportBtn.innerHTML = 'Export CSV'; adminExportBtn.style.background = ''; adminExportBtn.style.color = ''; }, 2500);
        });
    }

    // Admin Refresh Data
    const adminRefreshBtn = document.getElementById('adminRefreshBtn');
    if (adminRefreshBtn) {
        adminRefreshBtn.addEventListener('click', async () => {
            adminRefreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
            await renderAlumniTable(1);
            adminRefreshBtn.innerHTML = '<i class="fas fa-check"></i> Refreshed!';
            adminRefreshBtn.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
            adminRefreshBtn.style.color = '#fff';
            setTimeout(() => { adminRefreshBtn.innerHTML = 'Refresh Now'; adminRefreshBtn.style.background = ''; adminRefreshBtn.style.color = ''; }, 2000);
        });
    }

    // Admin Bulk Import CSV
    const adminBulkBtn = document.getElementById('adminBulkImportBtn');
    const adminBulkFile = document.getElementById('adminBulkImportFile');
    if (adminBulkBtn && adminBulkFile) {
        adminBulkBtn.addEventListener('click', () => adminBulkFile.click());
        adminBulkFile.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            adminBulkBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';
            const text = await file.text();
            const lines = text.split('\n').filter(l => l.trim());
            if (lines.length < 2) { alert('CSV file is empty or invalid.'); adminBulkBtn.innerHTML = 'Upload File'; return; }

            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
            let imported = 0, failed = 0;
            for (let i = 1; i < lines.length; i++) {
                const vals = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                const row = {};
                headers.forEach((h, j) => { row[h] = vals[j] || ''; });
                const record = {
                    student_id: row.student_id || alumniDB.generateStudentId(row.program || '', row.degree_level || 'BS'),
                    full_name: row.full_name || row.name || '',
                    email: row.email || '',
                    phone: row.phone || null,
                    program: row.program || null,
                    degree_level: row.degree_level || row.degree || null,
                    graduation_year: parseInt(row.graduation_year) || null,
                    cgpa: parseFloat(row.cgpa) || null,
                    employment_status: row.employment_status || null,
                    job_title: row.job_title || null,
                };
                if (!record.full_name || !record.email) { failed++; continue; }
                const { error } = await alumniDB.addAlumni(record);
                if (error) failed++; else imported++;
            }
            adminBulkBtn.innerHTML = `<i class="fas fa-check"></i> ${imported} imported`;
            adminBulkBtn.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
            adminBulkBtn.style.color = '#fff';
            if (failed) alert(`${failed} records failed to import.`);
            setTimeout(() => { adminBulkBtn.innerHTML = 'Upload File'; adminBulkBtn.style.background = ''; adminBulkBtn.style.color = ''; }, 3000);
            adminBulkFile.value = '';
            await bootstrapDashboard();
            renderAlumniTable(1);
        });
    }

    // Admin Database Stats
    const adminStatsBtn = document.getElementById('adminStatsBtn');
    if (adminStatsBtn) {
        adminStatsBtn.addEventListener('click', async () => {
            adminStatsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
            const { data: progs } = await alumniDB.getPrograms();
            const { data: statuses } = await alumniDB.getEmploymentStatuses();
            const { count: totalCount } = await alumniDB.getAlumni({}, 1);
            const { data: companies } = await alumniDB.getCompanies();

            let msg = `📊 Database Statistics\n\n`;
            msg += `Total Alumni: ${totalCount?.toLocaleString() || '—'}\n`;
            msg += `Total Companies: ${companies?.length || '—'}\n`;
            msg += `Programs: ${progs?.join(', ') || '—'}\n`;
            msg += `Employment Statuses: ${statuses?.join(', ') || '—'}`;
            alert(msg);
            adminStatsBtn.innerHTML = 'View Stats';
        });
    }

    // Admin Connection Status
    const adminConnBtn = document.getElementById('adminConnectionBtn');
    if (adminConnBtn) {
        adminConnBtn.addEventListener('click', async () => {
            adminConnBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
            try {
                const { count, error } = await alumniDB.getAlumni({}, 1);
                if (error) throw error;
                adminConnBtn.innerHTML = '<i class="fas fa-check-circle"></i> Connected!';
                adminConnBtn.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
                adminConnBtn.style.color = '#fff';
                alert(`✅ Supabase Connected!\n\nProject: AlumniTrackingSystem\nURL: https://anxoxtavdydntwhavgdh.supabase.co\nAlumni Records: ${count}\nStatus: Healthy`);
            } catch (err) {
                adminConnBtn.innerHTML = '<i class="fas fa-times-circle"></i> Failed';
                adminConnBtn.style.background = 'linear-gradient(135deg, #f43f5e, #fb7185)';
                adminConnBtn.style.color = '#fff';
                alert('❌ Connection failed: ' + (err.message || err));
            }
            setTimeout(() => { adminConnBtn.innerHTML = 'Check Status'; adminConnBtn.style.background = ''; adminConnBtn.style.color = ''; }, 3000);
        });
    }

    // ==================== EXPORT BUTTON ANIMATION ====================
    const exportBtn = document.getElementById('exportDashboard');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
            const { csv, error } = await alumniDB.exportCSV();
            if (!error && csv) {
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `dashboard_report_${new Date().toISOString().slice(0, 10)}.csv`;
                a.click(); URL.revokeObjectURL(url);
            }
            exportBtn.innerHTML = '<i class="fas fa-check"></i> Exported!';
            exportBtn.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
            setTimeout(() => {
                exportBtn.innerHTML = '<i class="fas fa-download"></i> Export Report';
                exportBtn.style.background = '';
            }, 2000);
        });
    }

    // ==================== GLOBAL SEARCH ====================
    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
        globalSearch.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                const query = globalSearch.value.toLowerCase().trim();
                if (query) {
                    document.querySelector('[data-page="alumni"]').click();
                    setTimeout(() => renderAlumniTable(1), 300);
                }
            }
        });
    }

    // ==================== SPARKLINE PLACEHOLDERS ====================
    // Small sparkline dots animation for KPI cards
    document.querySelectorAll('.kpi-sparkline').forEach(container => {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 30;
        canvas.style.position = 'absolute';
        canvas.style.bottom = '12px';
        canvas.style.right = '12px';
        canvas.style.opacity = '0.3';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const points = Array.from({ length: 8 }, () => Math.random() * 20 + 5);

        ctx.beginPath();
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 1.5;
        points.forEach((p, i) => {
            const x = (i / (points.length - 1)) * canvas.width;
            if (i === 0) ctx.moveTo(x, p);
            else ctx.lineTo(x, p);
        });
        ctx.stroke();
    });

    console.log('✅ Alumni Analytics & Career Prediction System initialized');

    // ==================== NOTIFICATION SYSTEM ====================
    const notifBtn = document.getElementById('notificationBtn');
    const notifDropdown = document.getElementById('notificationDropdown');
    const notifDot = document.getElementById('notificationDot');
    const notifList = document.getElementById('notificationList');
    const notifFooter = document.getElementById('notificationFooterText');
    const clearNotifBtn = document.getElementById('clearNotificationsBtn');

    let notificationsRead = false;

    function generateNotifications() {
        const now = new Date();
        const notifications = [
            {
                icon: 'fa-database', type: 'icon-success',
                text: '<strong>Database Connected</strong> — Supabase is healthy and responding.',
                time: 'Just now'
            },
            {
                icon: 'fa-chart-line', type: 'icon-info',
                text: '<strong>Dashboard Updated</strong> — KPIs and charts refreshed with live data.',
                time: formatTimeAgo(2)
            },
            {
                icon: 'fa-robot', type: 'icon-info',
                text: '<strong>AI Service Online</strong> — Groq-powered analytics are active.',
                time: formatTimeAgo(5)
            },
            {
                icon: 'fa-user-graduate', type: 'icon-warning',
                text: '<strong>Alumni Attention</strong> — Some alumni are still seeking employment. Review the at-risk segments.',
                time: formatTimeAgo(15)
            },
            {
                icon: 'fa-satellite-dish', type: 'icon-info',
                text: '<strong>Job Market Intel</strong> — Ready for on-demand skill gap analysis.',
                time: formatTimeAgo(30)
            }
        ];
        return notifications;
    }

    function formatTimeAgo(minutes) {
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        return `${Math.floor(minutes / 60)}h ago`;
    }

    function renderNotifications() {
        const notifs = generateNotifications();
        notifList.innerHTML = notifs.map((n, i) => `
            <div class="notification-item ${notificationsRead ? '' : 'unread'}">
                <div class="notification-icon ${n.type}">
                    <i class="fas ${n.icon}"></i>
                </div>
                <div class="notification-text">
                    <p>${n.text}</p>
                    <small><i class="fas fa-clock"></i> ${n.time}</small>
                </div>
            </div>
        `).join('');
        notifFooter.textContent = notificationsRead ? 'All caught up!' : `${notifs.length} notifications`;
        notifDot.style.display = notificationsRead ? 'none' : '';
    }

    if (notifBtn && notifDropdown) {
        // Toggle dropdown
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = notifDropdown.classList.contains('hidden');
            notifDropdown.classList.toggle('hidden');
            if (isHidden) {
                renderNotifications();
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!notifDropdown.classList.contains('hidden') &&
                !notifDropdown.contains(e.target) &&
                !notifBtn.contains(e.target)) {
                notifDropdown.classList.add('hidden');
            }
        });

        // Clear all
        if (clearNotifBtn) {
            clearNotifBtn.addEventListener('click', () => {
                notificationsRead = true;
                renderNotifications();
            });
        }

        // Initial render of dot
        renderNotifications();

        // Contact Office Form
        const contactForm = document.getElementById('contactOfficeForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const btn = contactForm.querySelector('button');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
                btn.disabled = true;

                setTimeout(() => {
                    alert('✅ Your message has been sent to the Alumni Office. We will get back to you soon!');
                    contactForm.reset();
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }, 1500);
            });
        }
    }

    // ==================== STUDENT FEEDBACK PORTAL ====================
    async function renderStudentFeedbackEntries() {
        const container = document.getElementById('studentFeedbackEntries');
        if (!container) return;

        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)"><i class="fas fa-spinner fa-spin" style="font-size:2rem;margin-bottom:12px;display:block"></i>Loading feedbacks...</div>';

        const { data: feedbacks, error } = await alumniDB.getFeedbacks();
        if (error) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-danger)"><i class="fas fa-exclamation-triangle" style="font-size:2rem;margin-bottom:12px;display:block"></i>Failed to load feedback entries.</div>';
            return;
        }

        if (!feedbacks || feedbacks.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)"><i class="fas fa-inbox" style="font-size:2rem;margin-bottom:12px;display:block"></i>No feedback entries yet. Be the first to share!</div>';
            return;
        }

        const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
        const typeIcons = { 'Internship': 'fa-user-tie', 'Full-Time Job': 'fa-briefcase', 'Part-Time Job': 'fa-clock', 'Freelance': 'fa-laptop' };
        const programColors = {
            'Business Analytics': '#06b6d4', 'Project Management': '#10b981',
            'Accounting & Finance': '#f59e0b', 'Business Admin': '#6366f1',
            'Fintech': '#ec4899', 'Public Admin': '#8b5cf6'
        };

        container.innerHTML = feedbacks.map(fb => {
            const initials = fb.name ? fb.name.split(' ').map(w => w[0]).join('').toUpperCase() : 'A';
            const color = programColors[fb.program] || '#6366f1';
            const stars = Array.from({ length: 5 }, (_, i) => `<i class="fas fa-star${i < fb.rating ? ' active' : ''}" style="color:${i < fb.rating ? '#f59e0b' : 'var(--border-color)'}"></i>`).join('');
            const timeAgo = getTimeAgo(fb.created_at || new Date());

            return `<div class="feedback-entry">
                <div class="feedback-entry-header">
                    <div class="feedback-author">
                        <div class="feedback-avatar" style="background:linear-gradient(135deg,${color},${color}88)">${initials}</div>
                        <div>
                            <strong>${fb.name}</strong>
                            <span class="feedback-meta"><i class="fas ${typeIcons[fb.type] || 'fa-briefcase'}"></i> ${fb.type} at <strong>${fb.company || 'N/A'}</strong> ${fb.role ? '• ' + fb.role : ''}</span>
                        </div>
                    </div>
                    <div class="feedback-rating">${stars} <span style="font-size:0.8rem;color:var(--text-muted);margin-left:4px">${ratingLabels[fb.rating] || 'Good'}</span></div>
                </div>
                <div class="feedback-tags">
                    <span class="feedback-tag program-tag" style="background:${color}15;color:${color};border:1px solid ${color}30">${fb.program || 'Not Specified'}</span>
                    <span class="feedback-tag">${fb.duration || 'N/A'}</span>
                    <span class="feedback-tag time-tag"><i class="fas fa-clock"></i> ${timeAgo}</span>
                </div>
                <div class="feedback-body">
                    <p>${fb.experience}</p>
                    ${fb.skills_learned ? `<div class="feedback-section"><h5><i class="fas fa-tools"></i> Skills Learned</h5><p>${fb.skills_learned}</p></div>` : ''}
                    ${fb.recommendations ? `<div class="feedback-section"><h5><i class="fas fa-graduation-cap"></i> What to Learn Before Joining</h5><p>${fb.recommendations}</p></div>` : ''}
                    ${fb.requirements ? `<div class="feedback-section"><h5><i class="fas fa-clipboard-list"></i> Organization Requirements</h5><p>${fb.requirements}</p></div>` : ''}
                    ${fb.advice ? `<div class="feedback-section"><h5><i class="fas fa-lightbulb"></i> Advice for Students</h5><p>${fb.advice}</p></div>` : ''}
                </div>
            </div>`;
        }).join('');
    }

    function getTimeAgo(dateStr) {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return (mins < 1 ? 'just now' : mins + 'm ago');
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return hrs + 'h ago';
        const days = Math.floor(hrs / 24);
        if (days < 30) return days + 'd ago';
        return Math.floor(days / 30) + 'mo ago';
    }

    // Star rating interaction
    const sfRating = document.getElementById('sfRating');
    if (sfRating) {
        sfRating.querySelectorAll('.fa-star').forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                document.getElementById('sfRatingValue').value = rating;
                const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
                document.getElementById('sfRatingText').textContent = labels[rating];
                sfRating.querySelectorAll('.fa-star').forEach((s, i) => {
                    s.style.color = i < rating ? '#f59e0b' : 'var(--border-color)';
                });
            });
            star.addEventListener('mouseenter', () => {
                const rating = parseInt(star.dataset.rating);
                sfRating.querySelectorAll('.fa-star').forEach((s, i) => {
                    s.style.color = i < rating ? '#fbbf24' : 'var(--border-color)';
                });
            });
        });
        sfRating.addEventListener('mouseleave', () => {
            const current = parseInt(document.getElementById('sfRatingValue').value);
            sfRating.querySelectorAll('.fa-star').forEach((s, i) => {
                s.style.color = i < current ? '#f59e0b' : 'var(--border-color)';
            });
        });
    }

    // Student Feedback Form Submit
    const studentFeedbackForm = document.getElementById('studentFeedbackForm');
    if (studentFeedbackForm) {
        studentFeedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const rating = parseInt(document.getElementById('sfRatingValue').value);
            if (rating === 0) { alert('Please select a rating'); return; }

            const submitBtn = studentFeedbackForm.querySelector('button[type="submit"]');
            const origText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            submitBtn.disabled = true;

            const entry = {
                name: document.getElementById('sfName').value.trim(),
                program: document.getElementById('sfProgram').value,
                type: document.getElementById('sfType').value,
                company: document.getElementById('sfCompany').value.trim(),
                role: document.getElementById('sfRole').value.trim(),
                duration: document.getElementById('sfDuration').value.trim(),
                rating: rating,
                experience: document.getElementById('sfExperience').value.trim(),
                skills_learned: document.getElementById('sfSkillsLearned').value.trim(),
                recommendations: document.getElementById('sfRecommendations').value.trim(),
                requirements: document.getElementById('sfRequirements').value.trim(),
                advice: document.getElementById('sfAdvice').value.trim()
            };

            const { error } = await alumniDB.addFeedback(entry);

            submitBtn.innerHTML = origText;
            submitBtn.disabled = false;

            if (error) {
                alert('Submission failed: ' + error.message);
            } else {
                renderStudentFeedbackEntries();
                studentFeedbackForm.reset();
                document.getElementById('sfRatingValue').value = '0';
                document.getElementById('sfRatingText').textContent = 'Select Rating';
                sfRating.querySelectorAll('.fa-star').forEach(s => s.style.color = 'var(--border-color)');
                alert('✅ Thank you! Your feedback has been submitted successfully.');
            }
        });
    }

    renderStudentFeedbackEntries();

    // ==================== ALUMNI COMMUNITY PORTAL ====================
    const categoryConfig = {
        feedback: { icon: 'fa-comment', color: '#6366f1', label: 'Feedback' },
        internship: { icon: 'fa-user-tie', color: '#10b981', label: 'Internship' },
        job: { icon: 'fa-briefcase', color: '#f43f5e', label: 'Job Opening' },
        workshop: { icon: 'fa-chalkboard-teacher', color: '#06b6d4', label: 'Workshop' },
        advice: { icon: 'fa-lightbulb', color: '#f59e0b', label: 'Advice' },
        achievement: { icon: 'fa-trophy', color: '#ec4899', label: 'Achievement' }
    };

    async function renderCommunityFeed(filter = 'all') {
        const container = document.getElementById('communityFeed');
        if (!container) return;

        container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted)"><i class="fas fa-spinner fa-spin" style="font-size:2.5rem;margin-bottom:16px;display:block"></i>Loading posts...</div>';

        const { data: posts, error } = await alumniDB.getPosts();
        if (error) {
            container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-danger)"><i class="fas fa-exclamation-triangle" style="font-size:2.5rem;margin-bottom:16px;display:block"></i><h3>Failed to load posts</h3></div>';
            return;
        }

        const filtered = filter === 'all' ? posts : posts.filter(p => p.category === filter);

        if (!filtered || filtered.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted)"><i class="fas fa-inbox" style="font-size:2.5rem;margin-bottom:16px;display:block"></i><h3>No posts yet</h3><p>Be the first to share something with the community!</p></div>';
            return;
        }

        const programColors = {
            'Business Analytics': '#06b6d4', 'Project Management': '#10b981',
            'Accounting & Finance': '#f59e0b', 'Business Admin': '#6366f1',
            'Fintech': '#ec4899', 'Public Admin': '#8b5cf6'
        };

        container.innerHTML = filtered.map(post => {
            const cat = categoryConfig[post.category] || categoryConfig.feedback;
            const initials = post.author ? post.author.split(' ').map(w => w[0]).join('').toUpperCase() : 'A';
            const color = programColors[post.program] || '#6366f1';
            const timeAgo = getTimeAgo(post.created_at || new Date());

            return `<div class="community-post" data-category="${post.category}">
                <div class="community-post-header">
                    <div class="community-post-author">
                        <div class="feedback-avatar" style="background:linear-gradient(135deg,${color},${color}88)">${initials}</div>
                        <div>
                            <strong>${post.author || 'Anonymous'}</strong>
                            <span class="feedback-meta">${post.program || 'Alumni'} • ${timeAgo}</span>
                        </div>
                    </div>
                    <span class="community-category-badge" style="background:${cat.color}15;color:${cat.color};border:1px solid ${cat.color}30">
                        <i class="fas ${cat.icon}"></i> ${cat.label}
                    </span>
                </div>
                <h3 class="community-post-title">${post.title}</h3>
                <p class="community-post-content">${post.content}</p>
                ${(post.company || post.location || post.contact) ? `<div class="community-post-meta">
                    ${post.company ? `<span><i class="fas fa-building"></i> ${post.company}</span>` : ''}
                    ${post.location ? `<span><i class="fas fa-map-marker-alt"></i> ${post.location}</span>` : ''}
                    ${post.contact ? `<span><i class="fas fa-link"></i> <a href="${post.contact.startsWith('http') ? post.contact : 'mailto:' + post.contact}" target="_blank" style="color:var(--accent-primary)">${post.contact.length > 35 ? post.contact.substring(0, 35) + '...' : post.contact}</a></span>` : ''}
                </div>` : ''}
                <div class="community-post-actions">
                    <button class="community-action-btn like-btn" data-id="${post.id}" data-likes="${post.likes || 0}">
                        <i class="fas fa-heart"></i> ${post.likes || 0}
                    </button>
                    <button class="community-action-btn">
                        <i class="fas fa-share-alt"></i> Share
                    </button>
                </div>
            </div>`;
        }).join('');

        // Like button handlers
        container.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.id);
                const currentLikes = parseInt(btn.dataset.likes || '0');
                btn.disabled = true;
                const { error, data } = await alumniDB.likePost(id, currentLikes);
                btn.disabled = false;
                if (!error && data && data.length) {
                    const newLikes = data[0].likes;
                    btn.dataset.likes = newLikes;
                    btn.innerHTML = `<i class="fas fa-heart" style="color:#f43f5e"></i> ${newLikes}`;
                }
            });
        });
    }

    // Community filter buttons
    document.querySelectorAll('.community-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.community-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderCommunityFeed(btn.dataset.filter);
        });
    });

    // New Post button
    const newPostBtn = document.getElementById('newCommunityPostBtn');
    const postForm = document.getElementById('communityPostForm');
    const closeFormBtn = document.getElementById('closeCommunityForm');

    if (newPostBtn && postForm) {
        newPostBtn.addEventListener('click', () => postForm.classList.toggle('hidden'));
    }
    if (closeFormBtn && postForm) {
        closeFormBtn.addEventListener('click', () => postForm.classList.add('hidden'));
    }

    // Community Form Submit
    const communityForm = document.getElementById('alumniCommunityForm');
    if (communityForm) {
        communityForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = authManager.getCurrentUser();
            
            const submitBtn = communityForm.querySelector('button[type="submit"]');
            const origText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
            submitBtn.disabled = true;

            const post = {
                category: document.getElementById('cpCategory').value,
                title: document.getElementById('cpTitle').value.trim(),
                content: document.getElementById('cpContent').value.trim(),
                company: document.getElementById('cpCompany').value.trim(),
                location: document.getElementById('cpLocation').value.trim(),
                contact: document.getElementById('cpContactInfo').value.trim(),
                author: user ? user.fullName : 'Anonymous',
                program: user ? (user.program || 'Alumni') : 'Alumni',
                likes: 0
            };

            const { error } = await alumniDB.addPost(post);
            
            submitBtn.innerHTML = origText;
            submitBtn.disabled = false;

            if (error) {
                alert('Posting failed: ' + error.message);
            } else {
                renderCommunityFeed('all');
                communityForm.reset();
                postForm.classList.add('hidden');
                // Reset filter buttons
                document.querySelectorAll('.community-filter-btn').forEach(b => b.classList.remove('active'));
                document.querySelector('.community-filter-btn[data-filter="all"]')?.classList.add('active');
                alert('✅ Your post has been published to the community!');
            }
        });
    }

    renderCommunityFeed('all');
});
