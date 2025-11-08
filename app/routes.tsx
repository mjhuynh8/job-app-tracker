// routes/layout.tsx
import React from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { ClerkProvider } from "@clerk/clerk-react";
import { JobProvider } from "./lib/jobStore";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

export function LinksFn() {
  return [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    {
      rel: "stylesheet",
      href:
        "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
    },
  ];
}

export default function Layout({ children }: { children?: React.ReactNode }) {
console.log("Routes layout mounted");
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
          <JobProvider>
            {/* The router will render pages here */}
            <Outlet />
            {children}
          </JobProvider>
        </ClerkProvider>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}