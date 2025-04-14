import { authClient } from "@/lib/authClient";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const { data, error } = await authClient.getSession({
    fetchOptions: {
      headers: context.request.headers,
    },
  });
  if (data && !error) {
    context.locals.auth = data;
  } else {
    context.locals.auth = null;
  }

  return next();
});
