import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function Reports() {
  return (
    <div className="min-h-screen">
      <Header title="Reports" subtitle="View analytics and reports" />
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Reports & Analytics</h3>
            <p className="text-muted-foreground">Detailed reports coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
