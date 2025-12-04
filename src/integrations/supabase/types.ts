export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          batch_id: string
          created_at: string
          enrollment_id: string
          id: string
          marked_by: string | null
          remarks: string | null
          session_date: string
          session_number: number | null
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Insert: {
          batch_id: string
          created_at?: string
          enrollment_id: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          session_date: string
          session_number?: number | null
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Update: {
          batch_id?: string
          created_at?: string
          enrollment_id?: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          session_date?: string
          session_number?: number | null
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "attendance_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          branch_id: string | null
          capacity: number
          code: string
          course_id: string
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          schedule: string | null
          start_date: string
          timings: string | null
          trainer_id: string | null
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          capacity?: number
          code: string
          course_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          schedule?: string | null
          start_date: string
          timings?: string | null
          trainer_id?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          capacity?: number
          code?: string
          course_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          schedule?: string | null
          start_date?: string
          timings?: string | null
          trainer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          code: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          attendance_percentage: number | null
          batch_name: string
          branch_id: string | null
          certificate_number: string
          completion_date: string | null
          course_name: string
          created_at: string
          enrollment_id: string | null
          grade: string | null
          id: string
          issue_date: string
          issued_by: string | null
          revoke_reason: string | null
          status: Database["public"]["Enums"]["certificate_status"]
          student_id: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          attendance_percentage?: number | null
          batch_name: string
          branch_id?: string | null
          certificate_number: string
          completion_date?: string | null
          course_name: string
          created_at?: string
          enrollment_id?: string | null
          grade?: string | null
          id?: string
          issue_date?: string
          issued_by?: string | null
          revoke_reason?: string | null
          status?: Database["public"]["Enums"]["certificate_status"]
          student_id: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          attendance_percentage?: number | null
          batch_name?: string
          branch_id?: string | null
          certificate_number?: string
          completion_date?: string | null
          course_name?: string
          created_at?: string
          enrollment_id?: string | null
          grade?: string | null
          id?: string
          issue_date?: string
          issued_by?: string | null
          revoke_reason?: string | null
          status?: Database["public"]["Enums"]["certificate_status"]
          student_id?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          branch_id: string | null
          code: string
          created_at: string
          description: string | null
          duration_days: number
          duration_hours: number
          fee_amount: number | null
          id: string
          is_active: boolean
          name: string
          syllabus: string | null
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          code: string
          created_at?: string
          description?: string | null
          duration_days?: number
          duration_hours?: number
          fee_amount?: number | null
          id?: string
          is_active?: boolean
          name: string
          syllabus?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          code?: string
          created_at?: string
          description?: string | null
          duration_days?: number
          duration_hours?: number
          fee_amount?: number | null
          id?: string
          is_active?: boolean
          name?: string
          syllabus?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          batch_id: string
          created_at: string
          enrolled_by: string | null
          enrollment_date: string
          fee_paid: number | null
          fee_pending: number | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          enrolled_by?: string | null
          enrollment_date?: string
          fee_paid?: number | null
          fee_pending?: number | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          enrolled_by?: string | null
          enrollment_date?: string
          fee_paid?: number | null
          fee_pending?: number | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_enrolled_by_fkey"
            columns: ["enrolled_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount: number
          branch_id: string | null
          created_at: string
          description: string | null
          enrollment_id: string | null
          generated_by: string | null
          id: string
          payment_date: string
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          receipt_number: string
          remarks: string | null
          status: Database["public"]["Enums"]["receipt_status"]
          student_id: string
          updated_at: string
          void_reason: string | null
        }
        Insert: {
          amount: number
          branch_id?: string | null
          created_at?: string
          description?: string | null
          enrollment_id?: string | null
          generated_by?: string | null
          id?: string
          payment_date?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          receipt_number: string
          remarks?: string | null
          status?: Database["public"]["Enums"]["receipt_status"]
          student_id: string
          updated_at?: string
          void_reason?: string | null
        }
        Update: {
          amount?: number
          branch_id?: string | null
          created_at?: string
          description?: string | null
          enrollment_id?: string | null
          generated_by?: string | null
          id?: string
          payment_date?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          receipt_number?: string
          remarks?: string | null
          status?: Database["public"]["Enums"]["receipt_status"]
          student_id?: string
          updated_at?: string
          void_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "staff_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_profiles: {
        Row: {
          branch_id: string | null
          created_at: string
          designation: string | null
          email: string
          employee_id: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          designation?: string | null
          email: string
          employee_id: string
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          designation?: string | null
          email?: string
          employee_id?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          admission_number: string
          alternate_phone: string | null
          branch_id: string | null
          created_at: string
          date_of_birth: string | null
          documents: Json | null
          email: string | null
          full_name: string
          gender: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          is_active: boolean
          notes: string | null
          phone: string
          photo_url: string | null
          qualification: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          admission_number: string
          alternate_phone?: string | null
          branch_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          documents?: Json | null
          email?: string | null
          full_name: string
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          phone: string
          photo_url?: string | null
          qualification?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          admission_number?: string
          alternate_phone?: string | null
          branch_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          documents?: Json | null
          email?: string | null
          full_name?: string
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string
          photo_url?: string | null
          qualification?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["staff_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_certificate_number: { Args: never; Returns: string }
      generate_receipt_number: { Args: never; Returns: string }
      get_user_branch_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["staff_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      attendance_status: "present" | "absent" | "late" | "excused"
      certificate_status: "issued" | "revoked"
      enrollment_status: "active" | "completed" | "dropped" | "transferred"
      payment_mode: "cash" | "card" | "upi" | "bank_transfer" | "cheque"
      receipt_status: "valid" | "voided" | "refunded"
      staff_role:
        | "admin"
        | "branch_manager"
        | "trainer"
        | "accounts"
        | "reception"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attendance_status: ["present", "absent", "late", "excused"],
      certificate_status: ["issued", "revoked"],
      enrollment_status: ["active", "completed", "dropped", "transferred"],
      payment_mode: ["cash", "card", "upi", "bank_transfer", "cheque"],
      receipt_status: ["valid", "voided", "refunded"],
      staff_role: [
        "admin",
        "branch_manager",
        "trainer",
        "accounts",
        "reception",
      ],
    },
  },
} as const
