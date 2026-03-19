import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import NextAuth from "next-auth";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    /**
     * GitHub OAuth Provider
     */
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    /**
     * Google OAuth Provider
     */
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    /* Normalize external provider identity into a stable internal `userId`.*/
    async jwt({ token, account, profile }) {
      if (account && profile) {
        if (account?.provider === "github") {
          token.userId = profile.id;
        }

        if (account?.provider === "google") {
          token.userId = profile.sub;
        }
      }

      return token;
    },
    /**Propagate normalized `userId` into the client-visible session object. */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
