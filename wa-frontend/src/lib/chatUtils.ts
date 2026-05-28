
export const normalizeTo62 = (input: string): string => {
    if (!input) return input;
    if (input.startsWith('+62')) return input.substring(1);
    if (input.startsWith('08')) return '62' + input.substring(1);
    if (input.startsWith('8')) return '62' + input;
    return input;
};

export const formatTime = (dateStr: string, timestamp?: number) => {
    const date = timestamp ? new Date(timestamp * 1000) : new Date(dateStr);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

export const formatTimeConversation = (dateStr: string, timestamp?: number) => {
    const date = timestamp ? new Date(timestamp * 1000) : new Date(dateStr);

    // if date is today return time
    if (isSameDay(date, new Date())) {
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }

    // if date is yesterday return yesterday
    if (isSameDay(date, new Date(new Date().setDate(new Date().getDate() - 1)))) {
        return 'Kemarin';
    }

    // if date is older than yesterday return date
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
};

export const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
};

export const formatDividerDate = (dateStr: string, timestamp?: number) => {
    const date = timestamp ? new Date(timestamp * 1000) : new Date(dateStr);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    if (isSameDay(date, now)) return 'Hari Ini';
    if (isSameDay(date, yesterday)) return 'Kemarin';

    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
};

export const getInitials = (name: string) => {
    if (!name) return '?';
    // Use spread operator to safely handle Unicode surrogate pairs (emojis)
    const chars = [...name.trim()];
    const words = name.split(' ').filter(w => w.length > 0);

    if (words.length > 1) {
        const first = [...words[0]][0];
        const last = [...words[words.length - 1]][0];
        return (first + last).toUpperCase();
    }

    return chars[0].toUpperCase();
};

export const truncateText = (text: string, limit: number) => {
    if (!text) return text;
    // Safely handle emojis/surrogate pairs by spreading into an array
    const chars = [...text];
    if (chars.length <= limit) return text;
    return chars.slice(0, limit).join('') + '...';
};

export const truncateNameInitial = (name: string) => {
    if (!name) return '?';
    // Use spread operator to safely handle Unicode surrogate pairs (emojis)
    const chars = [...name.trim()];
    const words = name.split(' ').filter(w => w.length > 0);

    if (words.length > 1) {
        const first = [...words[0]][0];
        const last = [...words[words.length - 1]][0];
        return (first + last).toUpperCase();
    }

    return chars[0].toUpperCase();
};
