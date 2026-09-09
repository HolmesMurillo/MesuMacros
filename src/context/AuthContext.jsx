import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "../services/supabaseClient";
import { AuthContext } from "./authContext";
import { getAppUrl } from "../utils/appUrl";
import { useLanguage } from "./languageContext";

function friendlyError(error, t) {
  if (!error) return "";
  if (error.message?.toLowerCase().includes("password"))
    return t("auth.passwordLength");
  if (error.message?.toLowerCase().includes("email")) return t("auth.emailFailed");
  if (/invalid login credentials/i.test(error.message || "")) return t("auth.invalidCredentials");
  return error.message || t("auth.genericError");
}

export function AuthProvider({ children }) {
  const { language, t } = useLanguage();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(supabaseConfigured);
  useEffect(() => {
    if (!supabase) return undefined;
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        setSession(nextSession);
        setLoading(false);
        if (
          event === "PASSWORD_RECOVERY" &&
          window.location.pathname !== "/reset-password"
        ) {
          window.history.replaceState(
            {},
            document.title,
            `/reset-password${window.location.search}${window.location.hash}`,
          );
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      },
    );
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);
  const value = useMemo(
    () => ({
      user: session?.user || null,
      session,
      loading,
      configured: supabaseConfigured,
      async signUp(email, password, name) {
        if (password.length < 8) return { error: t("auth.passwordLength") };
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name, language },
            emailRedirectTo: `${getAppUrl()}/auth/callback`,
          },
        });
        return {
          data,
          error: error ? { message: friendlyError(error, t) } : null,
        };
      },
      async resendConfirmation(email) {
        const { error } = await supabase.auth.resend({ type: "signup", email });
        return { error: error ? { message: t("auth.emailFailed") } : null };
      },
      async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return {
          data,
          error: error ? { message: friendlyError(error, t) } : null,
        };
      },
      async signInWithGoogle() {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: getAppUrl() },
        });
        return {
          data,
          error: error ? { message: friendlyError(error, t) } : null,
        };
      },
      async signOut() {
        return supabase.auth.signOut();
      },
      async resetPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        return { error: error ? { message: t("auth.emailFailed") } : null };
      },
      async updatePassword(password) {
        if (password.length < 8)
          return { error: { message: t("auth.passwordLength") } };
        const { error } = await supabase.auth.updateUser({ password });
        return { error: error ? { message: t("auth.genericError") } : null };
      },
      async exchangeCode(code) {
        const { data, error } =
          await supabase.auth.exchangeCodeForSession(code);
        return {
          data,
          error: error ? { message: friendlyError(error, t) } : null,
        };
      },
      async verifyOtp(tokenHash, type) {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });
        return {
          data,
          error: error ? { message: friendlyError(error, t) } : null,
        };
      },
      async refreshSession() {
        const { data, error } = await supabase.auth.getSession();
        return {
          data,
          error: error ? { message: friendlyError(error, t) } : null,
        };
      },
    }),
    [language, loading, session, t],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
