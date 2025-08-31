import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import apiService from "@/services/api";

interface AuthUser {
  id: string;
  email: string;
  profile?: {
    display_name?: string;
    avatar_url?: string;
    phone?: string;
  };
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth token and validate it
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        try {
          apiService.setAuthToken(token);
          const userData = await apiService.getCurrentUser();
          
          if (userData.success) {
            setUser(userData.data);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('authToken');
            apiService.setAuthToken(null);
          }
        } catch (error) {
          console.error("Error validating auth token:", error);
          localStorage.removeItem('authToken');
          apiService.setAuthToken(null);
        }
      }
      
      setLoading(false);
    };

    checkAuthStatus();

    // Also keep the Supabase auth listener for direct Supabase operations
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Supabase auth state changed:", event, session?.user?.email);
        setSession(session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // When user signs in via Supabase, also check our backend
          try {
            const userData = await apiService.getCurrentUser();
            if (userData.success) {
              setUser(userData.data);
            }
          } catch (error) {
            console.error("Error syncing with backend:", error);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          apiService.setAuthToken(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Sign out from both backend and Supabase
      await Promise.all([
        apiService.logout().catch(() => {}), // Don't fail if backend logout fails
        supabase.auth.signOut()
      ]);
      
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error("Error during signout:", error);
    }
  };

  return {
    user,
    session,
    loading,
    signOut,
  };
};