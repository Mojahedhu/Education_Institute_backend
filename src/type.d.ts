type Schedule = {
  day: string;
  startTime: string;
  endTime: string;
};

type userRole = "admin" | "teacher" | "student";

type RateLimitRole = UserRole | "guest";
