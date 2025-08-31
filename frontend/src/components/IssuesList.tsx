import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import apiService from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, MapPin, Calendar, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface CivicIssue {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  location_description: string | null;
  upvotes: number;
  created_at: string;
  profiles?: {
    display_name: string | null;
  } | null;
  issue_comments?: {
    id: string;
  }[];
  comments_count?: number;
  user_has_upvoted?: boolean;
}

export const IssuesList = () => {
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [useBackend, setUseBackend] = useState(false); // Temporarily start with Supabase due to RLS issues
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchIssues = async () => {
    try {
      setLoading(true);

      if (useBackend) {
        // Use backend API
        console.log("Fetching issues via Backend API...");
        const response = await apiService.getIssues({
          status: filter !== "all" ? filter : undefined,
          limit: 50,
          offset: 0,
        });

        if (response.success) {
          setIssues(response.data || []);
        } else {
          throw new Error(response.message || "Failed to fetch issues from backend");
        }
      } else {
        // Fallback to direct Supabase (original code)
        console.log("Fetching issues via Supabase...");
        let query = supabase
          .from("civic_issues")
          .select(`
            *,
            profiles (display_name),
            issue_comments (id)
          `)
          .order("created_at", { ascending: false });

        if (filter !== "all") {
          query = query.eq("status", filter);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Check if user has upvoted each issue
        if (user && data) {
          const issueIds = data.map(issue => issue.id);
          const { data: upvotes } = await supabase
            .from("issue_upvotes")
            .select("issue_id")
            .eq("user_id", user.id)
            .in("issue_id", issueIds);

          const upvotedIssueIds = new Set(upvotes?.map(upvote => upvote.issue_id) || []);
          
          const issuesWithUpvotes = data.map(issue => ({
            ...issue,
            user_has_upvoted: upvotedIssueIds.has(issue.id),
            comments_count: issue.issue_comments?.length || 0
          })) as unknown as CivicIssue[];
          
          setIssues(issuesWithUpvotes);
        } else {
          const formattedIssues = (data || []).map(issue => ({
            ...issue,
            comments_count: issue.issue_comments?.length || 0
          })) as unknown as CivicIssue[];
          setIssues(formattedIssues);
        }
      }
    } catch (error: any) {
      console.error("Error fetching issues:", error);
      
      // If backend fails, try fallback to Supabase
      if (useBackend) {
        console.warn("Backend fetch failed, falling back to Supabase...");
        setUseBackend(false);
        // Don't call fetchIssues recursively, just try again with the current parameters
        return;
      }

      toast({
        title: "Error loading issues",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [filter, user, useBackend]);

  const handleUpvote = async (issueId: string) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to upvote issues.",
        variant: "destructive",
      });
      return;
    }

    try {
      const issue = issues.find(i => i.id === issueId);
      if (!issue) return;

      if (useBackend) {
        // Use backend API for upvoting
        const response = await apiService.toggleUpvote(issueId);

        if (response.success) {
          setIssues(issues.map(i => 
            i.id === issueId 
              ? { 
                  ...i, 
                  upvotes: issue.user_has_upvoted ? i.upvotes - 1 : i.upvotes + 1,
                  user_has_upvoted: !issue.user_has_upvoted 
                }
              : i
          ));
        } else {
          throw new Error(response.message || "Failed to update upvote");
        }
      } else {
        // Fallback to direct Supabase
        if (issue.user_has_upvoted) {
          // Remove upvote
          await supabase
            .from("issue_upvotes")
            .delete()
            .eq("issue_id", issueId)
            .eq("user_id", user.id);

          await supabase
            .from("civic_issues")
            .update({ upvotes: issue.upvotes - 1 })
            .eq("id", issueId);
        } else {
          // Add upvote
          await supabase
            .from("issue_upvotes")
            .insert({ issue_id: issueId, user_id: user.id });

          await supabase
            .from("civic_issues")
            .update({ upvotes: issue.upvotes + 1 })
            .eq("id", issueId);
        }

        fetchIssues();
      }
    } catch (error: any) {
      console.error("Error handling upvote:", error);
      
      // If backend fails, try fallback
      if (useBackend) {
        console.warn("Backend upvote failed, falling back to Supabase...");
        setUseBackend(false);
        await handleUpvote(issueId);
        return;
      }

      toast({
        title: "Error",
        description: error.message || "Failed to update upvote",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
      case "in_progress": return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
      case "resolved": return "bg-green-500/20 text-green-700 dark:text-green-300";
      default: return "bg-gray-500/20 text-gray-700 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/20 text-red-700 dark:text-red-300";
      case "medium": return "bg-orange-500/20 text-orange-700 dark:text-orange-300";
      case "low": return "bg-green-500/20 text-green-700 dark:text-green-300";
      default: return "bg-gray-500/20 text-gray-700 dark:text-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Community Issues</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See what your neighbors are reporting and help prioritize community improvements.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {["all", "pending", "in_progress", "resolved"].map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status === "all" ? "All Issues" : status.replace("_", " ").toUpperCase()}
            </Button>
          ))}
        </div>

        {/* Issues list */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {issues.map((issue) => (
            <Card key={issue.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{issue.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{issue.location_description}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Badge className={getStatusColor(issue.status)}>
                    {issue.status.replace("_", " ")}
                  </Badge>
                  <Badge className={getPriorityColor(issue.priority)}>
                    {issue.priority}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {issue.category}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {issue.description}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpvote(issue.id)}
                      className={`flex items-center gap-1 ${
                        issue.user_has_upvoted ? "text-red-500" : ""
                      }`}
                    >
                      <Heart 
                        className={`h-4 w-4 ${issue.user_has_upvoted ? "fill-current" : ""}`} 
                      />
                      {issue.upvotes}
                    </Button>
                    
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MessageCircle className="h-4 w-4" />
                      {issue.comments_count || issue.issue_comments?.length || 0}
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {issue.profiles?.display_name || "Anonymous"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(issue.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {issues.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No issues found. Be the first to report one!</p>
          </div>
        )}
      </div>
    </section>
  );
};