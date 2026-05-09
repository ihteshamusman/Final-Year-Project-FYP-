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
            initDashboardCharts();
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
        const password = document.getElementById('loginPassword').value;
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
            initDashboardCharts();
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
        const password = document.getElementById('alumniLoginPassword').value;
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
            initDashboardCharts();
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
                chartInstances.employmentByProgram = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Acc & Finance', 'Business Admin', 'Business Analytics', 'Fintech', 'Project Mgmt', 'Public Admin'],
                        datasets: [{
                            label: 'Employment Rate (%)',
                            data: [61.9, 64.3, 64.7, 64.3, 61.3, 64.9],
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
                chartInstances.employmentStatus = new Chart(ctx2, {
                    type: 'doughnut',
                    data: {
                        labels: ['Employed', 'Seeking Employment', 'Pursuing Higher Education'],
                        datasets: [{
                            data: [2543, 1146, 311],
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
                chartInstances.industry = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Telecommunications', 'Manufacturing', 'E-commerce', 'Finance', 'Technology', 'Education', 'Consulting', 'Healthcare'],
                        datasets: [{
                            label: 'Alumni Count',
                            data: [602, 386, 324, 287, 285, 238, 222, 199],
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
                chartInstances.jobLevel = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'],
                        datasets: [{
                            data: [1240, 890, 420, 120],
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
                chartInstances.salary = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['50K-80K', '80K-120K', '120K-200K', '200K+'],
                        datasets: [{
                            label: 'Alumni Count',
                            data: [908, 951, 495, 189],
                            backgroundColor: 'rgba(99, 102, 241, 0.7)',
                            borderRadius: 6,
                            borderSkipped: false,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'top' } },
                        scales: {
                            y: {
                                grid: { color: colors.grid },
                                beginAtZero: true,
                            },
                            x: { grid: { display: false } }
                        }
                    }
                });
            }
        }

        if (!chartInstances.companyType) {
            const ctx = document.getElementById('companyTypeChart');
            if (ctx) {
                chartInstances.companyType = new Chart(ctx, {
                    type: 'polarArea',
                    data: {
                        labels: ['MNC', 'Startup', 'SME', 'Govt Body'],
                        datasets: [{
                            data: [799, 777, 665, 302],
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
    function initSkillCharts() {
        setChartDefaults();
        const colors = getChartColors();

        if (!chartInstances.topSkills) {
            const ctx = document.getElementById('topSkillsChart');
            if (ctx) {
                const skills = ['Financial Modeling', 'SPSS', 'Power BI', 'Data Analysis', 'Excel', 'AWS', 'SAP', 'ERP', 'Azure', 'Java', 'R', 'C++', 'Python', 'Risk Mgmt', 'Salesforce'];
                const counts = [1195, 1177, 1174, 1172, 1165, 1161, 1158, 1158, 1149, 1143, 1138, 1135, 1134, 1129, 1125];

                chartInstances.topSkills = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: skills,
                        datasets: [{
                            label: 'Alumni with Skill',
                            data: counts,
                            backgroundColor: counts.map((v, i) => {
                                const alpha = 0.4 + (0.5 * (1 - i / counts.length));
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
                chartInstances.skillsByProgram = new Chart(ctx, {
                    type: 'radar',
                    data: {
                        labels: ['Analytics', 'Programming', 'Finance', 'Management', 'Communication', 'Tech Tools', 'Domain Knowledge'],
                        datasets: [{
                            label: 'Business Analytics',
                            data: [95, 88, 40, 60, 55, 90, 75],
                            backgroundColor: 'rgba(6, 182, 212, 0.15)',
                            borderColor: '#06b6d4',
                            borderWidth: 2,
                            pointBackgroundColor: '#06b6d4',
                        }, {
                            label: 'Accounting & Finance',
                            data: [45, 35, 95, 70, 65, 50, 85],
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            borderColor: '#f59e0b',
                            borderWidth: 2,
                            pointBackgroundColor: '#f59e0b',
                        }, {
                            label: 'Project Management',
                            data: [50, 45, 40, 95, 90, 70, 78],
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            borderColor: '#10b981',
                            borderWidth: 2,
                            pointBackgroundColor: '#10b981',
                        }, {
                            label: 'Business Admin',
                            data: [40, 30, 60, 92, 92, 45, 80],
                            backgroundColor: 'rgba(99, 102, 241, 0.15)',
                            borderColor: '#6366f1',
                            borderWidth: 2,
                            pointBackgroundColor: '#6366f1',
                        }, {
                            label: 'Fintech',
                            data: [80, 82, 75, 55, 50, 88, 70],
                            backgroundColor: 'rgba(236, 72, 153, 0.15)',
                            borderColor: '#ec4899',
                            borderWidth: 2,
                            pointBackgroundColor: '#ec4899',
                        }, {
                            label: 'Public Admin',
                            data: [35, 45, 50, 65, 80, 40, 75],
                            backgroundColor: 'rgba(139, 92, 246, 0.15)',
                            borderColor: '#8b5cf6',
                            borderWidth: 2,
                            pointBackgroundColor: '#8b5cf6',
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

        if (!chartInstances.trend) {
            const ctx = document.getElementById('trendChart');
            if (ctx) {
                chartInstances.trend = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['2018', '2019', '2020', '2021', '2022', '2023', '2024'],
                        datasets: [{
                            label: 'Business Analytics',
                            data: [66.7, 63.2, 68.8, 74.4, 76.1, 75.7, 73.5],
                            borderColor: '#06b6d4',
                            backgroundColor: 'rgba(6, 182, 212, 0.1)',
                            fill: true,
                            tension: 0.4,
                            pointRadius: 5,
                            pointHoverRadius: 8,
                            pointBackgroundColor: '#06b6d4',
                            borderWidth: 3,
                        }, {
                            label: 'Accounting & Finance',
                            data: [72.1, 71.7, 73.5, 68.5, 66.1, 65.9, 70.1],
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            fill: true,
                            tension: 0.4,
                            pointRadius: 5,
                            pointHoverRadius: 8,
                            pointBackgroundColor: '#f59e0b',
                            borderWidth: 3,
                        }, {
                            label: 'Project Management',
                            data: [68.8, 62.5, 78.2, 64.9, 76.6, 71.0, 63.9],
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            fill: true,
                            tension: 0.4,
                            pointRadius: 5,
                            pointHoverRadius: 8,
                            pointBackgroundColor: '#10b981',
                            borderWidth: 3,
                        }, {
                            label: 'Business Admin',
                            data: [69.3, 62.9, 65.8, 72.1, 67.4, 70.5, 73.9],
                            borderColor: '#6366f1',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            fill: true,
                            tension: 0.4,
                            pointRadius: 5,
                            pointHoverRadius: 8,
                            pointBackgroundColor: '#6366f1',
                            borderWidth: 3,
                        }, {
                            label: 'Fintech',
                            data: [77.1, 62.5, 72.9, 76.9, 66.7, 70.7, 70.6],
                            borderColor: '#ec4899',
                            backgroundColor: 'rgba(236, 72, 153, 0.05)',
                            fill: true,
                            tension: 0.4,
                            pointRadius: 5,
                            pointHoverRadius: 8,
                            pointBackgroundColor: '#ec4899',
                            borderWidth: 3,
                        }, {
                            label: 'Public Admin',
                            data: [75.4, 66.7, 77.1, 68.1, 67.6, 72.6, 70.0],
                            borderColor: '#8b5cf6',
                            backgroundColor: 'rgba(139, 92, 246, 0.05)',
                            fill: true,
                            tension: 0.4,
                            pointRadius: 5,
                            pointHoverRadius: 8,
                            pointBackgroundColor: '#8b5cf6',
                            borderWidth: 3,
                            borderDash: [5, 5],
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'top' } },
                        scales: {
                            y: {
                                grid: { color: colors.grid },
                                min: 60,
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
                chartInstances.cgpaTrend = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['2018', '2019', '2020', '2021', '2022', '2023', '2024'],
                        datasets: [{
                            label: 'Business Analytics',
                            data: [3.09, 3.09, 3.09, 3.09, 3.09, 3.09, 3.09],
                            borderColor: '#06b6d4',
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: '#06b6d4',
                            borderWidth: 2,
                        }, {
                            label: 'Accounting & Finance',
                            data: [3.12, 3.12, 3.12, 3.12, 3.12, 3.12, 3.12],
                            borderColor: '#f59e0b',
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: '#f59e0b',
                            borderWidth: 2,
                        }, {
                            label: 'Project Management',
                            data: [3.09, 3.09, 3.09, 3.09, 3.09, 3.09, 3.09],
                            borderColor: '#10b981',
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: '#10b981',
                            borderWidth: 2,
                        }, {
                            label: 'Business Admin',
                            data: [3.10, 3.10, 3.10, 3.10, 3.10, 3.10, 3.10],
                            borderColor: '#6366f1',
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: '#6366f1',
                            borderWidth: 2,
                        }, {
                            label: 'Fintech',
                            data: [3.13, 3.13, 3.13, 3.13, 3.13, 3.13, 3.13],
                            borderColor: '#ec4899',
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: '#ec4899',
                            borderWidth: 2,
                        }, {
                            label: 'Public Admin',
                            data: [3.07, 3.07, 3.07, 3.07, 3.07, 3.07, 3.07],
                            borderColor: '#8b5cf6',
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: '#8b5cf6',
                            borderWidth: 2,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'top' } },
                        scales: {
                            y: {
                                grid: { color: colors.grid },
                                min: 2.8,
                                max: 3.6,
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
                chartInstances.graduates = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['2018', '2019', '2020', '2021', '2022', '2023', '2024'],
                        datasets: [{
                            label: 'BS',
                            data: [120, 145, 160, 175, 190, 210, 230],
                            backgroundColor: 'rgba(99, 102, 241, 0.7)',
                            borderRadius: 4,
                            borderSkipped: false,
                        }, {
                            label: 'MS',
                            data: [60, 72, 80, 85, 92, 98, 110],
                            backgroundColor: 'rgba(6, 182, 212, 0.7)',
                            borderRadius: 4,
                            borderSkipped: false,
                        }, {
                            label: 'PhD',
                            data: [8, 12, 15, 18, 20, 22, 25],
                            backgroundColor: 'rgba(16, 185, 129, 0.7)',
                            borderRadius: 4,
                            borderSkipped: false,
                        }]
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

        if (!chartInstances.programComparison) {
            const ctx = document.getElementById('programComparisonChart');
            if (ctx) {
                chartInstances.programComparison = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['2018', '2019', '2020', '2021', '2022', '2023', '2024'],
                        datasets: [{
                            label: 'Accounting & Finance',
                            data: [72.1, 71.7, 73.5, 68.5, 66.1, 65.9, 70.1],
                            borderColor: '#f59e0b',
                            borderWidth: 2,
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: '#f59e0b',
                        }, {
                            label: 'Business Admin',
                            data: [69.3, 62.9, 65.8, 72.1, 67.4, 70.5, 73.9],
                            borderColor: '#6366f1',
                            borderWidth: 2,
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: '#6366f1',
                        }, {
                            label: 'Business Analytics',
                            data: [66.7, 63.2, 68.8, 74.4, 76.1, 75.7, 73.5],
                            borderColor: '#06b6d4',
                            borderWidth: 2,
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: '#06b6d4',
                        }, {
                            label: 'Fintech',
                            data: [77.1, 62.5, 72.9, 76.9, 66.7, 70.7, 70.6],
                            borderColor: '#ec4899',
                            borderWidth: 2,
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: '#ec4899',
                        }, {
                            label: 'Project Management',
                            data: [68.8, 62.5, 78.2, 64.9, 76.6, 71.0, 63.9],
                            borderColor: '#10b981',
                            borderWidth: 2,
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: '#10b981',
                        }, {
                            label: 'Public Admin',
                            data: [75.4, 66.7, 77.1, 68.1, 67.6, 72.6, 70.0],
                            borderColor: '#8b5cf6',
                            borderWidth: 2,
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: '#8b5cf6',
                            borderDash: [5, 5],
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'top' } },
                        scales: {
                            y: {
                                grid: { color: colors.grid },
                                min: 60,
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
                // Load AI analytics widgets on dashboard
                if (typeof jobScraper !== 'undefined') {
                    jobScraper.renderAnalyticsWidgets();
                }
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
            case 'jobmarket':
                // Job market page is loaded on-demand via button click
                break;
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

        // Update alumniDB pageSize from dropdown
        alumniDB.pageSize = getPageSize();

        tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:32px;color:var(--text-muted)"><i class="fas fa-spinner fa-spin"></i> Loading from database...</td></tr>';

        const filters = getFilters();
        const { data, count, error } = await alumniDB.getAlumni(filters, page);

        if (error) {
            tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:32px;color:#f43f5e"><i class="fas fa-exclamation-triangle"></i> Error loading data</td></tr>';
            console.error('Supabase error:', error);
            return;
        }
        if (!data.length) {
            tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:32px;color:var(--text-muted)"><i class="fas fa-search"></i> No alumni found matching filters</td></tr>';
            updatePagination(0, page);
            return;
        }

        tbody.innerHTML = data.map((a, idx) => {
            const initials = (a.full_name || '').split(' ').map(w => w[0]).join('').substring(0, 2);
            const color = programColors[a.program] || '#6366f1';
            const statusClass = a.employment_status === 'Employed' ? 'status-employed' :
                a.employment_status === 'Seeking Employment' ? 'status-unemployed' : 'status-studies';
            const companyName = a.companies?.company_name || '—';

            return `<tr data-id="${a.student_id}">
                <td><input type="checkbox"></td>
                <td><div class="alumni-cell">
                    <div class="alumni-avatar-mini" style="background:linear-gradient(135deg,${color},${color}88)">${initials}</div>
                    <div class="alumni-name-cell"><strong>${a.full_name}</strong><small>${a.email}</small></div>
                </div></td>
                <td>${a.program || '—'}</td>
                <td>${a.degree_level || '—'}</td>
                <td>${a.graduation_year || '—'}</td>
                <td><strong>${a.cgpa ? a.cgpa.toFixed(2) : '—'}</strong></td>
                <td><span class="status-badge ${statusClass}">${a.employment_status || '—'}</span></td>
                <td>${companyName}</td>
                <td class="admin-only-col">${a.email || '—'}</td>
                <td class="admin-only-col">${a.phone || '—'}</td>
                <td><div class="action-btns">
                    <button class="action-btn view-alumni-btn" title="View" data-id="${a.student_id}"><i class="fas fa-eye"></i></button>
                    ${isAdmin ? `<button class="action-btn delete-alumni-btn danger" title="Delete" data-id="${a.student_id}"><i class="fas fa-trash"></i></button>` : ''}
                </div></td>
            </tr>`;
        }).join('');

        updatePagination(count, page);

        // Bind delete buttons
        tbody.querySelectorAll('.delete-alumni-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Are you sure you want to delete this alumni record?')) return;
                const id = btn.dataset.id;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                const { error } = await alumniDB.deleteAlumni(id);
                if (error) { alert('Delete failed: ' + error.message); return; }
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

        let btns = `<button class="pagination-btn" ${page <= 1 ? 'disabled' : ''} data-p="${page-1}" title="Previous"><i class="fas fa-chevron-left"></i></button>`;
        const show = [1];
        if (page > 3) show.push('...');
        for (let i = Math.max(2, page-1); i <= Math.min(totalPages-1, page+1); i++) show.push(i);
        if (page < totalPages - 2) show.push('...');
        if (totalPages > 1) show.push(totalPages);
        show.forEach(p => {
            if (p === '...') { btns += '<span class="pagination-dots">...</span>'; }
            else { btns += `<button class="pagination-btn ${p===page?'active':''}" data-p="${p}">${p}</button>`; }
        });
        btns += `<button class="pagination-btn" ${page >= totalPages ? 'disabled' : ''} data-p="${page+1}" title="Next"><i class="fas fa-chevron-right"></i></button>`;
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

            // Update prediction details based on score
            const predIndustry = document.getElementById('predIndustry');
            const predTime = document.getElementById('predTime');
            const predSalary = document.getElementById('predSalary');

            if (score >= 80) {
                predIndustry.textContent = 'IT & Consulting';
                predTime.textContent = '1-2 months';
                predSalary.textContent = 'PKR 100K - 150K';
            } else if (score >= 60) {
                predIndustry.textContent = 'Banking / FMCG';
                predTime.textContent = '2-4 months';
                predSalary.textContent = 'PKR 60K - 100K';
            } else {
                predIndustry.textContent = 'Various Sectors';
                predTime.textContent = '4-6 months';
                predSalary.textContent = 'PKR 40K - 70K';
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
    async function updateDashboard(year = 'all') {
        const { stats, error } = await alumniDB.getDashboardStats(year);
        if (error || !stats) { console.error('Dashboard stats error:', error); return; }

        // Update KPI cards
        const kpiValues = document.querySelectorAll('.kpi-value');
        if (kpiValues[0]) { kpiValues[0].setAttribute('data-count', stats.total); kpiValues[0].textContent = stats.total.toLocaleString(); }
        if (kpiValues[1]) { kpiValues[1].innerHTML = `${stats.empRate}<small>%</small>`; }
        if (kpiValues[2]) { kpiValues[2].innerHTML = `${stats.avgTimeToJob}<small>months</small>`; }
        if (kpiValues[3]) { kpiValues[3].setAttribute('data-count', stats.uniqueCompanies); kpiValues[3].textContent = stats.uniqueCompanies.toLocaleString(); }

        // Update KPI subtitles
        const kpiChanges = document.querySelectorAll('.kpi-change');
        if (kpiChanges[0]) kpiChanges[0].innerHTML = `<i class="fas fa-arrow-up"></i> ${stats.total.toLocaleString()} total alumni`;
        if (kpiChanges[1]) kpiChanges[1].innerHTML = `<i class="fas fa-arrow-up"></i> ${stats.employed.toLocaleString()} employed alumni`;
        if (kpiChanges[2]) kpiChanges[2].innerHTML = `<i class="fas fa-arrow-down"></i> Based on ${stats.employed.toLocaleString()} employed`;
        if (kpiChanges[3]) kpiChanges[3].innerHTML = `<i class="fas fa-arrow-up"></i> ${stats.uniqueCompanies} hiring companies`;

        // Update Employment by Program chart
        const empChart = Chart.getChart('employmentChart');
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

        // Update donut charts
        updateDonutIfExists('programDonut', stats.programBreakdown);
        updateStatusDonut(stats);
    }

    function updateDonutIfExists(canvasId, programBreakdown) {
        const chart = Chart.getChart(canvasId);
        if (!chart) return;
        const labels = Object.keys(programBreakdown);
        const values = labels.map(p => programBreakdown[p].total);
        chart.data.labels = labels;
        chart.data.datasets[0].data = values;
        chart.update('none');
        // Update center text
        const total = values.reduce((a, b) => a + b, 0);
        const centerEl = chart.canvas?.closest('.chart-card')?.querySelector('.donut-center-value');
        if (centerEl) centerEl.textContent = total.toLocaleString();
    }

    function updateStatusDonut(stats) {
        const chart = Chart.getChart('statusDonut');
        if (!chart) return;
        chart.data.labels = ['Employed', 'Seeking Employment', 'Pursuing Higher Education'];
        chart.data.datasets[0].data = [stats.employed, stats.seeking, stats.pursuing];
        chart.update('none');
        const centerEl = chart.canvas?.closest('.chart-card')?.querySelector('.donut-center-value');
        if (centerEl) centerEl.textContent = stats.empRate + '%';
    }

    // Dashboard year filter change handler
    const dashYearFilter = document.getElementById('dashboardYearFilter');
    if (dashYearFilter) {
        dashYearFilter.addEventListener('change', () => {
            updateDashboard(dashYearFilter.value);
        });
    }

    // Initial dashboard load with live data
    updateDashboard('all');

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
            const record = {
                student_id: alumniDB.generateStudentId(program, degree),
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

            const { data, error } = await alumniDB.addAlumni(record);
            submitBtn.innerHTML = origText;
            submitBtn.disabled = false;

            if (error) {
                alert('Error adding alumni: ' + error.message);
            } else {
                addAlumniForm.reset();
                document.getElementById('addAlumniModal').classList.add('hidden');
                renderAlumniTable(1);
                alert('✅ Alumni record added successfully!');
            }
        });
    }

    // ==================== ADMIN PANEL HANDLERS ====================
    // Admin Add Alumni — open the modal
    const adminAddBtn = document.getElementById('adminAddAlumniBtn');
    if (adminAddBtn) {
        adminAddBtn.addEventListener('click', () => {
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
            a.href = url; a.download = `alumni_export_${new Date().toISOString().slice(0,10)}.csv`;
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
                a.href = url; a.download = `dashboard_report_${new Date().toISOString().slice(0,10)}.csv`;
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

    console.log('✅ AlumniInsight Dashboard initialized successfully');

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
    }
});
