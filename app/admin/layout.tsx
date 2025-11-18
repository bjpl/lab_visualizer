import Link from 'next/link';
import { Shield, ImageIcon, BarChart3 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6" />
              <h1 className="text-xl font-bold">Admin Panel</h1>
            </div>
            <Link href="/" className="text-sm hover:underline">
              Back to App
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <nav className="flex gap-6">
            <Link
              href="/admin/annotations"
              className="py-4 px-2 border-b-2 border-transparent hover:border-blue-500 flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              Annotations
            </Link>
            <Link
              href="/admin/analytics"
              className="py-4 px-2 border-b-2 border-transparent hover:border-blue-500 flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Link>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
