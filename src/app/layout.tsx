import type { Metadata } from 'next';
// Corrected imports for Geist fonts - these are objects, not functions to call
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

// GeistSans and GeistMono are imported as objects.
// Their .variable property provides the CSS variable class name.
// No need to call them as functions like GeistSans({})

export const metadata: Metadata = {
  title: 'SeatLayout Editor',
  description: 'Edit and store cinema hall layouts',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Apply font variable classes directly from the imported objects to the html tag
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
      {/*
        The `GeistSans.variable` (e.g., '__className_123abc') class will make CSS variables
        like `--font-geist-sans` available.
        `globals.css` then uses `font-family: var(--font-geist-sans);` for the body.
        The `font-mono` variable can be used similarly if needed, e.g., for code blocks.
        The `dark` class enables the dark theme by default.
      */}
      <body className="antialiased">
        {/*
          The `antialiased` class provides font smoothing.
          The actual font-family for the body is set in `globals.css` using `var(--font-geist-sans)`.
          If you want to use Tailwind's `font-sans` utility class, ensure it's configured
          in `tailwind.config.ts` to use `var(--font-geist-sans)`.
          For now, `globals.css` handles this directly.
        */}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
