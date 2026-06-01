/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function todayMonth(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

export function todayStr(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function genId(): string {
  return Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
}

export function parseAmount(s: string | number | null | undefined): number {
  if (s == null) return 0;
  if (typeof s === 'number') return Math.round(s);
  let str = String(s).trim().toLowerCase().replace(/\s/g, '').replace(/rp/gi, '');
  const hasComma = str.includes(',');
  const hasDot = str.includes('.');
  
  if (hasComma && hasDot) {
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    const dec = lastComma > lastDot ? ',' : '.';
    const thou = dec === ',' ? '.' : ',';
    str = str.replace(new RegExp('\\' + thou, 'g'), '').replace(dec, '.');
  } else if (hasComma && /,\d{1,2}$/.test(str)) {
    str = str.replace(',', '.');
  }
  
  // Handle k/m suffix with possible decimal
  if (/^[\d.,]+[km]$/.test(str)) {
    const suf = str.slice(-1);
    const num = parseFloat(str.slice(0, -1).replace(/,/g, '.'));
    return isNaN(num) ? 0 : Math.round(num * (suf === 'k' ? 1e3 : 1e6));
  }
  
  // Dots-as-thousands: "35.000" or "1.500.000" — multiple dots OR dot + exactly 3 digits at end
  if ((str.match(/\./g) || []).length > 1 || /\.\d{3}($|\D)/.test(str)) {
    str = str.replace(/\./g, '');
  }
  
  const n = parseFloat(str.replace(/,/g, ''));
  return isNaN(n) ? 0 : Math.round(n);
}

export function fmtIDR(n: number | null | undefined, prefix = true): string {
  if (n == null || isNaN(n)) n = 0;
  const neg = n < 0;
  const abs = Math.abs(Math.round(n));
  const str = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (neg ? '-' : '') + (prefix ? 'Rp' : '') + str;
}

export function fmtCompact(n: number | null | undefined): string {
  if (n == null || isNaN(n)) n = 0;
  const neg = n < 0;
  const abs = Math.abs(n);
  let s: string;
  if (abs >= 1e6) {
    s = (abs / 1e6).toFixed(abs % 1e6 === 0 ? 0 : 1).replace(/\.0$/, '') + 'M';
  } else if (abs >= 1e3) {
    s = (abs / 1e3).toFixed(abs % 1e3 === 0 ? 0 : 1).replace(/\.0$/, '') + 'k';
  } else {
    s = abs.toString();
  }
  return (neg ? '-' : '') + s;
}

export function prevMonth(m: string): string {
  let [y, mo] = m.split('-').map(Number);
  mo--;
  if (mo < 1) {
    mo = 12;
    y--;
  }
  return y + '-' + String(mo).padStart(2, '0');
}

export function nextMonth(m: string): string {
  let [y, mo] = m.split('-').map(Number);
  mo++;
  if (mo > 12) {
    mo = 1;
    y++;
  }
  return y + '-' + String(mo).padStart(2, '0');
}

export function monthLabel(m: string): string {
  const [y, mo] = m.split('-');
  const names = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return names[parseInt(mo) - 1] + ' ' + y;
}

export function monthLabelShort(m: string): string {
  const [y, mo] = m.split('-');
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return names[parseInt(mo) - 1] + ' ' + y;
}

export function fmtDate(d: string): string {
  if (!d) return '';
  const dt = new Date(d + 'T12:00:00');
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return dt.getDate() + ' ' + names[dt.getMonth()] + ' ' + dt.getFullYear();
}

export function fmtDateShort(d: string): string {
  if (!d) return '';
  const dt = new Date(d + 'T12:00:00');
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return dt.getDate() + ' ' + names[dt.getMonth()];
}

export function fmtDateTime(iso: string): string {
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return 'never';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export function isToday(d: string): boolean {
  return d === todayStr();
}

// Age of Money Calculation
export function calculateAgeOfMoney(incomes: { date: string, amount: number }[], expenses: { date: string, amount: number }[]): number | null {
  const incList = incomes
    .map(i => ({ date: new Date(i.date + 'T12:00:00'), amount: i.amount }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
    
  const expList = expenses
    .map(t => ({ date: new Date(t.date + 'T12:00:00'), amount: t.amount }))
    .sort((a, b) => b.date.getTime() - a.date.getTime()); // most recent first
    
  if (!incList.length || !expList.length) return null;
  
  const pool = incList.map(i => ({ ...i, remaining: i.amount }));
  const recent = expList.slice(0, 10);
  const ages: { days: number, weight: number }[] = [];
  
  for (const exp of recent) {
    let left = exp.amount;
    for (const inc of pool) {
      if (inc.remaining <= 0) continue;
      if (inc.date > exp.date) continue; // income must be before expense
      
      const use = Math.min(left, inc.remaining);
      const ageDays = Math.round((exp.date.getTime() - inc.date.getTime()) / 86400000);
      
      ages.push({ days: ageDays, weight: use });
      inc.remaining -= use;
      left -= use;
      
      if (left <= 0) break;
    }
  }
  
  if (!ages.length) return null;
  const totalWeight = ages.reduce((s, a) => s + a.weight, 0);
  if (totalWeight === 0) return null;
  
  const weightedAge = ages.reduce((s, a) => s + a.days * a.weight, 0) / totalWeight;
  return Math.round(weightedAge);
}
