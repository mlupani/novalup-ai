import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db/client";
import { verifyPassword } from "@/lib/auth/password";
import { grantFreeCredits } from "@/lib/credits/service";
import { loginSchema } from "@/lib/validation/schemas";

// `@auth/prisma-adapter` types its argument as `PrismaClient` from the legacy
// `@prisma/client`, which is not populated under Prisma 7's `prisma-client`
// generator (our client lives at `@/generated/prisma`). The adapter arg type
// therefore resolves to `any` and `PrismaAdapter(prisma)` passes as-is; the
// adapter's runtime behaviour does not depend on the exact client type.
const adapter = PrismaAdapter(prisma);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (raw) => {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.passwordHash) return null;

        const ok = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user?.id) token.userId = user.id;
      return token;
    },
    session: ({ session, token }) => {
      // `next-auth/jwt`'s `JWT` carries a `Record<string, unknown>` index
      // signature, so `token.userId` widens to `unknown` here despite the
      // `src/types/next-auth.d.ts` augmentation — narrow it back to string.
      if (token.userId) session.user.id = token.userId as string;
      return session;
    },
  },
  events: {
    // Fires only for adapter-created users (Google). The email/password path
    // seeds its own free credits (Task 14), so it must not also seed here.
    createUser: async ({ user }) => {
      if (user.id) await grantFreeCredits(user.id);
    },
  },
});
