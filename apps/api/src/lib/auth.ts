// auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { stripe } from "@better-auth/stripe";
import {
  oneTimeToken,
  admin,
  haveIBeenPwned,
  openAPI,
  organization,
} from "better-auth/plugins";
import Stripe from "stripe";
import { schema } from "@neo-stack/database";
import { drizzle } from "@neo-stack/database";
import { AppEnv } from "..";

export const createAuthClient = (
  env: AppEnv
): ReturnType<typeof betterAuth> => {
  return betterAuth({
    appName: "NeoStack",
    baseURL: `${env.BETTER_AUTH_URL}/v1/auth`,
    basePath: "/v1/auth",
    trustedOrigins: env.TRUSTED_ORIGINS.split(","),

    advanced: {
      cookiePrefix: "neostack",
      crossSubDomainCookies: {
        enabled: true,
        domain: ".stack.neoprint3d.dev",
      },
    },

    database: drizzleAdapter(drizzle(env.HYPERDRIVE.connectionString), {
      provider: "pg",
      usePlural: true,
      schema,
    }),

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true, // Require email verification
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, token }) => {},
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    plugins: [
      stripe({
        stripeClient: new Stripe(env.STRIPE_SECRET_KEY),
        stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
        createCustomerOnSignUp: true,
        onCustomerCreate: async (
          { customer, stripeCustomer, user },
          request
        ) => {
          console.log(`Customer ${customer.id} created for user ${user.id}`);
        },
        subscription: {
          enabled: true,
          plans: [],
        },
      }),
      openAPI(),
      haveIBeenPwned(),
      admin(),
      organization(),
    ],
  });
};

export const auth: any = betterAuth({
  database: drizzleAdapter(
    drizzle("postgres://john:doe@localhost:5432/postgres"),
    {
      provider: "pg",
      usePlural: true,
      schema,
    }
  ),
  emailAndPassword: {
    enabled: true,
  },

  plugins: [
    stripe({
      stripeClient: new Stripe("dummy-key"),
      stripeWebhookSecret: "dummy-key",
      createCustomerOnSignUp: true,

      subscription: {
        enabled: true,
        plans: [],
      },
    }),
    openAPI(),
    haveIBeenPwned(),
    oneTimeToken(),
    admin(),
    organization(),
  ],
});
