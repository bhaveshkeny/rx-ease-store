import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — MediCare Pharmacy" },
      {
        name: "description",
        content: "Sign in or create a MediCare Pharmacy account to order medicines and track orders.",
      },
      { property: "og:title", content: "Sign In — MediCare Pharmacy" },
      {
        property: "og:description",
        content: "Sign in or create an account to order medicines and track orders.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [pendingConfirm, setPendingConfirm] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/orders" });
  }, [loading, user, navigate]);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    router.invalidate();
    navigate({ to: "/orders" });
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!dataema.session) {
      setPendingConfirm(true);
      toast.success("Check your email to confirm your account.");
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    router.invalidate();
    navigate({ to: "/orders" });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-center text-3xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Sign in to order medicines, upload prescriptions and track deliveries.
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 card-lift">
        {pendingConfirm ? (
          <div className="text-center text-sm">
            <p className="font-medium">Confirm your email</p>
            <p className="mt-2 text-muted-foreground">
              We sent a confirmation link to {email}. Click it to activate your account, then sign in.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setPendingConfirm(false)}>
              Back to sign in
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="text"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name">Full name</Label>
                  <Input
                    id="signup-name"
                    required
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="text"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  Create account
                </Button>
              </form>
            </TabsContent>

            <div className="mt-5">
              <div className="relative text-center text-xs text-muted-foreground">
                <span className="relative z-10 bg-card px-2">or</span>
                <span className="absolute left-0 top-1/2 h-px w-full bg-border" />
              </div>
              <Button variant="outline" className="mt-4 w-full" onClick={handleGoogle} disabled={busy}>
                Continue with Google
              </Button>
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
}
