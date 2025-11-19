import { useEffect, useState } from "react";
import { Navbar } from "./Navbar";
import "./header.css";

export function Header({ title }: { title?: string }) {
  const fallback = title || "JobApp";
  const [clientTitle, setClientTitle] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setClientTitle(document.title || fallback);
    }
  }, [fallback]);

  return (
    <header className="w-full app-header">
        <div className="w-full bg-blue-900 text-white" style={{ height: '100px' }}>
        <div className="container mx-auto flex items-center h-full">
            <a href="/" className="flex items-center">
            <img
                src="/logo2.png"
                alt="Job App Tracker Logo"
                className="h-64 w-auto block"
            />
            </a>
        </div>
        </div>

      <Navbar />
    </header>
  );
}