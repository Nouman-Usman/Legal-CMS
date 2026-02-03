'use client';

import React from 'react';
import { ProtectedRoute } from '@/lib/components/protected-route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <ProtectedRoute requiredRole="chamber_admin">
      <div className="p-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Chamber Settings</h1>
            <p className="text-muted-foreground">Configure your chamber preferences</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Coming soon: Settings interface</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
