
"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User } from '@/lib/types';
import { useState, useEffect } from 'react';

// Mock users for demo purposes, used only if localStorage is empty.
const initialUsers: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'Admin' },
  { id: '2', name: 'Regular User', email: 'user@example.com', role: 'User' },
];


export function LoginForm() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'Admin' | 'User'>('User');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // On component mount, check localStorage for existing users.
    const storedUsers = localStorage.getItem('callflow-users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      // If no users are found, seed localStorage with initial data.
      localStorage.setItem('callflow-users', JSON.stringify(initialUsers));
      setUsers(initialUsers);
    }
  }, []);


  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // In a real app, you'd handle authentication here.
    const userToLogin = users.find(u => u.role === selectedRole);
    if (userToLogin) {
      localStorage.setItem('callflow-currentUser', JSON.stringify(userToLogin));
    }
    
    router.push('/dashboard');
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Select a role to log in. Your data will be saved in this browser.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              defaultValue="demo@example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required defaultValue="password" />
          </div>
           <div className="grid gap-2">
            <Label htmlFor="role">Login as</Label>
             <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as 'Admin' | 'User')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                </SelectContent>
              </Select>
          </div>
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
