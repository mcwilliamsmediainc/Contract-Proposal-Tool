import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useAuth } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";

import Home from "@/pages/home";
import AdminDashboard from "@/pages/admin/dashboard";
import ProposalsList from "@/pages/admin/proposals/list";
import NewProposal from "@/pages/admin/proposals/new";
import EditProposal from "@/pages/admin/proposals/edit";
import Onboarding from "@/pages/admin/onboarding";
import Clients from "@/pages/admin/clients";
import ContractsList from "@/pages/admin/contracts/list";
import NewContract from "@/pages/admin/contracts/new";
import EditContract from "@/pages/admin/contracts/edit";
import ClientPortal from "@/pages/portal/proposal";
import ContractPortal from "@/pages/portal/contract";
import OnboardingFormPortal from "@/pages/portal/onboarding-form";
import UpdatePayment from "@/pages/portal/update-payment";
import PaymentLink from "@/pages/admin/payment-link";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/mcwilliams-logo.png`,
  },
  variables: {
    colorPrimary: "#061e57",
    colorForeground: "#111827",
    colorMutedForeground: "#6b7280",
    colorDanger: "#dc2626",
    colorBackground: "#ffffff",
    colorInput: "#f1f5f9",
    colorInputForeground: "#111827",
    colorNeutral: "#e2e8f0",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-gray-900 font-bold",
    headerSubtitle: "text-gray-500",
    socialButtonsBlockButtonText: "text-gray-700 font-medium",
    formFieldLabel: "text-gray-700 text-sm font-medium",
    footerActionLink: "text-[#061e57] hover:text-[#0d3494] font-semibold",
    footerActionText: "text-gray-500",
    dividerText: "text-gray-400",
    identityPreviewEditButton: "text-[#061e57]",
    formFieldSuccessText: "text-green-600",
    alertText: "text-red-600",
    logoBox: "flex justify-center py-2",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton: "border border-gray-200 hover:bg-gray-50 transition-colors",
    formButtonPrimary: "bg-[#061e57] hover:bg-[#0d3494] text-white transition-colors",
    formFieldInput: "border-gray-200 bg-gray-50 text-gray-900 focus:ring-[#061e57]",
    footerAction: "text-center",
    dividerLine: "bg-gray-200",
    alert: "bg-red-50 border-red-200",
    otpCodeFieldInput: "border-gray-200",
    formFieldRow: "",
    main: "",
  },
};

function SignInPage() {
  return (
    <div className="min-h-[100dvh] bg-[#061e57] flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <img
          src={`${basePath}/mcwilliams-logo.png`}
          alt="McWilliams Media"
          className="h-10 w-auto object-contain mx-auto"
          style={{ filter: "brightness(0) invert(1)" }}
        />
        <p className="text-[#b3cee1] text-sm mt-3 font-medium tracking-wide uppercase">Strategic Portal</p>
      </div>
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        forceRedirectUrl={`${basePath}/admin`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-[100dvh] bg-[#061e57] flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <img
          src={`${basePath}/mcwilliams-logo.png`}
          alt="McWilliams Media"
          className="h-10 w-auto object-contain mx-auto"
          style={{ filter: "brightness(0) invert(1)" }}
        />
        <p className="text-[#b3cee1] text-sm mt-3 font-medium tracking-wide uppercase">Strategic Portal</p>
      </div>
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        forceRedirectUrl={`${basePath}/admin`}
      />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#061e57] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#b3cee1]" />
    </div>
  );
}

function RequireSignIn({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return <>{children}</>;
}

function HomeRoute() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <LoadingScreen />;
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/admin" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to the McWilliams Media portal",
          },
        },
        signUp: {
          start: {
            title: "Set up your account",
            subtitle: "Create your McWilliams Media portal account",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            {/* Public routes */}
            <Route path="/" component={HomeRoute} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/proposal/:id" component={ClientPortal} />
            <Route path="/contract/:id" component={ContractPortal} />
            <Route path="/intake/:id" component={OnboardingFormPortal} />
            <Route path="/update-payment" component={UpdatePayment} />

            {/* Protected admin routes */}
            <Route path="/admin">
              {() => <RequireSignIn><AdminDashboard /></RequireSignIn>}
            </Route>
            <Route path="/admin/proposals">
              {() => <RequireSignIn><ProposalsList /></RequireSignIn>}
            </Route>
            <Route path="/admin/proposals/new">
              {() => <RequireSignIn><NewProposal /></RequireSignIn>}
            </Route>
            <Route path="/admin/proposals/:id/edit">
              {() => <RequireSignIn><EditProposal /></RequireSignIn>}
            </Route>
            <Route path="/admin/clients">
              {() => <RequireSignIn><Clients /></RequireSignIn>}
            </Route>
            <Route path="/admin/onboarding">
              {() => <RequireSignIn><Onboarding /></RequireSignIn>}
            </Route>
            <Route path="/admin/contracts">
              {() => <RequireSignIn><ContractsList /></RequireSignIn>}
            </Route>
            <Route path="/admin/contracts/new">
              {() => <RequireSignIn><NewContract /></RequireSignIn>}
            </Route>
            <Route path="/admin/contracts/:id/edit">
              {() => <RequireSignIn><EditContract /></RequireSignIn>}
            </Route>
            <Route path="/admin/payment-link">
              {() => <RequireSignIn><PaymentLink /></RequireSignIn>}
            </Route>

            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}
