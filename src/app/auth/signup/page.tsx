/**
 * Signup Page
 */

import SignupForm from '@/components/auth/SignupForm';

export const metadata = {
  title: 'Sign Up - LAB Visualization Platform',
  description: 'Create your LAB Visualization account',
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <SignupForm />
    </div>
  );
}
