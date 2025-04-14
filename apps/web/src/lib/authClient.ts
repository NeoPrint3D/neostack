import { createAuthClient } from "better-auth/react";
import { organizationClient, adminClient } from "better-auth/client/plugins";
export const authClient = createAuthClient({
  baseURL: `${import.meta.env.PUBLIC_API_URL}/v1/auth`,
  plugins: [organizationClient(), adminClient()],
});
