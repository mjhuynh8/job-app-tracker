"use client";

import { SignUp as ClerkSignUp } from "@clerk/clerk-react";
import "./sign-up.css";

export default function SignUp() {
  return (
    <div className="sign-up-page-container">
      <ClerkSignUp routing="path" path="/sign-up" />
    </div>
  );
}
