import { useState, useRef } from "react";
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
import { Textarea } from "@neostack/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@neostack/ui/components/select";
import { authClient } from "@/lib/authClient";
import { toast } from "sonner";

// Form schema
const userSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be 50 characters or less"),
  bio: z.string().max(160, "Bio must be 160 characters or less").optional(),
  timezone: z.string().optional(),
  profilePicture: z.any().optional(), // Handled separately due to file input
});

type UserForm = z.infer<typeof userSchema>;

export function PagesSettingsUser() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form setup
  const userForm = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      bio: "",
      timezone: "",
      profilePicture: null,
    },
  });

  // Handle file selection and preview
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {};

  // Form submission handler
  const onSubmit = (values: UserForm) => {};

  // Update user data
  const updateUser = (values: UserForm, profilePictureUrl?: string) => {};

  // Timezone options (sample list, can be expanded)
  const timezones = [
    { value: "UTC", label: "UTC" },
    { value: "America/New_York", label: "New York (EST)" },
    { value: "America/Los_Angeles", label: "Los Angeles (PST)" },
    { value: "Europe/London", label: "London (GMT)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  ];

  return (
    <div className="flex justify-center items-center bg-background min-h-first-page">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">User Settings</CardTitle>
          <CardDescription>
            Update your name, profile picture, and other details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...userForm}>
            <form
              onSubmit={userForm.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {/* Profile Picture */}
              <FormField
                control={userForm.control}
                name="profilePicture"
                render={() => (
                  <FormItem>
                    <FormLabel>Profile Picture</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {previewUrl && (
                          <img
                            src={previewUrl}
                            alt="Profile preview"
                            className="rounded-full w-24 h-24 object-cover"
                          />
                        )}
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          ref={fileInputRef}
                          className="cursor-pointer"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Name */}
              <FormField
                control={userForm.control}
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

              {/* Bio */}
              <FormField
                control={userForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about yourself"
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Timezone */}
              <FormField
                control={userForm.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {timezones.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {userForm.formState.errors.root && (
                <p className="text-destructive text-sm">
                  {userForm.formState.errors.root.message}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update User Settings"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
          <div className="text-muted-foreground text-sm">
            <a
              href="/dashboard"
              className="text-primary hover:underline underline-offset-4"
            >
              Back to dashboard
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
