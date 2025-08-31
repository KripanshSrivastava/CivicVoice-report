import { Router, Response } from 'express';
import { supabase } from '../services/supabase';
import { AuthenticatedRequest, authenticateToken } from '../middleware/auth';
import { validateUpdateProfile, handleValidationErrors } from '../middleware/validation';

const router = Router();

// Get user profile
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      res.status(500).json({
        success: false,
        error: 'Database error',
        message: error.message
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: req.user.id,
        email: req.user.email,
        profile: profile || {
          user_id: req.user.id,
          display_name: null,
          avatar_url: null,
          phone: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching profile'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, validateUpdateProfile, handleValidationErrors, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const { display_name, phone, avatar_url } = req.body;
    
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    let profileData;
    let error;

    if (existingProfile) {
      // Update existing profile
      const result = await supabase
        .from('profiles')
        .update({
          display_name,
          phone,
          avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', req.user.id)
        .select()
        .single();
      
      profileData = result.data;
      error = result.error;
    } else {
      // Create new profile
      const result = await supabase
        .from('profiles')
        .insert({
          user_id: req.user.id,
          display_name,
          phone,
          avatar_url
        })
        .select()
        .single();
      
      profileData = result.data;
      error = result.error;
    }

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Database error',
        message: error.message
      });
      return;
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profileData
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while updating profile'
    });
  }
});

// Get user's issues
router.get('/issues', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const { 
      status, 
      limit = '20', 
      offset = '0',
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    let query = supabase
      .from('civic_issues')
      .select(`
        *,
        issue_comments (id)
      `)
      .eq('user_id', req.user.id);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply sorting
    query = query.order(sortBy as string, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    query = query.range(offsetNum, offsetNum + limitNum - 1);

    const { data: issues, error } = await query;

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Database error',
        message: error.message
      });
      return;
    }

    const issuesWithCommentCount = issues?.map(issue => ({
      ...issue,
      comments_count: issue.issue_comments?.length || 0
    })) || [];

    res.json({
      success: true,
      data: issuesWithCommentCount,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: issuesWithCommentCount.length
      }
    });
  } catch (error) {
    console.error('Get user issues error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching user issues'
    });
  }
});

// Get user's upvoted issues
router.get('/upvoted', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    const { 
      limit = '20', 
      offset = '0' 
    } = req.query;

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    const { data: upvotedIssues, error } = await supabase
      .from('issue_upvotes')
      .select(`
        created_at,
        civic_issues (
          *,
          profiles (display_name, avatar_url),
          issue_comments (id)
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offsetNum, offsetNum + limitNum - 1);

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Database error',
        message: error.message
      });
      return;
    }

    const formattedIssues = upvotedIssues?.map(upvote => {
      const issue = upvote.civic_issues as any;
      return {
        ...issue,
        comments_count: issue?.issue_comments?.length || 0,
        upvoted_at: upvote.created_at
      };
    }) || [];

    res.json({
      success: true,
      data: formattedIssues,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: formattedIssues.length
      }
    });
  } catch (error) {
    console.error('Get upvoted issues error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching upvoted issues'
    });
  }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    // Get issue counts by status
    const { data: issueStats, error: issueError } = await supabase
      .from('civic_issues')
      .select('status')
      .eq('user_id', req.user.id);

    if (issueError) {
      res.status(500).json({
        success: false,
        error: 'Database error',
        message: issueError.message
      });
      return;
    }

    // Get upvote count
    const { count: upvoteCount, error: upvoteError } = await supabase
      .from('issue_upvotes')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id);

    if (upvoteError) {
      console.error('Error fetching upvote count:', upvoteError);
    }

    // Get comment count
    const { count: commentCount, error: commentError } = await supabase
      .from('issue_comments')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id);

    if (commentError) {
      console.error('Error fetching comment count:', commentError);
    }

    // Calculate statistics
    const stats = {
      total_issues: issueStats?.length || 0,
      pending_issues: issueStats?.filter(issue => issue.status === 'pending').length || 0,
      in_progress_issues: issueStats?.filter(issue => issue.status === 'in_progress').length || 0,
      resolved_issues: issueStats?.filter(issue => issue.status === 'resolved').length || 0,
      rejected_issues: issueStats?.filter(issue => issue.status === 'rejected').length || 0,
      total_upvotes: upvoteCount || 0,
      total_comments: commentCount || 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching user statistics'
    });
  }
});

export default router;
