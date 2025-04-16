import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@neostack/ui/components/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@neostack/ui/components/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@neostack/ui/components/form";
import { Input } from "@neostack/ui/components/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@neostack/ui/components/dialog";
import { authClient } from "@/lib/authClient";
import { toast } from "sonner";

// Form schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type LoginForm = z.infer<typeof loginSchema>;
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export function PagesLogin() {
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  // Login form
  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Forgot password form
  const forgotPasswordForm = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Handlers
  const onLoginSubmit = (values: LoginForm) => {
    setIsLoginSubmitting(true);
    authClient.signIn.email({
      email: values.email,
      password: values.password,
      fetchOptions: {
        onSuccess: () => {
          toast.success("Login successful!");
          window.location.href = "/dashboard";
        },
        onError: (error) => {
          console.error("Login error:", error);
          loginForm.setError("root", {
            message: "Invalid email or password.",
          });
          setIsLoginSubmitting(false);
        },
      },
    });
  };

  const onForgotPasswordSubmit = (values: ForgotPasswordForm) => {
    setIsForgotSubmitting(true);
    authClient.forgetPassword({
      email: values.email,
      redirectTo: `${import.meta.env.PUBLIC_SITE_URL}/reset-password`,
      fetchOptions: {
        onSuccess: () => {
          toast.success("Reset link sent to your email!");
          setIsForgotPasswordOpen(false);
          forgotPasswordForm.reset();
          setIsForgotSubmitting(false);
        },
        onError: (error) => {
          console.error("Forgot password error:", error);
          forgotPasswordForm.setError("email", {
            message: "Failed to send reset email. Please try again.",
          });
          setIsForgotSubmitting(false);
        },
      },
    });
  };

  const handleGoogleSignIn = () => {
    authClient.signIn.social({
      provider: "google",
      callbackURL: `${import.meta.env.PUBLIC_SITE_URL}`,
      fetchOptions: {
        onSuccess: () => {
          toast.success("Google sign-in successful!");
        },
        onError: (error) => {
          console.error("Google sign-in error:", error);
          loginForm.setError("root", {
            message: "Google sign-in failed. Please try again.",
          });
        },
      },
    });
  };

  return (
    <div className="flex justify-center items-center bg-background min-h-first-page">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Log in</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Social Sign-In */}
            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoginSubmitting}
            >
              <svg
                className="mr-2 w-4 h-4"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="currentColor"
                  d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.564,9.415-11.354H12.545z"
                />
              </svg>
              Sign in with Google
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="border-t w-full"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Login Form */}
            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {loginForm.formState.errors.root && (
                  <p className="text-destructive text-sm">
                    {loginForm.formState.errors.root.message}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoginSubmitting}
                >
                  {isLoginSubmitting ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </Form>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
          <div className="text-muted-foreground text-sm">
            Don't have an account?{" "}
            <a
              href="/register"
              className="text-primary hover:underline underline-offset-4"
            >
              Create account
            </a>
          </div>

          {/* Forgot Password Dialog */}
          <Dialog
            open={isForgotPasswordOpen}
            onOpenChange={setIsForgotPasswordOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="link"
                size="sm"
                className="text-muted-foreground"
              >
                Forgot your password?
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader className="space-y-2">
                <DialogTitle className="text-2xl">Reset Password</DialogTitle>
                <DialogDescription>
                  Enter your email to receive a password reset link.
                </DialogDescription>
              </DialogHeader>
              <Form {...forgotPasswordForm}>
                <form
                  onSubmit={forgotPasswordForm.handleSubmit(
                    onForgotPasswordSubmit
                  )}
                  className="space-y-6"
                >
                  <FormField
                    control={forgotPasswordForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="flex justify-between gap-4">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(false)}
                      disabled={isForgotSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isForgotSubmitting}>
                      {isForgotSubmitting ? "Sending..." : "Send reset link"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  );
}
