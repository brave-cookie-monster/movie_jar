// Vercel Serverless Function to securely serve environment variables to the client
export default function handler(req, res) {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.status(200).json({
        supabaseUrl: process.env.SUPABASE_URL || 'https://odpguhxozwwivaaandpw.supabase.co',
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
    });
}
