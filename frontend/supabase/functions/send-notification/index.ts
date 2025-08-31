import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  issueId: string;
  type: 'status_update' | 'new_comment' | 'upvote_milestone';
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { issueId, type, message }: NotificationRequest = await req.json();

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get issue details
    const { data: issue, error: issueError } = await supabaseClient
      .from("civic_issues")
      .select("title, user_id, profiles(display_name)")
      .eq("id", issueId)
      .single();

    if (issueError) throw issueError;

    // Log notification (in a real app, you might send emails, push notifications, etc.)
    console.log(`📧 Notification for issue "${issue.title}":`, {
      type,
      message,
      user: issue.profiles?.display_name,
      timestamp: new Date().toISOString(),
    });

    // You could extend this to:
    // 1. Send emails using Resend
    // 2. Send push notifications
    // 3. Store notifications in a database table
    // 4. Send SMS notifications

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification sent successfully" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});