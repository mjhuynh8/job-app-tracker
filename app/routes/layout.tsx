import { Outlet, Link, useLocation } from "react-router";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export default function Layout() {
  const loc = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto p-4 pt-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
