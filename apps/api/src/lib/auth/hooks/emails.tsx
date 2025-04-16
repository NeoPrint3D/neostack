import { AppEnv } from "@/types/AppEnv";
import { appInfo } from "@neostack/constants";
import ResetPasswordEmail from "@neostack/email/ResetPassword";
import VerificationEmail from "@neostack/email/VerificationEmail";
import { Resend } from "resend";
import { BetterAuthInstance } from "../../../client";

export const sendVerificationEmail = async (
  env: AppEnv,
  user: BetterAuthInstance["$Infer"]["Session"]["user"],
  url: string
) => {
  const resend = new Resend(env.RESEND_API_KEY);

  await resend.emails.send({
    from: appInfo.email,
    to: user.email,
    subject: "Verification Email",
    text: "test",
    react: <VerificationEmail username={user.name} verificationLink={url} />,
  });
};
export const sendResetPasswordEmail = async (
  env: AppEnv,
  user: BetterAuthInstance["$Infer"]["Session"]["user"],
  url: string
) => {
  const resend = new Resend(env.RESEND_API_KEY);

  await resend.emails.send({
    from: appInfo.email,
    to: user.email,
    subject: "Reset Password",
    text: "test",
    react: <ResetPasswordEmail username={user.name} resetLink={url} />,
  });
};
