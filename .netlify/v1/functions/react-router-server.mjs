// Replace SSR forwarder with a no-op to prevent Netlify from invoking a server build
export default async function handler() {
  // client-only: do nothing, prefer static files
  return new Response("OK", { status: 200 });
}

export const config = {
  name: "React Router server handler",
  generator: "@netlify/vite-plugin-react-router@1.0.1",
  path: "/*",
  preferStatic: true, // ensure static publishing from build/client
};
