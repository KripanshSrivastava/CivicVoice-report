export interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface CivicIssue {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  location_coordinates?: {
    lat: number;
    lng: number;
  };
  location_description?: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  image_url?: string;
  upvotes: number;
  created_at: string;
  updated_at: string;
}

export interface IssueComment {
  id: string;
  issue_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface IssueUpvote {
  id: string;
  issue_id: string;
  user_id: string;
  created_at: string;
}

export interface CreateIssueRequest {
  title: string;
  description: string;
  category: string;
  location_coordinates?: {
    lat: number;
    lng: number;
  };
  location_description?: string;
  priority?: 'low' | 'medium' | 'high';
  image?: Express.Multer.File;
}

export interface UpdateIssueRequest {
  title?: string;
  description?: string;
  category?: string;
  status?: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  priority?: 'low' | 'medium' | 'high';
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: User;
}
