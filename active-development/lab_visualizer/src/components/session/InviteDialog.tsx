/**
 * InviteDialog - Dialog for sharing session invite links
 * Provides easy copy-to-clipboard functionality for invite codes and links
 */
'use client';

import { Check, Copy, Share2 } from 'lucide-react';
import type React from 'react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInviteLink } from '@/hooks/use-collaboration';


export interface InviteDialogProps {
  /**
   * Whether dialog is open
   */
  open: boolean;

  /**
   * Callback when dialog should close
   */
  onClose: () => void;
}

export const InviteDialog: React.FC<InviteDialogProps> = ({ open, onClose }) => {
  const { inviteLink, inviteCode, copyToClipboard } = useInviteLink();
  const [linkCopied, setLinkCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  /**
   * Reset copied states when dialog closes
   */
  useEffect(() => {
    if (!open) {
      setLinkCopied(false);
      setCodeCopied(false);
    }
  }, [open]);

  /**
   * Copy invite link to clipboard
   */
  const handleCopyLink = async () => {
    const success = await copyToClipboard();
    if (success) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  /**
   * Copy invite code to clipboard
   */
  const handleCopyCode = async () => {
    if (!inviteCode) return;

    try {
      await navigator.clipboard.writeText(inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  /**
   * Share via Web Share API if available
   */
  const handleShare = async () => {
    if (!inviteLink || !navigator.share) return;

    try {
      await navigator.share({
        title: 'Join my collaboration session',
        text: 'Join me in exploring molecular structures together!',
        url: inviteLink,
      });
    } catch (error) {
      // User cancelled or share failed
      console.log('Share cancelled or failed:', error);
    }
  };

  const canShare = typeof navigator !== 'undefined' && navigator.share;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Invite Collaborators
          </DialogTitle>
          <DialogDescription>
            Share this link or code with others to invite them to your session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invite Link */}
          <div className="space-y-2">
            <Label htmlFor="invite-link">Invite Link</Label>
            <div className="flex gap-2">
              <Input
                id="invite-link"
                type="text"
                value={inviteLink || ''}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={handleCopyLink}
                title="Copy link"
              >
                {linkCopied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can join your session
            </p>
          </div>

          {/* Invite Code */}
          <div className="space-y-2">
            <Label htmlFor="invite-code">Invite Code</Label>
            <div className="flex gap-2">
              <Input
                id="invite-code"
                type="text"
                value={inviteCode || ''}
                readOnly
                className="flex-1 font-mono text-xl text-center tracking-wider uppercase"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={handleCopyCode}
                title="Copy code"
              >
                {codeCopied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Others can enter this code to join manually
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-4">
            {canShare && (
              <Button
                onClick={handleShare}
                className="w-full"
                variant="default"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share Link
              </Button>
            )}
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              Done
            </Button>
          </div>

          {/* Success Message */}
          {(linkCopied || codeCopied) && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
              <Check className="h-4 w-4" />
              <span>
                {linkCopied ? 'Link' : 'Code'} copied to clipboard!
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
