
"use client";

import React, { useState, useEffect } from 'react';
import { Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// Function to generate a random password
const generatePassword = () => {
  return Math.random().toString(36).slice(-8);
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUserAlertOpen, setDeleteUserAlertOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

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
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersData);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleUserFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('userName') as string;
    const email = formData.get('userEmail') as string;
    const role = formData.get('userRole') as 'Admin' | 'User';
    
    const userData: Partial<User> = { name, email, role };

    try {
      if (editingUser) {
        const password = formData.get('userPassword') as string;
        if (password) {
            userData.password = password;
        }
        const userDoc = doc(db, 'users', editingUser.id);
        await updateDoc(userDoc, userData);
        toast({ title: "User Updated", description: `${name}'s profile has been updated.` });
      } else {
        const newPassword = generatePassword();
        userData.password = newPassword;
        userData.passwordResetRequired = true;
        
        await addDoc(collection(db, 'users'), userData);
        
        setGeneratedPassword(newPassword);
        toast({
            title: "User Added",
            description: (
                <div>
                    <p>{name} has been added.</p>
                    <p className="mt-2">Temporary Password: <strong className="bg-muted px-2 py-1 rounded">{newPassword}</strong></p>
                </div>
            ),
            duration: 10000
        });
      }
    } catch (error) {
      console.error("Error saving user: ", error);
      toast({ title: "Error", description: "Could not save user.", variant: "destructive" });
    }

    setUserDialogOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = async () => {
    if (!deletingUserId) return;
    if (deletingUserId === currentUser?.id) {
        toast({ title: "Cannot delete self", description: "You cannot delete your own user account.", variant: "destructive" });
        setDeleteUserAlertOpen(false);
        return;
    }
    
    try {
      await deleteDoc(doc(db, 'users', deletingUserId));
      toast({ title: "User Deleted", description: "The user has been deleted." });
    } catch (error) {
       console.error("Error deleting user: ", error);
       toast({ title: "Error", description: "Could not delete user.", variant: "destructive" });
    }
    setDeleteUserAlertOpen(false);
    setDeletingUserId(null);
  };

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
    <>
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-lg font-semibold md:text-2xl">User Management</h1>
            <p className="text-sm text-muted-foreground">Manage all users in the system.</p>
        </div>
        <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingUser(null); setUserDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
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
                {editingUser && (
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="userPassword" className="text-right">Password</Label>
                        <Input id="userPassword" name="userPassword" type="password" placeholder="Leave blank to keep unchanged" className="col-span-3" />
                    </div>
                )}
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
              </div>
              <DialogFooter>
                <Button type="submit">{editingUser ? 'Save Changes' : 'Add User'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}{user.id === currentUser.id && " (You)"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
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
                           <DropdownMenuItem onClick={() => { setEditingUser(user); setUserDialogOpen(true); }}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => { setDeletingUserId(user.id); setDeleteUserAlertOpen(true); }}
                            disabled={user.id === currentUser.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Delete User Alert */}
      <AlertDialog open={deleteUserAlertOpen} onOpenChange={setDeleteUserAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user's account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
