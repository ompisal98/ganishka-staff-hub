import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, GraduationCap, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

interface Enrollment {
  id: string;
  enrollment_date: string;
  status: string;
  fee_paid: number | null;
  fee_pending: number | null;
  students?: { full_name: string; admission_number: string };
  batches?: { name: string; code: string; courses?: { name: string } };
}

interface Student {
  id: string;
  full_name: string;
  admission_number: string;
}

interface Batch {
  id: string;
  name: string;
  code: string;
  courses?: { name: string };
}

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    student_id: '',
    batch_id: '',
    fee_paid: '',
    fee_pending: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [enrollRes, studentsRes, batchesRes] = await Promise.all([
        supabase
          .from('enrollments')
          .select('*, students(full_name, admission_number), batches(name, code, courses(name))')
          .order('created_at', { ascending: false }),
        supabase.from('students').select('id, full_name, admission_number').eq('is_active', true),
        supabase.from('batches').select('id, name, code, courses(name)').eq('is_active', true),
      ]);

      if (enrollRes.error) throw enrollRes.error;
      if (studentsRes.error) throw studentsRes.error;
      if (batchesRes.error) throw batchesRes.error;

      setEnrollments(enrollRes.data || []);
      setStudents(studentsRes.data || []);
      setBatches(batchesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { error } = await supabase.from('enrollments').insert({
        student_id: formData.student_id,
        batch_id: formData.batch_id,
        fee_paid: parseFloat(formData.fee_paid) || 0,
        fee_pending: parseFloat(formData.fee_pending) || 0,
      });

      if (error) throw error;
      toast.success('Enrollment created successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error creating enrollment:', error);
      if (error.message?.includes('duplicate')) {
        toast.error('Student is already enrolled in this batch');
      } else {
        toast.error(error.message || 'Failed to create enrollment');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (id: string, status: 'active' | 'completed' | 'dropped' | 'transferred') => {
    try {
      const { error } = await supabase
        .from('enrollments')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast.success('Status updated');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this enrollment?')) return;

    try {
      const { error } = await supabase.from('enrollments').delete().eq('id', id);
      if (error) throw error;
      toast.success('Enrollment deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      batch_id: '',
      fee_paid: '',
      fee_pending: '',
    });
  };

  const filteredEnrollments = enrollments.filter(
    (enrollment) =>
      enrollment.students?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enrollment.students?.admission_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enrollment.batches?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    active: 'default',
    completed: 'success',
    dropped: 'destructive',
    transferred: 'secondary',
  };

  return (
    <div className="min-h-screen">
      <Header title="Enrollments" subtitle="Manage student enrollments in batches" />

      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search enrollments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button variant="gradient">
                    <Plus className="h-4 w-4" />
                    New Enrollment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Enrollment</DialogTitle>
                    <DialogDescription>Enroll a student in a batch</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Student *</Label>
                      <Select
                        value={formData.student_id}
                        onValueChange={(value) => setFormData({ ...formData, student_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.full_name} ({student.admission_number})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Batch *</Label>
                      <Select
                        value={formData.batch_id}
                        onValueChange={(value) => setFormData({ ...formData, batch_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select batch" />
                        </SelectTrigger>
                        <SelectContent>
                          {batches.map((batch) => (
                            <SelectItem key={batch.id} value={batch.id}>
                              {batch.name} - {batch.courses?.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fee Paid (₹)</Label>
                        <Input
                          type="number"
                          value={formData.fee_paid}
                          onChange={(e) => setFormData({ ...formData, fee_paid: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fee Pending (₹)</Label>
                        <Input
                          type="number"
                          value={formData.fee_pending}
                          onChange={(e) => setFormData({ ...formData, fee_pending: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enroll Student'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">All Enrollments ({filteredEnrollments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredEnrollments.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">No enrollments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Enrolled On</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnrollments.map((enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{enrollment.students?.full_name}</p>
                            <p className="text-xs text-muted-foreground">{enrollment.students?.admission_number}</p>
                          </div>
                        </TableCell>
                        <TableCell>{enrollment.batches?.name}</TableCell>
                        <TableCell>{enrollment.batches?.courses?.name}</TableCell>
                        <TableCell>{format(new Date(enrollment.enrollment_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <Badge variant="default">
                            {enrollment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => updateStatus(enrollment.id, 'completed')}>
                                Mark Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateStatus(enrollment.id, 'dropped')}>
                                Mark Dropped
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(enrollment.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
