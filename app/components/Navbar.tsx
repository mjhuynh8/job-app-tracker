import { Link } from "react-router";
import { useState } from "react";

export function Navbar() {
  // Simple auth flag: in a real app you'd replace this with context
  const [signedIn] = useState(false);

  return (
    <header className="w-full border-b bg-white dark:bg-gray-900">
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-semibold text-lg">
            JobApp
          </Link>
        </div>
        <nav className="flex items-center gap-4">
          <Link to="/" className="hover:underline">
            Front
          </Link>
          {signedIn ? (
            <>
              <Link to="/job-form" className="hover:underline">
                Job Form
              </Link>
              <Link to="/job-dashboard" className="hover:underline">
                Dashboard
              </Link>
              <button className="px-3 py-1 border rounded">Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/sign-in" className="px-3 py-1 border rounded">
                Sign In
              </Link>
              <Link to="/sign-up" className="px-3 py-1 bg-blue-600 text-white rounded">
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
