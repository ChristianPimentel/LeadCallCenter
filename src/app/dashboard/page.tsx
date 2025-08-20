"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Phone,
  Mail,
  Filter,
  Voicemail,
  PhoneMissed,
  PhoneCall,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Group, Student, CallStatus, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


const initialGroups: Group[] = [
  { id: '1', name: 'Fall 2024 Admissions' },
  { id: '2', name: 'Spring 2025 Applicants' },
  { id: '3', name: 'Scholarship Candidates' },
];

const initialStudents: Student[] = [
  { id: '101', name: 'Alice Johnson', phone: '555-0101', email: 'alice@example.com', groupId: '1', callHistory: [{ status: 'Called', timestamp: new Date(Date.now() - 86400000 * 2).toISOString() }] },
  { id: '102', name: 'Bob Williams', phone: '555-0102', email: 'bob@example.com', groupId: '1', callHistory: [{ status: 'Voicemail', timestamp: new Date(Date.now() - 86400000 * 1).toISOString() }] },
  { id: '103', name: 'Charlie Brown', phone: '555-0103', email: 'charlie@example.com', groupId: '1', callHistory: [] },
  { id: '201', name: 'Diana Miller', phone: '555-0104', email: 'diana@example.com', groupId: '2', callHistory: [{ status: 'Missed Call', timestamp: new Date().toISOString() }] },
  { id: '202', name: 'Ethan Davis', phone: '555-0105', email: 'ethan@example.com', groupId: '2', callHistory: [] },
  { id: '301', name: 'Fiona Garcia', phone: '555-0106', email: 'fiona@example.com', groupId: '3', callHistory: [] },
];

const getStatusBadgeVariant = (status: CallStatus) => {
  switch (status) {
    case 'Called': return 'default';
    case 'Voicemail': return 'secondary';
    case 'Missed Call': return 'destructive';
    default: return 'outline';
  }
};

const getStatusIcon = (status: CallStatus) => {
  switch (status) {
    case 'Called': return <PhoneCall className="h-4 w-4 text-green-500" />;
    case 'Voicemail': return <Voicemail className="h-4 w-4 text-blue-500" />;
    case 'Missed Call': return <PhoneMissed className="h-4 w-4 text-red-500" />;
    default: return <Phone className="h-4 w-4 text-muted-foreground" />;
  }
};

