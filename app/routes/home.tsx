import type { Route } from "./+types/home";
import { useUser, useClerk } from "@clerk/clerk-react";
import { Link } from "react-router";
import "./home.css";
import Lottie from "lottie-react";
import jobDashboardAnimation from "public/assets/Big-Data-Centre-Isomatric-Animation.json";


export function meta({}: Route.MetaArgs) {
  return [
    { title: "Job App Tracker" },
    { name: "description", content: "Track your job applications." },
  ];
}

const HERO_IMG = "JobTrackerHeroImage-2.png";

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
      <section className="home-hero-section relative overflow-hidden">

         {/* BUBBLE BACKGROUND */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="floating-blur floating-blur-1" />
            <div className="floating-blur floating-blur-2" />
          </div>

        {/* HERO */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

        {/* LEFT CONTENT */}
        <div>
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
                  to="/job-dashboard"
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
              <Link
                to="/sign-up"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-white font-semibold shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                Get Started
              </Link>
            )}
          </div>

          {/* LARGE MODERN TECH ANIMATION */}
          <div className="mt-10 w-full max-w-xl">
            <Lottie
              animationData={jobDashboardAnimation}
              loop
              autoplay
              className="w-full h-auto"
            />
          </div>
        </div>


        <div className="relative">
          <div
            className="absolute -inset-4 -z-10 rounded-3xl bg-emerald-100/40 blur-2xl"
            aria-hidden="true"
          />
        <img
          src={HERO_IMG}
          alt="Job application tracker dashboard with stages and analytics"
          className="w-full max-w-[680px] mx-auto"
          loading="eager"
          decoding="async"
        />


        </div>

          </div>
        </div>

        {/* FEATURE CARDS */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Card 1 */}
            <div className="bg-[#0F2F27] rounded-2xl shadow-sm ring-1 ring-slate-800 p-6 transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:ring-emerald-300/40">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Track Applications
                </h3>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-300">
                  📌
                </div>
              </div>
              <p className="mt-3 text-slate-200 text-sm">
                Stages for Applied, Interviewing, and Offer to track application status.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#0F2F27] rounded-2xl shadow-sm ring-1 ring-slate-800 p-6 transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:ring-emerald-300/40">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Job Details
                </h3>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-300">
                  🗂️
                </div>
              </div>
              <p className="mt-3 text-slate-200 text-sm">
                Save key info: roles, skills, notes, and dates.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#0F2F27] rounded-2xl shadow-sm ring-1 ring-slate-800 p-6 transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:ring-emerald-300/40">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Analytics
                </h3>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-300">
                  📊
                </div>
              </div>
              <p className="mt-3 text-slate-200 text-sm">
                Charts for response time, interview rate, and offer rate.
              </p>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
