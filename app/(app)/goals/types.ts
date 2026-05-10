import type { Database } from "@/lib/database.types";

export type Goal = Database["public"]["Tables"]["pov_goals"]["Row"];
export type GoalStatus = Database["public"]["Enums"]["goal_status"];

export type UseCaseSummary = {
  id: string;
  pain_point_tag: string;
  roi_stat: string;
  roi_description: string;
};
