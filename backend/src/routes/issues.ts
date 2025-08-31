import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { AuthenticatedRequest, authenticateToken, optionalAuth } from '../middleware/auth';
import { validateCreateIssue, validateUpdateIssue, handleValidationErrors } from '../middleware/validation';

const router = Router();

// Get all issues with optional filtering
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { 
      status, 
      category, 
      priority, 
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
      `);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (priority) {
      query = query.eq('priority', priority);
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

    // Manually fetch profile information for each issue
    let issuesWithProfiles = issues;
    if (issues && issues.length > 0) {
      const userIds = [...new Set(issues.map(issue => issue.user_id).filter(Boolean))];
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        issuesWithProfiles = issues.map(issue => ({
          ...issue,
          profiles: issue.user_id ? profileMap.get(issue.user_id) : null
        }));
      }
    }

    // If user is authenticated, check which issues they've upvoted
    let issuesWithUpvoteStatus = issuesWithProfiles;
    if (req.user && issuesWithProfiles) {
      const issueIds = issuesWithProfiles.map(issue => issue.id);
      const { data: upvotes } = await supabase
        .from('issue_upvotes')
        .select('issue_id')
        .eq('user_id', req.user.id)
        .in('issue_id', issueIds);

      const upvotedIssueIds = new Set(upvotes?.map(upvote => upvote.issue_id) || []);
      
      issuesWithUpvoteStatus = issuesWithProfiles.map(issue => ({
        ...issue,
        user_has_upvoted: upvotedIssueIds.has(issue.id),
        comments_count: issue.issue_comments?.length || 0
      }));
    } else {
      issuesWithUpvoteStatus = issuesWithProfiles?.map(issue => ({
        ...issue,
        user_has_upvoted: false,
        comments_count: issue.issue_comments?.length || 0
      })) || [];
    }

    res.json({
      success: true,
      data: issuesWithUpvoteStatus,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: issuesWithUpvoteStatus?.length || 0
      }
    });
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching issues'
    });
  }
});

// Get single issue by ID
router.get('/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: issue, error } = await supabase
      .from('civic_issues')
      .select(`
        *,
        issue_comments (
          id,
          content,
          created_at,
          user_id
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({
          success: false,
          error: 'Issue not found',
          message: 'The requested issue does not exist'
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: 'Database error',
        message: error.message
      });
      return;
    }

    // Manually fetch profile information for the issue and comments
    let issueWithProfiles = issue;
    if (issue) {
      // Fetch issue author profile
      if (issue.user_id) {
        const { data: authorProfile } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('user_id', issue.user_id)
          .single();
        
        issueWithProfiles = {
          ...issue,
          profiles: authorProfile
        };
      }

      // Fetch profiles for comments
      if (issue.issue_comments && issue.issue_comments.length > 0) {
        const commentUserIds = [...new Set(issue.issue_comments.map((comment: any) => comment.user_id).filter(Boolean))];
        
        if (commentUserIds.length > 0) {
          const { data: commentProfiles } = await supabase
            .from('profiles')
            .select('user_id, display_name, avatar_url')
            .in('user_id', commentUserIds);

          const profileMap = new Map(commentProfiles?.map(p => [p.user_id, p]) || []);
          
          issueWithProfiles.issue_comments = issue.issue_comments.map((comment: any) => ({
            ...comment,
            profiles: comment.user_id ? profileMap.get(comment.user_id) : null
          }));
        }
      }
    }

    // Check if user has upvoted this issue
    let userHasUpvoted = false;
    if (req.user) {
      const { data: upvote } = await supabase
        .from('issue_upvotes')
        .select('id')
        .eq('issue_id', id)
        .eq('user_id', req.user.id)
        .single();
      
      userHasUpvoted = !!upvote;
    }

    res.json({
      success: true,
      data: {
        ...issueWithProfiles,
        user_has_upvoted: userHasUpvoted
      }
    });
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching the issue'
    });
  }
});

