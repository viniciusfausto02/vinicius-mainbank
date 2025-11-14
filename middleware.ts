export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/demo",
    "/api/transfer",
    "/settings",
    "/admin",
  ],
};
