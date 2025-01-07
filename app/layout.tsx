"use client"

import React from "react";
import { Amplify } from "aws-amplify";
import "./app.css";
import outputs from "@/amplify_outputs.json";
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] })

Amplify.configure(outputs);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-background to-accent`}>
        <main className="container mx-auto px-4 py-8 bg-transparent">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
