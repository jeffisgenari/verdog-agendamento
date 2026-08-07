import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "text" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) return null;
        const email = credentials.email.trim().toLowerCase();

        // Conta de admin provisória (sem banco) — ver README.md.
        if (
          process.env.ADMIN_EMAIL &&
          process.env.ADMIN_PASSWORD_HASH &&
          email === process.env.ADMIN_EMAIL.toLowerCase() &&
          (await bcrypt.compare(credentials.senha, process.env.ADMIN_PASSWORD_HASH))
        ) {
          return { id: "admin", email, name: "Admin", tipo: "ADMIN" };
        }

        const user = await prisma.user.findUnique({ where: { email } }).catch(() => null);
        if (!user?.senhaHash) return null;

        const senhaOk = await bcrypt.compare(credentials.senha, user.senhaHash);
        if (!senhaOk) return null;

        return { id: user.id, email: user.email, name: user.name, tipo: user.tipo };
      },
    }),
  ],
  // jwt (não "database"): o provider de credenciais exige essa estratégia.
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.tipo = (user as unknown as { tipo: string }).tipo;
      }
      // O token fica "congelado" com os dados de quando a pessoa logou.
      // Depois que ela escolhe cliente/profissional (EscolhaPerfil) ou troca
      // o avatar (AvatarUpload), o cliente chama update() pra forçar essa
      // releitura do banco.
      if (trigger === "update" && token.id) {
        const atual = await prisma.user.findUnique({ where: { id: token.id } }).catch(() => null);
        if (atual) {
          token.tipo = atual.tipo;
          token.picture = atual.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.tipo = token.tipo as string;
      }
      return session;
    },
  },
};
