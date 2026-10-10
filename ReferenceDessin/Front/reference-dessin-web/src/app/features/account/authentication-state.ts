import { UserAccount } from './user-account';

export type AuthenticationState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; account: UserAccount }
  | { status: 'signingOut' }
  | { status: 'deleting' }
  | { status: 'error' };