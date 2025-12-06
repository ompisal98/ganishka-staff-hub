import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { toast } from 'sonner';
import {
  Users,
  BookOpen,
  GraduationCap,
  Receipt,
  Award,
  TrendingUp,
  Download,
  Calendar,
  IndianRupee,
  Loader2,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface ReportStats {
  totalStudents: number;
  activeStudents: number;
  totalCourses: number;
  activeBatches: number;
  activeEnrollments: number;
  completedEnrollments: number;
  totalReceipts: number;
  totalRevenue: number;
  certificatesIssued: number;
}

interface MonthlyData {
  month: string;
  enrollments: number;
  revenue: number;
  certificates: number;
}

interface CourseDistribution {
  name: string;
  students: number;
}

const COLORS = ['hsl(213, 69%, 39%)', 'hsl(195, 70%, 45%)', 'hsl(142, 70%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(280, 70%, 50%)'];

export default function Reports() {
  const [stats, setStats] = useState<ReportStats>({
    totalStudents: 0,
    activeStudents: 0,
    totalCourses: 0,
    activeBatches: 0,
    activeEnrollments: 0,
    completedEnrollments: 0,
    totalReceipts: 0,
    totalRevenue: 0,
    certificatesIssued: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [courseDistribution, setCourseDistribution] = useState<CourseDistribution[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<{ status: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6months');

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // Fetch all stats in parallel
      const [
        { count: totalStudents },
        { count: activeStudents },
        { count: totalCourses },
        { count: activeBatches },
        { count: activeEnrollments },
        { count: completedEnrollments },
        { count: totalReceipts },
        { data: receiptsData },
        { count: certificatesIssued },
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('batches').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('receipts').select('*', { count: 'exact', head: true }).eq('status', 'valid'),
        supabase.from('receipts').select('amount').eq('status', 'valid'),
        supabase.from('certificates').select('*', { count: 'exact', head: true }).eq('status', 'issued'),
      ]);

      const totalRevenue = (receiptsData || []).reduce((sum, r) => sum + (r.amount || 0), 0);

      setStats({
        totalStudents: totalStudents || 0,
        activeStudents: activeStudents || 0,
        totalCourses: totalCourses || 0,
        activeBatches: activeBatches || 0,
        activeEnrollments: activeEnrollments || 0,
        completedEnrollments: completedEnrollments || 0,
        totalReceipts: totalReceipts || 0,
        totalRevenue,
        certificatesIssued: certificatesIssued || 0,
      });

      // Fetch monthly data
      await fetchMonthlyData();
      
      // Fetch course distribution
      await fetchCourseDistribution();

      // Fetch attendance stats
      await fetchAttendanceStats();
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to fetch report data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMonthlyData = async () => {
    const months = dateRange === '12months' ? 12 : 6;
    const data: MonthlyData[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const monthStr = format(date, 'MMM yyyy');

      const [enrollRes, receiptRes, certRes] = await Promise.all([
        supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .gte('enrollment_date', start.toISOString())
          .lte('enrollment_date', end.toISOString()),
        supabase
          .from('receipts')
          .select('amount')
          .eq('status', 'valid')
          .gte('payment_date', start.toISOString())
          .lte('payment_date', end.toISOString()),
        supabase
          .from('certificates')
          .select('*', { count: 'exact', head: true })
          .gte('issue_date', start.toISOString())
          .lte('issue_date', end.toISOString()),
      ]);

      data.push({
        month: format(date, 'MMM'),
        enrollments: enrollRes.count || 0,
        revenue: (receiptRes.data || []).reduce((sum, r) => sum + (r.amount || 0), 0),
        certificates: certRes.count || 0,
      });
    }

    setMonthlyData(data);
  };

  const fetchCourseDistribution = async () => {
    const { data: courses } = await supabase.from('courses').select('id, name');
    if (!courses) return;

    const distribution: CourseDistribution[] = [];

    for (const course of courses) {
      const { count } = await supabase
        .from('enrollments')
        .select('*, batches!inner(course_id)', { count: 'exact', head: true })
        .eq('batches.course_id', course.id)
        .eq('status', 'active');

      if (count && count > 0) {
        distribution.push({
          name: course.name.length > 20 ? course.name.substring(0, 20) + '...' : course.name,
          students: count,
        });
      }
    }

    setCourseDistribution(distribution.slice(0, 5));
  };

  const fetchAttendanceStats = async () => {
    const { data } = await supabase.from('attendance').select('status');
    if (!data) return;

    const counts: Record<string, number> = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    data.forEach((record) => {
      if (counts[record.status] !== undefined) {
        counts[record.status]++;
      }
    });

    setAttendanceStats(
      Object.entries(counts).map(([status, count]) => ({ status, count }))
    );
  };

  const exportCSV = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Students', stats.totalStudents],
      ['Active Students', stats.activeStudents],
      ['Total Courses', stats.totalCourses],
      ['Active Batches', stats.activeBatches],
      ['Active Enrollments', stats.activeEnrollments],
      ['Completed Enrollments', stats.completedEnrollments],
      ['Total Receipts', stats.totalReceipts],
      ['Total Revenue (₹)', stats.totalRevenue],
      ['Certificates Issued', stats.certificatesIssued],
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  const statCards = [
    { title: 'Total Students', value: stats.totalStudents, subValue: `${stats.activeStudents} active`, icon: Users, color: 'bg-primary/10 text-primary' },
    { title: 'Active Batches', value: stats.activeBatches, subValue: `${stats.totalCourses} courses`, icon: BookOpen, color: 'bg-accent/10 text-accent' },
    { title: 'Active Enrollments', value: stats.activeEnrollments, subValue: `${stats.completedEnrollments} completed`, icon: GraduationCap, color: 'bg-success/10 text-success' },
    { title: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, subValue: `${stats.totalReceipts} receipts`, icon: IndianRupee, color: 'bg-warning/10 text-warning' },
    { title: 'Certificates', value: stats.certificatesIssued, subValue: 'Issued', icon: Award, color: 'bg-primary/10 text-primary' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Reports" subtitle="Analytics and insights" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Reports" subtitle="Analytics and insights" />

      <div className="p-6 space-y-6">
        {/* Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6months">Last 6 Months</SelectItem>
                      <SelectItem value="12months">Last 12 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((stat, index) => (
            <Card key={index} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                    <p className="text-xs text-muted-foreground">{stat.subValue}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enrollment & Revenue Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Enrollment Trends</CardTitle>
              <CardDescription>Monthly enrollments over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="enrollments" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Enrollments" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue collection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--success))" strokeWidth={2} dot={{ fill: 'hsl(var(--success))' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Course Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Course Distribution</CardTitle>
              <CardDescription>Students by course (top 5)</CardDescription>
            </CardHeader>
            <CardContent>
              {courseDistribution.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-muted-foreground">
                  No enrollment data
                </div>
              ) : (
                <div className="h-72 flex items-center">
                  <ResponsiveContainer width="60%" height="100%">
                    <PieChart>
                      <Pie
                        data={courseDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="students"
                      >
                        {courseDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {courseDistribution.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-muted-foreground truncate">{item.name}</span>
                        <span className="text-sm font-medium ml-auto">{item.students}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-display">Attendance Overview</CardTitle>
              <CardDescription>Overall attendance distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {attendanceStats.length === 0 || attendanceStats.every(s => s.count === 0) ? (
                <div className="h-72 flex items-center justify-center text-muted-foreground">
                  No attendance data
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis dataKey="status" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={60} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Certificates Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">Certificates Issued</CardTitle>
            <CardDescription>Monthly certificate issuance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="certificates" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Certificates" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
