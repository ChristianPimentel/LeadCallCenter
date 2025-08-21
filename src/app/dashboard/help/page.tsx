
"use client";

import React, { useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const faqs = [
    {
        id: "item-1",
        question: "How do I create a new group?",
        answer: "On the main dashboard, you'll see a \"Groups\" card. Click the plus (+) icon next to the group selection dropdown to open the 'Create New Group' dialog. Enter a name for your group and click 'Create Group'."
    },
    {
        id: "item-2",
        question: "How do I add students to a group?",
        answer: "First, select a group from the dropdown. Once a group is selected, the student list will appear. Click the \"Add\" button to open a dialog where you can enter the student's name, phone, and email. You can also use the \"Import\" button to upload an XLSX file with student data in bulk."
    },
    {
        id: "item-3",
        question: "How do I log a call for a student?",
        answer: "In the student list, find the student you want to call. You can click the phone icon to initiate a call, which automatically logs the status as 'Called'. Alternatively, you can click on the status badge (e.g., 'Not Called') to open a dropdown menu and select the appropriate outcome ('Called', 'Voicemail', 'Missed Call')."
    },
    {
        id: "item-4",
        question: "What do the different call statuses mean?",
        answer: (
            <ul className="list-disc pl-5 space-y-2">
                <li><strong>Not Called:</strong> No call has been logged for this student yet.</li>
                <li><strong>Called:</strong> You successfully connected with the student.</li>
                <li><strong>Voicemail:</strong> You left a voicemail for the student.</li>
                <li><strong>Missed Call:</strong> The student did not answer and no voicemail was left.</li>
            </ul>
        )
    },
    {
        id: "item-5",
        question: "How does the student import feature work?",
        answer: "The import feature allows you to add multiple students at once from an XLSX file. The file must have three columns with the exact headers: 'name', 'phone', and 'email'. Any rows that do not have all three of these values will be skipped."
    },
    {
        id: "item-6",
        question: "How do I manage users? (Admin only)",
        answer: "If you are an Admin, you can access the \"Users\" page from the main navigation. On this page, you can add new users, and view existing administrators and standard users. When you add a new user, a temporary password is created which they will be required to change on their first login.",
        adminOnly: true
    }
];


export default function HelpPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('callflow-currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
    }
  }, []);

  const isAdmin = currentUser?.role === 'Admin';
  const visibleFaqs = isAdmin ? faqs : faqs.filter(faq => !faq.adminOnly);
  
  return (
    <div className="grid gap-6 max-w-6xl mx-auto">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Help & FAQ</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Find answers to common questions about using Lead Call Center.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleFaqs.map(faq => (
                     <Card key={faq.id}>
                        <CardHeader className="p-4">
                            <CardTitle className="text-base">{faq.question}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                           {faq.answer}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
