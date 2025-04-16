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
import { schema } from "@neostack/database";
import { drizzle } from "@neostack/database";
import {
  sendResetPasswordEmail,
  sendVerificationEmail,
} from "./auth/hooks/emails";
import { AppEnv } from "@/types/AppEnv";

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
        domain: `.${env.BETTER_AUTH_COOKIE_DOMAIN}`,
      },
    },

    database: drizzleAdapter(drizzle(env.HYPERDRIVE.connectionString), {
      provider: "pg",
      usePlural: true,
      schema,
    }),

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url, token }, request) => {
        await sendResetPasswordEmail(env, user, url);
      },
    },
    emailVerification: {
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendVerificationEmail(env, user, url);
      },
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
