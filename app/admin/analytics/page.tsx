'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  TrendingUp,
  Database,
} from 'lucide-react';

export default function AnalyticsAdminPage() {
  // Mock data - replace with actual API calls
  const stats = {
    totalUsers: 156,
    totalImages: 324,
    approvedAnnotations: 289,
    pendingAnnotations: 35,
    averageConfidence: 87,
    totalColors: 36,
    basicColors: 12,
    expandedColors: 24,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Analytics Dashboard</h2>
        <p className="text-gray-600">Overview of system performance and content</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Active learners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalImages}</div>
            <p className="text-xs text-muted-foreground">From Unsplash</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedAnnotations}</div>
            <p className="text-xs text-muted-foreground">Ready for learning</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingAnnotations}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Annotation Quality</CardTitle>
            <CardDescription>AI confidence scores for annotations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Average Confidence</span>
                  <span className="text-sm font-bold">{stats.averageConfidence}%</span>
                </div>
                <Progress value={stats.averageConfidence} className="h-2" />
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">High Confidence (80%+)</span>
                  <span className="font-semibold">245</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Medium Confidence (60-80%)</span>
                  <span className="font-semibold">58</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Low Confidence (&lt;60%)</span>
                  <span className="font-semibold">21</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Color Coverage</CardTitle>
            <CardDescription>Distribution across basic and expanded levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Basic Colors</span>
                  <span className="text-sm">{stats.basicColors} colors</span>
                </div>
                <Progress
                  value={(stats.basicColors / stats.totalColors) * 100}
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Expanded Colors</span>
                  <span className="text-sm">{stats.expandedColors} colors</span>
                </div>
                <Progress
                  value={(stats.expandedColors / stats.totalColors) * 100}
                  className="h-2"
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>All colors have images and annotations</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">✓</div>
              <div className="text-sm font-medium">Database</div>
              <div className="text-xs text-gray-600">Healthy</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">✓</div>
              <div className="text-sm font-medium">ML Worker</div>
              <div className="text-xs text-gray-600">Processing</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">✓</div>
              <div className="text-sm font-medium">API Services</div>
              <div className="text-xs text-gray-600">Online</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
