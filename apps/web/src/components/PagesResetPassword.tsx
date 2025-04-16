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
const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export function PagesResetPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form setup
  const resetForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Form submission handler
  const onSubmit = async (values: ResetPasswordForm) => {
    setIsSubmitting(true);
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      toast.error("Invalid token. Please try again.");
      setIsSubmitting(false);
      return;
    }
    await authClient.resetPassword({
      newPassword: values.password,
      token,
      fetchOptions: {
        onSuccess: async () => {
          toast.success("Password reset successfully. You can now sign in.");
          resetForm.reset();
          setIsSubmitting(false);
          window.location.href = "/login";
        },
        onError: (res) => {
          const errorMessage = res.error.message || "An error occurred";
          toast.error(errorMessage);
          resetForm.setError("root", {
            message: errorMessage,
          });
          setIsSubmitting(false);
        },
      },
    });
  };

  return (
    <div className="flex justify-center items-center bg-background min-h-first-page">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Reset your password</CardTitle>
          <CardDescription>
            Enter a new password for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...resetForm}>
            <form
              onSubmit={resetForm.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={resetForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
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
                control={resetForm.control}
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

              {resetForm.formState.errors.root && (
                <p className="text-destructive text-sm">
                  {resetForm.formState.errors.root.message}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
          <div className="text-muted-foreground text-sm">
            Return to{" "}
            <a
              href="/login"
              className="text-primary hover:underline underline-offset-4"
            >
              Sign in
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