// Create new issue
router.post('/', authenticateToken, validateCreateIssue, handleValidationErrors, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, category, priority = 'medium', location_description, location_coordinates } = req.body;

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    // Prepare location coordinates for PostGIS POINT format
    let locationPoint = null;
    if (location_coordinates && location_coordinates.lat && location_coordinates.lng) {
      locationPoint = `POINT(${location_coordinates.lng} ${location_coordinates.lat})`;
    }

    const { data: issue, error } = await supabase
      .from('civic_issues')
      .insert({
        user_id: req.user.id,
        title,
        description,
        category,
        priority,
        location_description,
        location_coordinates: locationPoint,
        status: 'pending',
        upvotes: 0
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Database error',
        message: error.message
      });
      return;
    }

    // Manually fetch profile information
    let issueWithProfile = issue;
    if (issue && req.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', req.user.id)
        .single();

      issueWithProfile = {
        ...issue,
        profiles: profile
      };
    }

    res.status(201).json({
      success: true,
      message: 'Issue created successfully',
      data: issueWithProfile
    });
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while creating the issue'
    });
  }
});

// Update issue (owner or admin only)
router.put('/:id', authenticateToken, validateUpdateIssue, handleValidationErrors, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    // Check if issue exists and user owns it
    const { data: existingIssue, error: fetchError } = await supabase
      .from('civic_issues')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        res.status(404).json({
          success: false,
          error: 'Issue not found',
          message: 'The requested issue does not exist'
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: 'Database error',
        message: fetchError.message
      });
      return;
    }

    if (existingIssue.user_id !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only update your own issues'
      });
      return;
    }

    const { data: updatedIssue, error } = await supabase
      .from('civic_issues')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      res.status(500).json({
        success: false,
        error: 'Database error',
        message: error.message
      });
      return;
    }

    // Manually fetch profile information
    let issueWithProfile = updatedIssue;
    if (updatedIssue && updatedIssue.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', updatedIssue.user_id)
        .single();

      issueWithProfile = {
        ...updatedIssue,
        profiles: profile
      };
    }

    res.json({
      success: true,
      message: 'Issue updated successfully',
      data: issueWithProfile
    });
  } catch (error) {
    console.error('Update issue error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while updating the issue'
    });
  }
});

// Delete issue (owner only)
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    // Check if issue exists and user owns it
    const { data: existingIssue, error: fetchError } = await supabase
      .from('civic_issues')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        res.status(404).json({
          success: false,
          error: 'Issue not found',
          message: 'The requested issue does not exist'
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: 'Database error',
        message: fetchError.message
      });
      return;
    }

    if (existingIssue.user_id !== req.user.id) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only delete your own issues'
      });
      return;
    }

    const { error } = await supabase
      .from('civic_issues')
      .delete()
      .eq('id', id);

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
      message: 'Issue deleted successfully'
    });
  } catch (error) {
    console.error('Delete issue error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while deleting the issue'
    });
  }
});

// Toggle upvote on issue
router.post('/:id/upvote', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
      return;
    }

    // Check if user has already upvoted
    const { data: existingUpvote } = await supabase
      .from('issue_upvotes')
      .select('id')
      .eq('issue_id', id)
      .eq('user_id', req.user.id)
      .single();

    if (existingUpvote) {
      // Remove upvote
      const { error: deleteError } = await supabase
        .from('issue_upvotes')
        .delete()
        .eq('id', existingUpvote.id);

      if (deleteError) {
        res.status(500).json({
          success: false,
          error: 'Database error',
          message: deleteError.message
        });
        return;
      }

      // Decrease upvote count
      const { error: updateError } = await supabase.rpc('decrement_upvotes', {
        issue_id: id
      });

      if (updateError) {
        console.error('Error decreasing upvote count:', updateError);
      }

      res.json({
        success: true,
        message: 'Upvote removed successfully',
        data: { upvoted: false }
      });
    } else {
      // Add upvote
      const { error: insertError } = await supabase
        .from('issue_upvotes')
        .insert({
          issue_id: id,
          user_id: req.user.id
        });

      if (insertError) {
        res.status(500).json({
          success: false,
          error: 'Database error',
          message: insertError.message
        });
        return;
      }

      // Increase upvote count
      const { error: updateError } = await supabase.rpc('increment_upvotes', {
        issue_id: id
      });

      if (updateError) {
        console.error('Error increasing upvote count:', updateError);
      }

      res.json({
        success: true,
        message: 'Upvote added successfully',
        data: { upvoted: true }
      });
    }
  } catch (error) {
    console.error('Toggle upvote error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while processing the upvote'
    });
  }
});

export default router;
