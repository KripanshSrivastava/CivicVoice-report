import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SummaryRequest {
  timeframe?: 'day' | 'week' | 'month';
  category?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { timeframe = 'week', category }: SummaryRequest = await req.json();

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    // Build query
    let query = supabaseClient
      .from("civic_issues")
      .select(`
        id,
        title,
        description,
        category,
        status,
        priority,
        upvotes,
        created_at,
        issue_comments(count)
      `)
      .gte("created_at", startDate.toISOString());

    if (category) {
      query = query.eq("category", category);
    }

    const { data: issues, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    // Generate summary statistics
    const summary = {
      timeframe,
      total_issues: issues.length,
      by_status: issues.reduce((acc, issue) => {
        acc[issue.status] = (acc[issue.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_category: issues.reduce((acc, issue) => {
        acc[issue.category] = (acc[issue.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_priority: issues.reduce((acc, issue) => {
        acc[issue.priority] = (acc[issue.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      total_upvotes: issues.reduce((sum, issue) => sum + issue.upvotes, 0),
      top_issues: issues
        .sort((a, b) => b.upvotes - a.upvotes)
        .slice(0, 5)
        .map(issue => ({
          id: issue.id,
          title: issue.title,
          upvotes: issue.upvotes,
          status: issue.status,
          category: issue.category,
        })),
      date_range: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        summary 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Error in generate-issue-summary function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});