import { useState } from "react";
import { useNavigate } from "react-router";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem("user", JSON.stringify({ email, password }));
    localStorage.setItem("signedIn", "true");
    nav("/job-dashboard");
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl mb-4">Sign Up</h1>
      <form onSubmit={submit} className="space-y-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full p-2 border rounded" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="w-full p-2 border rounded" />
        <button className="px-4 py-2 bg-green-600 text-white rounded">Create Account</button>
      </form>
    </div>
  );
}
