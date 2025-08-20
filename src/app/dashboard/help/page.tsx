
"use client";

import React, { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { User } from '@/lib/types';

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

  return (
    <div className="grid gap-6 max-w-4xl mx-auto">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Help & FAQ</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Find answers to common questions about using CallFlow.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How do I create a new group?</AccordionTrigger>
              <AccordionContent>
                On the main dashboard, you'll see a "Groups" card. Click the plus (+) icon next to the group selection dropdown to open the 'Create New Group' dialog. Enter a name for your group and click 'Create Group'.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>How do I add students to a group?</AccordionTrigger>
              <AccordionContent>
                First, select a group from the dropdown. Once a group is selected, the student list will appear. Click the "Add" button to open a dialog where you can enter the student's name, phone, and email. You can also use the "Import" button to upload an XLSX file with student data in bulk.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>How do I log a call for a student?</AccordionTrigger>
              <AccordionContent>
                In the student list, find the student you want to call. You can click the phone icon to initiate a call, which automatically logs the status as 'Called'. Alternatively, you can click on the status badge (e.g., 'Not Called') to open a dropdown menu and select the appropriate outcome ('Called', 'Voicemail', 'Missed Call').
              </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-4">
              <AccordionTrigger>What do the different call statuses mean?</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Not Called:</strong> No call has been logged for this student yet.</li>
                  <li><strong>Called:</strong> You successfully connected with the student.</li>
                  <li><strong>Voicemail:</strong> You left a voicemail for the student.</li>
                  <li><strong>Missed Call:</strong> The student did not answer and no voicemail was left.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger>How does the student import feature work?</AccordionTrigger>
              <AccordionContent>
                The import feature allows you to add multiple students at once from an XLSX file. The file must have three columns with the exact headers: 'name', 'phone', and 'email'. Any rows that do not have all three of these values will be skipped.
              </AccordionContent>
            </AccordionItem>
            {isAdmin && (
             <AccordionItem value="item-6">
              <AccordionTrigger>How do I manage users? (Admin only)</AccordionTrigger>
              <AccordionContent>
                If you are an Admin, you can access the "Users" page from the main navigation. On this page, you can add new users, and view existing administrators and standard users. When you add a new user, a temporary password is created which they will be required to change on their first login.
              </AccordionContent>
            </AccordionItem>
            )}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
