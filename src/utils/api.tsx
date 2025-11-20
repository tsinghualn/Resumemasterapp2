import { projectId, publicAnonKey } from './supabase/info';

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-bc1c5df9`;

export class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.accessToken || publicAnonKey}`,
      ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`API Error [${endpoint}]:`, data);
      throw new Error(data.error || 'API request failed');
    }

    return data;
  }

  // Auth endpoints
  async signup(email: string, password: string, username?: string) {
    console.log('📤 Calling signup API with:', { email, username });
    const result = await this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    });
    console.log('📥 Signup API response:', result);
    return result;
  }

  async getUserByUsername(username: string) {
    return this.request(`/auth/username/${username}`);
  }

  async debugUser(emailOrUsername: string) {
    return this.request(`/auth/debug/${emailOrUsername}`);
  }

  async resetPassword(email: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async deleteUser(email: string) {
    const response = await fetch(`${BASE_URL}/auth/delete-user/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.accessToken || publicAnonKey}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Delete user error:', data);
      throw new Error(data.error || 'User deletion failed');
    }

    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Resume endpoints
  async createResume(resumeData: any) {
    return this.request('/resumes', {
      method: 'POST',
      body: JSON.stringify(resumeData),
    });
  }

  async getResumes() {
    return this.request('/resumes');
  }

  async getResume(id: string) {
    return this.request(`/resumes/${id}`);
  }

  async updateResume(id: string, updates: any) {
    return this.request(`/resumes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteResume(id: string) {
    return this.request(`/resumes/${id}`, {
      method: 'DELETE',
    });
  }

  async getResumeVersions(id: string) {
    return this.request(`/resumes/${id}/versions`);
  }

  // AI endpoints
  async optimizeSection(
    resumeSection: string, 
    jobDescription: string, 
    sectionType: string,
    industryTone?: string,
    rewriteStyle?: string
  ) {
    return this.request('/optimize', {
      method: 'POST',
      body: JSON.stringify({ 
        resumeSection, 
        jobDescription, 
        sectionType,
        industryTone,
        rewriteStyle
      }),
    });
  }

  async analyzeMatch(resume: any, jobDescription: string) {
    return this.request('/analyze-match', {
      method: 'POST',
      body: JSON.stringify({ resume, jobDescription }),
    });
  }

  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/upload-file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken || publicAnonKey}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('File upload error:', data);
      throw new Error(data.error || 'File upload failed');
    }

    return data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();