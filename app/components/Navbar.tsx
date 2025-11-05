import { Link } from "react-router";
import { useUser, useClerk } from "@clerk/clerk-react";
import "./navbar.css";

export function Navbar() {
  const { isSignedIn } = useUser() ?? { isSignedIn: false };
  const clerk = useClerk?.() ?? null;

  async function handleSignOut() {
    try {
      await clerk?.signOut();
    } catch {
      // ignore sign out errors
    } finally {
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  }

  return (
    <nav className="w-full bg-blue-600 text-white app-navbar">
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-semibold text-lg text-white">
            Home
          </Link>
        </div>
        <nav className="flex items-center gap-4">

          {/* show Job Form & Dashboard only when signed in */}
          {isSignedIn && (
            <>
              <Link to="/job-form" className="hover:underline text-white">
                Job Form
              </Link>
              <Link to="/job-dashboard" className="hover:underline text-white">
                Dashboard
              </Link>
            </>
          )}

          {isSignedIn ? (
            <button
              onClick={handleSignOut}
              className="px-3 py-1 border rounded bg-white/10 text-white"
            >
              Sign Out
            </button>
          ) : (
            <>
              <Link
                to="/sign-in"
                className="px-3 py-1 border rounded bg-white/10 text-white"
              >
                Sign In
              </Link>
              <Link
                to="/sign-up"
                className="px-3 py-1 bg-green-600 text-white rounded"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </nav>
  );
}
