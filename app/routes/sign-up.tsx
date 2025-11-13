"use client";

import { SignUp as ClerkSignUp } from "@clerk/clerk-react";
import "./sign-up.css";

export default function SignUp() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <ClerkSignUp routing="path" path="/sign-up" />
    </div>
  );
}
