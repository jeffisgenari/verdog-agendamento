import Image from "next/image";
import Link from "next/link";
import IconWhatsapp from "@/components/IconWhatsapp";
import IconInstagram from "@/components/IconInstagram";
import { linkWhatsapp, SUPORTE_TELEFONE } from "@/lib/whatsapp";

const LINK_WHATSAPP = linkWhatsapp(SUPORTE_TELEFONE);
const LINK_INSTAGRAM = "https://instagram.com/verdog.pet";

export default function Footer() {
  return (
    <footer className="max-w-xl mx-auto border-x border-t border-neutral-100 px-4 py-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Image src="/logo.png" alt="Verdog" width={1068} height={481} className="h-7 w-auto" />
        <div className="flex items-center gap-2">
          <a
            href={LINK_WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="flex-shrink-0 w-9 h-9 rounded-full bg-verdog text-white flex items-center justify-center"
          >
            <IconWhatsapp className="w-5 h-5" />
          </a>
          <a
            href={LINK_INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="flex-shrink-0 w-9 h-9 rounded-full bg-verdog text-white flex items-center justify-center"
          >
            <IconInstagram className="w-5 h-5" />
          </a>
        </div>
      </div>

      <Link href="/politica-de-privacidade" className="text-[11px] text-neutral-400 text-center">
        Política de Privacidade
      </Link>
    </footer>
  );
}
