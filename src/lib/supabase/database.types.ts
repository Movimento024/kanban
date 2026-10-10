export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      atividades: {
        Row: {
          acao: Database["public"]["Enums"]["acao_atividade"];
          ator_id: string | null;
          contexto: NonNullable<Json>;
          created_at: string;
          entidade: string;
          entidade_id: string;
          frente_id: string | null;
          id: number;
          item_id: string | null;
          valor_anterior: Json | null;
          valor_novo: Json | null;
        };
        ComputedFields: never;
        Insert: {
          acao: Database["public"]["Enums"]["acao_atividade"];
          ator_id?: string | null;
          contexto?: NonNullable<Json>;
          created_at?: string;
          entidade: string;
          entidade_id: string;
          frente_id?: string | null;
          id?: never;
          item_id?: string | null;
          valor_anterior?: Json | null;
          valor_novo?: Json | null;
        };
        Update: {
          acao?: Database["public"]["Enums"]["acao_atividade"];
          ator_id?: string | null;
          contexto?: NonNullable<Json>;
          created_at?: string;
          entidade?: string;
          entidade_id?: string;
          frente_id?: string | null;
          id?: never;
          item_id?: string | null;
          valor_anterior?: Json | null;
          valor_novo?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "atividades_ator_id_fkey";
            columns: ["ator_id"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          },
        ];
      };
      atribuicoes: {
        Row: {
          atribuido_por: string | null;
          created_at: string;
          id: string;
          item_id: string;
          papel: Database["public"]["Enums"]["papel_atribuicao"];
          pessoa_id: string;
        };
        ComputedFields: never;
        Insert: {
          atribuido_por?: string | null;
          created_at?: string;
          id?: string;
          item_id: string;
          papel: Database["public"]["Enums"]["papel_atribuicao"];
          pessoa_id: string;
        };
        Update: {
          atribuido_por?: string | null;
          created_at?: string;
          id?: string;
          item_id?: string;
          papel?: Database["public"]["Enums"]["papel_atribuicao"];
          pessoa_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "atribuicoes_atribuido_por_fkey";
            columns: ["atribuido_por"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "atribuicoes_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "itens";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "atribuicoes_pessoa_id_fkey";
            columns: ["pessoa_id"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          },
        ];
      };
      configuracoes: {
        Row: {
          chave: string;
          updated_at: string;
          valor: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          chave: string;
          updated_at?: string;
          valor: NonNullable<Json>;
        };
        Update: {
          chave?: string;
          updated_at?: string;
          valor?: NonNullable<Json>;
        };
        Relationships: [];
      };
      decisao_opcoes: {
        Row: {
          archived_at: string | null;
          created_at: string;
          created_by: string | null;
          decisao_id: string;
          id: string;
          ordem: number;
          texto: string;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          decisao_id: string;
          id?: string;
          ordem?: number;
          texto: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          decisao_id?: string;
          id?: string;
          ordem?: number;
          texto?: string;
        };
        Relationships: [
          {
            foreignKeyName: "decisao_opcoes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "decisao_opcoes_decisao_id_fkey";
            columns: ["decisao_id"];
            isOneToOne: false;
            referencedRelation: "decisoes";
            referencedColumns: ["id"];
          },
        ];
      };
      decisoes: {
        Row: {
          archived_at: string | null;
          campo_relacionado: string | null;
          created_at: string;
          created_by: string | null;
          decidida_em: string | null;
          decidida_por: string | null;
          id: string;
          item_id: string;
          opcao_escolhida_id: string | null;
          ordem: number;
          pergunta: string;
          prazo: string | null;
          status: Database["public"]["Enums"]["status_decisao"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          campo_relacionado?: string | null;
          created_at?: string;
          created_by?: string | null;
          decidida_em?: string | null;
          decidida_por?: string | null;
          id?: string;
          item_id: string;
          opcao_escolhida_id?: string | null;
          ordem?: number;
          pergunta: string;
          prazo?: string | null;
          status?: Database["public"]["Enums"]["status_decisao"];
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          campo_relacionado?: string | null;
          created_at?: string;
          created_by?: string | null;
          decidida_em?: string | null;
          decidida_por?: string | null;
          id?: string;
          item_id?: string;
          opcao_escolhida_id?: string | null;
          ordem?: number;
          pergunta?: string;
          prazo?: string | null;
          status?: Database["public"]["Enums"]["status_decisao"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "decisoes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "decisoes_decidida_por_fkey";
            columns: ["decidida_por"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "decisoes_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "itens";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "decisoes_opcao_escolhida_fk";
            columns: ["opcao_escolhida_id"];
            isOneToOne: false;
            referencedRelation: "decisao_opcoes";
            referencedColumns: ["id"];
          },
        ];
      };
      frentes: {
        Row: {
          archived_at: string | null;
          cor: string;
          created_at: string;
          created_by: string | null;
          descricao: string | null;
          icone: string;
          id: string;
          layout: Database["public"]["Enums"]["layout_frente"];
          nome: string;
          ordem: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          cor: string;
          created_at?: string;
          created_by?: string | null;
          descricao?: string | null;
          icone: string;
          id?: string;
          layout: Database["public"]["Enums"]["layout_frente"];
          nome: string;
          ordem?: number;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          cor?: string;
          created_at?: string;
          created_by?: string | null;
          descricao?: string | null;
          icone?: string;
          id?: string;
          layout?: Database["public"]["Enums"]["layout_frente"];
          nome?: string;
          ordem?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "frentes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          },
        ];
      };
      itens: {
        Row: {
          archived_at: string | null;
          canais: string[];
          created_at: string;
          created_by: string | null;
          data_fim: string | null;
          data_hora: string | null;
          data_inicio: string | null;
          data_periodo: Database["public"]["Enums"]["periodo_ano"] | null;
          data_precisao: Database["public"]["Enums"]["precisao_data"];
          data_texto: string | null;
          descricao: string | null;
          frente_id: string;
          id: string;
          local: string | null;
          ordem: number;
          recorrencia: Database["public"]["Enums"]["recorrencia"];
          recorrencia_dia_semana: number | null;
          recorrencia_estreia: string | null;
          recorrencia_texto: string | null;
          regiao: Database["public"]["Enums"]["regiao_item"];
          status: Database["public"]["Enums"]["status_item"];
          titulo: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          canais?: string[];
          created_at?: string;
          created_by?: string | null;
          data_fim?: string | null;
          data_hora?: string | null;
          data_inicio?: string | null;
          data_periodo?: Database["public"]["Enums"]["periodo_ano"] | null;
          data_precisao?: Database["public"]["Enums"]["precisao_data"];
          data_texto?: string | null;
          descricao?: string | null;
          frente_id: string;
          id?: string;
          local?: string | null;
          ordem?: number;
          recorrencia?: Database["public"]["Enums"]["recorrencia"];
          recorrencia_dia_semana?: number | null;
          recorrencia_estreia?: string | null;
          recorrencia_texto?: string | null;
          regiao: Database["public"]["Enums"]["regiao_item"];
          status?: Database["public"]["Enums"]["status_item"];
          titulo: string;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          canais?: string[];
          created_at?: string;
          created_by?: string | null;
          data_fim?: string | null;
          data_hora?: string | null;
          data_inicio?: string | null;
          data_periodo?: Database["public"]["Enums"]["periodo_ano"] | null;
          data_precisao?: Database["public"]["Enums"]["precisao_data"];
          data_texto?: string | null;
          descricao?: string | null;
          frente_id?: string;
          id?: string;
          local?: string | null;
          ordem?: number;
          recorrencia?: Database["public"]["Enums"]["recorrencia"];
          recorrencia_dia_semana?: number | null;
          recorrencia_estreia?: string | null;
          recorrencia_texto?: string | null;
          regiao?: Database["public"]["Enums"]["regiao_item"];
          status?: Database["public"]["Enums"]["status_item"];
          titulo?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "itens_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "itens_frente_id_fkey";
            columns: ["frente_id"];
            isOneToOne: false;
            referencedRelation: "frentes";
            referencedColumns: ["id"];
          },
        ];
      };
      notas: {
        Row: {
          archived_at: string | null;
          autor_id: string | null;
          created_at: string;
          id: string;
          item_id: string;
          texto: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          autor_id?: string | null;
          created_at?: string;
          id?: string;
          item_id: string;
          texto: string;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          autor_id?: string | null;
          created_at?: string;
          id?: string;
          item_id?: string;
          texto?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notas_autor_id_fkey";
            columns: ["autor_id"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notas_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "itens";
            referencedColumns: ["id"];
          },
        ];
      };
      perfis: {
        Row: {
          ativo: boolean;
          created_at: string;
          email: string;
          id: string;
          iniciais: string;
          nome: string;
          papel: Database["public"]["Enums"]["papel_usuario"];
          precisa_trocar_senha: boolean;
          regiao: Database["public"]["Enums"]["regiao_pessoa"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          ativo?: boolean;
          created_at?: string;
          email: string;
          id: string;
          iniciais: string;
          nome: string;
          papel?: Database["public"]["Enums"]["papel_usuario"];
          precisa_trocar_senha?: boolean;
          regiao: Database["public"]["Enums"]["regiao_pessoa"];
          updated_at?: string;
        };
        Update: {
          ativo?: boolean;
          created_at?: string;
          email?: string;
          id?: string;
          iniciais?: string;
          nome?: string;
          papel?: Database["public"]["Enums"]["papel_usuario"];
          precisa_trocar_senha?: boolean;
          regiao?: Database["public"]["Enums"]["regiao_pessoa"];
          updated_at?: string;
        };
        Relationships: [];
      };
      tarefas: {
        Row: {
          archived_at: string | null;
          concluida: boolean;
          concluida_em: string | null;
          concluida_por: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          item_id: string;
          ordem: number;
          parent_id: string | null;
          prazo: string | null;
          responsavel_id: string | null;
          titulo: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          concluida?: boolean;
          concluida_em?: string | null;
          concluida_por?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          item_id: string;
          ordem?: number;
          parent_id?: string | null;
          prazo?: string | null;
          responsavel_id?: string | null;
          titulo: string;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          concluida?: boolean;
          concluida_em?: string | null;
          concluida_por?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          item_id?: string;
          ordem?: number;
          parent_id?: string | null;
          prazo?: string | null;
          responsavel_id?: string | null;
          titulo?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tarefas_concluida_por_fkey";
            columns: ["concluida_por"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tarefas_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tarefas_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "itens";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tarefas_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "tarefas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tarefas_responsavel_id_fkey";
            columns: ["responsavel_id"];
            isOneToOne: false;
            referencedRelation: "perfis";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json };
      eh_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      eh_ativo: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: {
      acao_atividade:
        | "criou"
        | "editou"
        | "atribuiu"
        | "desatribuiu"
        | "concluiu"
        | "reabriu"
        | "decidiu"
        | "reabriu_decisao"
        | "arquivou"
        | "restaurou"
        | "excluiu";
      layout_frente: "linha_do_tempo" | "cadencia" | "lista";
      papel_atribuicao: "responsavel" | "apoio";
      papel_usuario: "admin" | "lider";
      periodo_ano: "s1" | "s2" | "t1" | "t2" | "t3" | "t4" | "meio_ano";
      precisao_data: "exata" | "intervalo" | "mes" | "periodo" | "a_definir";
      recorrencia: "nenhuma" | "semanal" | "quinzenal" | "mensal";
      regiao_item: "SP" | "Nordeste" | "Nacional";
      regiao_pessoa: "SP" | "Nordeste" | "SP_Nordeste";
      status_decisao: "aberta" | "decidida";
      status_item: "ideia" | "em_definicao" | "confirmado" | "realizado" | "cancelado";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      acao_atividade: [
        "criou",
        "editou",
        "atribuiu",
        "desatribuiu",
        "concluiu",
        "reabriu",
        "decidiu",
        "reabriu_decisao",
        "arquivou",
        "restaurou",
        "excluiu",
      ],
      layout_frente: ["linha_do_tempo", "cadencia", "lista"],
      papel_atribuicao: ["responsavel", "apoio"],
      papel_usuario: ["admin", "lider"],
      periodo_ano: ["s1", "s2", "t1", "t2", "t3", "t4", "meio_ano"],
      precisao_data: ["exata", "intervalo", "mes", "periodo", "a_definir"],
      recorrencia: ["nenhuma", "semanal", "quinzenal", "mensal"],
      regiao_item: ["SP", "Nordeste", "Nacional"],
      regiao_pessoa: ["SP", "Nordeste", "SP_Nordeste"],
      status_decisao: ["aberta", "decidida"],
      status_item: ["ideia", "em_definicao", "confirmado", "realizado", "cancelado"],
    },
  },
} as const;
