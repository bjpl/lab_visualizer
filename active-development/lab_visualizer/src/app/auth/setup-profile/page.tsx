/**
 * Profile Setup Page
 * For users who authenticated via OAuth but don't have a profile yet
 */

'use client';

import { useRouter } from 'next/navigation';
import type React from 'react';
import { useState, useEffect } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { authService } from '@/services/auth-service';

type UserRole = 'student' | 'educator' | 'researcher';

export default function SetupProfilePage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    role: 'student' as UserRole,
    institution: '',
    bio: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Pre-fill display name from user metadata if available
    if (user.user_metadata?.full_name) {
      setFormData((prev) => ({
        ...prev,
        displayName: user.user_metadata.full_name,
      }));
    }
  }, [user, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = (): string | null => {
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(formData.username)) {
      return 'Username must be 3-30 characters and contain only letters, numbers, hyphens, and underscores';
    }

    if (formData.displayName.length < 2) {
      return 'Display name must be at least 2 characters';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user) {
      setError('Not authenticated');
      return;
    }

    setLoading(true);

    try {
      // Create user profile
      const { error: profileError } = await authService.getClient()
        .from('user_profiles')
        .insert({
          id: user.id,
          username: formData.username,
          display_name: formData.displayName,
          role: formData.role,
          institution: formData.institution || null,
          bio: formData.bio || null,
        });

      if (profileError) {
        setError(profileError.message || 'Failed to create profile');
        return;
      }

      // Refresh profile in context
      await refreshProfile();

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete your profile</h1>
          <p className="text-gray-600">Just a few more details to get started</p>
        </div>

        {error && (
          <div className="error-message bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                required
                className="input-field w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="username"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                3-30 characters, letters, numbers, hyphens, and underscores only
              </p>
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium mb-2">
                Display Name
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                value={formData.displayName}
                onChange={handleChange}
                required
                className="input-field w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your Name"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium mb-2">
                I am a...
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="input-field w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="student">Student</option>
                <option value="educator">Educator</option>
                <option value="researcher">Researcher</option>
              </select>
            </div>

            <div>
              <label htmlFor="institution" className="block text-sm font-medium mb-2">
                Institution (Optional)
              </label>
              <input
                id="institution"
                name="institution"
                type="text"
                value={formData.institution}
                onChange={handleChange}
                className="input-field w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="University or Organization"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium mb-2">
                Bio (Optional)
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="input-field w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tell us about yourself..."
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Creating profile...' : 'Complete setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
