import React, { createContext, useContext, useState, useEffect } from 'react';
import { tokenStore } from '../utils/tokenStore';
import { useToast } from '../hooks/useToast';

interface User {
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  apiCall: (path: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const API_BASE_URL = 'http://localhost:8000';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Helper for all authenticated API requests
  const apiCall = async (path: string, options: RequestInit = {}): Promise<Response> => {
    const url = `${API_BASE_URL}${path}`;
    const headers = new Headers(options.headers || {});
    
    // Add bearer token if present
    const token = tokenStore.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const mergedOptions: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // vital for sending HTTP-only cookies
    };

    let response = await fetch(url, mergedOptions);

    // If 401 Unauthorized, try to refresh token
    if (response.status === 401 && token) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          tokenStore.setToken(refreshData.access_token);
          
          // Retry the original request with the new token
          headers.set('Authorization', `Bearer ${refreshData.access_token}`);
          response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
          });
        } else {
          // Refresh failed, clear user
          tokenStore.clearToken();
          setUser(null);
        }
      } catch (err) {
        console.error('Error refreshing token:', err);
        tokenStore.clearToken();
        setUser(null);
      }
    }

    return response;
  };

  // Perform initial check on mount using /refresh to restore session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          tokenStore.setToken(data.access_token);
          
          // Parse user payload from token
          const payloadBase64 = data.access_token.split('.')[1];
          const decoded = JSON.parse(atob(payloadBase64));
          setUser({ email: decoded.sub, name: decoded.name || '' });
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed. Please check your credentials.');
      }

      const data = await response.json();
      tokenStore.setToken(data.access_token);
      
      // Parse payload
      const payloadBase64 = data.access_token.split('.')[1];
      const decoded = JSON.parse(atob(payloadBase64));
      setUser({ email: decoded.sub, name: decoded.name || '' });
      showToast('Logged in successfully!');
    } catch (err: any) {
      showToast(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (email: string, password: string, name: string = '') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed.');
      }

      showToast('Registration successful! Logging you in...');
      // Automatically log in after registration
      await login(email, password);
    } catch (err: any) {
      showToast(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      tokenStore.clearToken();
      setUser(null);
      showToast('Logged out successfully');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, apiCall }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
