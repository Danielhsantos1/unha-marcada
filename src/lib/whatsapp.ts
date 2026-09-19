/** Link do WhatsApp pronto pra enviar pra qualquer contato — sem número de
 * destino, então abre o seletor de conversa do WhatsApp em vez de mandar
 * direto pra alguém específico. Usado pelo dono do salão pra convidar
 * clientes a agendar. */
export function buildBookingShareLink(tenantName: string, bookingUrl: string): string {
  const message = `Olá! Você pode agendar seu horário no ${tenantName} por aqui: ${bookingUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
