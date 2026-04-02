import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request) {
  // This endpoint should be triggered by a Cron service (like Vercel or a GitHub Action)
  // Secure it with a secret in the environment variables
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Call the SQL function we created earlier
    const { error } = await supabase.rpc('generate_monthly_dues');

    if (error) throw error;
    
    // Log the activity
    await supabase.from('audit_logs').insert({
      activity: 'SYSTEM_CRON_DUES_GENERATED',
      details: { timestamp: new Date(), message: 'Monthly dues processed successfully' }
    });

    return NextResponse.json({ success: true, message: 'Dues generated successfully' });
  } catch (err) {
    console.error('Cron Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
