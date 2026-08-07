export default function Avatar({
  src,
  nome,
  className = "w-9 h-9",
}: {
  src?: string | null;
  nome?: string | null;
  className?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={nome ?? "Avatar"}
        className={`${className} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  const inicial = nome?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <div
      className={`${className} rounded-full bg-verdog-pale text-verdog-dark flex items-center justify-center font-medium flex-shrink-0`}
    >
      {inicial}
    </div>
  );
}
