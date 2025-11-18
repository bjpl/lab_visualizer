/**
 * AnnotationTools component - Real-time annotation system
 * Add, edit, delete, and sync annotations on molecular structures
 */
'use client';

import React, { useState, useCallback } from 'react';
import {
  useCollaborationStore,
  selectAnnotations,
  selectCurrentUser,
  selectCanControl,
} from '@/store/collaboration-slice';
import { collaborationSession } from '@/services/collaboration-session';
import type { Annotation } from '@/types/collaboration';

interface AnnotationToolsProps {
  structureId?: string;
  onAnnotationSelect?: (annotation: Annotation | null) => void;
}

export const AnnotationTools: React.FC<AnnotationToolsProps> = ({
  structureId,
  onAnnotationSelect,
}) => {
  const annotations = useCollaborationStore(selectAnnotations);
  const currentUser = useCollaborationStore(selectCurrentUser);
  const canControl = useCollaborationStore(selectCanControl);
  const selectedAnnotationId = useCollaborationStore((state) => state.selectedAnnotation);
  const setSelectedAnnotation = useCollaborationStore((state) => state.setSelectedAnnotation);
  const addAnnotation = useCollaborationStore((state) => state.addAnnotation);
  const updateAnnotation = useCollaborationStore((state) => state.updateAnnotation);
  const deleteAnnotation = useCollaborationStore((state) => state.deleteAnnotation);
  const addActivity = useCollaborationStore((state) => state.addActivity);

  const [isAdding, setIsAdding] = useState(false);
  const [newAnnotationContent, setNewAnnotationContent] = useState('');
  const [filterUser, setFilterUser] = useState<string | null>(null);

  /**
   * Create new annotation
   */
  const handleAddAnnotation = useCallback(
    async (position: { x: number; y: number; z: number }, target?: Annotation['target']) => {
      if (!currentUser || !canControl) {
        return;
      }

      const annotation: Annotation = {
        id: `annotation-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        userId: currentUser.id,
        userName: currentUser.name,
        content: newAnnotationContent || 'New annotation',
        position,
        target,
        color: currentUser.color,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: false,
      };

      // Optimistic update
      addAnnotation(annotation);

      try {
        // Broadcast to other users
        await collaborationSession.broadcast('annotation-add', annotation);

        // Add activity
        addActivity({
          id: `activity-${Date.now()}`,
          type: 'annotation-add',
          userId: currentUser.id,
          userName: currentUser.name,
          timestamp: Date.now(),
          message: `${currentUser.name} added an annotation`,
          data: { annotationId: annotation.id },
        });

        setNewAnnotationContent('');
        setIsAdding(false);
      } catch (error) {
        console.error('Failed to add annotation:', error);
        // Rollback on error
        deleteAnnotation(annotation.id);
      }
    },
    [currentUser, canControl, newAnnotationContent, addAnnotation, addActivity, deleteAnnotation]
  );

  /**
   * Edit annotation
   */
  const handleEditAnnotation = useCallback(
    async (id: string, content: string) => {
      if (!currentUser) return;

      const annotation = annotations.find((a) => a.id === id);
      if (!annotation || annotation.userId !== currentUser.id) {
        return;
      }

      // Optimistic update
      updateAnnotation(id, { content });

      try {
        const updated = { ...annotation, content, updatedAt: Date.now() };
        await collaborationSession.broadcast('annotation-edit', updated);

        addActivity({
          id: `activity-${Date.now()}`,
          type: 'annotation-edit',
          userId: currentUser.id,
          userName: currentUser.name,
          timestamp: Date.now(),
          message: `${currentUser.name} edited an annotation`,
          data: { annotationId: id },
        });
      } catch (error) {
        console.error('Failed to edit annotation:', error);
      }
    },
    [currentUser, annotations, updateAnnotation, addActivity]
  );

  /**
   * Delete annotation
   */
  const handleDeleteAnnotation = useCallback(
    async (id: string) => {
      if (!currentUser) return;

      const annotation = annotations.find((a) => a.id === id);
      if (!annotation || annotation.userId !== currentUser.id) {
        return;
      }

      // Optimistic delete
      deleteAnnotation(id);

      try {
        await collaborationSession.broadcast('annotation-delete', {
          id,
          userId: currentUser.id,
        });

        addActivity({
          id: `activity-${Date.now()}`,
          type: 'annotation-delete',
          userId: currentUser.id,
          userName: currentUser.name,
          timestamp: Date.now(),
          message: `${currentUser.name} deleted an annotation`,
          data: { annotationId: id },
        });
      } catch (error) {
        console.error('Failed to delete annotation:', error);
        // Rollback
        if (annotation) {
          addAnnotation(annotation);
        }
      }
    },
    [currentUser, annotations, deleteAnnotation, addActivity, addAnnotation]
  );

  /**
   * Toggle pin annotation
   */
  const handleTogglePin = useCallback(
    (id: string) => {
      const annotation = annotations.find((a) => a.id === id);
      if (annotation) {
        updateAnnotation(id, { isPinned: !annotation.isPinned });
      }
    },
    [annotations, updateAnnotation]
  );

  /**
   * Select annotation
   */
  const handleSelectAnnotation = useCallback(
    (id: string | null) => {
      setSelectedAnnotation(id);
      const annotation = id ? annotations.find((a) => a.id === id) : null;
      onAnnotationSelect?.(annotation || null);
    },
    [annotations, setSelectedAnnotation, onAnnotationSelect]
  );

  // Filter annotations
  const filteredAnnotations = annotations.filter(
    (a) => !filterUser || a.userId === filterUser
  );

  // Get unique users
  const uniqueUsers = Array.from(
    new Set(annotations.map((a) => JSON.stringify({ id: a.userId, name: a.userName })))
  ).map((s) => JSON.parse(s));

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Annotations
          </h3>
          {canControl && (
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              disabled={!structureId}
            >
              {isAdding ? 'Cancel' : '+ Add'}
            </button>
          )}
        </div>

        {/* Filter */}
        <select
          value={filterUser || ''}
          onChange={(e) => setFilterUser(e.target.value || null)}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">All users</option>
          {uniqueUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      {/* Add annotation form */}
      {isAdding && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
          <textarea
            value={newAnnotationContent}
            onChange={(e) => setNewAnnotationContent(e.target.value)}
            placeholder="Enter annotation text..."
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            rows={3}
          />
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            Click on a structure element to place the annotation
          </p>
        </div>
      )}

      {/* Annotations list */}
      <div className="flex-1 overflow-y-auto">
        {filteredAnnotations.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No annotations yet
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAnnotations.map((annotation) => {
              const isSelected = annotation.id === selectedAnnotationId;
              const isOwn = annotation.userId === currentUser?.id;

              return (
                <div
                  key={annotation.id}
                  onClick={() => handleSelectAnnotation(annotation.id)}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: annotation.color }}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {annotation.userName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isOwn && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePin(annotation.id);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title={annotation.isPinned ? 'Unpin' : 'Pin'}
                          >
                            <svg
                              className="w-4 h-4"
                              fill={annotation.isPinned ? 'currentColor' : 'none'}
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAnnotation(annotation.id);
                            }}
                            className="p-1 text-red-400 hover:text-red-600"
                            title="Delete"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {annotation.content}
                  </p>

                  {/* Target */}
                  {annotation.target && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {annotation.target.type}: {annotation.target.label}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(annotation.createdAt).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        {filteredAnnotations.length} annotation{filteredAnnotations.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};
