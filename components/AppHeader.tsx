import Link from "next/link";
import Image from "next/image";
import HeaderAuth from "@/components/HeaderAuth";

export default function AppHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
      <Link href="/">
        <Image src="/logo.png" alt="Verdog" width={1068} height={481} className="h-8 w-auto" priority />
      </Link>
      <HeaderAuth />
    </header>
  );
}
