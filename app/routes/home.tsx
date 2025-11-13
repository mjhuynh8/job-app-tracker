"use client";

import type { Route } from "./+types/home";
import { useUser, useClerk } from "@clerk/clerk-react";
import { Link } from "react-router";
import "./home.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Job App Tracker" },
    { name: "description", content: "Track your job applications." },
  ];
}

const HERO_IMG = "JobTrackerHeroImage.png"; // <- put the generated illustration here

export default function Home() {
  const { isSignedIn } = useUser() ?? { isSignedIn: false };
  const signedIn = Boolean(isSignedIn);
  const clerk = useClerk?.() ?? null;

  async function handleSignOut() {
    try {
      await clerk?.signOut();
    } catch {
      // ignore
    } finally {
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  }

  return (
    <>
      {/* Page content */}
      <section className="relative">
        {/* soft gradient background behind hero */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-slate-50 via-white to-white"
        />

        {/* Hero */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: copy + CTAs */}
            <div>
              {/* <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Stay organized. Get hired faster.
              </div> */}

              <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                Track every job, interview, and offer all in one place.
              </h1>

              <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-xl">
                A visual job application tracker with stages for{" "}
                <span className="font-medium">Applied</span>,{" "}
                <span className="font-medium">Interviewing</span>, and{" "}
                <span className="font-medium">Offer</span>, plus analytics to
                track progress through your job finding journey.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                {signedIn ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-white font-semibold shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      Go to Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/sign-up"
                      className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-white font-semibold shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      Get Started
                    </Link>
                    {/* <Link
                      to="/demo"
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Try Demo
                    </Link> */}
                  </>
                )}
              </div>

              {/* quick credibility chips */}
              <div className="mt-6 flex flex-wrap gap-2 text-sm text-slate-500">
                {/* <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                  📅 Auto reminders
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                  📈 Offer rate analytics
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                  🔁 Drag & drop stages
                </span> */}
              </div>
            </div>

            {/* Right: hero illustration */}
            <div className="relative">
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-emerald-100/50 blur-2xl" aria-hidden="true" />
              <img
                src={HERO_IMG}
                alt="Job application tracker dashboard with stages and analytics"
                className="w-full max-w-[680px] mx-auto rounded-3xl mix-blend-multiply"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </div>

        {/* Feature cards (under hero) */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Track Applications
              </h3>
              <p className="mt-2 text-slate-600 text-sm">
                Stages for Applied, Interviewing, and Offer to track application
                status.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900">Job Details</h3>
              <p className="mt-2 text-slate-600 text-sm">
                Save key info: roles, skills, notes, and dates.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900">Analytics</h3>
              <p className="mt-2 text-slate-600 text-sm">
                Charts for response time, interview rate, and offer rate.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
