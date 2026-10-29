import { Directive, HostListener } from '@angular/core';

const formatCnpj = (digits: string): string => {
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return digits.replace(/^(\d{2})(\d+)/, '$1.$2');
  if (digits.length <= 8) return digits.replace(/^(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
  if (digits.length <= 12) return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, '$1.$2.$3/$4-$5');
};

@Directive({
  selector: '[appCnpjMask]'
})
export class CnpjMaskDirective {
  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 14);
    const formatted = formatCnpj(digits);

    if (input.value === formatted) return;

    input.value = formatted;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
