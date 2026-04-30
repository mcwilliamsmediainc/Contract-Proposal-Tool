import { Switch, Route, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Home from "@/pages/home";
import AdminDashboard from "@/pages/admin/dashboard";
import NewProposal from "@/pages/admin/proposals/new";
import EditProposal from "@/pages/admin/proposals/edit";
import Onboarding from "@/pages/admin/onboarding";
import ClientPortal from "@/pages/portal/proposal";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/proposals/new" component={NewProposal} />
            <Route path="/admin/proposals/:id/edit" component={EditProposal} />
            <Route path="/admin/onboarding" component={Onboarding} />
            <Route path="/proposal/:id" component={ClientPortal} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}
