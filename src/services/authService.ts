export interface AuthUser {
  username: string;
  name: string;
  role: string;
  email: string;
  loginAt: string;
}

const AUTH_STORAGE_KEY = 'vapt_auth_session_v1';
const CUSTOM_CREDS_KEY = 'vapt_custom_credentials_v1';

class AuthService {
  private getStoredCreds(): { username: string; pass: string } {
    try {
      const saved = localStorage.getItem(CUSTOM_CREDS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // ignore
    }
    return {
      username: 'sanjay',
      pass: 'Sanjay@437',
    };
  }

  public isAuthenticated(): boolean {
    try {
      const session = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (!session) return false;
      const parsed = JSON.parse(session);
      return Boolean(parsed && parsed.username);
    } catch (e) {
      return false;
    }
  }

  public getCurrentUser(): AuthUser | null {
    try {
      const session = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (!session) return null;
      return JSON.parse(session);
    } catch (e) {
      return null;
    }
  }

  public login(
    usernameInput: string,
    passwordInput: string,
    rememberMe: boolean = true
  ): { success: boolean; message?: string; user?: AuthUser } {
    const creds = this.getStoredCreds();
    const u = usernameInput.trim().toLowerCase();
    const p = passwordInput;

    if (u === creds.username.toLowerCase() && p === creds.pass) {
      const user: AuthUser = {
        username: creds.username,
        name: 'Sanjay',
        role: 'Cyber Security Engineer',
        email: 'sanjay.cybersec@secureshield.io',
        loginAt: new Date().toISOString(),
      };

      const payload = JSON.stringify(user);
      if (rememberMe) {
        localStorage.setItem(AUTH_STORAGE_KEY, payload);
      } else {
        sessionStorage.setItem(AUTH_STORAGE_KEY, payload);
      }

      window.dispatchEvent(new Event('vapt_auth_changed'));
      return { success: true, user };
    }

    return {
      success: false,
      message: 'Invalid username or password. Please check your credentials.',
    };
  }

  public logout(): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      // ignore
    }
    window.dispatchEvent(new Event('vapt_auth_changed'));
  }

  public updatePassword(oldPass: string, newPass: string): { success: boolean; message: string } {
    const creds = this.getStoredCreds();
    if (oldPass !== creds.pass) {
      return { success: false, message: 'Current password does not match.' };
    }
    if (!newPass || newPass.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters.' };
    }

    const updated = { username: creds.username, pass: newPass };
    localStorage.setItem(CUSTOM_CREDS_KEY, JSON.stringify(updated));
    return { success: true, message: 'Password updated successfully!' };
  }
}

export const authService = new AuthService();
