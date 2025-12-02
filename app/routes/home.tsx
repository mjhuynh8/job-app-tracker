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
            className="home-bg-layer"
          >
            <div className="floating-blur floating-blur-1" />
            <div className="floating-blur floating-blur-2" />
          </div>

        {/* HERO */}
        <div className="home-container">
          <div className="home-hero-grid">

        {/* LEFT CONTENT */}
        <div>
          <h1 className="home-title">
            Track every job, interview, and offer all in one place.
          </h1>

          <p className="home-subtitle">
            A visual job application tracker with stages for{" "}
            <span>Applied</span>,{" "}
            <span>Interviewing</span>, and{" "}
            <span>Offer</span>, plus analytics to
            track progress through your job finding journey.
          </p>

          <div className={`home-buttons ${signedIn ? 'start' : 'centered'}`}>
            {signedIn ? (
              <>
                <Link
                  to="/job-dashboard"
                  className="btn-primary"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="btn-secondary"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/sign-up"
                className="btn-primary"
              >
                Get Started!
              </Link>
            )}
          </div>

          {/* LARGE MODERN TECH ANIMATION */}
          <div className="home-lottie">
            <Lottie
              animationData={jobDashboardAnimation}
              loop
              autoplay
              className="w-full h-auto"
            />
          </div>
        </div>


        <div className="home-image-wrapper">
          <div
            className="home-image-blur"
            aria-hidden="true"
          />
        <img
          src={HERO_IMG}
          alt="Job application tracker dashboard with stages and analytics"
          className="home-hero-img"
          loading="eager"
          decoding="async"
        />


        </div>

          </div>
        </div>

        {/* FEATURE CARDS */}
        <div className="home-features-section">
          <div className="home-features-grid">

            {/* Card 1 */}
            <div className="feature-card">
              <div className="feature-card-header">
                <h3 className="feature-card-title">
                  Track Applications
                </h3>
                <div className="feature-card-icon">
                  📌
                </div>
              </div>
              <p className="feature-card-text">
                Stages for Applied, Interviewing, and Offer to track application status.
              </p>
            </div>

            {/* Card 2 */}
            <div className="feature-card">
              <div className="feature-card-header">
                <h3 className="feature-card-title">
                  Job Details
                </h3>
                <div className="feature-card-icon">
                  🗂️
                </div>
              </div>
              <p className="feature-card-text">
                Save key info: roles, skills, notes, and dates.
              </p>
            </div>

            {/* Card 3 */}
            <div className="feature-card">
              <div className="feature-card-header">
                <h3 className="feature-card-title">
                  Analytics
                </h3>
                <div className="feature-card-icon">
                  📊
                </div>
              </div>
              <p className="feature-card-text">
                Charts for response time, interview rate, and offer rate.
              </p>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
