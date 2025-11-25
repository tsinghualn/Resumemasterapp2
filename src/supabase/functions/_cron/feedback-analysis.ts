/**
 * Cron job configuration for daily feedback analysis
 * Runs at 10:00 PM PST (6:00 AM UTC next day)
 * 
 * PST is UTC-8, so 10 PM PST = 6 AM UTC next day
 * During PDT (daylight saving), it's UTC-7, so 10 PM PDT = 5 AM UTC next day
 * 
 * Using cron expression: 0 6 * * * (6 AM UTC daily)
 * 
 * Note: Supabase cron jobs use UTC timezone
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  try {
    console.log('⏰ Cron job triggered: Daily feedback analysis');
    
    // Call the analyze-feedback function
    const functionUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const response = await fetch(
      `${functionUrl}/functions/v1/analyze-feedback/analyze-feedback-cron`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const result = await response.json();
    
    console.log('✅ Cron job completed:', result);
    
    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Cron job failed:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});