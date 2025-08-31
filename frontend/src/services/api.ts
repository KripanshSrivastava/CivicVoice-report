// API configuration and service functions
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    // Get token from localStorage if it exists
    this.token = localStorage.getItem('authToken');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  setAuthToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Auth endpoints
  async register(userData: { email: string; password: string; display_name?: string }) {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await this.handleResponse(response);
    
    if (data.data?.session?.access_token) {
      this.setAuthToken(data.data.session.access_token);
    }
    
    return data;
  }

  async login(credentials: { email: string; password: string }) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
    });
    const data = await this.handleResponse(response);
    
    if (data.data?.session?.access_token) {
      this.setAuthToken(data.data.session.access_token);
    }
    
    return data;
  }

  async logout() {
    const response = await fetch(`${this.baseURL}/auth/logout`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    this.setAuthToken(null);
    return this.handleResponse(response);
  }

  async getCurrentUser() {
    const response = await fetch(`${this.baseURL}/auth/me`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Issues endpoints
  async getIssues(params?: {
    status?: string;
    category?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(`${this.baseURL}/issues?${searchParams}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getIssue(id: string) {
    const response = await fetch(`${this.baseURL}/issues/${id}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async createIssue(issueData: {
    title: string;
    description: string;
    category: string;
    priority?: string;
    location_description?: string;
    location_coordinates?: string | null;
    image_url?: string | null;
    user_id?: string;
  }) {
    const response = await fetch(`${this.baseURL}/issues`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(issueData),
    });
    return this.handleResponse(response);
  }

  async updateIssue(id: string, updateData: any) {
    const response = await fetch(`${this.baseURL}/issues/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updateData),
    });
    return this.handleResponse(response);
  }

  async toggleUpvote(issueId: string) {
    const response = await fetch(`${this.baseURL}/issues/${issueId}/upvote`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // User endpoints
  async getUserProfile() {
    const response = await fetch(`${this.baseURL}/users/profile`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateUserProfile(profileData: {
    display_name?: string;
    phone?: string;
    avatar_url?: string;
  }) {
    const response = await fetch(`${this.baseURL}/users/profile`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(profileData),
    });
    return this.handleResponse(response);
  }

  async getUserIssues() {
    const response = await fetch(`${this.baseURL}/users/issues`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async getUserStats() {
    const response = await fetch(`${this.baseURL}/users/stats`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Health check
  async healthCheck() {
    const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
    return this.handleResponse(response);
  }
}

export const apiService = new ApiService();
export default apiService;
