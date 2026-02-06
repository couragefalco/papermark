import { sendEmail } from "@/lib/resend";

import LoginLink from "@/components/emails/verification-link";

export const sendVerificationRequestEmail = async (params: {
  email: string;
  url: string;
}) => {
  const { url, email } = params;
  // Use the direct callback URL from NextAuth
  const emailTemplate = LoginLink({ url });
  try {
    await sendEmail({
      to: email as string,
      system: true,
      subject: "Your Papermark Login Link",
      react: emailTemplate,
      test: process.env.NODE_ENV === "development",
    });
  } catch (e) {
    console.error(e);
  }
};
