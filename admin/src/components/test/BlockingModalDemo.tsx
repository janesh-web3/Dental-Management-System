import React, { useState } from 'react';
import { BlockingModal } from '@/components/ui/enhanced-popup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const BlockingModalDemo: React.FC = () => {
  const [isBlocking, setIsBlocking] = useState(false);
  const [actionCompleted, setActionCompleted] = useState(false);

  const handleShowBlocking = () => {
    setIsBlocking(true);
    setActionCompleted(false);
  };

  const handleConfirm = async () => {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setActionCompleted(true);
    setIsBlocking(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Blocking Modal Demo</CardTitle>
          <CardDescription>
            Test the completely blocking modal that prevents all user interactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={handleShowBlocking}
              variant="destructive"
              disabled={isBlocking}
            >
              Show Blocking Modal
            </Button>

            <Button
              variant="outline"
              disabled={isBlocking}
            >
              Try Clicking Me (Should be blocked)
            </Button>
          </div>

          {actionCompleted && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">
                ✅ Action completed! System is now unlocked.
              </p>
            </div>
          )}

          <div className="mt-6 text-sm text-gray-600">
            <h3 className="font-medium mb-2">Features Tested:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Modal blocks all background interactions</li>
              <li>Escape key is disabled</li>
              <li>Outside click is disabled</li>
              <li>Browser refresh is prevented</li>
              <li>Alt+F4 is blocked</li>
              <li>Only the "Confirm" button can close the modal</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* The blocking modal */}
      <BlockingModal
        isOpen={isBlocking}
        onConfirm={handleConfirm}
        title="Critical System Action"
        description="This is a demonstration of a completely blocking modal. You must complete this action to continue using the system."
        confirmLabel="Complete Action"
        loading={false}
      />
    </div>
  );
};