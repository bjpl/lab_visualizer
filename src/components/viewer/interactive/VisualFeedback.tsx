'use client';

/**
 * Visual Selection Feedback Component
 *
 * Provides visual feedback for atom, residue, and chain selections
 * in the molecular viewer with accessibility support.
 */

import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';

/**
 * Visual feedback component props
 */
export interface VisualFeedbackProps {
  selectedAtoms: Set<string>;
  hoveredAtom: string | null;
  selectedResidue: string | null;
  selectedChain: string | null;
  highlightColor?: string;
  hoverColor?: string;
  animationDuration?: number;
  accessibilityMode?: boolean;
}

/**
 * Selection effect configuration
 */
export interface SelectionEffect {
  atomId: string;
  effect: 'glow' | 'scale' | 'outline';
  intensity: number;
}

/**
 * Atom highlight subcomponent props
 */
interface AtomHighlightProps {
  atomId: string;
  color: string;
  opacity: number;
  isHover?: boolean;
  animationDuration?: number;
  intensity?: number;
  accessibilityMode?: boolean;
  pattern?: string;
}

/**
 * Residue highlight subcomponent props
 */
interface ResidueHighlightProps {
  residueId: string;
  atoms: string[];
  color?: string;
}

/**
 * Default colors
 */
const DEFAULT_SELECTION_COLOR = '#00ff00';
const DEFAULT_HOVER_COLOR = '#ff00ff';
const DEFAULT_CHAIN_COLOR = '#00ccff';
const DEFAULT_RESIDUE_COLOR = '#ffcc00';
const SELECTION_INTENSITY = 0.5;
const HOVER_INTENSITY = 0.8;

/**
 * Check for reduced motion preference
 */
const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
};

/**
 * Atom highlight component
 */
export const AtomHighlight: React.FC<AtomHighlightProps> = ({
  atomId,
  color,
  opacity,
  isHover = false,
  animationDuration = 200,
  intensity = SELECTION_INTENSITY,
  accessibilityMode = false,
  pattern,
}) => {
  const reducedMotion = prefersReducedMotion();
  const type = isHover ? 'hover' : 'selection';
  const zIndex = isHover ? 10 : 5;

  const style: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: color,
    opacity,
    transition: `opacity ${animationDuration}ms ease-in-out`,
    transform: !isHover ? 'scale(1.1)' : undefined,
    filter: !reducedMotion ? `drop-shadow(0 0 ${intensity * 10}px ${color})` : undefined,
    animation: !reducedMotion && !isHover ? `pulse 2s ease-in-out infinite` : undefined,
    zIndex,
  };

  if (accessibilityMode) {
    style.border = `2px solid ${color}`;
  }

  return (
    <div
      data-testid={`atom-highlight-${atomId}`}
      data-atom-id={atomId}
      data-color={color}
      data-opacity={opacity}
      data-type={type}
      data-glow={atomId}
      data-intensity={intensity}
      data-pattern={pattern}
      style={style}
      aria-label={`Atom ${atomId} ${isHover ? 'hovered' : 'selected'}`}
    >
      Atom {atomId}
    </div>
  );
};

/**
 * Residue highlight component
 */
export const ResidueHighlight: React.FC<ResidueHighlightProps> = ({
  residueId,
  atoms,
  color = DEFAULT_RESIDUE_COLOR,
}) => {
  return (
    <div
      data-testid={`residue-highlight-${residueId}`}
      data-residue-outline={residueId}
      style={{
        border: `2px solid ${color}`,
        borderRadius: '4px',
        borderColor: color,
      }}
    >
      {atoms.map((atomId) => (
        <div key={atomId} data-testid={`residue-atom-${atomId}`} />
      ))}
    </div>
  );
};

/**
 * Residue label component
 */
const ResidueLabel: React.FC<{ residueId: string }> = ({ residueId }) => {
  // Extract display name from residueId (e.g., "residue-A42" -> "A42")
  const displayName = residueId.replace('residue-', '');

  return (
    <div
      data-testid={`residue-label-${residueId}`}
      data-residue-label={residueId}
      style={{
        position: 'absolute',
        transform: 'translate(-50%, -100%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '2px 6px',
        borderRadius: '3px',
        fontSize: '12px',
      }}
    >
      {displayName}
    </div>
  );
};

/**
 * Chain highlight component
 */
