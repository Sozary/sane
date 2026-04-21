import { z } from "zod/v4";

export const analysePeriodSchema = z
  .object({
    startDate: z.string().date(),
    endDate: z.string().date(),
  })
  .refine((v) => v.startDate <= v.endDate, {
    message: "startDate must be <= endDate",
    path: ["startDate"],
  })
  .refine(
    (v) => {
      const start = new Date(v.startDate + "T00:00:00");
      const end = new Date(v.endDate + "T00:00:00");
      const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
      return diffDays <= 92;
    },
    { message: "Period must not exceed 92 days", path: ["endDate"] }
  );
