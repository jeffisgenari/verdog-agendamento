import { Poppins } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import Footer from "@/components/Footer";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata = {
  title: "Verdog | Agendamento",
  description: "Encontre passeadores, adestradores e hospedagem para seu pet",
  icons: {
    icon: "/fav.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${poppins.className} bg-white text-neutral-900`}>
        <SessionProviderWrapper>{children}</SessionProviderWrapper>
        <Footer />
      </body>
    </html>
  );
}
