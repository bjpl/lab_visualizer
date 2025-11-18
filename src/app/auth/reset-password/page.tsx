/**
 * Reset Password Page
 */

import ResetPassword from '@/components/auth/ResetPassword';

export const metadata = {
  title: 'Reset Password - LAB Visualization Platform',
  description: 'Reset your account password',
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <ResetPassword mode="request" />
    </div>
  );
}
