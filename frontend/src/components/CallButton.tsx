import { Phone } from 'lucide-react';
import { telHref } from '../utils/phone';
import { cn } from '../utils/cn';

interface CallButtonProps {
  phone: string;
  onCall?: () => void;
  className?: string;
}

/** Big tel:+91… button. */
export function CallButton({ phone, onCall, className }: CallButtonProps) {
  return (
    <a href={telHref(phone)} onClick={onCall} className={cn('btn-primary btn-lg', className)}>
      <Phone className="h-5 w-5" strokeWidth={2.4} />
      Call
    </a>
  );
}
