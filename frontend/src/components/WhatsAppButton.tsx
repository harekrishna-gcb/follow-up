import { MessageCircle } from 'lucide-react';
import { whatsappHref } from '../utils/phone';
import { cn } from '../utils/cn';

/** Big wa.me/91… button. */
export function WhatsAppButton({ phone, className }: { phone: string; className?: string }) {
  return (
    <a
      href={whatsappHref(phone)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('btn btn-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800', className)}
    >
      <MessageCircle className="h-5 w-5" strokeWidth={2.4} />
      WhatsApp
    </a>
  );
}
