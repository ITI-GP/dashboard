import { AuthBindings } from "@refinedev/core";
import { HttpError } from "@refinedev/core";
import { supabase } from "./supabaseClient";

export const authProvider: AuthBindings = {
  login: async ({ email, password, providerName }) => {
    try {
      // Sign in with email/password
      if (email && password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return {
            success: false,
            error: new Error(error.message || "Login failed"),
          };
        }

        if (data?.user) {
          return {
            success: true,
            redirectTo: "/",
          };
        }
      }

      // OAuth login
      if (providerName) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: providerName as any,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          return {
            success: false,
            error: new Error(error.message || "OAuth login failed"),
          };
        }

        if (data?.url) {
          return {
            success: true,
            redirectTo: "/",
          };
        }
      }

      return {
        success: false,
        error: new Error("Invalid login credentials"),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(error?.message || "Login failed"),
      };
    }
  },
  register: async ({ email, password, options }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: options?.data,
        },
      });

      if (error) {
        return {
          success: false,
          error: new Error(error.message || "Registration failed"),
        };
      }

      return {
        success: true,
        redirectTo: "/login?registered=true",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(error?.message || "Registration failed"),
      };
    }
  },
  forgotPassword: async ({ email }) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return {
          success: false,
          error: new Error(error.message || "Failed to send password reset email"),
        };
      }

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(error?.message || "Failed to send password reset email"),
      };
    }
  },
  updatePassword: async ({ password }) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        return {
          success: false,
          error: new Error(error.message || "Failed to update password"),
        };
      }

      return {
        success: true,
        redirectTo: "/login",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(error?.message || "Failed to update password"),
      };
    }
  },
  logout: async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: new Error(error.message || "Logout failed"),
      };
    }

    return {
      success: true,
      redirectTo: "/login",
    };
  },
  onError: async (error) => {
    console.error(error);
    return { error };
  },
  check: async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const { session } = data;

      if (!session) {
        return {
          authenticated: false,
          redirectTo: "/login",
        };
      }

      return {
        authenticated: true,
      };
    } catch (error: any) {
      return {
        authenticated: false,
        redirectTo: "/login",
        error: error?.message,
      };
    }
  },
  getPermissions: async () => {
    const { data } = await supabase.auth.getUser();
    const { user } = data;

    if (!user) {
      return null;
    }

    // You can add custom role/permission logic here
    return user.role;
  },
  getIdentity: async () => {
    const { data } = await supabase.auth.getUser();
    const { user } = data;

    if (!user) {
      return null;
    }

    return {
      ...user,
      name: user.email,
      avatar: user.user_metadata?.avatar_url,
    };
  },
};
