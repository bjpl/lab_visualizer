'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Edit, AlertCircle } from 'lucide-react';

interface PendingAnnotation {
  id: string;
  image: {
    id: string;
    url: string;
    photographer: string;
  };
  description_basic: string;
  description_expanded: string;
  phrases: string[];
  confidence_score: number;
  color: {
    name_es: string;
    name_en: string;
    hex_code: string;
  };
}

export default function AnnotationsAdminPage() {
  const [annotations, setAnnotations] = useState<PendingAnnotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchPendingAnnotations();
  }, []);

  const fetchPendingAnnotations = async () => {
    try {
      const response = await fetch('/api/admin/annotations/pending');
      const data = await response.json();

      if (data.success) {
        setAnnotations(data.data);
      }
    } catch (error) {
      console.error('Error fetching annotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (annotationId: string) => {
    try {
      const response = await fetch('/api/admin/annotations/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annotationId,
          action: 'approve',
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Remove from list and move to next
        setAnnotations(prev => prev.filter(a => a.id !== annotationId));
        if (currentIndex >= annotations.length - 1) {
          setCurrentIndex(Math.max(0, currentIndex - 1));
        }
      }
    } catch (error) {
      console.error('Error approving annotation:', error);
    }
  };

  const handleReject = async (annotationId: string) => {
    const reason = prompt('Reason for rejection (optional):');

    try {
      const response = await fetch('/api/admin/annotations/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annotationId,
          action: 'reject',
          feedback: { rejectionReason: reason || 'No reason provided' },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAnnotations(prev => prev.filter(a => a.id !== annotationId));
        if (currentIndex >= annotations.length - 1) {
          setCurrentIndex(Math.max(0, currentIndex - 1));
        }
      }
    } catch (error) {
      console.error('Error rejecting annotation:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-6xl mb-4">🔄</div>
        <p className="text-gray-600">Loading pending annotations...</p>
      </div>
    );
  }

  if (annotations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Pending Annotations</CardTitle>
          <CardDescription>
            All annotations have been reviewed. New annotations will appear here as they are
            generated.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const current = annotations[currentIndex];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header Stats */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Review Annotations</h2>
        <p className="text-gray-600">
          {annotations.length} pending annotation{annotations.length !== 1 ? 's' : ''} ·
          Reviewing {currentIndex + 1} of {annotations.length}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / annotations.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Annotation */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Image Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Image</CardTitle>
            <CardDescription>
              Color: {current.color.name_es} ({current.color.name_en})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full aspect-video mb-4 rounded-lg overflow-hidden">
              <Image
                src={current.image.url}
                alt={`Image for ${current.color.name_es}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <p className="text-sm text-gray-600">📷 {current.image.photographer}</p>

            {/* Color Swatch */}
            <div className="mt-4 flex items-center gap-3">
              <div
                className="w-16 h-16 rounded-lg border-2 border-gray-300"
                style={{ backgroundColor: current.color.hex_code }}
              />
              <div>
                <div className="font-semibold">{current.color.name_es}</div>
                <div className="text-sm text-gray-600">{current.color.hex_code}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Annotation Content */}
        <Card>
          <CardHeader>
            <CardTitle>ML-Generated Content</CardTitle>
            <CardDescription>
              Confidence: {Math.round((current.confidence_score || 0) * 100)}%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Description */}
            <div>
              <h4 className="font-semibold text-sm text-gray-600 mb-1">Basic Description</h4>
              <p className="text-gray-900">{current.description_basic}</p>
            </div>

            {/* Expanded Description */}
            <div>
              <h4 className="font-semibold text-sm text-gray-600 mb-1">
                Expanded Description
              </h4>
              <p className="text-gray-900">{current.description_expanded}</p>
            </div>

            {/* Phrases */}
            {current.phrases && current.phrases.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-2">Example Phrases</h4>
                <ul className="space-y-1">
                  {current.phrases.map((phrase, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{phrase}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quality Indicator */}
            <div className="pt-4 border-t">
              {current.confidence_score >= 0.8 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">High confidence annotation</span>
                </div>
              ) : current.confidence_score >= 0.6 ? (
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Medium confidence - review carefully</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Low confidence - needs review</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button
          variant="outline"
          size="lg"
          onClick={() => handleReject(current.id)}
          className="px-8"
        >
          <XCircle className="w-5 h-5 mr-2" />
          Reject
        </Button>

        <Button
          variant="secondary"
          size="lg"
          onClick={() => {
            // In a full implementation, this would open an edit modal
            alert('Edit functionality would open a modal to edit the annotation');
          }}
          className="px-8"
        >
          <Edit className="w-5 h-5 mr-2" />
          Edit
        </Button>

        <Button
          variant="default"
          size="lg"
          onClick={() => handleApprove(current.id)}
          className="px-8 bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Approve
        </Button>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
        >
          ← Previous
        </Button>
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(prev => Math.min(annotations.length - 1, prev + 1))}
          disabled={currentIndex === annotations.length - 1}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
