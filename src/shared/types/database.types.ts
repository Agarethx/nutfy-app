export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      allergens: {
        Row: {
          created_at: string
          id: string
          is_eu_mandatory: boolean
          name: string
          slug: string
          status: Database["public"]["Enums"]["lifecycle_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_eu_mandatory?: boolean
          name: string
          slug: string
          status?: Database["public"]["Enums"]["lifecycle_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_eu_mandatory?: boolean
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["lifecycle_status"]
          updated_at?: string
        }
        Relationships: []
      }
      attributes: {
        Row: {
          category: Database["public"]["Enums"]["attribute_category"]
          created_at: string
          description: string | null
          id: string
          name: string
          scope: Database["public"]["Enums"]["attribute_scope"]
          slug: string
          status: Database["public"]["Enums"]["lifecycle_status"]
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["attribute_category"]
          created_at?: string
          description?: string | null
          id?: string
          name: string
          scope: Database["public"]["Enums"]["attribute_scope"]
          slug: string
          status?: Database["public"]["Enums"]["lifecycle_status"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["attribute_category"]
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          scope?: Database["public"]["Enums"]["attribute_scope"]
          slug?: string
          status?: Database["public"]["Enums"]["lifecycle_status"]
          updated_at?: string
        }
        Relationships: []
      }
      ingredient_aliases: {
        Row: {
          alias: string
          created_at: string
          id: string
          ingredient_id: string
          locale: string | null
          updated_at: string
        }
        Insert: {
          alias: string
          created_at?: string
          id?: string
          ingredient_id: string
          locale?: string | null
          updated_at?: string
        }
        Update: {
          alias?: string
          created_at?: string
          id?: string
          ingredient_id?: string
          locale?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_aliases_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_allergens: {
        Row: {
          allergen_id: string
          created_at: string
          ingredient_id: string
          is_trace: boolean
        }
        Insert: {
          allergen_id: string
          created_at?: string
          ingredient_id: string
          is_trace?: boolean
        }
        Update: {
          allergen_id?: string
          created_at?: string
          ingredient_id?: string
          is_trace?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_allergens_allergen_id_fkey"
            columns: ["allergen_id"]
            isOneToOne: false
            referencedRelation: "allergens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_allergens_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_attributes: {
        Row: {
          attribute_id: string
          created_at: string
          ingredient_id: string
        }
        Insert: {
          attribute_id: string
          created_at?: string
          ingredient_id: string
        }
        Update: {
          attribute_id?: string
          created_at?: string
          ingredient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_attributes_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_attributes_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          status: Database["public"]["Enums"]["lifecycle_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          status?: Database["public"]["Enums"]["lifecycle_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["lifecycle_status"]
          updated_at?: string
        }
        Relationships: []
      }
      ingredient_micronutrients: {
        Row: {
          amount_per_100g: number
          created_at: string
          ingredient_id: string
          micronutrient_id: string
          updated_at: string
        }
        Insert: {
          amount_per_100g: number
          created_at?: string
          ingredient_id: string
          micronutrient_id: string
          updated_at?: string
        }
        Update: {
          amount_per_100g?: number
          created_at?: string
          ingredient_id?: string
          micronutrient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_micronutrients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_micronutrients_micronutrient_id_fkey"
            columns: ["micronutrient_id"]
            isOneToOne: false
            referencedRelation: "micronutrients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_storage_rules: {
        Row: {
          can_freeze: boolean
          created_at: string
          duration_unit: Database["public"]["Enums"]["duration_unit"]
          id: string
          ingredient_id: string
          is_recommended: boolean
          max_duration: number
          notes: string | null
          storage_method_id: string
          updated_at: string
        }
        Insert: {
          can_freeze?: boolean
          created_at?: string
          duration_unit: Database["public"]["Enums"]["duration_unit"]
          id?: string
          ingredient_id: string
          is_recommended?: boolean
          max_duration: number
          notes?: string | null
          storage_method_id: string
          updated_at?: string
        }
        Update: {
          can_freeze?: boolean
          created_at?: string
          duration_unit?: Database["public"]["Enums"]["duration_unit"]
          id?: string
          ingredient_id?: string
          is_recommended?: boolean
          max_duration?: number
          notes?: string | null
          storage_method_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_storage_rules_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_storage_rules_storage_method_id_fkey"
            columns: ["storage_method_id"]
            isOneToOne: false
            referencedRelation: "storage_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_subcategories: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          status: Database["public"]["Enums"]["lifecycle_status"]
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          status?: Database["public"]["Enums"]["lifecycle_status"]
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["lifecycle_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "ingredient_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_translations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          ingredient_id: string
          locale: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          ingredient_id: string
          locale: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          ingredient_id?: string
          locale?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_translations_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_unit_conversions: {
        Row: {
          created_at: string
          factor: number
          from_unit_id: string
          id: string
          ingredient_id: string
          is_default: boolean
          notes: string | null
          to_unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          factor: number
          from_unit_id: string
          id?: string
          ingredient_id: string
          is_default?: boolean
          notes?: string | null
          to_unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          factor?: number
          from_unit_id?: string
          id?: string
          ingredient_id?: string
          is_default?: boolean
          notes?: string | null
          to_unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_unit_conversions_from_unit_id_fkey"
            columns: ["from_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_unit_conversions_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_unit_conversions_to_unit_id_fkey"
            columns: ["to_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          calories_kcal: number | null
          carbs_g: number | null
          category_id: string | null
          countries: string[]
          created_at: string
          default_unit_id: string | null
          deprecated_at: string | null
          description: string | null
          fat_g: number | null
          fiber_g: number | null
          id: string
          image_url: string | null
          is_system: boolean
          name: string
          protein_g: number | null
          saturated_fat_g: number | null
          seasonality_months: number[]
          slug: string
          sodium_mg: number | null
          status: Database["public"]["Enums"]["lifecycle_status"]
          subcategory_id: string | null
          sugar_g: number | null
          updated_at: string
        }
        Insert: {
          calories_kcal?: number | null
          carbs_g?: number | null
          category_id?: string | null
          countries?: string[]
          created_at?: string
          default_unit_id?: string | null
          deprecated_at?: string | null
          description?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          image_url?: string | null
          is_system?: boolean
          name: string
          protein_g?: number | null
          saturated_fat_g?: number | null
          seasonality_months?: number[]
          slug: string
          sodium_mg?: number | null
          status?: Database["public"]["Enums"]["lifecycle_status"]
          subcategory_id?: string | null
          sugar_g?: number | null
          updated_at?: string
        }
        Update: {
          calories_kcal?: number | null
          carbs_g?: number | null
          category_id?: string | null
          countries?: string[]
          created_at?: string
          default_unit_id?: string | null
          deprecated_at?: string | null
          description?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          image_url?: string | null
          is_system?: boolean
          name?: string
          protein_g?: number | null
          saturated_fat_g?: number | null
          seasonality_months?: number[]
          slug?: string
          sodium_mg?: number | null
          status?: Database["public"]["Enums"]["lifecycle_status"]
          subcategory_id?: string | null
          sugar_g?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "ingredient_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredients_default_unit_id_fkey"
            columns: ["default_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredients_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "ingredient_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      micronutrients: {
        Row: {
          category: Database["public"]["Enums"]["micronutrient_category"]
          created_at: string
          id: string
          name: string
          slug: string
          status: Database["public"]["Enums"]["lifecycle_status"]
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["micronutrient_category"]
          created_at?: string
          id?: string
          name: string
          slug: string
          status?: Database["public"]["Enums"]["lifecycle_status"]
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["micronutrient_category"]
          created_at?: string
          id?: string
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["lifecycle_status"]
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "micronutrients_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_attributes: {
        Row: {
          attribute_id: string
          created_at: string
          recipe_id: string
        }
        Insert: {
          attribute_id: string
          created_at?: string
          recipe_id: string
        }
        Update: {
          attribute_id?: string
          created_at?: string
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_attributes_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "attributes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_attributes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          is_optional: boolean
          notes: string | null
          quantity: number
          recipe_id: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          is_optional?: boolean
          notes?: string | null
          quantity: number
          recipe_id: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          is_optional?: boolean
          notes?: string | null
          quantity?: number
          recipe_id?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_steps: {
        Row: {
          created_at: string
          duration_min: number | null
          id: string
          image_url: string | null
          instruction: string
          recipe_id: string
          step_number: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_min?: number | null
          id?: string
          image_url?: string | null
          instruction: string
          recipe_id: string
          step_number: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_min?: number | null
          id?: string
          image_url?: string | null
          instruction?: string
          recipe_id?: string
          step_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_steps_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_storage_rules: {
        Row: {
          can_freeze: boolean
          created_at: string
          duration_unit: Database["public"]["Enums"]["duration_unit"]
          id: string
          is_recommended: boolean
          max_duration: number
          notes: string | null
          recipe_id: string
          storage_method_id: string
          updated_at: string
        }
        Insert: {
          can_freeze?: boolean
          created_at?: string
          duration_unit: Database["public"]["Enums"]["duration_unit"]
          id?: string
          is_recommended?: boolean
          max_duration: number
          notes?: string | null
          recipe_id: string
          storage_method_id: string
          updated_at?: string
        }
        Update: {
          can_freeze?: boolean
          created_at?: string
          duration_unit?: Database["public"]["Enums"]["duration_unit"]
          id?: string
          is_recommended?: boolean
          max_duration?: number
          notes?: string | null
          recipe_id?: string
          storage_method_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_storage_rules_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_storage_rules_storage_method_id_fkey"
            columns: ["storage_method_id"]
            isOneToOne: false
            referencedRelation: "storage_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_variations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          recipe_id: string
          servings_max: number | null
          servings_min: number | null
          slug: string
          status: Database["public"]["Enums"]["lifecycle_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          recipe_id: string
          servings_max?: number | null
          servings_min?: number | null
          slug: string
          status?: Database["public"]["Enums"]["lifecycle_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          recipe_id?: string
          servings_max?: number | null
          servings_min?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["lifecycle_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_variations_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          cook_time_min: number | null
          cooking_methods: Database["public"]["Enums"]["cooking_method"][]
          created_at: string
          deprecated_at: string | null
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          id: string
          image_url: string | null
          is_public: boolean
          name: string
          notes: string | null
          prep_time_min: number | null
          rest_time_min: number | null
          servings_max: number
          servings_min: number
          slug: string
          source_url: string | null
          status: Database["public"]["Enums"]["lifecycle_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cook_time_min?: number | null
          cooking_methods?: Database["public"]["Enums"]["cooking_method"][]
          created_at?: string
          deprecated_at?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          id?: string
          image_url?: string | null
          is_public?: boolean
          name: string
          notes?: string | null
          prep_time_min?: number | null
          rest_time_min?: number | null
          servings_max: number
          servings_min: number
          slug: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["lifecycle_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cook_time_min?: number | null
          cooking_methods?: Database["public"]["Enums"]["cooking_method"][]
          created_at?: string
          deprecated_at?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          id?: string
          image_url?: string | null
          is_public?: boolean
          name?: string
          notes?: string | null
          prep_time_min?: number | null
          rest_time_min?: number | null
          servings_max?: number
          servings_min?: number
          slug?: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["lifecycle_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_job_runs: {
        Row: {
          created_at: string
          error_message: string | null
          finished_at: string | null
          id: string
          job_name: string
          records_processed: number | null
          started_at: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_name: string
          records_processed?: number | null
          started_at?: string
          status: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_name?: string
          records_processed?: number | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      storage_methods: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          status: Database["public"]["Enums"]["lifecycle_status"]
          storage_type: Database["public"]["Enums"]["storage_method_type"]
          typical_temp_max_c: number | null
          typical_temp_min_c: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          status?: Database["public"]["Enums"]["lifecycle_status"]
          storage_type: Database["public"]["Enums"]["storage_method_type"]
          typical_temp_max_c?: number | null
          typical_temp_min_c?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["lifecycle_status"]
          storage_type?: Database["public"]["Enums"]["storage_method_type"]
          typical_temp_max_c?: number | null
          typical_temp_min_c?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      unit_conversions: {
        Row: {
          created_at: string
          factor: number
          from_unit: string
          id: string
          to_unit: string
        }
        Insert: {
          created_at?: string
          factor: number
          from_unit: string
          id?: string
          to_unit: string
        }
        Update: {
          created_at?: string
          factor?: number
          from_unit?: string
          id?: string
          to_unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_conversions_from_unit_fkey"
            columns: ["from_unit"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_conversions_to_unit_fkey"
            columns: ["to_unit"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          abbreviation: string
          base_unit_id: string | null
          created_at: string
          id: string
          name: string
          status: Database["public"]["Enums"]["lifecycle_status"]
          system: Database["public"]["Enums"]["measurement_system"]
          to_base_factor: number | null
          unit_type: Database["public"]["Enums"]["unit_type"]
          updated_at: string
        }
        Insert: {
          abbreviation: string
          base_unit_id?: string | null
          created_at?: string
          id?: string
          name: string
          status?: Database["public"]["Enums"]["lifecycle_status"]
          system: Database["public"]["Enums"]["measurement_system"]
          to_base_factor?: number | null
          unit_type: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Update: {
          abbreviation?: string
          base_unit_id?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["lifecycle_status"]
          system?: Database["public"]["Enums"]["measurement_system"]
          to_base_factor?: number | null
          unit_type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_base_unit_id_fkey"
            columns: ["base_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      variation_ingredient_overrides: {
        Row: {
          created_at: string
          id: string
          new_ingredient_id: string | null
          new_quantity: number | null
          new_unit_id: string | null
          notes: string | null
          original_ingredient_id: string | null
          override_type: Database["public"]["Enums"]["override_type"]
          updated_at: string
          variation_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_ingredient_id?: string | null
          new_quantity?: number | null
          new_unit_id?: string | null
          notes?: string | null
          original_ingredient_id?: string | null
          override_type: Database["public"]["Enums"]["override_type"]
          updated_at?: string
          variation_id: string
        }
        Update: {
          created_at?: string
          id?: string
          new_ingredient_id?: string | null
          new_quantity?: number | null
          new_unit_id?: string | null
          notes?: string | null
          original_ingredient_id?: string | null
          override_type?: Database["public"]["Enums"]["override_type"]
          updated_at?: string
          variation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variation_ingredient_overrides_new_ingredient_id_fkey"
            columns: ["new_ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variation_ingredient_overrides_new_unit_id_fkey"
            columns: ["new_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variation_ingredient_overrides_original_ingredient_id_fkey"
            columns: ["original_ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variation_ingredient_overrides_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "recipe_variations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      f_unaccent: { Args: { "": string }; Returns: string }
      is_owner: { Args: { row_user_id: string }; Returns: boolean }
      match_ingredients: {
        Args: {
          match_limit?: number
          min_similarity?: number
          search_term: string
        }
        Returns: {
          ingredient_id: string
          matched_text: string
          matched_via: string
          name: string
          score: number
          slug: string
          status: Database["public"]["Enums"]["lifecycle_status"]
        }[]
      }
    }
    Enums: {
      attribute_category:
        | "DIETARY"
        | "LIFESTYLE"
        | "COOKING"
        | "TEXTURE"
        | "ALLERGEN_FREE"
        | "OTHER"
      attribute_scope: "INGREDIENT" | "RECIPE" | "BOTH"
      cooking_method:
        | "RAW"
        | "BAKE"
        | "GRILL"
        | "ROAST"
        | "STEAM"
        | "BOIL"
        | "SAUTE"
        | "FRY"
        | "AIR_FRY"
        | "SLOW_COOK"
        | "PRESSURE_COOK"
        | "MICROWAVE"
        | "FERMENT"
        | "CURE"
        | "SOUS_VIDE"
      difficulty_level: "EASY" | "MEDIUM" | "HARD" | "EXPERT"
      duration_unit: "DAYS" | "WEEKS" | "MONTHS"
      lifecycle_status: "ACTIVE" | "PENDING_REVIEW" | "DEPRECATED"
      measurement_system: "METRIC" | "IMPERIAL" | "UNIVERSAL"
      micronutrient_category: "VITAMIN" | "MINERAL" | "OTHER"
      override_type: "ADD" | "REMOVE" | "REPLACE" | "ADJUST_QUANTITY"
      storage_method_type:
        | "FRIDGE"
        | "FREEZER"
        | "PANTRY"
        | "COUNTER"
        | "COOL_DARK"
        | "CELLAR"
      unit_type: "WEIGHT" | "VOLUME" | "PIECE" | "CUSTOM"
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
      attribute_category: [
        "DIETARY",
        "LIFESTYLE",
        "COOKING",
        "TEXTURE",
        "ALLERGEN_FREE",
        "OTHER",
      ],
      attribute_scope: ["INGREDIENT", "RECIPE", "BOTH"],
      cooking_method: [
        "RAW",
        "BAKE",
        "GRILL",
        "ROAST",
        "STEAM",
        "BOIL",
        "SAUTE",
        "FRY",
        "AIR_FRY",
        "SLOW_COOK",
        "PRESSURE_COOK",
        "MICROWAVE",
        "FERMENT",
        "CURE",
        "SOUS_VIDE",
      ],
      difficulty_level: ["EASY", "MEDIUM", "HARD", "EXPERT"],
      duration_unit: ["DAYS", "WEEKS", "MONTHS"],
      lifecycle_status: ["ACTIVE", "PENDING_REVIEW", "DEPRECATED"],
      measurement_system: ["METRIC", "IMPERIAL", "UNIVERSAL"],
      micronutrient_category: ["VITAMIN", "MINERAL", "OTHER"],
      override_type: ["ADD", "REMOVE", "REPLACE", "ADJUST_QUANTITY"],
      storage_method_type: [
        "FRIDGE",
        "FREEZER",
        "PANTRY",
        "COUNTER",
        "COOL_DARK",
        "CELLAR",
      ],
      unit_type: ["WEIGHT", "VOLUME", "PIECE", "CUSTOM"],
    },
  },
} as const

