import { QueryClient } from "@tanstack/react-query";
import { ApiError, NetworkError } from "./errors";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, e) => e instanceof NetworkError && count < 1,
      throwOnError: (e) => e instanceof ApiError && e.status === 401,
    },
    mutations: { retry: 0 },
  },
});
