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
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Receipt, IndianRupee, Loader2, Plus, FileText, Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { downloadReceiptPDF } from '@/lib/pdf-generator';

interface ReceiptData {
  id: string;
  receipt_number: string;
  amount: number;
  payment_mode: string;
  payment_date: string;
  description: string | null;
  remarks: string | null;
  status: string;
  receipt_type: string | null;
  created_at: string;
  students?: { full_name: string; admission_number: string };
  enrollments?: { batches?: { name: string; code: string; courses?: { name: string } } } | null;
}

interface Student {
  id: string;
  full_name: string;
  admission_number: string;
}

interface Enrollment {
  id: string;
  student_id: string;
  batch_id: string;
  batches?: { name: string; code: string; courses?: { name: string } };
}

export default function Receipts() {
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<ReceiptData | null>(null);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    student_id: '',
    enrollment_id: '',
    amount: '',
    payment_mode: 'cash',
    receipt_type: 'GA',
    description: '',
    remarks: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [receiptsRes, studentsRes] = await Promise.all([
        supabase
          .from('receipts')
          .select('*, students(full_name, admission_number), enrollments(batches(name, code, courses(name)))')
          .order('created_at', { ascending: false }),
        supabase.from('students').select('id, full_name, admission_number').eq('is_active', true),
      ]);

      if (receiptsRes.error) throw receiptsRes.error;
      if (studentsRes.error) throw studentsRes.error;

      setReceipts(receiptsRes.data || []);
      setStudents(studentsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEnrollments = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('id, student_id, batch_id, batches(name, code, courses(name))')
        .eq('student_id', studentId)
        .eq('status', 'active');

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const generateReceiptNumber = async () => {
    const { data, error } = await supabase.rpc('generate_receipt_number');
    if (error) throw error;
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const receiptNumber = await generateReceiptNumber();

      const { error } = await supabase.from('receipts').insert([{
        receipt_number: receiptNumber,
        student_id: formData.student_id,
        enrollment_id: formData.enrollment_id || null,
        amount: parseFloat(formData.amount),
        payment_mode: formData.payment_mode as any,
        receipt_type: formData.receipt_type,
        description: formData.description || null,
        remarks: formData.remarks || null,
      }]);

      if (error) throw error;
      toast.success('Receipt generated successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error generating receipt:', error);
      toast.error(error.message || 'Failed to generate receipt');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      enrollment_id: '',
      amount: '',
      payment_mode: 'cash',
      receipt_type: 'GA',
      description: '',
      remarks: '',
    });
    setEnrollments([]);
  };

  const handleDownload = async (receipt: ReceiptData) => {
    setIsDownloading(receipt.id);
    try {
      await downloadReceiptPDF({
        receipt_number: receipt.receipt_number,
        student_name: receipt.students?.full_name || '',
        admission_number: receipt.students?.admission_number || '',
        amount: receipt.amount,
        payment_mode: receipt.payment_mode,
        payment_date: format(new Date(receipt.payment_date), 'dd/MM/yyyy'),
        description: receipt.description,
        batch_name: receipt.enrollments?.batches?.name || null,
        course_name: receipt.enrollments?.batches?.courses?.name || null,
        receipt_type: receipt.receipt_type || 'GA',
        status: receipt.status,
      });
      toast.success('Receipt PDF opened - use Print > Save as PDF to download');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate PDF');
    } finally {
      setIsDownloading(null);
    }
  };

  const filteredReceipts = receipts.filter(
    (receipt) =>
      receipt.receipt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.students?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      receipt.students?.admission_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paymentModes = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'upi', label: 'UPI' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
  ];

  return (
    <div className="min-h-screen">
      <Header title="Receipts" subtitle="Generate and manage payment receipts" />

      {/* Receipt Preview Modal */}
      {previewReceipt && (
        <Dialog open={!!previewReceipt} onOpenChange={() => setPreviewReceipt(null)}>
          <DialogContent className="max-w-md">
            <div className="space-y-4">
              <div className="text-center p-4 bg-primary text-primary-foreground rounded-t-lg -m-6 mb-4">
                <h2 className="text-xl font-bold">GANISHKA TECHNOLOGY</h2>
                <p className="text-sm opacity-80">Tech Coaching Institute</p>
              </div>
              <div className="text-center border-b pb-4">
                <h3 className="font-semibold">Payment Receipt</h3>
                <p className="text-sm text-muted-foreground font-mono">{previewReceipt.receipt_number}</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{format(new Date(previewReceipt.payment_date), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student</span>
                  <span>{previewReceipt.students?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Admission No</span>
                  <span>{previewReceipt.students?.admission_number}</span>
                </div>
                {previewReceipt.enrollments?.batches && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Batch</span>
                      <span>{previewReceipt.enrollments.batches.name}</span>
                    </div>
                    {previewReceipt.enrollments.batches.courses && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Course</span>
                        <span>{previewReceipt.enrollments.batches.courses.name}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receipt Type</span>
                  <Badge variant="outline">{previewReceipt.receipt_type || 'GA'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Mode</span>
                  <span className="capitalize">{previewReceipt.payment_mode.replace('_', ' ')}</span>
                </div>
                {previewReceipt.description && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Description</span>
                    <span>{previewReceipt.description}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-3 mt-3">
                  <span className="font-semibold">Amount Paid</span>
                  <span className="text-xl font-bold text-primary">₹{previewReceipt.amount.toLocaleString()}</span>
                </div>
              </div>
              <div className="text-center">
                <Badge variant={previewReceipt.status === 'valid' ? 'default' : 'destructive'}>
                  {previewReceipt.status}
                </Badge>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewReceipt(null)}>Close</Button>
              <Button onClick={() => handleDownload(previewReceipt)} disabled={isDownloading === previewReceipt.id}>
                {isDownloading === previewReceipt.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Download PDF
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
                  placeholder="Search by receipt number, student..."
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
                    Generate Receipt
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Generate Receipt</DialogTitle>
                    <DialogDescription>Create a new payment receipt for a student</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="student_id">Student *</Label>
                      <Select
                        value={formData.student_id}
                        onValueChange={(value) => {
                          setFormData({ ...formData, student_id: value, enrollment_id: '' });
                          fetchEnrollments(value);
                        }}
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

                    {enrollments.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="enrollment_id">Batch (Optional)</Label>
                        <Select
                          value={formData.enrollment_id}
                          onValueChange={(value) => setFormData({ ...formData, enrollment_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select batch" />
                          </SelectTrigger>
                          <SelectContent>
                            {enrollments.map((enrollment) => (
                              <SelectItem key={enrollment.id} value={enrollment.id}>
                                {enrollment.batches?.name} ({enrollment.batches?.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (₹) *</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          placeholder="Enter amount"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment_mode">Payment Mode</Label>
                        <Select
                          value={formData.payment_mode}
                          onValueChange={(value) => setFormData({ ...formData, payment_mode: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentModes.map((mode) => (
                              <SelectItem key={mode.value} value={mode.value}>
                                {mode.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="receipt_type">Receipt Type *</Label>
                        <Select
                          value={formData.receipt_type}
                          onValueChange={(value) => setFormData({ ...formData, receipt_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GA">GA (Ganishka Academy)</SelectItem>
                            <SelectItem value="GT">GT (Ganishka Technology)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="e.g., Course Fee Installment 1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="remarks">Remarks</Label>
                      <Textarea
                        id="remarks"
                        value={formData.remarks}
                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        rows={2}
                        placeholder="Additional notes..."
                      />
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          'Generate Receipt'
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
            <CardTitle className="text-lg font-display">All Receipts ({filteredReceipts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredReceipts.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">No receipts found</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                  Generate your first receipt
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt No.</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReceipts.map((receipt) => (
                      <TableRow key={receipt.id}>
                        <TableCell className="font-mono text-sm">{receipt.receipt_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{receipt.students?.full_name}</p>
                            <p className="text-xs text-muted-foreground">{receipt.students?.admission_number}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-semibold">
                            <IndianRupee className="h-3 w-3" />
                            {receipt.amount.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {receipt.payment_mode.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(receipt.payment_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={receipt.status === 'valid' ? 'default' : 'destructive'}>
                            {receipt.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setPreviewReceipt(receipt)} title="Preview">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDownload(receipt)} 
                              title="Download PDF"
                              disabled={isDownloading === receipt.id}
                            >
                              {isDownloading === receipt.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
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
