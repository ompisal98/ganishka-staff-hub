import { useState, useEffect, useRef } from 'react';
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
import { Search, FileDown, Receipt, IndianRupee, Loader2, Plus, Printer, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

interface ReceiptData {
  id: string;
  receipt_number: string;
  amount: number;
  payment_mode: string;
  payment_date: string;
  description: string | null;
  remarks: string | null;
  status: string;
  created_at: string;
  students?: { full_name: string; admission_number: string };
  enrollments?: { batches?: { name: string; code: string } } | null;
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
  batches?: { name: string; code: string };
}

export default function Receipts() {
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    student_id: '',
    enrollment_id: '',
    amount: '',
    payment_mode: 'cash',
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
          .select('*, students(full_name, admission_number), enrollments(batches(name, code))')
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
        .select('id, student_id, batch_id, batches(name, code)')
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
      description: '',
      remarks: '',
    });
    setEnrollments([]);
  };

  const handlePrint = (receipt: ReceiptData) => {
    setSelectedReceipt(receipt);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleDownload = (receipt: ReceiptData) => {
    // Create a simple receipt PDF content
    const content = `
      GANISHKA TECHNOLOGY
      Receipt No: ${receipt.receipt_number}
      Date: ${format(new Date(receipt.payment_date), 'dd/MM/yyyy')}
      
      Student: ${receipt.students?.full_name}
      Admission No: ${receipt.students?.admission_number}
      
      Amount: ₹${receipt.amount.toLocaleString()}
      Payment Mode: ${receipt.payment_mode.toUpperCase()}
      ${receipt.description ? `Description: ${receipt.description}` : ''}
      
      Thank you for your payment!
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt-${receipt.receipt_number}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Receipt downloaded');
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

      {/* Print Template - Hidden on screen */}
      {selectedReceipt && (
        <div className="hidden print:block" ref={printRef}>
          <div className="p-8 max-w-lg mx-auto">
            <div className="text-center border-b-2 pb-4 mb-4">
              <h1 className="text-2xl font-bold">GANISHKA TECHNOLOGY</h1>
              <p className="text-sm text-gray-600">Tech Coaching Institute</p>
            </div>
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold">PAYMENT RECEIPT</h2>
              <p className="font-mono">{selectedReceipt.receipt_number}</p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{format(new Date(selectedReceipt.payment_date), 'dd/MM/yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span>Student Name:</span>
                <span>{selectedReceipt.students?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Admission No:</span>
                <span>{selectedReceipt.students?.admission_number}</span>
              </div>
              {selectedReceipt.enrollments?.batches && (
                <div className="flex justify-between">
                  <span>Batch:</span>
                  <span>{selectedReceipt.enrollments.batches.name}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-3 mt-3">
                <span className="font-semibold">Amount Paid:</span>
                <span className="font-bold text-lg">₹{selectedReceipt.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="capitalize">{selectedReceipt.payment_mode}</span>
              </div>
              {selectedReceipt.description && (
                <div className="flex justify-between">
                  <span>Description:</span>
                  <span>{selectedReceipt.description}</span>
                </div>
              )}
            </div>
            <div className="border-t pt-4 mt-6 text-center text-sm text-gray-600">
              <p>Thank you for your payment!</p>
              <p className="mt-2">This is a computer-generated receipt.</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 space-y-6 no-print">
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

                    <div className="grid grid-cols-2 gap-4">
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
                            <Button variant="ghost" size="icon" onClick={() => handlePrint(receipt)} title="Print">
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDownload(receipt)} title="Download">
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
