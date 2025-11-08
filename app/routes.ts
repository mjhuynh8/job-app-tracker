import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [ // top‐level layout wrapping all routes 

route("", "routes/layout.tsx", [ 
    // home/index route 
 index("routes/welcome.tsx"), 
// authenticated/job routes 

route("job-form", "routes/job-form.tsx"), route("job-dashboard", "routes/job-dashboard.tsx"), 
// sign‐in/up 
route("sign-in", "routes/sign-in.tsx"), route("sign-up", "routes/sign-up.tsx"), ]), ] satisfies RouteConfig
