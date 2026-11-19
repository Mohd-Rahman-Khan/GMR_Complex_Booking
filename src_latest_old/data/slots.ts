export const generateSlots = (
  openingTime: string,
  closingTime: string,
  duration: number,
  interval: number = 30,
) => {
  const slots = [];

  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const toTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const opening = toMinutes(openingTime);
  const closing = toMinutes(closingTime);

  for (let start = opening; start + duration <= closing; start += interval) {
    slots.push({
      id: `${start}`,
      startTime: toTime(start),
      endTime: toTime(start + duration),
      duration,
    });
  }

  return slots;
};
