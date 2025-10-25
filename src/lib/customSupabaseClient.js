import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gzfoxyinxkyjskxjysog.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6Zm94eWlueGt5anNreGp5c29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMTEwMDYsImV4cCI6MjA3MDc4NzAwNn0.XhHHztRpx5KoVCeM7si7I8agTHouTevm6iFKfG9RAWM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);