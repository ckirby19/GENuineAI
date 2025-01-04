"use client"

import React from "react";
import { Amplify } from "aws-amplify";
import "./app.css";
import outputs from "@/amplify_outputs.json";
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

Amplify.configure(outputs);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-br from-background to-accent min-h-screen`}>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
