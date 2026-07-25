/**
 * Generates a Google Calendar "quick add" URL for a deadline.
 * No OAuth needed — opens Google Calendar's pre-filled event creation screen
 * in a new tab. This is the MVP approach; a true one-click server-side
 * Calendar API integration (OAuth) can replace this later without changing
 * how it's called from components.
 */
export function generateGCalLink(item) {
  const deadlineDate = new Date(item.deadline);

  // All-day event format: YYYYMMDD/YYYYMMDD (day after, since end is exclusive)
  const startStr = formatDateForGCal(deadlineDate);
  const endDate = new Date(deadlineDate);
  endDate.setDate(endDate.getDate() + 1);
  const endStr = formatDateForGCal(endDate);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Deadline: ${item.title}`,
    dates: `${startStr}/${endStr}`,
    details: `${item.description || ''}\n\nOfficial link: ${item.sourceUrl}`.trim(),
    location: item.sourceUrl,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function formatDateForGCal(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}
