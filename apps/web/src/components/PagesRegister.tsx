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
import { authClient } from "@/lib/authClient";
import { toast } from "sonner";
import { navigate } from "astro/virtual-modules/transitions-router.js";

// Form schema
const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export function PagesRegister() {
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);

  // Register form
  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handlers
  const onRegisterSubmit = async (values: RegisterForm) => {
    setIsRegisterSubmitting(true);
    await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      callbackURL: `${import.meta.env.PUBLIC_SITE_URL}/dashboard`,
      fetchOptions: {
        onSuccess: async () => {
          toast.success("Account created! Please verify your email.");
          registerForm.reset();
          setIsRegisterSubmitting(false);
          await navigate(`/verify-email?email=${values.email}`);
        },
        onError: (res) => {
          const errorMessage = res?.error?.message || "Registration failed";
          toast.error(errorMessage);
          registerForm.setError("root", {
            message: errorMessage,
          });
          setIsRegisterSubmitting(false);
        },
      },
    });
  };

  const handleGoogleSignIn = () => {
    authClient.signIn.social({
      provider: "google",
      callbackURL: `${import.meta.env.PUBLIC_SITE_URL}/dashboard`,
      newUserCallbackURL: `${import.meta.env.PUBLIC_SITE_URL}`,
      fetchOptions: {
        onSuccess: () => {
          toast.success("Google sign-up successful!");
        },
        onError: (error) => {
          console.error("Google sign-up error:", error);
          registerForm.setError("root", {
            message: "Google sign-up failed. Please try again.",
          });
        },
      },
    });
  };

  return (
    <div className="flex justify-center items-center bg-background min-h-first-page">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            Enter your details below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Social Sign-Up */}
            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isRegisterSubmitting}
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
              Sign up with Google
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

            {/* Registration Form */}
            <Form {...registerForm}>
              <form
                onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={registerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
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
                  control={registerForm.control}
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
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
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

                {registerForm.formState.errors.root && (
                  <p className="text-destructive text-sm">
                    {registerForm.formState.errors.root.message}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isRegisterSubmitting}
                >
                  {isRegisterSubmitting
                    ? "Creating account..."
                    : "Create account"}
                </Button>
              </form>
            </Form>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
          <div className="text-muted-foreground text-sm">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-primary hover:underline underline-offset-4"
            >
              Log in
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
