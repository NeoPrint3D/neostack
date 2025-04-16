import { createAuthClient } from "better-auth/react";
import { organizationClient, adminClient } from "better-auth/client/plugins";
import { toast } from "sonner";
import { navigate } from "astro:transitions/client";
export const authClient = createAuthClient({
  baseURL: `${import.meta.env.PUBLIC_API_URL}/v1/auth`,
  plugins: [organizationClient(), adminClient()],
});

export const handleSignOut = async () => {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: async () => {
        toast.success("Signed out successfully!");
        await navigate("/login");
      },
    },
  });
};
