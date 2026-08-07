// Ícones preenchidos (fill sólido, herdam a cor via currentColor) usados nos cards de filtro da home.

export function IconTodos({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="3" y="3" width="8" height="8" rx="2.2" />
      <rect x="13" y="3" width="8" height="8" rx="2.2" />
      <rect x="3" y="13" width="8" height="8" rx="2.2" />
      <rect x="13" y="13" width="8" height="8" rx="2.2" />
    </svg>
  );
}

export function IconPasseio({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="8" cy="7.2" r="1.9" />
      <circle cx="12.5" cy="5.5" r="1.9" />
      <circle cx="17" cy="7.2" r="1.9" />
      <path d="M12.5 10.3c2.8 0 5.2 2 5.2 4.4 0 1.7-1.3 2.7-2.9 2.7-1 0-1.5-.5-2.3-.5s-1.3.5-2.3.5c-1.6 0-2.9-1-2.9-2.7 0-2.4 2.4-4.4 5.2-4.4Z" />
    </svg>
  );
}

export function IconAdestramento({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M8.7 12 6.2 20.2 10 18.6 12 20.4 14 18.6 17.8 20.2 15.3 12Z" />
      <circle cx="12" cy="9" r="6" />
    </svg>
  );
}

export function IconHospedagem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 3.8 20.5 11.3 17.8 11.3 17.8 20 6.2 20 6.2 11.3 3.5 11.3Z" />
    </svg>
  );
}
