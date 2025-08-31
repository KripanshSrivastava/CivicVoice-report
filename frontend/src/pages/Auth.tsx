import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import apiService from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResendEmail, setShowResendEmail] = useState(false);
  const [useBackend, setUseBackend] = useState(true); // Toggle between backend and Supabase
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already authenticated
    const checkUser = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        navigate("/");
        return;
      }
      
      // Also check Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log(`Attempting to sign in with ${useBackend ? 'Backend API' : 'Supabase'}:`, email);
      
      if (useBackend) {
        // Use backend API
        const data = await apiService.login({ email, password });
        
        if (data.success) {
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in via Backend API.",
          });
          navigate("/");
        }
      } else {
        // Use Supabase directly (fallback)
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error("Supabase sign in error:", error);
          throw error;
        }

        console.log("Supabase sign in successful:", data);

        if (data.user) {
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in via Supabase.",
          });
          navigate("/");
        }
      }
    } catch (error: any) {
      console.error("Sign in failed:", error);
      
      // If backend fails, try Supabase as fallback
      if (useBackend) {
        console.log("Backend login failed, trying Supabase fallback...");
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          if (data.user) {
            toast({
              title: "Welcome back!",
              description: "You have successfully signed in via Supabase (fallback).",
            });
            navigate("/");
            return;
          }
        } catch (supabaseError: any) {
          console.error("Supabase fallback also failed:", supabaseError);
        }
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to sign in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log(`Attempting to sign up with ${useBackend ? 'Backend API' : 'Supabase'}:`, email, displayName);
      
      if (useBackend) {
        // Use backend API
        const data = await apiService.register({
          email,
          password,
          display_name: displayName,
        });
        
        if (data.success) {
          toast({
            title: "Account created successfully!",
            description: "You are now signed in via Backend API.",
          });
          navigate("/");
          return;
        }
      } else {
        // Use Supabase directly (fallback)
        const redirectUrl = `${window.location.origin}/`;
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              display_name: displayName,
            },
          },
        });

        if (error) {
          console.error("Supabase sign up error:", error);
          throw error;
        }

        console.log("Supabase sign up successful:", data);

        if (data.user) {
          // Check if email confirmation is disabled (user is immediately confirmed)
          if (data.user.email_confirmed_at || !data.user.identities || data.user.identities.length === 0) {
            console.log("User confirmed immediately, attempting auto sign-in");
            toast({
              title: "Account created successfully!",
              description: "You are now signed in via Supabase.",
            });
            
            // Try to sign in automatically
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            
            if (!signInError) {
              navigate("/");
              return;
            } else {
              console.log("Auto sign-in failed, user needs to sign in manually");
              toast({
                title: "Account created!",
                description: "Please sign in with your new credentials.",
              });
            }
          } else {
            // Email confirmation is required
            console.log("Email confirmation required");
            setShowResendEmail(true);
            toast({
              title: "Account created!",
              description: "Please check your email to verify your account before signing in.",
            });
          }
        }
      }
    } catch (error: any) {
      console.error("Sign up failed:", error);
      
      // If backend fails, try Supabase as fallback
      if (useBackend) {
        console.log("Backend signup failed, trying Supabase fallback...");
        try {
          const redirectUrl = `${window.location.origin}/`;
          
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: redirectUrl,
              data: {
                display_name: displayName,
              },
            },
          });

          if (error) throw error;

          if (data.user) {
            toast({
              title: "Account created successfully!",
              description: "Account created via Supabase (fallback).",
            });
            setShowResendEmail(true);
            return;
          }
        } catch (supabaseError: any) {
          console.error("Supabase fallback also failed:", supabaseError);
        }
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      toast({
        title: "Confirmation email sent!",
        description: "Please check your email inbox and spam folder.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Reset email sent!",
        description: "Please check your email for password reset instructions.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      // Test backend connection
      const backendResponse = await apiService.healthCheck();
      console.log("Backend connection test:", backendResponse);
      
      if (backendResponse.status === 'OK') {
        toast({
          title: "✅ Backend Connected!",
          description: `Backend is running: ${backendResponse.message}`,
        });
      } else {
        throw new Error("Backend health check failed");
      }
    } catch (error: any) {
      console.error("Backend connection test failed:", error);
      
      // Test Supabase connection as fallback
      try {
        const { data, error: supabaseError } = await supabase.from('civic_issues').select('count').limit(1);
        console.log("Supabase connection test:", { data, error: supabaseError });
        
        if (supabaseError) {
          toast({
            title: "❌ Both Connections Failed",
            description: `Backend: ${error.message}. Supabase: ${supabaseError.message}`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "⚠️ Backend Down, Supabase OK",
            description: "Backend is unavailable, but Supabase is connected. Using Supabase fallback.",
            variant: "destructive",
          });
        }
      } catch (supabaseError: any) {
        toast({
          title: "❌ Total Connection Failure",
          description: "Both Backend and Supabase are unavailable.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Civic Connect</CardTitle>
          <CardDescription>
            Join your community in reporting and solving civic issues
          </CardDescription>
          {/* Development Test Button */}
          {import.meta.env.DEV && (
            <div className="mt-2 space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={testConnection}
                className="w-full"
              >
                Test Backend Connection
              </Button>
              <div className="flex items-center justify-center space-x-2 text-sm">
                <span>Using:</span>
                <Button
                  variant={useBackend ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseBackend(!useBackend)}
                  className="text-xs px-2 py-1"
                >
                  {useBackend ? "Backend API" : "Supabase Direct"}
                </Button>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-primary hover:underline"
                    disabled={loading}
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Display Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Choose a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign Up
                </Button>
                {showResendEmail && (
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Didn't receive the confirmation email?
                    </p>
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      className="text-sm text-primary hover:underline"
                      disabled={loading}
                    >
                      Resend confirmation email
                    </button>
                  </div>
                )}
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;