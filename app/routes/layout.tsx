import { Outlet } from "react-router";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ClerkProvider } from "@clerk/clerk-react";
import { JobProvider } from "../lib/jobStore";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

export default function Layout() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <JobProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 bg-white">
            <div className="container mx-auto p-4 pt-6 min-h-0">
              <Outlet />
            </div>
          </main>
          <Footer />
        </div>
      </JobProvider>
    </ClerkProvider>
  );
}
