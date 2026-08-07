// Redimensiona/comprime uma imagem no navegador antes de enviar, já que
// guardamos as fotos direto no banco (sem serviço de storage por enquanto).
export function comprimirImagem(
  arquivo: File,
  maxDimensao = 1280,
  qualidade = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Arquivo não é uma imagem válida."));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimensao || height > maxDimensao) {
          const escala = maxDimensao / Math.max(width, height);
          width = Math.round(width * escala);
          height = Math.round(height * escala);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas não suportado."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", qualidade));
      };
      img.src = leitor.result as string;
    };
    leitor.readAsDataURL(arquivo);
  });
}
