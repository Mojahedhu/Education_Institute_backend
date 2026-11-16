type Schedule = {
  day: string;
  startTime: string;
  endTime: string;
};

type UserRole = "admin" | "teacher" | "student";

type RateLimitRole = UserRole | "guest";
type MemberRole = "teacher" | "student";
type Page = { limit: number; offset: number };
