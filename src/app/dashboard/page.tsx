
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  Activity,
  User,
  Users2,
  Settings,
  Upload,
  Database,
  ExternalLink
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
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
import type { Group, Student, CallStatus, User as AppUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, where, writeBatch, getDocs, Timestamp, arrayUnion } from 'firebase/firestore';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { PieChart, Pie, Cell } from "recharts"
import { cn } from '@/lib/utils';

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
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<CallStatus | 'all'>('all');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  // Dialog states
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteGroupAlertOpen, setDeleteGroupAlertOpen] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('callflow-currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const groupsCollection = collection(db, 'groups');
    const studentsCollection = collection(db, 'students');

    const unsubscribeGroups = onSnapshot(groupsCollection, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
      setAllGroups(groupsData);
    });
    
    const unsubscribeStudents = onSnapshot(studentsCollection, (snapshot) => {
      const studentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setAllStudents(studentsData);
    });

    return () => {
      unsubscribeGroups();
      unsubscribeStudents();
    };
  }, [currentUser]);

  const isAdmin = currentUser?.role === 'Admin';

  const userGroups = useMemo(() => {
    if (!currentUser) return [];
    if (isAdmin) return allGroups;
    return allGroups.filter(g => g.createdBy === currentUser.id);
  }, [allGroups, currentUser, isAdmin]);

  const studentsForUser = useMemo(() => {
    if (!currentUser) return [];
    if (isAdmin) return allStudents;
    const userGroupIds = userGroups.map(g => g.id);
    return allStudents.filter(s => userGroupIds.includes(s.groupId));
  }, [allStudents, userGroups, currentUser, isAdmin]);

  useEffect(() => {
    if (userGroups.length > 0 && !userGroups.find(g => g.id === selectedGroupId)) {
        setSelectedGroupId(userGroups[0].id);
    } else if (userGroups.length === 0) {
        setSelectedGroupId(null);
    }
  }, [userGroups, selectedGroupId]);

  const selectedGroup = useMemo(() => userGroups.find(g => g.id === selectedGroupId), [userGroups, selectedGroupId]);
  
  const studentsInSelectedGroup = useMemo(() => {
     if (!selectedGroupId) return [];
     return allStudents.filter(s => s.groupId === selectedGroupId);
  }, [allStudents, selectedGroupId]);

  const filteredStudents = useMemo(() => {
    if (!selectedGroupId || !currentUser) return [];
    
    const students = studentsInSelectedGroup.filter(s => {
        const lastCallStatus = s.callHistory[s.callHistory.length - 1]?.status ?? 'Not Called';
        if (filterStatus === 'all') return true;
        if (filterStatus === 'Not Called') return s.callHistory.length === 0;
        return lastCallStatus === filterStatus;
      });
    
    // Sort by last call timestamp descending to prioritize recently called students
    return students.sort((a, b) => {
        const lastCallA = a.callHistory[a.callHistory.length - 1];
        const lastCallB = b.callHistory[b.callHistory.length - 1];
        if (!lastCallA && !lastCallB) return 0;
        if (!lastCallA) return 1;
        if (!lastCallB) return -1;
        return lastCallB.timestamp.toMillis() - lastCallA.timestamp.toMillis();
    });

  }, [studentsInSelectedGroup, selectedGroupId, filterStatus, currentUser, isAdmin]);

  const handleGroupFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('groupName') as string;
    
    try {
      if (editingGroup) {
        const groupDoc = doc(db, 'groups', editingGroup.id);
        await updateDoc(groupDoc, { name });
        toast({ title: "Group Updated", description: `Group "${name}" has been updated.`});
      } else {
        await addDoc(collection(db, 'groups'), { name, createdBy: currentUser.id });
        toast({ title: "Group Created", description: `Group "${name}" has been created.`});
      }
    } catch (error) {
      console.error("Error saving group:", error);
      toast({ title: "Error", description: "Could not save group.", variant: "destructive" });
    }

    setGroupDialogOpen(false);
    setEditingGroup(null);
  };
  
  const handleDeleteGroup = async () => {
    if (!deletingGroupId) return;
    try {
      const batch = writeBatch(db);
      
      const groupDoc = doc(db, 'groups', deletingGroupId);
      batch.delete(groupDoc);
      
      const q = query(collection(db, 'students'), where('groupId', '==', deletingGroupId));
      const studentsSnapshot = await getDocs(q);
      studentsSnapshot.forEach(doc => batch.delete(doc.ref));

      await batch.commit();

      if (selectedGroupId === deletingGroupId) {
        const remainingGroups = userGroups.filter(g => g.id !== deletingGroupId);
        setSelectedGroupId(remainingGroups.length > 0 ? remainingGroups[0].id : null);
      }
      toast({ title: "Group Deleted", description: "The group and its students have been deleted."});
    } catch (error) {
       console.error("Error deleting group:", error);
       toast({ title: "Error", description: "Could not delete group.", variant: "destructive" });
    }
    setDeleteGroupAlertOpen(false);
    setDeletingGroupId(null);
  };

  const handleStudentFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser || !selectedGroupId) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('studentName') as string;
    const phone = formData.get('studentPhone') as string;
    const email = formData.get('studentEmail') as string;

    try {
      if (editingStudent) {
        const studentDoc = doc(db, 'students', editingStudent.id);
        await updateDoc(studentDoc, { name, phone, email });
        toast({ title: "Student Updated", description: `${name}'s profile has been updated.` });
      } else {
        const newStudent = { name, phone, email, groupId: selectedGroupId, callHistory: [], createdBy: currentUser.id };
        await addDoc(collection(db, 'students'), newStudent);
        toast({ title: "Student Added", description: `${name} has been added to the group.` });
      }
    } catch(error) {
      console.error("Error saving student:", error);
      toast({ title: "Error", description: "Could not save student.", variant: "destructive" });
    }
    setStudentDialogOpen(false);
    setEditingStudent(null);
  };

  const handleLogCall = async (studentId: string, status: CallStatus) => {
    try {
      const studentDoc = doc(db, 'students', studentId);
      await updateDoc(studentDoc, {
        callHistory: arrayUnion({ status, timestamp: Timestamp.now() })
      });
      toast({ title: "Call Logged", description: `Call status for student updated to "${status}".` });
    } catch (error) {
      console.error("Error logging call:", error);
      toast({ title: "Error", description: "Could not log call.", variant: "destructive" });
    }
  };
  
  const handlePhoneClick = async (e: React.MouseEvent<HTMLAnchorElement>, studentId: string) => {
      e.preventDefault();
      const href = e.currentTarget.href;
      await handleLogCall(studentId, 'Called');
      window.location.href = href;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !currentUser || !selectedGroupId) return;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          toast({ title: "Error", description: "The uploaded file is empty.", variant: "destructive" });
          return;
        }

        const batch = writeBatch(db);
        let studentsAdded = 0;

        json.forEach(row => {
          if (row.name && row.phone && row.email) {
            const newStudent = {
              name: String(row.name),
              phone: String(row.phone),
              email: String(row.email),
              groupId: selectedGroupId,
              callHistory: [],
              createdBy: currentUser.id
            };
            const studentRef = doc(collection(db, 'students'));
            batch.set(studentRef, newStudent);
            studentsAdded++;
          }
        });

        if (studentsAdded > 0) {
          await batch.commit();
          toast({ title: "Import Successful", description: `${studentsAdded} students have been imported.` });
        } else {
           toast({ title: "Import Failed", description: "No valid student data found. Make sure the file has 'name', 'phone', and 'email' columns.", variant: "destructive" });
        }
      } catch (error) {
        console.error("Error importing students:", error);
        toast({ title: "Error", description: "Failed to parse or import the file.", variant: "destructive" });
      }
      setImportDialogOpen(false);
    };

    reader.readAsBinaryString(file);
  };
  
  const handleEditStudentClick = (student: Student) => {
    setEditingStudent(student);
    setStudentDialogOpen(true);
  };

  const totalCallsMade = useMemo(() => {
    return studentsForUser.reduce((acc, student) => acc + student.callHistory.length, 0);
  }, [studentsForUser]);

  const chartData = useMemo(() => {
    const statuses: { [key in CallStatus]: number } = {
      'Called': 0,
      'Voicemail': 0,
      'Missed Call': 0,
      'Not Called': 0,
    };
    
    studentsInSelectedGroup.forEach(student => {
      const lastStatus = student.callHistory[student.callHistory.length - 1]?.status ?? 'Not Called';
      statuses[lastStatus]++;
    });

    return Object.entries(statuses).map(([name, value]) => ({ name, value, fill: `var(--color-${name.replace(/\s+/g, '')})` }));
  }, [studentsInSelectedGroup]);

  const chartConfig = {
    Called: { label: "Called", color: "hsl(var(--chart-1))" },
    Voicemail: { label: "Voicemail", color: "hsl(var(--chart-2))" },
    MissedCall: { label: "Missed Call", color: "hsl(var(--chart-3))" },
    NotCalled: { label: "Not Called", color: "hsl(var(--chart-4))" },
  }
  
  if (!currentUser) {
    return null; // or a loading spinner
  }

  return (
    <div className="grid gap-6">
       <div className={cn("grid gap-4 md:grid-cols-2", isAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
              <Users2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userGroups.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentsForUser.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calls Logged</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCallsMade}</div>
            </CardContent>
          </Card>
           {isAdmin && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database Storage</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1 GiB</div>
                <p className="text-xs text-muted-foreground">
                  Free plan limit. 
                  <Link href="https://console.firebase.google.com/" target="_blank" className="underline inline-flex items-center gap-1">
                      Check usage <ExternalLink className="h-3 w-3" />
                  </Link>
                </p>
              </CardContent>
            </Card>
           )}
        </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
              <Card>
                <CardHeader>
                    <CardTitle>Groups</CardTitle>
                    <CardDescription>Select a group to view students.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-2">
                    <Select value={selectedGroupId ?? ''} onValueChange={setSelectedGroupId}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                        <SelectContent>
                            {userGroups.map(group => (
                                <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <DialogTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => { setEditingGroup(null); setGroupDialogOpen(true); }}>
                            <Plus className="h-4 w-4" />
                            <span className="sr-only">Add Group</span>
                        </Button>
                    </DialogTrigger>
                    
                    {selectedGroup && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <Settings className="h-4 w-4" />
                                    <span className="sr-only">Group Actions</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setEditingGroup(selectedGroup); setGroupDialogOpen(true); }}>
                                    <Edit className="mr-2 h-4 w-4" /> Rename
                                </DropdownMenuItem>
                                { (isAdmin || currentUser.id === selectedGroup.createdBy) && (
                                <DropdownMenuItem onClick={() => { setDeletingGroupId(selectedGroup.id); setDeleteGroupAlertOpen(true); }} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
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

        <div className="lg:col-span-3">
          {selectedGroupId ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedGroup?.name} Overview</CardTitle>
                <CardDescription>Call status breakdown for this group.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                 <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60}>
                       {chartData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                      ))}
                    </Pie>
                     <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                  </PieChart>
                </ChartContainer>
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
                        {userGroups.length > 0 ? "Select a group to view students." : "Create a group to get started."}
                    </p>
                </div>
            </div>
          )}
        </div>
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
                    <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto flex-1 sm:flex-initial">
                                <Upload className="mr-2 h-4 w-4" /> Import
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Import Students</DialogTitle>
                                <DialogDescription>
                                    Upload an XLSX file to add students in bulk. The file must have columns named 'name', 'phone', and 'email'.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <Input id="file" type="file" accept=".xlsx" onChange={handleFileUpload} />
                            </div>
                        </DialogContent>
                    </Dialog>
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
                            <a href={`tel:${student.phone}`} onClick={(e) => handlePhoneClick(e, student.id)} className="flex items-center gap-2 hover:underline">
                                <Phone className="h-4 w-4 text-muted-foreground"/> {student.phone}
                            </a>
                             <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4"/> {student.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="p-0 h-auto">
                                  <Badge variant={getStatusBadgeVariant(status)} className="flex items-center gap-2 w-fit cursor-pointer">
                                      {getStatusIcon(status)}
                                      {status}
                                  </Badge>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleLogCall(student.id, 'Called')}>
                                    <PhoneCall className="mr-2 h-4 w-4" /> Called
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleLogCall(student.id, 'Voicemail')}>
                                    <Voicemail className="mr-2 h-4 w-4" /> Voicemail
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleLogCall(student.id, 'Missed Call')}>
                                    <PhoneMissed className="mr-2 h-4 w-4" /> Missed Call
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                             {lastCall && <div className="text-xs text-muted-foreground mt-1">{lastCall.timestamp.toDate().toLocaleString()}</div>}
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
                                <DropdownMenuItem onSelect={() => handleEditStudentClick(student)}>Edit</DropdownMenuItem>
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
                        {userGroups.length > 0 ? "Select a group to view students." : "Create a group to get started."}
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
