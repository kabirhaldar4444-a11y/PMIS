import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ziaonlzktgmgizkmspkh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYW9ubHprdGdtZ2l6a21zcGtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjA2MzAsImV4cCI6MjA5MTMzNjYzMH0.6Q0ZAiO-6HnaqjPWHlrLInkzfw59CAkUZrW5LdqX2rA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getAdmins() {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('full_name, email, role')
            .in('role', ['super_admin', 'admin', 'staff']);
        
        if (error) {
            console.error('Error fetching admins:', error.message);
            return;
        }

        if (!data || data.length === 0) {
            console.log('No admins found.');
            return;
        }

        console.log('\n--- ADMIN LIST ---');
        data.forEach(p => {
            const roleName = p.role.replace('_', ' ').toUpperCase();
            console.log(`[${roleName}] ${p.full_name} <${p.email}>`);
        });
        console.log('------------------\n');
    } catch (e) {
        console.error('Fatal error:', e.message);
    }
}

getAdmins();
