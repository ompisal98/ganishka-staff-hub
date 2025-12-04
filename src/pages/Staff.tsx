import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { UserCog } from 'lucide-react';

export default function Staff() {
  return (
    <div className="min-h-screen">
      <Header title="Staff Management" subtitle="Manage staff accounts and roles" />
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <UserCog className="h-16 w-16 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Staff Management</h3>
            <p className="text-muted-foreground">Admin-only feature coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
