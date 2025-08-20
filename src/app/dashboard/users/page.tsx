
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Copy, Trash2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';


// Function to generate a random password
const generatePassword = () => {
  return Math.random().toString(36).slice(-8);
};

const UserTable = ({ users, currentUser, onUserClick }: { users: User[], currentUser: User, onUserClick: (user: User) => void }) => {
    return (
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow 
                  key={user.id} 
                  className={cn(
                    user.status === 'Disabled' && 'text-muted-foreground',
                    "cursor-pointer"
                  )}
                  onClick={() => onUserClick(user)}
                >
                  <TableCell className="font-medium">{user.name}{user.id === currentUser.id && " (You)"}</TableCell>
                  <TableCell className="break-words">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'Active' ? 'outline' : 'destructive'}>
                      {user.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
        </Table>
    )
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordInfo, setPasswordInfo] = useState<{ name: string; pass: string } | null>(null);
  const [passwordAlertOpen, setPasswordAlertOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [resetPasswordAlertOpen, setResetPasswordAlertOpen] = useState(false);


  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedCurrentUser = localStorage.getItem('callflow-currentUser');
      if (storedCurrentUser) {
        setCurrentUser(JSON.parse(storedCurrentUser));
      } else {
         window.location.href = '/';
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const usersCollection = collection(db, 'users');
    const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), status: doc.data().status || 'Active' } as User));
      setUsers(usersData);
    });

    return () => unsubscribe();
  }, [currentUser]);
  
  const { admins, regularUsers } = useMemo(() => {
    const admins: User[] = [];
    const regularUsers: User[] = [];
    users.forEach(user => {
      if (user.role === 'Admin') {
        admins.push(user);
      } else {
        regularUsers.push(user);
      }
    });
    return { admins, regularUsers };
  }, [users]);

  const handleUserFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('userName') as string;
    const email = formData.get('userEmail') as string;
    const role = formData.get('userRole') as 'Admin' | 'User';
    const status = formData.get('userStatus') as 'Active' | 'Disabled';

    
    const userData: Partial<User> = { name, email, role, status };

    try {
      if (editingUser) {
        const userDoc = doc(db, 'users', editingUser.id);
        await updateDoc(userDoc, userData);
        toast({ title: "User Updated", description: `${name}'s profile has been updated.` });
      } else {
        const newPassword = generatePassword();
        userData.password = newPassword;
        userData.passwordResetRequired = true;
        userData.status = 'Active';
        
        await addDoc(collection(db, 'users'), userData);

        toast({ title: "User Added", description: `${name} has been added successfully.` });
        setPasswordInfo({ name: name, pass: newPassword });
        setPasswordAlertOpen(true);
      }
    } catch (error) {
      console.error("Error saving user: ", error);
      toast({ title: "Error", description: "Could not save user.", variant: "destructive" });
    }

    setUserDialogOpen(false);
    setEditingUser(null);
  };

  const handleUserClick = (user: User) => {
    setEditingUser(user);
    setUserDialogOpen(true);
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Password copied to clipboard." });
  };
  
  const handleResetPassword = async () => {
    if (!editingUser) return;
    const newPassword = generatePassword();
    try {
        const userDoc = doc(db, 'users', editingUser.id);
        await updateDoc(userDoc, { password: newPassword, passwordResetRequired: true });
        setPasswordInfo({ name: editingUser.name, pass: newPassword });
        setPasswordAlertOpen(true);
        setResetPasswordAlertOpen(false);
        setUserDialogOpen(false);
        setEditingUser(null);
    } catch (error) {
        console.error("Error resetting password:", error);
        toast({ title: "Error", description: "Could not reset password.", variant: "destructive" });
    }
  }

  const handleDeleteUser = async () => {
    if (!editingUser) return;
    try {
        await deleteDoc(doc(db, 'users', editingUser.id));
        toast({ title: "User Deleted", description: `${editingUser.name} has been deleted.` });
        setDeleteAlertOpen(false);
        setUserDialogOpen(false);
        setEditingUser(null);
    } catch (error) {
        console.error("Error deleting user:", error);
        toast({ title: "Error", description: "Could not delete user.", variant: "destructive" });
    }
  }
  
  const isAdmin = currentUser?.role === 'Admin';

  if (!currentUser) {
    return null; // or a loading spinner
  }
  
  if (!isAdmin) {
    return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full min-h-[60vh]">
            <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">
                    Access Denied
                </h3>
                <p className="text-sm text-muted-foreground">
                    You do not have permission to view this page.
                </p>
            </div>
        </div>
    );
  }

  return (
    <div className="grid gap-6">
      <Dialog open={userDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingUser(null); setUserDialogOpen(isOpen);}}>
          <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">User Management</h1>
          </div>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
              {editingUser && <DialogDescription>Manage user details and actions.</DialogDescription>}
            </DialogHeader>
            <form onSubmit={handleUserFormSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="userName" className="text-right">Name</Label>
                  <Input id="userName" name="userName" defaultValue={editingUser?.name} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="userEmail" className="text-right">Email</Label>
                  <Input id="userEmail" name="userEmail" type="email" defaultValue={editingUser?.email} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="userRole" className="text-right">Role</Label>
                  <Select name="userRole" defaultValue={editingUser?.role || 'User'}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="User">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editingUser && (
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="userStatus" className="text-right">Status</Label>
                        <Select name="userStatus" defaultValue={editingUser?.status || 'Active'}>
                            <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Disabled">Disabled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
              </div>
              <DialogFooter className="sm:justify-between">
                <div>
                    {editingUser && currentUser?.id !== editingUser.id && (
                        <div className="flex gap-2">
                             <Button type="button" variant="outline" onClick={() => setResetPasswordAlertOpen(true)}>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Reset Password
                            </Button>
                            <Button type="button" variant="destructive" onClick={() => setDeleteAlertOpen(true)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    )}
                </div>
                <Button type="submit">{editingUser ? 'Save Changes' : 'Add User'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Administrators</CardTitle>
                    <CardDescription>Users with full system access.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <UserTable 
                        users={admins} 
                        currentUser={currentUser}
                        onUserClick={handleUserClick}
                    />
                </CardContent>
            </Card>
        
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                         <CardTitle>Users</CardTitle>
                        <DialogTrigger asChild>
                            <Button size="icon" variant="outline" onClick={() => { setEditingUser(null); setUserDialogOpen(true); }}>
                                <Plus className="h-4 w-4" />
                                <span className="sr-only">Add User</span>
                            </Button>
                        </DialogTrigger>
                    </div>
                    <CardDescription>Users with standard access.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <UserTable 
                        users={regularUsers} 
                        currentUser={currentUser}
                        onUserClick={handleUserClick}
                    />
                </CardContent>
            </Card>
        </div>
      </Dialog>
      
      {/* Show Generated Password Alert */}
      <AlertDialog open={passwordAlertOpen} onOpenChange={setPasswordAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Temporary Password</AlertDialogTitle>
            <AlertDialogDescription>
              Please copy the temporary password for <strong>{passwordInfo?.name}</strong> and share it with them. They will be required to change it upon their next login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="relative my-4">
            <Input
              id="temp-password"
              readOnly
              value={passwordInfo?.pass || ''}
              className="pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
              onClick={() => copyToClipboard(passwordInfo?.pass || '')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => { setPasswordAlertOpen(false); setPasswordInfo(null); }}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Confirmation */}
       <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account for <strong>{editingUser?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Confirmation */}
       <AlertDialog open={resetPasswordAlertOpen} onOpenChange={setResetPasswordAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset the password for <strong>{editingUser?.name}</strong>? A new temporary password will be generated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword}>Reset Password</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

    