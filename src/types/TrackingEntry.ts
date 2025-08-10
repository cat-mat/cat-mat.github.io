export interface TrackingEntry {
  id: string;
  timestamp: string; // ISO 8601 format with timezone
  type: 'morning' | 'evening' | 'quick';
  sync_status: 'synced' | 'pending' | 'failed';
  updated_at: string;
  timezone: string;
  is_deleted?: boolean;
  
  // Body section items
  allergic_reactions?: 1 | 3 | 5;
  bleeding_spotting?: 1 | 3 | 5;
  diet_triggers?: 1 | 2 | 3 | 4 | 5;
  eating_habits?: 1 | 3 | 5;
  energy_level?: 1 | 2 | 3 | 4 | 5;
  exercise_impact?: 1 | 2 | 3 | 4 | 5;
  forehead_shine?: 1 | 3 | 5;
  headache?: 1 | 3 | 5;
  hormone_symptoms?: 1 | 2 | 3 | 4 | 5;
  hot_flashes?: 1 | 2 | 3 | 4 | 5;
  hydration?: 1 | 3 | 5;
  joint_pain?: string[]; // multi-select
  nausea?: 1 | 3 | 5;
  temperature_sensitivity?: 1 | 3 | 5;
  workout_recovery?: 1 | 3 | 5;
  
  // Mind section items
  anxiety?: 1 | 2 | 3 | 4 | 5;
  brain_fog?: 1 | 3 | 5;
  depression?: 1 | 2 | 3 | 4 | 5;
  irritability?: 1 | 2 | 3 | 4 | 5;
  mood?: 1 | 3 | 5;
  social_stamina?: 1 | 2 | 3 | 4 | 5;
  stress_level?: 1 | 2 | 3 | 4 | 5;
  
  // Morning only items
  pill_pack_start_date?: string;
  sleep_quality?: 1 | 3 | 5;
  weird_dreams?: 1 | 3 | 5;
  wearables_sleep_score?: number; // 0-100
  wearables_body_battery?: number; // 0-100
  
  // Evening only items
  overall_sentiment?: 1 | 2 | 3 | 4 | 5;
  notes?: {
    observations?: string; // max 2000 chars
    reflections?: string; // max 2000 chars
    thankful_for?: string; // max 2000 chars
  };
}

export interface UserConfig {
  id: string;
  display_type: 'text' | 'face_emojis' | 'heart_emojis' | 'dot_emojis';
  morning_end: string; // HH:MM format, default "09:00"
  evening_start: string; // HH:MM format, default "20:00"
  quick_track_items: string[]; // subset of tracking items
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface GoogleDriveConfig {
  client_id: string;
  scopes: string[];
  access_type: 'offline';
  prompt: 'consent';
}

export interface SyncStatus {
  last_sync: string;
  pending_entries: number;
  failed_entries: number;
  is_online: boolean;
  is_authenticated: boolean;
}

export type ScaleType = '3-point' | '5-point' | 'multi-select' | 'numeric';

export interface TrackingItem {
  id: string;
  label: string;
  scale_type: ScaleType;
  section: 'body' | 'mind' | 'morning' | 'evening';
  description?: string;
  required?: boolean;
}

export interface AppState {
  user: UserConfig | null;
  entries: TrackingEntry[];
  sync_status: SyncStatus;
  current_view: 'morning' | 'evening' | 'quick' | 'dashboard' | 'settings';
  is_loading: boolean;
  error: string | null;
}
