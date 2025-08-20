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
import { useState } from 'react';

// Mock users for demo purposes
const mockUsers: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'Admin' },
  { id: '2', name: 'Regular User', email: 'user@example.com', role: 'User' },
];


export function LoginForm() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'Admin' | 'User'>('User');


  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // In a real app, you'd handle authentication here.
    const userToLogin = mockUsers.find(u => u.role === selectedRole);
    if (userToLogin) {
      localStorage.setItem('callflow-currentUser', JSON.stringify(userToLogin));
    }
    
    // Seed users if they don't exist
    if (!localStorage.getItem('callflow-users')) {
      localStorage.setItem('callflow-users', JSON.stringify(mockUsers));
    }

    router.push('/dashboard');
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your details below to login to your account.
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
