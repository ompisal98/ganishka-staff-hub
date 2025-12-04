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
import { Search, Award, Loader2, Plus, Download, Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

interface CertificateData {
  id: string;
  certificate_number: string;
  course_name: string;
  batch_name: string;
  issue_date: string;
  completion_date: string | null;
  grade: string | null;
  attendance_percentage: number | null;
  status: string;
  created_at: string;
  students?: { full_name: string; admission_number: string };
}

interface Student {
  id: string;
  full_name: string;
  admission_number: string;
}

interface Enrollment {
  id: string;
  student_id: string;
  students?: { full_name: string; admission_number: string };
  batches?: { name: string; code: string; courses?: { name: string } };
}

export default function Certificates() {
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewCert, setPreviewCert] = useState<CertificateData | null>(null);

  const [formData, setFormData] = useState({
    enrollment_id: '',
    grade: '',
    attendance_percentage: '',
    completion_date: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [certsRes, enrollRes] = await Promise.all([
        supabase
          .from('certificates')
          .select('*, students(full_name, admission_number)')
          .order('created_at', { ascending: false }),
        supabase
          .from('enrollments')
          .select('id, student_id, students(full_name, admission_number), batches(name, code, courses(name))')
          .eq('status', 'completed'),
      ]);

      if (certsRes.error) throw certsRes.error;
      if (enrollRes.error) throw enrollRes.error;

      setCertificates(certsRes.data || []);
      setEnrollments(enrollRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateCertificateNumber = async () => {
    const { data, error } = await supabase.rpc('generate_certificate_number');
    if (error) throw error;
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const enrollment = enrollments.find(e => e.id === formData.enrollment_id);
      if (!enrollment) throw new Error('Enrollment not found');

      const certNumber = await generateCertificateNumber();

      const { error } = await supabase.from('certificates').insert({
        certificate_number: certNumber,
        student_id: enrollment.student_id,
        enrollment_id: formData.enrollment_id,
        course_name: enrollment.batches?.courses?.name || '',
        batch_name: enrollment.batches?.name || '',
        grade: formData.grade || null,
        attendance_percentage: parseFloat(formData.attendance_percentage) || null,
        completion_date: formData.completion_date || null,
      });

      if (error) throw error;
      toast.success('Certificate generated successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error generating certificate:', error);
      toast.error(error.message || 'Failed to generate certificate');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      enrollment_id: '',
      grade: '',
      attendance_percentage: '',
      completion_date: '',
    });
  };

  const handleDownload = (cert: CertificateData) => {
    const content = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                           GANISHKA TECHNOLOGY                                ║
║                         Tech Coaching Institute                              ║
║                                                                              ║
║                      CERTIFICATE OF COMPLETION                               ║
║                                                                              ║
║                   Certificate No: ${cert.certificate_number.padEnd(20)}                   ║
║                                                                              ║
║                         This is to certify that                              ║
║                                                                              ║
║                          ${cert.students?.full_name?.padStart(30)}                            ║
║                                                                              ║
║              has successfully completed the training program in              ║
║                                                                              ║
║                          ${cert.course_name.padStart(30)}                            ║
║                                                                              ║
║                            Batch: ${cert.batch_name.padEnd(20)}                         ║
║                                                                              ║
${cert.grade ? `║                            Grade: ${cert.grade.padEnd(20)}                         ║\n` : ''}${cert.attendance_percentage ? `║                     Attendance: ${cert.attendance_percentage.toString().padEnd(5)}%                              ║\n` : ''}║                                                                              ║
║                       Issue Date: ${format(new Date(cert.issue_date), 'dd MMM yyyy').padEnd(20)}                     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificate-${cert.certificate_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Certificate downloaded');
  };

  const filteredCertificates = certificates.filter(
    (cert) =>
      cert.certificate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.students?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Header title="Certificates" subtitle="Generate and manage completion certificates" />

      {/* Certificate Preview Modal */}
      {previewCert && (
        <Dialog open={!!previewCert} onOpenChange={() => setPreviewCert(null)}>
          <DialogContent className="max-w-2xl">
            <div className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border-2 border-primary/20">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-display font-bold text-primary">GANISHKA TECHNOLOGY</h2>
                <p className="text-sm text-muted-foreground">Tech Coaching Institute</p>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold mb-2">CERTIFICATE OF COMPLETION</h3>
                <p className="text-sm text-muted-foreground font-mono">{previewCert.certificate_number}</p>
              </div>
              <div className="text-center space-y-4">
                <p>This is to certify that</p>
                <p className="text-2xl font-display font-bold">{previewCert.students?.full_name}</p>
                <p>has successfully completed the training program in</p>
                <p className="text-xl font-semibold text-primary">{previewCert.course_name}</p>
                <p className="text-sm text-muted-foreground">Batch: {previewCert.batch_name}</p>
                {previewCert.grade && <p>Grade: <span className="font-semibold">{previewCert.grade}</span></p>}
                {previewCert.attendance_percentage && (
                  <p>Attendance: <span className="font-semibold">{previewCert.attendance_percentage}%</span></p>
                )}
              </div>
              <div className="mt-8 text-center text-sm text-muted-foreground">
                <p>Issue Date: {format(new Date(previewCert.issue_date), 'dd MMMM yyyy')}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewCert(null)}>Close</Button>
              <Button onClick={() => handleDownload(previewCert)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search certificates..."
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
                    Generate Certificate
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Generate Certificate</DialogTitle>
                    <DialogDescription>
                      Create a completion certificate for a student
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="enrollment_id">Select Completed Enrollment *</Label>
                      <Select
                        value={formData.enrollment_id}
                        onValueChange={(value) => setFormData({ ...formData, enrollment_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select enrollment" />
                        </SelectTrigger>
                        <SelectContent>
                          {enrollments.length === 0 ? (
                            <SelectItem value="none" disabled>No completed enrollments</SelectItem>
                          ) : (
                            enrollments.map((enrollment) => (
                              <SelectItem key={enrollment.id} value={enrollment.id}>
                                {enrollment.students?.full_name} - {enrollment.batches?.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="grade">Grade (Optional)</Label>
                        <Select
                          value={formData.grade}
                          onValueChange={(value) => setFormData({ ...formData, grade: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A+">A+</SelectItem>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="B+">B+</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                            <SelectItem value="C">C</SelectItem>
                            <SelectItem value="Pass">Pass</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="attendance_percentage">Attendance %</Label>
                        <Input
                          id="attendance_percentage"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.attendance_percentage}
                          onChange={(e) => setFormData({ ...formData, attendance_percentage: e.target.value })}
                          placeholder="e.g., 85"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="completion_date">Completion Date</Label>
                      <Input
                        id="completion_date"
                        type="date"
                        value={formData.completion_date}
                        onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                      />
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSaving || enrollments.length === 0}>
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          'Generate Certificate'
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
            <CardTitle className="text-lg font-display">All Certificates ({filteredCertificates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredCertificates.length === 0 ? (
              <div className="text-center py-8">
                <Award className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">No certificates found</p>
                <p className="text-sm text-muted-foreground">Complete enrollments first to generate certificates</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Certificate No.</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCertificates.map((cert) => (
                      <TableRow key={cert.id}>
                        <TableCell className="font-mono text-sm">{cert.certificate_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{cert.students?.full_name}</p>
                            <p className="text-xs text-muted-foreground">{cert.students?.admission_number}</p>
                          </div>
                        </TableCell>
                        <TableCell>{cert.course_name}</TableCell>
                        <TableCell>{cert.batch_name}</TableCell>
                        <TableCell>
                          {cert.grade ? (
                            <Badge variant="outline">{cert.grade}</Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(cert.issue_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={cert.status === 'issued' ? 'default' : 'destructive'}>
                            {cert.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setPreviewCert(cert)} title="Preview">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDownload(cert)} title="Download">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
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
