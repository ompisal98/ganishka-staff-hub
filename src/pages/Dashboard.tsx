import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import {
  Users,
  BookOpen,
  Calendar,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Receipt,
  Award,
  ClipboardCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  activeBatches: number;
  totalEnrollments: number;
  receiptsThisMonth: number;
  certificatesIssued: number;
}

const COLORS = ['hsl(213, 69%, 39%)', 'hsl(195, 70%, 45%)', 'hsl(142, 70%, 45%)', 'hsl(38, 92%, 50%)'];

export default function Dashboard() {
  const { profile, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalCourses: 0,
    activeBatches: 0,
    totalEnrollments: 0,
    receiptsThisMonth: 0,
    certificatesIssued: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [
        { count: studentsCount },
        { count: coursesCount },
        { count: batchesCount },
        { count: enrollmentsCount },
        { count: receiptsCount },
        { count: certificatesCount },
      ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('batches').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('receipts').select('*', { count: 'exact', head: true }).eq('status', 'valid'),
        supabase.from('certificates').select('*', { count: 'exact', head: true }).eq('status', 'issued'),
      ]);

      setStats({
        totalStudents: studentsCount || 0,
        totalCourses: coursesCount || 0,
        activeBatches: batchesCount || 0,
        totalEnrollments: enrollmentsCount || 0,
        receiptsThisMonth: receiptsCount || 0,
        certificatesIssued: certificatesCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      trend: '+12%',
      trendUp: true,
      color: 'bg-primary/10 text-primary',
      href: '/students',
    },
    {
      title: 'Active Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      trend: '+5%',
      trendUp: true,
      color: 'bg-accent/10 text-accent',
      href: '/courses',
    },
    {
      title: 'Active Batches',
      value: stats.activeBatches,
      icon: Calendar,
      trend: '+8%',
      trendUp: true,
      color: 'bg-success/10 text-success',
      href: '/batches',
    },
    {
      title: 'Active Enrollments',
      value: stats.totalEnrollments,
      icon: GraduationCap,
      trend: '+15%',
      trendUp: true,
      color: 'bg-warning/10 text-warning',
      href: '/enrollments',
    },
  ];

  const enrollmentChartData = [
    { name: 'Jan', enrollments: 65 },
    { name: 'Feb', enrollments: 78 },
    { name: 'Mar', enrollments: 90 },
    { name: 'Apr', enrollments: 81 },
    { name: 'May', enrollments: 95 },
    { name: 'Jun', enrollments: 110 },
  ];

  const courseDistribution = [
    { name: 'Web Development', value: 35 },
    { name: 'Data Science', value: 25 },
    { name: 'Mobile Apps', value: 20 },
    { name: 'Others', value: 20 },
  ];

  const quickActions = [
    { label: 'Add Student', icon: Users, href: '/students?action=add' },
    { label: 'New Enrollment', icon: GraduationCap, href: '/enrollments?action=add' },
    { label: 'Mark Attendance', icon: ClipboardCheck, href: '/attendance' },
    { label: 'Generate Receipt', icon: Receipt, href: '/receipts?action=add' },
  ];

  return (
    <div className="min-h-screen">
      <Header
        title={`Welcome back, ${profile?.full_name?.split(' ')[0] || 'Staff'}!`}
        subtitle="Here's what's happening at Ganishka Technology today"
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <Link key={index} to={stat.href}>
              <Card className="hover:shadow-medium transition-all duration-200 cursor-pointer group animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-display font-bold mt-2">
                        {isLoading ? '...' : stat.value.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        {stat.trendUp ? (
                          <TrendingUp className="h-3 w-3 text-success" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-destructive" />
                        )}
                        <span className={`text-xs font-medium ${stat.trendUp ? 'text-success' : 'text-destructive'}`}>
                          {stat.trend}
                        </span>
                        <span className="text-xs text-muted-foreground">vs last month</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display">Quick Actions</CardTitle>
            <CardDescription>Common tasks you perform frequently</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map((action, index) => (
                <Link key={index} to={action.href}>
                  <Button
                    variant="outline"
                    className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                  >
                    <action.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enrollment Trends */}
          <Card className="animate-slide-up" style={{ animationDelay: '300ms' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-display">Enrollment Trends</CardTitle>
                  <CardDescription>Monthly student enrollments</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/reports">
                    View Report <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={enrollmentChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="enrollments" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Course Distribution */}
          <Card className="animate-slide-up" style={{ animationDelay: '400ms' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-display">Course Distribution</CardTitle>
                  <CardDescription>Students by course category</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/courses">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={courseDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
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
                <div className="space-y-2 ml-4">
                  {courseDistribution.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                      <span className="text-sm font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="animate-slide-up" style={{ animationDelay: '500ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Receipts</p>
                  <p className="text-2xl font-display font-bold">{stats.receiptsThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up" style={{ animationDelay: '550ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-success/10">
                  <Award className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Certificates Issued</p>
                  <p className="text-2xl font-display font-bold">{stats.certificatesIssued}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up" style={{ animationDelay: '600ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-accent/10">
                  <ClipboardCheck className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Attendance</p>
                  <p className="text-2xl font-display font-bold">87%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
