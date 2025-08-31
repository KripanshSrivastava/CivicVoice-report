import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// Register a new user
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, display_name } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Email and password are required'
      });
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: display_name || ''
        }
      }
    });

    if (error) {
      res.status(400).json({
        success: false,
        error: 'Registration failed',
        message: error.message
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: data.user,
        session: data.session
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred during registration'
    });
  }
});

// Sign in user
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: error.message
      });
      return;
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: data.user,
        session: data.session
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred during login'
    });
  }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      res.status(400).json({
        success: false,
        error: 'Missing refresh token',
        message: 'Refresh token is required'
      });
      return;
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (error) {
      res.status(401).json({
        success: false,
        error: 'Token refresh failed',
        message: error.message
      });
      return;
    }

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user: data.user,
        session: data.session
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred during token refresh'
    });
  }
});

// Sign out user
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      res.status(400).json({
        success: false,
        error: 'Logout failed',
        message: error.message
      });
      return;
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred during logout'
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    // Get user profile from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Profile fetch error:', error);
    }

    res.json({
      success: true,
      data: {
        id: req.user.id,
        email: req.user.email,
        profile: profile || null
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching user data'
    });
  }
});

export default router;
