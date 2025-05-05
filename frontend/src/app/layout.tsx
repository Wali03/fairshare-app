import type { Metadata } from "next";
import "./globals.css";
import { NextUIProvider } from '@nextui-org/react';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "FairShare - Split Expenses with Friends",
  description: "Track expenses, settle debts, and manage group finances easily with FairShare",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet' />
      </head>
      <body>
        <NextUIProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10B981',
                },
              },
              error: {
                duration: 4000,
                style: {
                  background: '#EF4444',
                },
              },
            }}
          />
        </NextUIProvider>
      </body>
    </html>
  );
}
