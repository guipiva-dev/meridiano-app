import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/api/queryClient";
import { AuthProvider } from "@/auth/AuthProvider";
import { ToastHost } from "@/components/feedback";
import { instalarAtalhos } from "@/lib/atalhos";
import { AppRoutes } from "@/router";

instalarAtalhos();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
        <ToastHost />
      </AuthProvider>
    </QueryClientProvider>
  );
}
