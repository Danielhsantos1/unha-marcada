import type { MetadataRoute } from "next";

// Habilita "Adicionar à tela inicial" / "Instalar app" no Android e
// "Adicionar à Tela de Início" no iPhone — sem isso funciona só como
// atalho genérico; com isso vira um app de verdade (ícone próprio, abre
// sem a barra do navegador).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Unha Marcada",
    short_name: "Unha Marcada",
    description: "Agendamento de manicure e pedicure com sinal via PIX.",
    start_url: "/",
    display: "standalone",
    background_color: "#fdfaf9",
    theme_color: "#D9536F",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
