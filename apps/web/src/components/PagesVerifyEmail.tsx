import { useState, useEffect } from "react";
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
import { useQueryState } from "nuqs";
import { NuqsAdapter } from "nuqs/adapters/react";
import { toast } from "sonner";

// Form schema
const verifyEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type VerifyEmailForm = z.infer<typeof verifyEmailSchema>;

export function PagesVerifyEmail() {
  return (
    <NuqsAdapter>
      <Page />
    </NuqsAdapter>
  );
}

function Page() {
  const [isSending, setIsSending] = useState(false);

  // Get email from URL query using nuqs
  const [emailQuery] = useQueryState("email");

  // Initialize form with email from query if available
  const verifyForm = useForm<VerifyEmailForm>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: emailQuery || "",
    },
  });

  // Update form email and send link if query changes
  useEffect(() => {
    if (emailQuery) {
      verifyForm.setValue("email", emailQuery);
      handleSendLink(emailQuery);
    }
  }, [emailQuery]);

  // Handler for sending/resending verification link
  const handleSendLink = (email: string) => {
    if (!email) {
      verifyForm.setError("root", {
        message: "Please enter an email address.",
      });
      return;
    }

    setIsSending(true);
    authClient.sendVerificationEmail({
      email,
      callbackURL: `${import.meta.env.PUBLIC_SITE_URL}`,
      fetchOptions: {
        onSuccess: () => {
          toast.success("A verification link has been sent to your email.");
          verifyForm.clearErrors("root");
          setIsSending(false);
        },
        onError: (error) => {
          console.error("Send verification email error:", error);
          verifyForm.setError("root", {
            message: "Failed to send verification link. Please try again.",
          });
          setIsSending(false);
        },
      },
    });
  };

  // Form submission handler
  const onSubmit = (values: VerifyEmailForm) => {
    handleSendLink(values.email);
  };

  return (
    <div className="flex justify-center items-center bg-background min-h-first-page">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>
            Enter your email address to receive a verification link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...verifyForm}>
            <form
              onSubmit={verifyForm.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <FormField
                control={verifyForm.control}
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

              {verifyForm.formState.errors.root && (
                <p className="text-destructive text-sm">
                  {verifyForm.formState.errors.root.message}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isSending}>
                {isSending ? "Sending..." : "Send Verification Link"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
          <div className="text-muted-foreground text-sm">
            Didn't receive a link?{" "}
            <Button
              variant="link"
              size="sm"
              className="p-0 text-primary hover:underline underline-offset-4"
              onClick={() => handleSendLink(verifyForm.getValues("email"))}
              disabled={isSending || !verifyForm.getValues("email")}
            >
              {isSending ? "Sending..." : "Resend link"}
            </Button>
          </div>
          <div className="text-muted-foreground text-sm">
            Already verified?{" "}
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
