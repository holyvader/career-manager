import { smtpMailSender } from '../../email/adapters/smtpMailSender';
import { createAuthService } from './service';
export const auth = createAuthService(smtpMailSender);
