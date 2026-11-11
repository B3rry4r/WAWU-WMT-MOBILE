import { resetPasswordRequest } from '@/api/identity';
import { LinkPasswordRoute } from '@/features/auth/LinkPasswordRoute';

/**
 * `https://wawuafrica.com/reset-password?token=...&email=...` opened in the installed app (RESET-APP, R-123) or on usewmt.com
 * (APP-RESET, R-133): the link WAWU ID mails for "Forgot password". The body is `LinkPasswordRoute`, shared with `/activate`.
 */
export default function ResetPasswordRoute() {
  return <LinkPasswordRoute save={(link, password) => resetPasswordRequest(link.token, link.email, password)} />;
}
