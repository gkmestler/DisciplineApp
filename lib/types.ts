export type ItemStatus = "active" | "graduated" | "slipped";

export type PointValue = 1 | 3 | 5 | 10;

export interface DisciplineItem {
  id: string;
  user_id: string;
  name: string;
  points: PointValue;
  status: ItemStatus;
  consecutive_wins: number;
  total_logs: number;
  graduation_threshold: number | null;
  deleted_at: string | null;
  created_at: string;
}

export interface DisciplineLog {
  id: string;
  user_id: string;
  item_id: string | null;
  item_name: string;
  points: number;
  was_disciplined: boolean;
  logged_at: string;
}
