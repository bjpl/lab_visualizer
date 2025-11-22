/**
 * Login Page
 */

import LoginForm from '@/components/auth/LoginForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Login - LAB Visualization Platform',
  description: 'Sign in to your LAB Visualization account',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <LoginForm />
    </div>
  );
}
