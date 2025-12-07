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
import { Search, MoreHorizontal, Pencil, UserCog, Loader2, Shield, Phone, Mail, Building2, Plus, UserPlus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';

interface StaffProfile {
  id: string;
  user_id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  branch_id: string | null;
  is_active: boolean;
  created_at: string;
  branches?: { name: string } | null;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'branch_manager' | 'trainer' | 'accounts' | 'reception';
}

interface Branch {
  id: string;
  name: string;
}

const ROLES = [
  { value: 'admin', label: 'Administrator', color: 'bg-destructive text-destructive-foreground' },
  { value: 'branch_manager', label: 'Branch Manager', color: 'bg-primary text-primary-foreground' },
  { value: 'trainer', label: 'Trainer', color: 'bg-success text-success-foreground' },
  { value: 'accounts', label: 'Accounts', color: 'bg-warning text-warning-foreground' },
  { value: 'reception', label: 'Reception', color: 'bg-accent text-accent-foreground' },
];

export default function Staff() {
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, UserRole[]>>({});
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedStaffForRoles, setSelectedStaffForRoles] = useState<StaffProfile | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    designation: '',
    branch_id: '',
    is_active: true,
  });

  const [newStaffData, setNewStaffData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    designation: '',
    branch_id: '',
    role: 'reception' as string,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [staffRes, rolesRes, branchesRes] = await Promise.all([
        supabase
          .from('staff_profiles')
          .select('*, branches(name)')
          .order('created_at', { ascending: false }),
        supabase.from('user_roles').select('*'),
        supabase.from('branches').select('id, name').eq('is_active', true),
      ]);

      if (staffRes.error) throw staffRes.error;
      if (rolesRes.error) throw rolesRes.error;
      if (branchesRes.error) throw branchesRes.error;

      setStaffList(staffRes.data || []);
      setBranches(branchesRes.data || []);

      // Group roles by user_id
      const rolesMap: Record<string, UserRole[]> = {};
      (rolesRes.data || []).forEach((role: UserRole) => {
        if (!rolesMap[role.user_id]) {
          rolesMap[role.user_id] = [];
        }
        rolesMap[role.user_id].push(role);
      });
      setUserRoles(rolesMap);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch staff data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (staff: StaffProfile) => {
    setEditingStaff(staff);
    setFormData({
      full_name: staff.full_name,
      phone: staff.phone || '',
      designation: staff.designation || '',
      branch_id: staff.branch_id || '',
      is_active: staff.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handleManageRoles = (staff: StaffProfile) => {
    setSelectedStaffForRoles(staff);
    const currentRoles = userRoles[staff.user_id]?.map(r => r.role) || [];
    setSelectedRoles(currentRoles);
    setIsRoleDialogOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('staff_profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          designation: formData.designation || null,
          branch_id: formData.branch_id || null,
          is_active: formData.is_active,
        })
        .eq('id', editingStaff.id);

      if (error) throw error;
      toast.success('Staff profile updated');
      setIsEditDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRoles = async () => {
    if (!selectedStaffForRoles) return;
    setIsSaving(true);

    try {
      // Delete existing roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedStaffForRoles.user_id);

      // Insert new roles
      if (selectedRoles.length > 0) {
        const newRoles = selectedRoles.map(role => ({
          user_id: selectedStaffForRoles.user_id,
          role: role as any,
        }));

        const { error } = await supabase.from('user_roles').insert(newRoles);
        if (error) throw error;
      }

      toast.success('Roles updated successfully');
      setIsRoleDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update roles');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newStaffData.email,
        password: newStaffData.password,
        options: {
          data: {
            full_name: newStaffData.full_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Wait a bit for the trigger to create the staff profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update staff profile with additional info
      const { error: updateError } = await supabase
        .from('staff_profiles')
        .update({
          phone: newStaffData.phone || null,
          designation: newStaffData.designation || null,
          branch_id: newStaffData.branch_id || null,
        })
        .eq('user_id', authData.user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
      }

      // Assign role
      if (newStaffData.role) {
        const { error: roleError } = await supabase.from('user_roles').insert({
          user_id: authData.user.id,
          role: newStaffData.role as any,
        });

        if (roleError) {
          console.error('Error assigning role:', roleError);
        }
      }

      toast.success('Staff member added successfully');
      setIsAddDialogOpen(false);
      setNewStaffData({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        designation: '',
        branch_id: '',
        role: 'reception',
      });
      fetchData();
    } catch (error: any) {
      console.error('Error adding staff:', error);
      toast.error(error.message || 'Failed to add staff member');
    } finally {
      setIsCreating(false);
    }
  };

  const toggleActive = async (staff: StaffProfile) => {
    try {
      const { error } = await supabase
        .from('staff_profiles')
        .update({ is_active: !staff.is_active })
        .eq('id', staff.id);

      if (error) throw error;
      toast.success(`Staff ${staff.is_active ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const filteredStaff = staffList.filter(
    (staff) =>
      staff.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadges = (userId: string) => {
    const roles = userRoles[userId] || [];
    if (roles.length === 0) {
      return <Badge variant="outline">No roles</Badge>;
    }
    return roles.map((role) => {
      const roleConfig = ROLES.find(r => r.value === role.role);
      return (
        <Badge key={role.id} className={roleConfig?.color || ''}>
          {roleConfig?.label || role.role}
        </Badge>
      );
    });
  };

  return (
    <div className="min-h-screen">
      <Header title="Staff Management" subtitle="Manage staff accounts and roles" />

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Profile</DialogTitle>
            <DialogDescription>Update staff member information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="space-y-2">
              <Label>Designation</Label>
              <Input
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="e.g., Senior Trainer"
              />
            </div>
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select
                value={formData.branch_id}
                onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Branch</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Roles Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Roles</DialogTitle>
            <DialogDescription>
              Assign roles to {selectedStaffForRoles?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {ROLES.map((role) => (
              <div key={role.value} className="flex items-center space-x-3 p-3 rounded-lg border">
                <Checkbox
                  id={role.value}
                  checked={selectedRoles.includes(role.value)}
                  onCheckedChange={() => toggleRole(role.value)}
                />
                <div className="flex-1">
                  <Label htmlFor={role.value} className="font-medium cursor-pointer">
                    {role.label}
                  </Label>
                </div>
                <Badge className={role.color}>{role.label}</Badge>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRoles} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Roles'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Staff Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
            <DialogDescription>Create a new staff account with login credentials</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStaff} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={newStaffData.full_name}
                  onChange={(e) => setNewStaffData({ ...newStaffData, full_name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={newStaffData.phone}
                  onChange={(e) => setNewStaffData({ ...newStaffData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={newStaffData.email}
                  onChange={(e) => setNewStaffData({ ...newStaffData, email: e.target.value })}
                  placeholder="staff@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input
                  type="password"
                  value={newStaffData.password}
                  onChange={(e) => setNewStaffData({ ...newStaffData, password: e.target.value })}
                  placeholder="Min 6 characters"
                  minLength={6}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Designation</Label>
                <Input
                  value={newStaffData.designation}
                  onChange={(e) => setNewStaffData({ ...newStaffData, designation: e.target.value })}
                  placeholder="e.g., Senior Trainer"
                />
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select
                  value={newStaffData.branch_id}
                  onValueChange={(value) => setNewStaffData({ ...newStaffData, branch_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Branch</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select
                value={newStaffData.role}
                onValueChange={(value) => setNewStaffData({ ...newStaffData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Staff
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="p-6 space-y-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="gradient" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Staff
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">All Staff ({filteredStaff.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-8">
                <UserCog className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">No staff members found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((staff) => (
                      <TableRow key={staff.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{staff.full_name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{staff.employee_id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {staff.email}
                            </div>
                            {staff.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {staff.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {staff.branches?.name || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {getRoleBadges(staff.user_id)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={staff.is_active ? 'default' : 'secondary'}>
                            {staff.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(staff.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(staff)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManageRoles(staff)}>
                                <Shield className="h-4 w-4 mr-2" />
                                Manage Roles
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => toggleActive(staff)}>
                                {staff.is_active ? 'Deactivate' : 'Activate'}
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
