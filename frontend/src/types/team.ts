export type Role = 'player' | 'coach';

export interface Team {
  team_id: number;
  team_name: string;
  role: Role;
}