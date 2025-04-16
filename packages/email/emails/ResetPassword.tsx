// emails/ResetPasswordEmail.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import { appInfo, tailwindConfig } from "@neostack/constants";

interface ResetPasswordEmailProps {
  username?: string;
  resetLink?: string;
}

export const ResetPasswordEmail = ({
  username = "User",
  resetLink = "https://example.com/reset-password?token=abc123",
}: ResetPasswordEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your password</Preview>
    <Tailwind config={tailwindConfig}>
      <Body className="font-sans text-foreground tracking-normal">
        <Container className="mx-auto px-4 py-8 border max-w-[600px]">
          <Section className="bg-card shadow-md p-6 rounded-lg">
            <Heading className="font-semibold text-card-foreground text-2xl">
              Hello, {username}!
            </Heading>
            <Text className="mt-4 text-muted-foreground text-base">
              We received a request to reset your password. Click the button
              below to set a new password.
            </Text>
            <Section className="mt-6 text-center">
              <Button
                href={resetLink}
                className="inline-block bg-primary px-6 py-3 rounded-lg font-medium text-primary-foreground text-sm"
              >
                Reset Your Password
              </Button>
            </Section>
            <Text className="mt-6 text-muted-foreground text-sm">
              If the button above doesn’t work, copy and paste the following
              link into your browser:
            </Text>
            <Link
              href={resetLink}
              className="block mt-2 text-brand text-sm underline break-all"
            >
              {resetLink}
            </Link>
            <Text className="mt-8 text-muted-foreground text-sm">
              If you didn’t request a password reset, you can safely ignore this
              email.
            </Text>
          </Section>
          <Section className="mt-6 text-center">
            <Text className="text-muted-foreground text-xs">
              © {new Date().getFullYear()} {appInfo.name}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default ResetPasswordEmail;
