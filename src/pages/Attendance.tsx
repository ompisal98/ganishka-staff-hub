import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { ClipboardCheck, Check, X, Clock, Loader2, Save } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Batch {
  id: string;
  name: string;
  code: string;
}

interface EnrollmentWithStudent {
  id: string;
  students: { id: string; full_name: string; admission_number: string };
}

interface AttendanceRecord {
  enrollment_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

export default function Attendance() {
  const { profile } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [enrollments, setEnrollments] = useState<EnrollmentWithStudent[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [existingAttendance, setExistingAttendance] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchEnrollments();
      fetchExistingAttendance();
    }
  }, [selectedBatch, selectedDate]);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to fetch batches');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('id, students(id, full_name, admission_number)')
        .eq('batch_id', selectedBatch)
        .eq('status', 'active');

      if (error) throw error;
      setEnrollments(data || []);
      
      // Initialize attendance records
      const initialAttendance: Record<string, AttendanceRecord> = {};
      (data || []).forEach((enrollment: any) => {
        initialAttendance[enrollment.id] = {
          enrollment_id: enrollment.id,
          status: 'present',
        };
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const fetchExistingAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('enrollment_id, status')
        .eq('batch_id', selectedBatch)
        .eq('session_date', selectedDate);

      if (error) throw error;

      const existing: Record<string, string> = {};
      (data || []).forEach((record: any) => {
        existing[record.enrollment_id] = record.status;
      });
      setExistingAttendance(existing);

      // Update attendance state with existing records
      if (data && data.length > 0) {
        const updatedAttendance: Record<string, AttendanceRecord> = {};
        data.forEach((record: any) => {
          updatedAttendance[record.enrollment_id] = {
            enrollment_id: record.enrollment_id,
            status: record.status,
          };
        });
        setAttendance(prev => ({ ...prev, ...updatedAttendance }));
      }
    } catch (error) {
      console.error('Error fetching existing attendance:', error);
    }
  };

  const updateAttendance = (enrollmentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    setAttendance(prev => ({
      ...prev,
      [enrollmentId]: {
        enrollment_id: enrollmentId,
        status,
      },
    }));
  };

  const saveAttendance = async () => {
    if (!selectedBatch || !selectedDate) {
      toast.error('Please select a batch and date');
      return;
    }

    setIsSaving(true);
    try {
      const records = Object.values(attendance).map(record => ({
        enrollment_id: record.enrollment_id,
        batch_id: selectedBatch,
        session_date: selectedDate,
        status: record.status,
        marked_by: profile?.id,
      }));

      // Delete existing attendance for this batch and date
      await supabase
        .from('attendance')
        .delete()
        .eq('batch_id', selectedBatch)
        .eq('session_date', selectedDate);

      // Insert new attendance records
      const { error } = await supabase.from('attendance').insert(records);

      if (error) throw error;
      toast.success('Attendance saved successfully');
      fetchExistingAttendance();
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      toast.error(error.message || 'Failed to save attendance');
    } finally {
      setIsSaving(false);
    }
  };

  const markAllPresent = () => {
    const allPresent: Record<string, AttendanceRecord> = {};
    enrollments.forEach(enrollment => {
      allPresent[enrollment.id] = {
        enrollment_id: enrollment.id,
        status: 'present',
      };
    });
    setAttendance(allPresent);
  };

  const statusConfig = {
    present: { icon: Check, color: 'bg-success text-success-foreground', label: 'Present' },
    absent: { icon: X, color: 'bg-destructive text-destructive-foreground', label: 'Absent' },
    late: { icon: Clock, color: 'bg-warning text-warning-foreground', label: 'Late' },
    excused: { icon: ClipboardCheck, color: 'bg-secondary text-secondary-foreground', label: 'Excused' },
  };

  const hasExistingAttendance = Object.keys(existingAttendance).length > 0;

  return (
    <div className="min-h-screen">
      <Header title="Attendance" subtitle="Mark and manage daily attendance" />

      <div className="p-6 space-y-6">
        {/* Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Select Batch</label>
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Choose a batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name} ({batch.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex h-10 w-full sm:w-auto rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              {selectedBatch && enrollments.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={markAllPresent}>
                    Mark All Present
                  </Button>
                  <Button onClick={saveAttendance} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Attendance
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Grid */}
        {selectedBatch ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-display">
                  Attendance for {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
                </CardTitle>
                {hasExistingAttendance && (
                  <Badge variant="secondary">Attendance already marked</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {enrollments.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">No active enrollments in this batch</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollments.map((enrollment, index) => (
                    <div
                      key={enrollment.id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border bg-card",
                        "animate-slide-up"
                      )}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{enrollment.students.full_name}</p>
                          <p className="text-sm text-muted-foreground">{enrollment.students.admission_number}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {(Object.keys(statusConfig) as Array<keyof typeof statusConfig>).map((status) => {
                          const config = statusConfig[status];
                          const Icon = config.icon;
                          const isSelected = attendance[enrollment.id]?.status === status;
                          return (
                            <Button
                              key={status}
                              variant={isSelected ? 'default' : 'outline'}
                              size="sm"
                              className={cn(
                                'transition-all',
                                isSelected && config.color
                              )}
                              onClick={() => updateAttendance(enrollment.id, status)}
                            >
                              <Icon className="h-4 w-4" />
                              <span className="hidden sm:inline ml-1">{config.label}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <ClipboardCheck className="h-16 w-16 mx-auto text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">Select a Batch</h3>
                <p className="text-muted-foreground">Choose a batch to mark attendance</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
