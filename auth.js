/* ================================================
   AlumniInsight — Authentication & Role-Based Access
   Manages login, registration, sessions, and RBAC
   ================================================ */

class AuthManager {
    constructor() {
        this.STORAGE_KEY = 'alumniInsight_users';
        this.SESSION_KEY = 'alumniInsight_session';
        this.REMEMBER_KEY = 'alumniInsight_remember';
        this.initializeStore();
    }

    // ==================== INITIALIZATION ====================
    async initializeStore() {
        const users = this.getUsers();
        if (users.length === 0) {
            // Seed default admin account
            const adminHash = await this.hashPassword('Admin@123');
            const admin = {
                id: this.generateId(),
                email: 'admin@alumniinsight.edu',
                passwordHash: adminHash,
                role: 'admin',
                fullName: 'System Administrator',
                personalEmail: 'admin@alumniinsight.edu',
                contactNumber: '+92-300-0000000',
                program: '',
                degree: '',
                graduationYear: '',
                company: '',
                jobTitle: '',
                cgpa: '',
                skills: [],
                bio: '',
                linkedIn: '',
                profileComplete: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Seed demo alumni account
            const alumniHash = await this.hashPassword('Alumni@123');
            const demoAlumni = {
                id: this.generateId() + '_demo',
                email: 'ahmed.k@university.edu',
                passwordHash: alumniHash,
                role: 'alumni',
                fullName: 'Ahmed Khan',
                personalEmail: 'ahmed.khan@gmail.com',
                contactNumber: '+92-321-5551234',
                program: 'ba',
                degree: 'bs',
                graduationYear: '2024',
                company: 'Systems Limited',
                jobTitle: 'Data Analyst',
                cgpa: '3.72',
                skills: ['Python', 'SQL', 'Power BI', 'Machine Learning'],
                bio: 'Business Analytics graduate passionate about data-driven decision making.',
                linkedIn: 'https://linkedin.com/in/ahmedkhan',
                profileComplete: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            this.saveUsers([admin, demoAlumni]);
        }

        // Check remembered session
        const remembered = localStorage.getItem(this.REMEMBER_KEY);
        if (remembered && !this.getCurrentSession()) {
            try {
                const data = JSON.parse(remembered);
                sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(data));
            } catch (e) {
                localStorage.removeItem(this.REMEMBER_KEY);
            }
        }
    }

    // ==================== PASSWORD HASHING ====================
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + '_alumniInsight_salt_2026');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // ==================== USER STORAGE ====================
    getUsers() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    saveUsers(users) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
    }

    findUserByEmail(email) {
        return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
    }

    findUserById(id) {
        return this.getUsers().find(u => u.id === id);
    }

    generateId() {
        return 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    }

    // ==================== AUTHENTICATION ====================
    async login(email, password, rememberMe = false) {
        const user = this.findUserByEmail(email);
        if (!user) {
            return { success: false, error: 'No account found with this email address.' };
        }

        const passwordHash = await this.hashPassword(password);
        if (user.passwordHash !== passwordHash) {
            return { success: false, error: 'Incorrect password. Please try again.' };
        }

        // Create session
        const session = {
            userId: user.id,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
            loginAt: new Date().toISOString()
        };

        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

        if (rememberMe) {
            localStorage.setItem(this.REMEMBER_KEY, JSON.stringify(session));
        }

        // Dispatch login event
        window.dispatchEvent(new CustomEvent('auth:login', { detail: { user, session } }));

        return { success: true, user, session };
    }

    async register(userData) {
        // Validate required fields
        const required = ['fullName', 'email', 'password', 'personalEmail', 'contactNumber'];
        for (const field of required) {
            if (!userData[field] || !userData[field].trim()) {
                return { success: false, error: `${this.fieldLabel(field)} is required.` };
            }
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            return { success: false, error: 'Please enter a valid university email address.' };
        }
        if (!emailRegex.test(userData.personalEmail)) {
            return { success: false, error: 'Please enter a valid personal email address.' };
        }

        // Validate phone number
        const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,20}$/;
        if (!phoneRegex.test(userData.contactNumber)) {
            return { success: false, error: 'Please enter a valid contact number.' };
        }

        // Check duplicate email
        if (this.findUserByEmail(userData.email)) {
            return { success: false, error: 'An account with this email already exists.' };
        }

        // Validate password strength
        const passwordCheck = this.validatePassword(userData.password);
        if (!passwordCheck.valid) {
            return { success: false, error: passwordCheck.error };
        }

        // Confirm password match
        if (userData.password !== userData.confirmPassword) {
            return { success: false, error: 'Passwords do not match.' };
        }

        // Create user
        const passwordHash = await this.hashPassword(userData.password);
        const newUser = {
            id: this.generateId(),
            email: userData.email.trim().toLowerCase(),
            passwordHash,
            role: userData.role || 'alumni',
            fullName: userData.fullName.trim(),
            personalEmail: userData.personalEmail.trim(),
            contactNumber: userData.contactNumber.trim(),
            program: userData.program || '',
            degree: userData.degree || '',
            graduationYear: userData.graduationYear || '',
            company: userData.company || '',
            jobTitle: userData.jobTitle || '',
            cgpa: userData.cgpa || '',
            skills: userData.skills || [],
            bio: userData.bio || '',
            linkedIn: userData.linkedIn || '',
            profileComplete: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const users = this.getUsers();
        users.push(newUser);
        this.saveUsers(users);

        window.dispatchEvent(new CustomEvent('auth:register', { detail: { user: newUser } }));

        return { success: true, user: newUser };
    }

    // Admin creates an account for someone
    async adminCreateUser(userData, adminSession) {
        if (!adminSession || adminSession.role !== 'admin') {
            return { success: false, error: 'Only administrators can create accounts.' };
        }

        // For admin-created users, set a default password
        const tempPassword = userData.password || 'Alumni@2026';
        userData.password = tempPassword;
        userData.confirmPassword = tempPassword;

        const result = await this.register(userData);
        if (result.success) {
            result.tempPassword = tempPassword;
        }
        return result;
    }

    logout() {
        const session = this.getCurrentSession();
        sessionStorage.removeItem(this.SESSION_KEY);
        localStorage.removeItem(this.REMEMBER_KEY);
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { session } }));
    }

    // ==================== SESSION MANAGEMENT ====================
    getCurrentSession() {
        try {
            const data = sessionStorage.getItem(this.SESSION_KEY);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    getCurrentUser() {
        const session = this.getCurrentSession();
        if (!session) return null;
        return this.findUserById(session.userId);
    }

    isLoggedIn() {
        return this.getCurrentSession() !== null;
    }

    isAdmin() {
        const session = this.getCurrentSession();
        return session && session.role === 'admin';
    }

    isAlumni() {
        const session = this.getCurrentSession();
        return session && session.role === 'alumni';
    }

    // ==================== PROFILE MANAGEMENT ====================
    async updateProfile(userId, updates) {
        const session = this.getCurrentSession();
        if (!session) return { success: false, error: 'Not authenticated.' };

        // Alumni can only update their own profile
        if (session.role === 'alumni' && session.userId !== userId) {
            return { success: false, error: 'You can only update your own profile.' };
        }

        const users = this.getUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index === -1) {
            return { success: false, error: 'User not found.' };
        }

        // Fields alumni can update about themselves
        const alumniEditableFields = [
            'fullName', 'personalEmail', 'contactNumber',
            'company', 'jobTitle', 'skills', 'bio', 'linkedIn'
        ];

        // Fields only admin can update
        const adminOnlyFields = ['role', 'email', 'program', 'degree', 'graduationYear', 'cgpa'];

        const updatedUser = { ...users[index] };
        for (const [key, value] of Object.entries(updates)) {
            if (key === 'passwordHash' || key === 'id' || key === 'createdAt') continue;

            if (session.role === 'alumni' && adminOnlyFields.includes(key)) {
                continue; // Skip admin-only fields for alumni
            }

            if (session.role === 'alumni' && !alumniEditableFields.includes(key)) {
                continue;
            }

            updatedUser[key] = value;
        }

        // Validate personal email if changed
        if (updates.personalEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(updates.personalEmail)) {
                return { success: false, error: 'Please enter a valid personal email.' };
            }
        }

        // Validate contact number if changed
        if (updates.contactNumber) {
            const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,20}$/;
            if (!phoneRegex.test(updates.contactNumber)) {
                return { success: false, error: 'Please enter a valid contact number.' };
            }
        }

        updatedUser.updatedAt = new Date().toISOString();
        users[index] = updatedUser;
        this.saveUsers(users);

        // Update session if it's the current user
        if (session.userId === userId) {
            session.fullName = updatedUser.fullName;
            session.email = updatedUser.email;
            sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        }

        return { success: true, user: updatedUser };
    }

    async changePassword(userId, currentPassword, newPassword) {
        const session = this.getCurrentSession();
        if (!session) return { success: false, error: 'Not authenticated.' };

        // Users can only change their own password (admin can change anyone's)
        if (session.role !== 'admin' && session.userId !== userId) {
            return { success: false, error: 'You can only change your own password.' };
        }

        const users = this.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return { success: false, error: 'User not found.' };

        // Verify current password (skip for admin changing another user's password)
        if (session.userId === userId || session.role !== 'admin') {
            const currentHash = await this.hashPassword(currentPassword);
            if (user.passwordHash !== currentHash) {
                return { success: false, error: 'Current password is incorrect.' };
            }
        }

        // Validate new password
        const passwordCheck = this.validatePassword(newPassword);
        if (!passwordCheck.valid) {
            return { success: false, error: passwordCheck.error };
        }

        user.passwordHash = await this.hashPassword(newPassword);
        user.updatedAt = new Date().toISOString();
        this.saveUsers(users);

        return { success: true };
    }

    async updateAdminCredentials(newEmail, currentPassword, newPassword) {
        const session = this.getCurrentSession();
        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Admin access required.' };
        }

        const users = this.getUsers();
        const admin = users.find(u => u.id === session.userId);
        if (!admin) return { success: false, error: 'Admin account not found.' };

        // Verify current password
        const currentHash = await this.hashPassword(currentPassword);
        if (admin.passwordHash !== currentHash) {
            return { success: false, error: 'Current password is incorrect.' };
        }

        // Update email if changed
        if (newEmail && newEmail !== admin.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(newEmail)) {
                return { success: false, error: 'Please enter a valid email address.' };
            }
            // Check if new email is already taken
            const existing = users.find(u => u.email.toLowerCase() === newEmail.toLowerCase() && u.id !== admin.id);
            if (existing) {
                return { success: false, error: 'This email is already in use.' };
            }
            admin.email = newEmail.toLowerCase();
        }

        // Update password if provided
        if (newPassword) {
            const passwordCheck = this.validatePassword(newPassword);
            if (!passwordCheck.valid) {
                return { success: false, error: passwordCheck.error };
            }
            admin.passwordHash = await this.hashPassword(newPassword);
        }

        admin.updatedAt = new Date().toISOString();
        this.saveUsers(users);

        // Update session
        session.email = admin.email;
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

        return { success: true };
    }

    // ==================== ACCESS CONTROL ====================
    canAccessPage(pageName) {
        const session = this.getCurrentSession();
        if (!session) return false;

        // Admin has full access
        if (session.role === 'admin') return true;

        // Alumni restricted pages
        const alumniAllowed = [
            'dashboard', 'alumni', 'predictor', 'employment',
            'skills', 'geographic', 'trends', 'programs', 'profile'
        ];
        return alumniAllowed.includes(pageName);
    }

    canEditAlumni(alumniId) {
        const session = this.getCurrentSession();
        if (!session) return false;
        if (session.role === 'admin') return true;
        return session.userId === alumniId; // Alumni can only edit themselves
    }

    canDeleteAlumni() {
        return this.isAdmin();
    }

    canViewPersonalData() {
        return this.isAdmin();
    }

    canAddAlumni() {
        return this.isAdmin();
    }

    canManageUsers() {
        return this.isAdmin();
    }

    // ==================== DATA PRIVACY ====================
    getAlumniForDisplay() {
        const users = this.getUsers();
        const session = this.getCurrentSession();
        const isAdmin = session && session.role === 'admin';

        return users
            .filter(u => u.role === 'alumni')
            .map(u => {
                const baseData = {
                    id: u.id,
                    fullName: u.fullName,
                    email: u.email,
                    program: u.program,
                    degree: u.degree,
                    graduationYear: u.graduationYear,
                    cgpa: u.cgpa,
                    company: u.company,
                    jobTitle: u.jobTitle,
                    skills: u.skills,
                    status: u.company && u.company !== '—' ? 'Employed' : 'Unemployed'
                };

                if (isAdmin) {
                    // Admin sees everything
                    baseData.personalEmail = u.personalEmail;
                    baseData.contactNumber = u.contactNumber;
                    baseData.createdAt = u.createdAt;
                    baseData.updatedAt = u.updatedAt;
                    baseData.profileComplete = u.profileComplete;
                }

                // Alumni can see their own personal data
                if (session && session.userId === u.id) {
                    baseData.personalEmail = u.personalEmail;
                    baseData.contactNumber = u.contactNumber;
                }

                return baseData;
            });
    }

    getAllUsersForAdmin() {
        if (!this.isAdmin()) return [];
        return this.getUsers().map(u => ({
            ...u,
            passwordHash: undefined // Never expose password hash
        }));
    }

    // ==================== VALIDATION HELPERS ====================
    validatePassword(password) {
        if (password.length < 8) {
            return { valid: false, error: 'Password must be at least 8 characters long.' };
        }
        if (!/[A-Z]/.test(password)) {
            return { valid: false, error: 'Password must contain at least one uppercase letter.' };
        }
        if (!/[0-9]/.test(password)) {
            return { valid: false, error: 'Password must contain at least one number.' };
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            return { valid: false, error: 'Password must contain at least one special character.' };
        }
        return { valid: true };
    }

    getPasswordStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
        if (password.length >= 16) score++;

        if (score <= 2) return { level: 'weak', label: 'Weak', color: '#f43f5e' };
        if (score <= 4) return { level: 'medium', label: 'Medium', color: '#f59e0b' };
        return { level: 'strong', label: 'Strong', color: '#10b981' };
    }

    fieldLabel(field) {
        const labels = {
            fullName: 'Full Name',
            email: 'Email',
            password: 'Password',
            personalEmail: 'Personal Email',
            contactNumber: 'Contact Number',
            program: 'Program',
            degree: 'Degree Level'
        };
        return labels[field] || field;
    }

    // ==================== USER STATS ====================
    getUserStats() {
        const users = this.getUsers();
        const alumni = users.filter(u => u.role === 'alumni');
        return {
            totalUsers: users.length,
            totalAlumni: alumni.length,
            totalAdmins: users.filter(u => u.role === 'admin').length,
            recentRegistrations: alumni.filter(u => {
                const d = new Date(u.createdAt);
                const now = new Date();
                return (now - d) < 7 * 24 * 60 * 60 * 1000; // Last 7 days
            }).length,
            profilesComplete: alumni.filter(u => u.profileComplete).length
        };
    }

    // ==================== ADMIN: DELETE USER ====================
    deleteUser(userId) {
        if (!this.isAdmin()) return { success: false, error: 'Admin access required.' };

        const session = this.getCurrentSession();
        if (session.userId === userId) {
            return { success: false, error: 'Cannot delete your own account.' };
        }

        const users = this.getUsers();
        const filtered = users.filter(u => u.id !== userId);
        if (filtered.length === users.length) {
            return { success: false, error: 'User not found.' };
        }
        this.saveUsers(filtered);
        return { success: true };
    }
}

// Create global instance
const authManager = new AuthManager();
