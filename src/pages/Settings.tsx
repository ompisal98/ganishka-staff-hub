import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="min-h-screen">
      <Header title="Settings" subtitle="System configuration" />
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <SettingsIcon className="h-16 w-16 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">System Settings</h3>
            <p className="text-muted-foreground">Configuration options coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
