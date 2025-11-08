import { Outlet } from "react-router";

// This file should NOT export a full HTML tree or providers.
// It should only be a passthrough for nested routes.

export default function RoutesWrapper() {
  return <Outlet />;
}