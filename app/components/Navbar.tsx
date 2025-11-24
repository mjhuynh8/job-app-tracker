import { Link } from "react-router";
import { useUser, useClerk } from "@clerk/clerk-react";
import {
  HomeIcon,
  DocumentPlusIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/solid";
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

        {/* LEFT */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold text-lg text-white hover:underline"
          >
            <HomeIcon className="w-5 h-5" />
            Home
          </Link>
        </div>

        {/* RIGHT */}
        <nav className="flex items-center gap-6">
          {isSignedIn && (
            <>
              <Link
                to="/job-form"
                className="flex items-center gap-2 hover:underline text-white"
              >
                <DocumentPlusIcon className="w-5 h-5" />
                Job Form
              </Link>

              <Link
                to="/job-dashboard"
                className="flex items-center gap-2 hover:underline text-white"
              >
                <Squares2X2Icon className="w-5 h-5" />
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
