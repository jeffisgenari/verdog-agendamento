import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { RateLimit } from "@/lib/ratelimit";

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

        // Barra tentativas repetidas de adivinhar a senha de uma conta
        // específica (a do admin incluída) — por e-mail, não por IP, pra
        // não dar pra contornar só trocando de rede.
        if (await RateLimit.login(email)) {
          throw new Error("Muitas tentativas. Aguarde alguns minutos e tente de novo.");
        }

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
    // Por padrão o NextAuth recusa login Google quando já existe uma conta
    // com o mesmo e-mail criada por senha (erro OAuthAccountNotLinked) — é
    // uma trava de segurança genérica. Como o Google já confirma que o
    // e-mail é mesmo da pessoa (email_verified), vinculamos automaticamente
    // em vez de bloquear.
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google" || !user.email) return true;

      const googleProfile = profile as { email_verified?: boolean } | undefined;
      if (!googleProfile?.email_verified) return true;

      const existente = await prisma.user
        .findUnique({ where: { email: user.email }, include: { accounts: true } })
        .catch(() => null);

      if (existente && !existente.accounts.some((a) => a.provider === "google")) {
        await prisma.account.create({
          data: {
            userId: existente.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state as string | undefined,
          },
        });
      }

      // Marca o e-mail como verificado (o Google já confirmou) — vale tanto
      // pra quem acabou de linkar a conta acima quanto pra um cadastro novo
      // via Google, que o adapter já criou antes desse callback rodar.
      await prisma.user
        .updateMany({
          where: { email: user.email, emailVerified: null },
          data: { emailVerified: new Date() },
        })
        .catch(() => null);

      return true;
    },
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
