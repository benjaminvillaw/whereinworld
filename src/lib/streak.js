// Streak tracking utilities for engagement features

// Get streak data from localStorage
export function getStreakData() {
    try {
        const data = localStorage.getItem('whereinworld_streak');
        return data ? JSON.parse(data) : { currentStreak: 0, lastCheckIn: null };
    } catch {
        return { currentStreak: 0, lastCheckIn: null };
    }
}

// Update streak (call when location is updated)
export function updateStreak() {
    const data = getStreakData();
    const now = new Date();
    const today = now.toDateString();

    if (data.lastCheckIn === today) {
        // Already checked in today
        return data;
    }

    const lastDate = data.lastCheckIn ? new Date(data.lastCheckIn) : null;
    const isConsecutiveDay = lastDate &&
        (now.getTime() - lastDate.getTime()) < (48 * 60 * 60 * 1000); // Within 48 hours

    const newData = {
        currentStreak: isConsecutiveDay ? data.currentStreak + 1 : 1,
        lastCheckIn: today,
        longestStreak: Math.max(data.longestStreak || 0, isConsecutiveDay ? data.currentStreak + 1 : 1)
    };

    localStorage.setItem('whereinworld_streak', JSON.stringify(newData));
    return newData;
}
