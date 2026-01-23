import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are not set. Database features will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database helper functions
export const db = {
    // Users
    async createUser(userData: {
        id: string;
        fullName: string;
        email: string;
        phone: string;
        password: string; // In production, this should be hashed
        timestamp: string;
    }) {
        if (!supabaseUrl || !supabaseAnonKey) {
            // Fallback to localStorage if Supabase not configured
            if (typeof window !== 'undefined') {
                const users = JSON.parse(localStorage.getItem('propReady_users') || '[]');
                users.push(userData);
                localStorage.setItem('propReady_users', JSON.stringify(users));
            }
            return { data: userData, error: null };
        }

        // Convert camelCase to snake_case for database
        const dbUserData = {
            id: userData.id,
            full_name: userData.fullName,
            email: userData.email,
            phone: userData.phone,
            password: userData.password,
            created_at: userData.timestamp,
            updated_at: userData.timestamp
        };

        const { data, error } = await supabase
            .from('users')
            .insert([dbUserData])
            .select()
            .single();

        if (error) {
            console.error('Supabase createUser error:', error);
        }

        return { data, error };
    },

    async getUserByEmail(email: string) {
        if (!supabaseUrl || !supabaseAnonKey) {
            // Fallback to localStorage
            if (typeof window !== 'undefined') {
                const users = JSON.parse(localStorage.getItem('propReady_users') || '[]');
                return { data: users.find((u: any) => u.email === email) || null, error: null };
            }
            return { data: null, error: null };
        }

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        return { data, error };
    },

    async updateUser(userId: string, updates: any) {
        if (!supabaseUrl || !supabaseAnonKey) {
            // Fallback to localStorage
            if (typeof window !== 'undefined') {
                const users = JSON.parse(localStorage.getItem('propReady_users') || '[]');
                const index = users.findIndex((u: any) => u.id === userId);
                if (index !== -1) {
                    users[index] = { ...users[index], ...updates };
                    localStorage.setItem('propReady_users', JSON.stringify(users));
                }
            }
            return { data: null, error: null };
        }

        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        return { data, error };
    },

    // Quiz Results
    async saveQuizResult(quizData: any) {
        if (!supabaseUrl || !supabaseAnonKey) {
            // Fallback to localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('propReady_quizResult', JSON.stringify(quizData));
            }
            return { data: quizData, error: null };
        }

        const { data, error } = await supabase
            .from('quiz_results')
            .insert([quizData])
            .select()
            .single();

        return { data, error };
    },

    async getQuizResult(userId: string) {
        if (!supabaseUrl || !supabaseAnonKey) {
            // Fallback to localStorage
            if (typeof window !== 'undefined') {
                const result = localStorage.getItem('propReady_quizResult');
                return { data: result ? JSON.parse(result) : null, error: null };
            }
            return { data: null, error: null };
        }

        const { data, error } = await supabase
            .from('quiz_results')
            .select('*')
            .eq('id', userId)
            .single();

        return { data, error };
    },

    // Agents
    async createAgent(agentData: any) {
        if (!supabaseUrl || !supabaseAnonKey) {
            // Fallback to localStorage
            if (typeof window !== 'undefined') {
                const agents = JSON.parse(localStorage.getItem('propReady_agents') || '[]');
                agents.push(agentData);
                localStorage.setItem('propReady_agents', JSON.stringify(agents));
            }
            return { data: agentData, error: null };
        }

        // Convert camelCase to snake_case for database
        const dbAgentData = {
            id: agentData.id,
            full_name: agentData.fullName,
            email: agentData.email,
            phone: agentData.phone,
            eaab_number: agentData.eaabNumber,
            company: agentData.company,
            password: agentData.password,
            status: agentData.status || 'pending',
            created_at: agentData.timestamp || new Date().toISOString(),
            updated_at: agentData.timestamp || new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('agents')
            .insert([dbAgentData])
            .select()
            .single();

        if (error) {
            console.error('Supabase createAgent error:', error);
        }

        return { data, error };
    },

    async getAgentByEmail(email: string) {
        if (!supabaseUrl || !supabaseAnonKey) {
            // Fallback to localStorage
            if (typeof window !== 'undefined') {
                const agents = JSON.parse(localStorage.getItem('propReady_agents') || '[]');
                return { data: agents.find((a: any) => a.email === email) || null, error: null };
            }
            return { data: null, error: null };
        }

        const { data, error } = await supabase
            .from('agents')
            .select('*')
            .eq('email', email)
            .single();

        return { data, error };
    },

    // Documents
    async saveDocuments(userId: string, documents: any[]) {
        if (!supabaseUrl || !supabaseAnonKey) {
            // Fallback to localStorage
            if (typeof window !== 'undefined') {
                localStorage.setItem('propReady_documents', JSON.stringify(documents));
            }
            return { data: documents, error: null };
        }

        const { data, error } = await supabase
            .from('documents')
            .upsert(documents.map(doc => ({ ...doc, user_id: userId })))
            .select();

        return { data, error };
    },

    async getDocuments(userId: string) {
        if (!supabaseUrl || !supabaseAnonKey) {
            // Fallback to localStorage
            if (typeof window !== 'undefined') {
                const docs = localStorage.getItem('propReady_documents');
                return { data: docs ? JSON.parse(docs) : [], error: null };
            }
            return { data: [], error: null };
        }

        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', userId);

        return { data, error };
    },

    // Properties
    async saveProperty(propertyData: any) {
        if (!supabaseUrl || !supabaseAnonKey) {
            // Fallback to localStorage
            if (typeof window !== 'undefined') {
                const properties = JSON.parse(localStorage.getItem('propReady_properties') || '[]');
                properties.push(propertyData);
                localStorage.setItem('propReady_properties', JSON.stringify(properties));
            }
            return { data: propertyData, error: null };
        }

        const { data, error } = await supabase
            .from('properties')
            .insert([propertyData])
            .select()
            .single();

        return { data, error };
    },

    async getProperties(agentId?: string) {
        if (!supabaseUrl || !supabaseAnonKey) {
            // Fallback to localStorage
            if (typeof window !== 'undefined') {
                const properties = JSON.parse(localStorage.getItem('propReady_properties') || '[]');
                if (agentId) {
                    return { data: properties.filter((p: any) => p.agentId === agentId), error: null };
                }
                return { data: properties, error: null };
            }
            return { data: [], error: null };
        }

        let query = supabase.from('properties').select('*');
        if (agentId) {
            query = query.eq('agent_id', agentId);
        }

        const { data, error } = await query;

        return { data, error };
    }
};
