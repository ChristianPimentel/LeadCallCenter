
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

export default function AccountPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordResetRequired, setPasswordResetRequired] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('callflow-currentUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setName(user.name);
        setEmail(user.email);
        setPasswordResetRequired(user.passwordResetRequired || false);
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
    }
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;
    
    try {
      const userDoc = doc(db, 'users', currentUser.id);
      await updateDoc(userDoc, { name, email });
      
      const updatedUser = { ...currentUser, name, email };
      localStorage.setItem('callflow-currentUser', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      
      toast({ title: "Profile Updated", description: "Your profile information has been updated successfully." });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    }
  };
  
  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;

    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }

    if (!passwordResetRequired && currentUser.password !== currentPassword) {
        toast({ title: "Error", description: "Current password is incorrect.", variant: "destructive" });
        return;
    }
    
    try {
        const userDoc = doc(db, 'users', currentUser.id);
        const updates: Partial<User> = { password: newPassword };
        if (passwordResetRequired) {
            updates.passwordResetRequired = false;
        }

        await updateDoc(userDoc, updates);

        const updatedUser = { ...currentUser, password: newPassword, passwordResetRequired: false };
        localStorage.setItem('callflow-currentUser', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        setPasswordResetRequired(false);

        toast({ title: "Password Changed", description: "Your password has been updated successfully." });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        if (passwordResetRequired) {
            window.location.href = '/dashboard';
        }

    } catch (error) {
        console.error("Error changing password:", error);
        toast({ title: "Error", description: "Failed to change password.", variant: "destructive" });
    }
  };

  if (!currentUser) {
    return null; // Or a loading spinner
  }

  return (
    <div className="grid gap-6 max-w-4xl mx-auto">
        {passwordResetRequired && (
            <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Security Update Required</AlertTitle>
                <AlertDescription>
                    For your security, you must change your temporary password before proceeding.
                </AlertDescription>
            </Alert>
        )}
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Manage Account</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details here.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={passwordResetRequired} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={passwordResetRequired} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={passwordResetRequired}>Update Profile</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password here. Your new password must be at least 6 characters long.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="grid gap-4">
            {!passwordResetRequired && (
                <div className="grid gap-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="flex justify-end">
              <Button type="submit">Change Password</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
