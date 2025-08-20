
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
import type { User } from '@/lib/types';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const initialUsers: Omit<User, 'id'>[] = [
  { name: 'Admin User', email: 'admin@example.com', role: 'Admin', password: 'password', status: 'Active' },
  { name: 'Regular User', email: 'user@example.com', role: 'User', password: 'password', status: 'Active' },
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
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    seedInitialUsers();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          title: "Login Failed",
          description: "No user found with that email address.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      const userDoc = querySnapshot.docs[0];
      const userToLogin = { id: userDoc.id, ...userDoc.data() } as User;

      if (userToLogin.status === 'Disabled') {
        toast({
          title: "Login Failed",
          description: "Your account is disabled. Please contact an administrator.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (userToLogin.password === password) {
        localStorage.setItem('callflow-currentUser', JSON.stringify(userToLogin));
        if (userToLogin.passwordResetRequired) {
            router.push('/dashboard/account');
        } else {
            router.push('/dashboard');
        }
      } else {
        toast({
          title: "Login Failed",
          description: "Incorrect password. Please try again.",
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
          Enter your email and password to log in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
