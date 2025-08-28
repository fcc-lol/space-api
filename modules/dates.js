export const getDates = (format = "dashes") => {
    let today = new Date().toISOString().split('T')[0];
    if (format === "dashes") {
        today = today.replace(/\//g, '-');
    } else if (format === "slashes") {
        today = today.replace(/-/g, '/');
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    let yesterdayFormatted = yesterday.toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    let thirtyDaysAgoFormatted = thirtyDaysAgo.toISOString().split('T')[0];
    if (format === "dashes") {
        thirtyDaysAgoFormatted = thirtyDaysAgoFormatted.replace(/\//g, '-');
    } else if (format === "slashes") {
        thirtyDaysAgoFormatted = thirtyDaysAgoFormatted.replace(/-/g, '/');
    }
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    let oneWeekAgoFormatted = oneWeekAgo.toISOString().split('T')[0];
    if (format === "dashes") {
        oneWeekAgoFormatted = oneWeekAgoFormatted.replace(/\//g, '-');
    } else if (format === "slashes") {
        oneWeekAgoFormatted = oneWeekAgoFormatted.replace(/-/g, '/');
    }
    

    return {
        thirtyDaysAgo: thirtyDaysAgoFormatted,
        oneWeekAgo: oneWeekAgoFormatted,
        yesterday: yesterdayFormatted,
        today: today
    }
}