export default function DashboardPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<CallStatus | 'all'>('all');
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Dialog states
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteGroupAlertOpen, setDeleteGroupAlertOpen] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    try {
      const storedGroups = localStorage.getItem('callflow-groups');
      const storedStudents = localStorage.getItem('callflow-students');
      const storedUser = localStorage.getItem('callflow-currentUser');

      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
      
      const loadedGroups = storedGroups ? JSON.parse(storedGroups) : initialGroups;
      setGroups(loadedGroups);

      if (loadedGroups.length > 0 && !selectedGroupId) {
        setSelectedGroupId(loadedGroups[0].id);
      }
      
      setStudents(storedStudents ? JSON.parse(storedStudents) : initialStudents);
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
      setGroups(initialGroups);
      setStudents(initialStudents);
       if (initialGroups.length > 0) {
        setSelectedGroupId(initialGroups[0].id);
      }
    }
  }, []);
  
  useEffect(() => {
    if(isClient) {
      localStorage.setItem('callflow-groups', JSON.stringify(groups));
      localStorage.setItem('callflow-students', JSON.stringify(students));
    }
  }, [groups, students, isClient]);


  const selectedGroup = useMemo(() => groups.find(g => g.id === selectedGroupId), [groups, selectedGroupId]);
  
  const filteredStudents = useMemo(() => {
    if (!selectedGroupId) return [];
    return students
      .filter(s => s.groupId === selectedGroupId)
      .filter(s => {
        if (filterStatus === 'all') return true;
        const lastCallStatus = s.callHistory[s.callHistory.length - 1]?.status ?? 'Not Called';
        return lastCallStatus === filterStatus;
      });
  }, [students, selectedGroupId, filterStatus]);

  const handleGroupFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('groupName') as string;
    
    if (editingGroup) {
      setGroups(groups.map(g => g.id === editingGroup.id ? { ...g, name } : g));
      toast({ title: "Group Updated", description: `Group "${name}" has been updated.`});
    } else {
      const newGroup: Group = { id: Date.now().toString(), name };
      setGroups([...groups, newGroup]);
      toast({ title: "Group Created", description: `Group "${name}" has been created.`});
    }
    setGroupDialogOpen(false);
    setEditingGroup(null);
  };
  
  const handleDeleteGroup = () => {
    if (!deletingGroupId) return;
    setGroups(groups.filter(g => g.id !== deletingGroupId));
    setStudents(students.filter(s => s.groupId !== deletingGroupId));
    if (selectedGroupId === deletingGroupId) {
      setSelectedGroupId(groups.length > 1 ? groups.find(g => g.id !== deletingGroupId)!.id : null);
    }
    toast({ title: "Group Deleted", description: "The group and its students have been deleted."});
    setDeleteGroupAlertOpen(false);
    setDeletingGroupId(null);
  };

  const handleStudentFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('studentName') as string;
    const phone = formData.get('studentPhone') as string;
    const email = formData.get('studentEmail') as string;

    if (editingStudent) {
      setStudents(students.map(s => s.id === editingStudent.id ? { ...s, name, phone, email } : s));
      toast({ title: "Student Updated", description: `${name}'s profile has been updated.` });
    } else {
      const newStudent: Student = { id: Date.now().toString(), name, phone, email, groupId: selectedGroupId!, callHistory: [] };
      setStudents([...students, newStudent]);
      toast({ title: "Student Added", description: `${name} has been added to the group.` });
    }
    setStudentDialogOpen(false);
    setEditingStudent(null);
  };

  const handleLogCall = (studentId: string, status: CallStatus) => {
    setStudents(students.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          callHistory: [...s.callHistory, { status, timestamp: new Date().toISOString() }]
        };
      }
      return s;
    }));
    toast({ title: "Call Logged", description: `Call status for student updated to "${status}".` });
  };

  const isAdmin = currentUser?.role === 'Admin';
  
  if (!isClient) {
    return null; // or a loading spinner
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <div className="xl:col-span-1">
        <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Groups</CardTitle>
                <CardDescription>Select a group to view students.</CardDescription>
              </div>
              {isAdmin && (
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => { setEditingGroup(null); setGroupDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Group
                  </Button>
                </DialogTrigger>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Students</TableHead>
                    {isAdmin && <TableHead><span className="sr-only">Actions</span></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map(group => {
                    const groupStudents = students.filter(s => s.groupId === group.id);
                    return (
                      <TableRow
                        key={group.id}
                        className={`cursor-pointer ${selectedGroupId === group.id ? 'bg-muted/50' : ''}`}
                        onClick={() => setSelectedGroupId(group.id)}
                      >
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell>{groupStudents.length}</TableCell>
                        {isAdmin && (
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0" onClick={e => e.stopPropagation()}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingGroup(group); setGroupDialogOpen(true); }}>
                                  <Edit className="mr-2 h-4 w-4" /> Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDeletingGroupId(group.id); setDeleteGroupAlertOpen(true); }} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGroup ? 'Edit Group' : 'Create New Group'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleGroupFormSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="groupName" className="text-right">Name</Label>
                  <Input id="groupName" name="groupName" defaultValue={editingGroup?.name} className="col-span-3" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingGroup ? 'Save Changes' : 'Create Group'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="xl:col-span-2">
        <Dialog open={studentDialogOpen} onOpenChange={setStudentDialogOpen}>
          {selectedGroupId ? (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle>{selectedGroup?.name} Students</CardTitle>
                        <CardDescription>Manage students in this group.</CardDescription>
                    </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-auto flex-1">
                      <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as CallStatus | 'all')}>
                        <SelectTrigger className="pl-8 w-full sm:w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="Not Called">Not Called</SelectItem>
                          <SelectItem value="Called">Called</SelectItem>
                          <SelectItem value="Voicemail">Voicemail</SelectItem>
                          <SelectItem value="Missed Call">Missed Call</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                     <DialogTrigger asChild>
                        <Button onClick={() => { setEditingStudent(null); setStudentDialogOpen(true); }} className="w-full sm:w-auto flex-1 sm:flex-initial">
                          <Plus className="mr-2 h-4 w-4" /> Add Student
                        </Button>
                    </DialogTrigger>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Contact</TableHead>
                      <TableHead>Last Call Status</TableHead>
                      <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length > 0 ? filteredStudents.map(student => {
                      const lastCall = student.callHistory[student.callHistory.length - 1];
                      const status: CallStatus = lastCall?.status ?? 'Not Called';
                      return (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground md:hidden">{student.email}</div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground"/> {student.phone}
                            </div>
                             <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4"/> {student.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(status)} className="flex items-center gap-2 w-fit">
                                {getStatusIcon(status)}
                                {status}
                            </Badge>
                             {lastCall && <div className="text-xs text-muted-foreground mt-1">{new Date(lastCall.timestamp).toLocaleString()}</div>}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleLogCall(student.id, 'Called')}>Log "Called"</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleLogCall(student.id, 'Voicemail')}>Log "Voicemail"</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleLogCall(student.id, 'Missed Call')}>Log "Missed Call"</DropdownMenuItem>
                                {isAdmin && <>
                                  <Separator />
                                  <DialogTrigger asChild>
                                    <DropdownMenuItem onClick={() => { setEditingStudent(student); setStudentDialogOpen(true); }}>Edit</DropdownMenuItem>
                                  </DialogTrigger>
                                </>}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    }) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                No students found.
                            </TableCell>
                        </TableRow>
                    )}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
             <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full min-h-[400px]">
                <div className="flex flex-col items-center gap-1 text-center">
                    <Users className="h-12 w-12 text-muted-foreground" />
                    <h3 className="text-2xl font-bold tracking-tight">
                        No group selected
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Select a group to view students.
                    </p>
                </div>
            </div>
          )}
           <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleStudentFormSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="studentName" className="text-right">Name</Label>
                    <Input id="studentName" name="studentName" defaultValue={editingStudent?.name} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="studentPhone" className="text-right">Phone</Label>
                    <Input id="studentPhone" name="studentPhone" type="tel" defaultValue={editingStudent?.phone} className="col-span-3" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="studentEmail" className="text-right">Email</Label>
                    <Input id="studentEmail" name="studentEmail" type="email" defaultValue={editingStudent?.email} className="col-span-3" required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">{editingStudent ? 'Save Changes' : 'Add Student'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
      </div>
      
      {/* Delete Group Alert */}
      <AlertDialog open={deleteGroupAlertOpen} onOpenChange={setDeleteGroupAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the group and all associated students.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
