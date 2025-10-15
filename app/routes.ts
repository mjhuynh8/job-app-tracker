import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("job-form", "routes/job-form.tsx"),
] satisfies RouteConfig;