const ChainHighlight: React.FC<{ chainId: string; color: string }> = ({
  chainId,
  color,
}) => {
  const displayName = chainId.replace('chain-', 'Chain ');

  return (
    <>
      <div
        data-chain={chainId}
        data-color={color}
        style={{
          position: 'absolute',
          backgroundColor: color,
          opacity: 0.5,
        }}
      />
      <div
        data-chain-ribbon={chainId}
        style={{
          opacity: 0.5,
        }}
      />
      <div data-testid={`chain-label-${chainId}`}>{displayName}</div>
    </>
  );
};

/**
 * Screen reader announcement component
 */
const ScreenReaderAnnouncement: React.FC<{
  selectedCount: number;
  hoveredAtom: string | null;
}> = ({ selectedCount, hoveredAtom }) => {
  const message = useMemo(() => {
    const parts: string[] = [];
    if (selectedCount > 0) {
      parts.push(`${selectedCount} atom${selectedCount > 1 ? 's' : ''} selected`);
    }
    if (hoveredAtom) {
      parts.push(`hovering over ${hoveredAtom}`);
    }
    return parts.join(', ') || 'No selection';
  }, [selectedCount, hoveredAtom]);

  return (
    <div role="status" aria-live="polite" className="sr-only" style={{ position: 'absolute', left: -9999 }}>
      {message}
    </div>
  );
};

/**
 * Main Visual Feedback component
 */
export const VisualFeedback: React.FC<VisualFeedbackProps> = ({
  selectedAtoms,
  hoveredAtom,
  selectedResidue,
  selectedChain,
  highlightColor = DEFAULT_SELECTION_COLOR,
  hoverColor = DEFAULT_HOVER_COLOR,
  animationDuration = 200,
  accessibilityMode = false,
}) => {
  const reducedMotion = prefersReducedMotion();
  const [visibleAtoms, setVisibleAtoms] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Virtualization: only render visible atoms for large selections
  const atomsArray = useMemo(() => Array.from(selectedAtoms), [selectedAtoms]);
  const shouldVirtualize = atomsArray.length > 50;

  useEffect(() => {
    if (shouldVirtualize) {
      // Only show first 50 atoms when virtualizing
      setVisibleAtoms(atomsArray.slice(0, 50));
    } else {
      setVisibleAtoms(atomsArray);
    }
  }, [atomsArray, shouldVirtualize]);

  // Pattern for accessibility mode (distinguishes selection from hover)
  const selectionPattern = accessibilityMode ? 'solid' : undefined;
  const hoverPattern = accessibilityMode ? 'dashed' : undefined;

  return (
    <div
      ref={containerRef}
      data-testid="visual-feedback"
      style={{ position: 'relative' }}
    >
      {/* Screen reader announcements */}
      <ScreenReaderAnnouncement
        selectedCount={selectedAtoms.size}
        hoveredAtom={hoveredAtom}
      />

      {/* Selected atom highlights */}
      {visibleAtoms.map((atomId) => (
        <AtomHighlight
          key={`selection-${atomId}`}
          atomId={atomId}
          color={highlightColor}
          opacity={0.5}
          isHover={false}
          animationDuration={animationDuration}
          intensity={SELECTION_INTENSITY}
          accessibilityMode={accessibilityMode}
          pattern={selectionPattern}
        />
      ))}

      {/* Hovered atom highlight (if not already in selection) */}
      {hoveredAtom && (
        <AtomHighlight
          key={`hover-${hoveredAtom}`}
          atomId={hoveredAtom}
          color={hoverColor}
          opacity={0.7}
          isHover={true}
          animationDuration={animationDuration}
          intensity={HOVER_INTENSITY}
          accessibilityMode={accessibilityMode}
          pattern={hoverPattern}
        />
      )}

      {/* Residue highlight */}
      {selectedResidue && (
        <>
          <ResidueHighlight
            residueId={selectedResidue}
            atoms={[]}
            color={DEFAULT_RESIDUE_COLOR}
          />
          <ResidueLabel residueId={selectedResidue} />
        </>
      )}

      {/* Chain highlight */}
      {selectedChain && (
        <ChainHighlight chainId={selectedChain} color={DEFAULT_CHAIN_COLOR} />
      )}

      {/* CSS animation keyframes */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.7; }
          }
        `}
      </style>
    </div>
  );
};

export default VisualFeedback;
