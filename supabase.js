/* ================================================
   AlumniInsight — Supabase Client Module
   Connects to AlumniTrackingSystem Supabase project
   ================================================ */

const SUPABASE_URL = 'https://anxoxtavdydntwhavgdh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFueG94dGF2ZHlkbnR3aGF2Z2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNDQxNzcsImV4cCI6MjA5MzgyMDE3N30.gO17m6YHaK52iN8QaE7kte0jW9-87hKVdaB5b66nssE';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * AlumniDB — Helper class for Supabase alumni/companies operations
 */
class AlumniDB {
    constructor() {
        this.db = supabaseClient;
        this.pageSize = 16;
    }

    // ==================== ALUMNI QUERIES ====================

    /**
     * Fetch alumni with optional filters and pagination
     */
    async getAlumni(filters = {}, page = 1) {
        let query = this.db
            .from('alumni')
            .select('*, companies(company_name, industry_sector, company_type)', { count: 'exact' });

        // Apply filters
        if (filters.program && filters.program !== 'all') {
            query = query.eq('program', filters.program);
        }
        if (filters.degree && filters.degree !== 'all') {
            query = query.eq('degree_level', filters.degree);
        }
        if (filters.gradYear && filters.gradYear !== 'all') {
            query = query.eq('graduation_year', parseInt(filters.gradYear));
        }
        if (filters.status && filters.status !== 'all') {
            query = query.eq('employment_status', filters.status);
        }
        if (filters.search && filters.search.trim()) {
            query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,job_title.ilike.%${filters.search}%`);
        }

        // Pagination
        const from = (page - 1) * this.pageSize;
        const to = from + this.pageSize - 1;

        query = query
            .order('created_at', { ascending: false })
            .range(from, to);

        const { data, error, count } = await query;
        return { data: data || [], count: count || 0, error };
    }

    // ==================== DYNAMIC DASHBOARD STATS ====================

    /**
     * Get dynamic KPI stats from database, optionally filtered by year
     */
    async getDashboardStats(gradYear = 'all', program = 'all') {
        let query = this.db.from('alumni').select('employment_status, graduation_year, program, degree_level, cgpa, time_to_first_job, monthly_salary_range, company_id, company_name');
        if (gradYear && gradYear !== 'all') {
            query = query.eq('graduation_year', parseInt(gradYear));
        }
        if (program && program !== 'all') {
            query = query.eq('program', program);
        }
        const { data, error } = await query;
        if (error || !data) return { stats: null, error };

        const total = data.length;
        const employed = data.filter(a => a.employment_status === 'Employed').length;
        const seeking = data.filter(a => a.employment_status === 'Seeking Employment').length;
        const pursuing = data.filter(a => a.employment_status === 'Pursuing Higher Education').length;
        const empRate = total > 0 ? ((employed / total) * 100).toFixed(1) : '0.0';
        const avgTime = data.filter(a => a.time_to_first_job).reduce((s, a) => s + a.time_to_first_job, 0) / (data.filter(a => a.time_to_first_job).length || 1);
        
        // Count unique company IDs and names
        const companyNames = data.filter(a => a.company_name).map(a => a.company_name.trim().toLowerCase());
        const companyIds = data.filter(a => a.company_id).map(a => a.company_id);
        const uniqueCompanies = new Set([...companyNames, ...companyIds]).size;

        // Per-program breakdown
        const programs = {};
        data.forEach(a => {
            if (!a.program) return;
            if (!programs[a.program]) programs[a.program] = { total: 0, employed: 0 };
            programs[a.program].total++;
            if (a.employment_status === 'Employed') programs[a.program].employed++;
        });

        return {
            stats: {
                total, employed, seeking, pursuing, empRate,
                avgTimeToJob: avgTime.toFixed(1),
                uniqueCompanies,
                programBreakdown: programs
            },
            error: null
        };
    }

    /**
     * Insert a new alumni record
     */
    async addAlumni(alumniRecord) {
        const { data, error } = await this.db
            .from('alumni')
            .insert([alumniRecord])
            .select();
        return { data, error };
    }

    /**
     * Update an existing alumni record
     */
    async updateAlumni(studentId, updates) {
        const { data, error } = await this.db
            .from('alumni')
            .update(updates)
            .eq('student_id', studentId)
            .select();
        return { data, error };
    }

    /**
     * Delete an alumni record
     */
    async deleteAlumni(studentId) {
        const { data, error } = await this.db
            .from('alumni')
            .delete()
            .eq('student_id', studentId);
        return { data, error };
    }

    /**
     * Delete all alumni in a specific program
     */
    async deleteAlumniByProgram(program) {
        if (!program || program === 'all') return { error: { message: 'Please select a specific program' } };
        const { data, error } = await this.db
            .from('alumni')
            .delete()
            .eq('program', program);
        return { data, error };
    }

    /**
     * Get a single alumni by student_id
     */
    async getAlumniById(studentId) {
        const { data, error } = await this.db
            .from('alumni')
            .select('*, companies(company_name, industry_sector, company_type)')
            .eq('student_id', studentId)
            .single();
        return { data, error };
    }

    // ==================== COMPANIES QUERIES ====================

    async getCompanies() {
        const { data, error } = await this.db
            .from('companies')
            .select('*')
            .order('company_name');
        return { data: data || [], error };
    }

    async getCompanyById(id) {
        const { data, error } = await this.db
            .from('companies')
            .select('*')
            .eq('id', id)
            .single();
        return { data, error };
    }

    // ==================== AGGREGATION QUERIES ====================

    /**
     * Helper to fetch all distinct values for a given column by bypassing the 1000-row limit via pagination
     */
    async fetchDistinctValues(column) {
        let allData = [];
        let from = 0;
        const limit = 1000;

        while (true) {
            const { data, error } = await this.db
                .from('alumni')
                .select(column)
                .not(column, 'is', null)
                .range(from, from + limit - 1);

            if (error) return { data: [], error };
            if (!data || data.length === 0) break;

            allData = allData.concat(data);
            if (data.length < limit) break;
            from += limit;
        }

        const distinctValues = [...new Set(allData.map(r => r[column]))];
        return { data: distinctValues, error: null };
    }

    /**
     * Get distinct graduation years for filter dropdown
     */
    async getGraduationYears() {
        const { data, error } = await this.fetchDistinctValues('graduation_year');
        if (!error) data.sort((a, b) => b - a); // descending
        return { data, error };
    }

    /**
     * Get distinct programs for filter dropdown
     */
    async getPrograms() {
        const { data, error } = await this.fetchDistinctValues('program');
        if (!error) data.sort(); // ascending
        return { data, error };
    }

    /**
     * Get distinct employment statuses
     */
    async getEmploymentStatuses() {
        const { data, error } = await this.fetchDistinctValues('employment_status');
        if (!error) data.sort(); // ascending
        return { data, error };
    }

    /**
     * Export all alumni data as CSV string
     */
    async exportCSV(filters = {}) {
        // Fetch all matching records (no pagination)
        let query = this.db
            .from('alumni')
            .select('*, companies(company_name)');

        if (filters.program && filters.program !== 'all') {
            query = query.eq('program', filters.program);
        }
        if (filters.degree && filters.degree !== 'all') {
            query = query.eq('degree_level', filters.degree);
        }
        if (filters.gradYear && filters.gradYear !== 'all') {
            query = query.eq('graduation_year', parseInt(filters.gradYear));
        }
        if (filters.status && filters.status !== 'all') {
            query = query.eq('employment_status', filters.status);
        }

        query = query.order('full_name');
        const { data, error } = await query;

        if (error || !data) return { csv: '', error };

        // Build CSV
        const headers = ['Student ID', 'Full Name', 'Email', 'Phone', 'Program', 'Degree', 'Grad Year', 'CGPA', 'Employment Status', 'Company', 'Job Title', 'Salary Range'];
        const rows = data.map(a => [
            a.student_id,
            a.full_name,
            a.email,
            a.phone || '',
            a.program || '',
            a.degree_level || '',
            a.graduation_year || '',
            a.cgpa || '',
            a.employment_status || '',
            a.company_name || a.companies?.company_name || '',
            a.job_title || '',
            a.monthly_salary_range || '',
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

        const csv = [headers.join(','), ...rows].join('\n');
        return { csv, error: null };
    }

    /**
     * Generate next student_id
     */
    generateStudentId(program, degreeLevel) {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 9000) + 1000;
        return `${year}-FMS-${degreeLevel}-${random}`;
    }

    // ==================== FEEDBACK METHODS ====================

    async getFeedbacks() {
        const { data, error } = await this.db
            .from('student_feedbacks')
            .select('*')
            .order('created_at', { ascending: false });
        return { data: data || [], error };
    }

    async addFeedback(feedbackRecord) {
        const { data, error } = await this.db
            .from('student_feedbacks')
            .insert([feedbackRecord])
            .select();
        return { data, error };
    }

    // ==================== COMMUNITY POSTS METHODS ====================

    async getPosts() {
        const { data, error } = await this.db
            .from('community_posts')
            .select('*')
            .order('created_at', { ascending: false });
        return { data: data || [], error };
    }

    async addPost(postRecord) {
        const { data, error } = await this.db
            .from('community_posts')
            .insert([postRecord])
            .select();
        return { data, error };
    }

    async likePost(postId, currentLikes) {
        const { data, error } = await this.db
            .from('community_posts')
            .update({ likes: (currentLikes || 0) + 1 })
            .eq('id', postId)
            .select();
        return { data, error };
    }
}

// Global instance
const alumniDB = new AlumniDB();
console.log('✅ Supabase client initialized for AlumniTrackingSystem');
