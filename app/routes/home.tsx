import type { Route } from "./+types/home";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Job App Tracker" },
    { name: "description", content: "Track your job applications." },
  ];
}

export default function Home() {
  const signedIn = typeof window !== "undefined" && localStorage.getItem("signedIn") === "true";

  return (
    <main className="pt-4">
      <section className="text-center py-8">
        <h1 className="text-4xl font-bold">Welcome to JobApp</h1>
        <p className="mt-2 text-gray-600">A simple job application tracker</p>
        <div className="mt-6 flex justify-center gap-3">
          {signedIn ? (
            <>
              <Link to="/job-form" className="px-4 py-2 bg-blue-600 text-white rounded">Add Job</Link>
              <Link to="/job-dashboard" className="px-4 py-2 border rounded">Dashboard</Link>
            </>
          ) : (
            <>
              <Link to="/sign-in" className="px-4 py-2 border rounded">Sign In</Link>
              <Link to="/sign-up" className="px-4 py-2 bg-green-600 text-white rounded">Sign Up</Link>
            </>
          )}
        </div>
      </section>

      <section className="py-8">
        <h2 className="text-2xl font-semibold mb-4">Features</h2>
        <ul className="space-y-2">
          <li>• Track applications by status</li>
          <li>• Add skills and company info</li>
          <li>• Move applications between stages</li>
        </ul>
      </section>
    </main>
  );
}
