import type { ScheduleSlot } from './api';

const DAY_MAP: Record<string, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 0,
};

export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getNextDateForWeekday(weekday: string): string {
  const today = new Date();
  const target = DAY_MAP[weekday];
  let diff = target - today.getDay();
  if (diff < 0) diff += 7;
  const date = new Date(today);
  date.setHours(12, 0, 0, 0);
  date.setDate(today.getDate() + diff);
  return toLocalDateString(date);
}

export function isSlotCancelled(slot: ScheduleSlot, date: string): boolean {
  return (slot.cancellations || []).some(
    (cancellation) => cancellation.cancellationDate.slice(0, 10) === date,
  );
}
