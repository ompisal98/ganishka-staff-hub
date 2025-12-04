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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Calendar, Users, Loader2 } from 'lucide-react';
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

interface Batch {
  id: string;
  name: string;
  code: string;
  course_id: string;
  trainer_id: string | null;
  start_date: string;
  end_date: string | null;
  schedule: string | null;
  timings: string | null;
  capacity: number;
  is_active: boolean;
  courses?: { name: string; code: string };
  staff_profiles?: { full_name: string };
}

interface Course {
  id: string;
  name: string;
  code: string;
}

interface StaffProfile {
  id: string;
  full_name: string;
}

export default function Batches() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [trainers, setTrainers] = useState<StaffProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    course_id: '',
    trainer_id: '',
    start_date: '',
    end_date: '',
    schedule: '',
    timings: '',
    capacity: '30',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [batchesRes, coursesRes, trainersRes] = await Promise.all([
        supabase
          .from('batches')
          .select('*, courses(name, code), staff_profiles(full_name)')
          .order('created_at', { ascending: false }),
        supabase.from('courses').select('id, name, code').eq('is_active', true),
        supabase.from('staff_profiles').select('id, full_name').eq('is_active', true),
      ]);

      if (batchesRes.error) throw batchesRes.error;
      if (coursesRes.error) throw coursesRes.error;
      if (trainersRes.error) throw trainersRes.error;

      setBatches(batchesRes.data || []);
      setCourses(coursesRes.data || []);
      setTrainers(trainersRes.data || []);
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
      const batchData = {
        name: formData.name,
        code: formData.code.toUpperCase(),
        course_id: formData.course_id,
        trainer_id: formData.trainer_id || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        schedule: formData.schedule || null,
        timings: formData.timings || null,
        capacity: parseInt(formData.capacity) || 30,
      };

      if (editingBatch) {
        const { error } = await supabase
          .from('batches')
          .update(batchData)
          .eq('id', editingBatch.id);

        if (error) throw error;
        toast.success('Batch updated successfully');
      } else {
        const { error } = await supabase.from('batches').insert(batchData);
        if (error) throw error;
        toast.success('Batch created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving batch:', error);
      toast.error(error.message || 'Failed to save batch');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      code: batch.code,
      course_id: batch.course_id,
      trainer_id: batch.trainer_id || '',
      start_date: batch.start_date,
      end_date: batch.end_date || '',
      schedule: batch.schedule || '',
      timings: batch.timings || '',
      capacity: batch.capacity.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;

    try {
      const { error } = await supabase.from('batches').delete().eq('id', id);
      if (error) throw error;
      toast.success('Batch deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete batch');
    }
  };

  const resetForm = () => {
    setEditingBatch(null);
    setFormData({
      name: '',
      code: '',
      course_id: '',
      trainer_id: '',
      start_date: '',
      end_date: '',
      schedule: '',
      timings: '',
      capacity: '30',
    });
  };

  const filteredBatches = batches.filter(
    (batch) =>
      batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Header title="Batches" subtitle="Manage course batches and schedules" />

      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search batches..."
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
                    Create Batch
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingBatch ? 'Edit Batch' : 'Create New Batch'}</DialogTitle>
                    <DialogDescription>
                      {editingBatch ? 'Update batch information' : 'Create a new batch for a course'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Batch Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Morning Batch A"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="code">Batch Code *</Label>
                        <Input
                          id="code"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          placeholder="e.g., FSWD-M-A-2024"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="course_id">Course *</Label>
                        <Select
                          value={formData.course_id}
                          onValueChange={(value) => setFormData({ ...formData, course_id: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select course" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map((course) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.name} ({course.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="trainer_id">Trainer</Label>
                        <Select
                          value={formData.trainer_id}
                          onValueChange={(value) => setFormData({ ...formData, trainer_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select trainer" />
                          </SelectTrigger>
                          <SelectContent>
                            {trainers.map((trainer) => (
                              <SelectItem key={trainer.id} value={trainer.id}>
                                {trainer.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="start_date">Start Date *</Label>
                        <Input
                          id="start_date"
                          type="date"
                          value={formData.start_date}
                          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end_date">End Date</Label>
                        <Input
                          id="end_date"
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="schedule">Schedule</Label>
                        <Input
                          id="schedule"
                          value={formData.schedule}
                          onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                          placeholder="e.g., Mon, Wed, Fri"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timings">Timings</Label>
                        <Input
                          id="timings"
                          value={formData.timings}
                          onChange={(e) => setFormData({ ...formData, timings: e.target.value })}
                          placeholder="e.g., 9:00 AM - 12:00 PM"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="capacity">Capacity</Label>
                        <Input
                          id="capacity"
                          type="number"
                          value={formData.capacity}
                          onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                          placeholder="30"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : editingBatch ? (
                          'Update Batch'
                        ) : (
                          'Create Batch'
                        )}
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
            <CardTitle className="text-lg font-display">All Batches ({filteredBatches.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredBatches.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">No batches found</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                  Create your first batch
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Batch Name</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Trainer</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBatches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {batch.code}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{batch.name}</TableCell>
                        <TableCell>
                          {batch.courses ? (
                            <span className="text-sm">
                              {batch.courses.name}
                              <span className="text-muted-foreground ml-1">({batch.courses.code})</span>
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{batch.staff_profiles?.full_name || '-'}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{batch.schedule || '-'}</p>
                            <p className="text-muted-foreground">{batch.timings || ''}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            {batch.capacity}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={batch.is_active ? 'default' : 'secondary'}>
                            {batch.is_active ? 'Active' : 'Inactive'}
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
                              <DropdownMenuItem onClick={() => handleEdit(batch)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(batch.id)}
                                className="text-destructive"
                              >
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
