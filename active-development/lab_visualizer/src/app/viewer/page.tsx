'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

import { ViewerSkeleton } from '@/components/viewer/LoadingState';
import { ViewerLayout } from '@/components/viewer/ViewerLayout';

function ViewerContent() {
  const searchParams = useSearchParams();
  const pdbId = searchParams.get('pdb');

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'r':
          // Reset camera
          console.log('Reset camera shortcut');
          break;
        case 'f':
          if (!e.ctrlKey) {
            // Focus on selection
            console.log('Focus shortcut');
          } else {
            // Fullscreen
            e.preventDefault();
            document.documentElement.requestFullscreen();
          }
          break;
        case 'p':
          // Toggle panel
          console.log('Toggle panel shortcut');
          break;
        case 's':
          if (!e.ctrlKey) {
            // Selection mode
            console.log('Selection mode shortcut');
          } else {
            // Screenshot
            e.preventDefault();
            console.log('Screenshot shortcut');
          }
          break;
        case 'h':
          // Help
          console.log('Help shortcut');
          break;
        case 'escape':
          // Clear selection
          console.log('Clear selection shortcut');
          break;
        case '+':
        case '=':
          // Zoom in
          console.log('Zoom in shortcut');
          break;
        case '-':
        case '_':
          // Zoom out
          console.log('Zoom out shortcut');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <ViewerLayout pdbId={pdbId || undefined} />;
}

export default function ViewerPage() {
  return (
    <Suspense fallback={<ViewerSkeleton />}>
      <ViewerContent />
    </Suspense>
  );
}
