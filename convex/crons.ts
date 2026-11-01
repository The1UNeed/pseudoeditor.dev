import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Just after midnight UTC, so each data point covers the day that has just ended.
crons.cron("report account stats", "5 0 * * *", internal.analytics.reportAccountStats, {});

export default crons;
