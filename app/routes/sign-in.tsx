"use client";

import { SignIn as ClerkSignIn } from "@clerk/clerk-react";
import "./sign-in.css";

export default function SignIn() {
  return (
    <div className="sign-in-page-container">
      <ClerkSignIn routing="path" path="/sign-in" />
    </div>
  );
}
