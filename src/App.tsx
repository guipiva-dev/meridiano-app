import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/api/queryClient";
import { AuthProvider } from "@/auth/AuthProvider";
import { ErrorBoundary, ToastHost } from "@/components/feedback";
import { instalarAtalhos } from "@/lib/atalhos";
import { AppRoutes } from "@/router";

instalarAtalhos();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
        <ToastHost />
      </AuthProvider>
    </QueryClientProvider>
  );
}
