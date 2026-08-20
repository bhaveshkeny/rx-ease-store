import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { apiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

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
  const [email, setEmail] = useState("");
  const [pendingConfirm, setPendingConfirm] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/orders" });
  }, [loading, user, navigate]);

  const signInSchema = Yup.object({
    email: Yup.string().email("Enter a valid email").required("Email is required"),
    password: Yup.string().required("Password is required"),
  });

  const signUpSchema = signInSchema.shape({
    fullName: Yup.string().min(2, "Enter your full name").required("Full name is required"),
    password: Yup.string().min(6, "Use at least 6 characters").required("Password is required"),
  });

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
              <Formik
                initialValues={{ email: "", password: "" }}
                validationSchema={signInSchema}
                onSubmit={async (values, { setSubmitting }) => {
                  try {
                    await useAuthStore.getState().signIn(values.email, values.password);
                    router.invalidate();
                    navigate({ to: "/orders" });
                  } catch (error) {
                    toast.error(apiErrorMessage(error));
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {({ isSubmitting }) => (
                  <Form className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="signin-email">Email</Label>
                      <Field as={Input} id="signin-email" name="email" type="email" />
                      <ErrorMessage name="email" component="p" className="text-xs text-destructive" />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signin-password">Password</Label>
                      <Field as={Input} id="signin-password" name="password" type="password" />
                      <ErrorMessage name="password" component="p" className="text-xs text-destructive" />
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      Sign in
                    </Button>
                  </Form>
                )}
              </Formik>
            </TabsContent>

            <TabsContent value="signup">
              <Formik
                initialValues={{ fullName: "", email: "", password: "" }}
                validationSchema={signUpSchema}
                onSubmit={async (values, { setSubmitting }) => {
                  try {
                    await useAuthStore.getState().signUp({
                      email: values.email,
                      password: values.password,
                      full_name: values.fullName,
                    });

                    setEmail(values.email);
                    setPendingConfirm(true);
                    toast.success("Your account is ready. Welcome to MediCare.");
                  } catch (error) {
                    toast.error(apiErrorMessage(error));
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {({ isSubmitting }) => (
                  <Form className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-name">Full name</Label>
                      <Field as={Input} id="signup-name" name="fullName" />
                      <ErrorMessage name="fullName" component="p" className="text-xs text-destructive" />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-email">Email</Label>
                      <Field as={Input} id="signup-email" name="email" type="email" />
                      <ErrorMessage name="email" component="p" className="text-xs text-destructive" />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password">Password</Label>
                      <Field as={Input} id="signup-password" name="password" type="password" />
                      <ErrorMessage name="password" component="p" className="text-xs text-destructive" />
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      Create account
                    </Button>
                  </Form>
                )}
              </Formik>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}