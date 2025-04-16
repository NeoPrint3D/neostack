import { api } from "@neostack/api/client";

export const apiClient = api(import.meta.env.PUBLIC_API_URL, {
  init: {
    credentials: "include",
  },
});

export type ExtractedApiData<
  T extends (...args: any[]) => Promise<{ json: () => Promise<any> }>,
  K extends string,
> = Awaited<ReturnType<Awaited<ReturnType<T>>["json"]>>[K];
