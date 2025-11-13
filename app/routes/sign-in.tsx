"use client";

import { SignIn as ClerkSignIn } from "@clerk/clerk-react";
import "./sign-in.css";

export default function SignIn() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <ClerkSignIn routing="path" path="/sign-in" />
    </div>
  );
}
