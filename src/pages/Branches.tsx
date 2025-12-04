import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export default function Branches() {
  return (
    <div className="min-h-screen">
      <Header title="Branches" subtitle="Manage institute branches" />
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Branch Management</h3>
            <p className="text-muted-foreground">Admin-only feature coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
