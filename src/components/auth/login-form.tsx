
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
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const initialUsers: Omit<User, 'id'>[] = [
  { name: 'Admin User', email: 'admin@example.com', role: 'Admin' },
  { name: 'Regular User', email: 'user@example.com', role: 'User' },
];

async function seedInitialUsers() {
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    if (snapshot.empty) {
        console.log("No users found, seeding initial users...");
        for (const user of initialUsers) {
            await addDoc(usersCollection, user);
        }
    }
}

export function LoginForm() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'Admin' | 'User'>('User');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    seedInitialUsers();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, where("role", "==", selectedRole), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userToLogin = { id: userDoc.id, ...userDoc.data() } as User;
        localStorage.setItem('callflow-currentUser', JSON.stringify(userToLogin));
        router.push('/dashboard');
      } else {
        toast({
          title: "Login Failed",
          description: `No user found with the role "${selectedRole}". Please contact an admin.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error logging in:", error);
      toast({
        title: "Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Select a role to log in. This will connect to a live Firestore database.
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
