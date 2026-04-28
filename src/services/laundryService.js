import dayjs from 'dayjs';

const DIRTY_HOURS = 16;
const URGENT_HOURS = 48;
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
const ok = (data) => ({ success: true, data });

function computeStatus(item) {
  const hours = dayjs().diff(dayjs(item.lastWorn), 'hour');
  const isDirty = hours >= DIRTY_HOURS;
  const urgency = hours >= URGENT_HOURS ? 'urgent' : 'normal';
  return { itemId: item.id, isDirty, hoursSinceWorn: hours, urgency };
}

export const laundryService = {
  async getLaundryItems(wardrobe) {
    await delay();
    const statuses = wardrobe.map((item) => ({
      ...item,
      laundryStatus: computeStatus(item),
    }));
    const dirty = statuses.filter((i) => i.inLaundry || i.laundryStatus.isDirty);
    return ok(dirty);
  },

  async getLaundryStats(wardrobe) {
    await delay(150);
    const total = wardrobe.length;
    const dirty = wardrobe.filter(
      (i) => i.inLaundry || dayjs().diff(dayjs(i.lastWorn), 'hour') >= DIRTY_HOURS
    ).length;
    const urgent = wardrobe.filter(
      (i) => i.inLaundry && dayjs().diff(dayjs(i.lastWorn), 'hour') >= URGENT_HOURS
    ).length;
    const clean = total - dirty;
    return ok({
      totalItems: total,
      dirtyItems: dirty,
      urgentItems: urgent,
      cleanItems: clean,
      dirtyPercentage: total > 0 ? Math.round((dirty / total) * 100) : 0,
    });
  },

  filterAndSort(items, { search = '', filter = 'all', sort = 'date' }) {
    let result = [...items];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.type.toLowerCase().includes(q) ||
          (i.color ?? '').toLowerCase().includes(q) ||
          (i.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    }

    // Filter
    if (filter === 'urgent') {
      result = result.filter(
        (i) => i.inLaundry && dayjs().diff(dayjs(i.lastWorn), 'hour') >= URGENT_HOURS
      );
    } else if (['top', 'bottom', 'shoes', 'accessories', 'outer'].includes(filter)) {
      result = result.filter((i) => i.type === filter);
    }

    // Sort
    if (sort === 'date') result.sort((a, b) => new Date(b.lastWorn) - new Date(a.lastWorn));
    else if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'type') result.sort((a, b) => a.type.localeCompare(b.type));

    return result;
  },
};
