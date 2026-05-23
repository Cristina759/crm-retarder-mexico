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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          accion: Database["public"]["Enums"]["audit_accion"]
          created_at: string | null
          datos_anteriores: Json | null
          datos_nuevos: Json | null
          id: string
          ip_address: unknown
          registro_id: string
          tabla: string
          usuario_id: string | null
        }
        Insert: {
          accion: Database["public"]["Enums"]["audit_accion"]
          created_at?: string | null
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          id?: string
          ip_address?: unknown
          registro_id: string
          tabla: string
          usuario_id?: string | null
        }
        Update: {
          accion?: Database["public"]["Enums"]["audit_accion"]
          created_at?: string | null
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          id?: string
          ip_address?: unknown
          registro_id?: string
          tabla?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      cat_frenos: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          especificaciones: Json | null
          id: string
          imagen_url: string | null
          modelo: string
          precio_lista: number
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          especificaciones?: Json | null
          id?: string
          imagen_url?: string | null
          modelo: string
          precio_lista?: number
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          especificaciones?: Json | null
          id?: string
          imagen_url?: string | null
          modelo?: string
          precio_lista?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      cat_refacciones: {
        Row: {
          activo: boolean | null
          categoria: Database["public"]["Enums"]["refaccion_categoria"]
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          numero_parte: string | null
          precio_lista: number
          stock_minimo: number | null
          unidad: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          categoria: Database["public"]["Enums"]["refaccion_categoria"]
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          numero_parte?: string | null
          precio_lista?: number
          stock_minimo?: number | null
          unidad?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          categoria?: Database["public"]["Enums"]["refaccion_categoria"]
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          numero_parte?: string | null
          precio_lista?: number
          stock_minimo?: number | null
          unidad?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cat_servicios: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          duracion_estimada_hrs: number | null
          id: string
          nombre: string
          precio_base: number
          requiere_equipo: Json | null
          tipo: Database["public"]["Enums"]["tipo_servicio"]
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          duracion_estimada_hrs?: number | null
          id?: string
          nombre: string
          precio_base?: number
          requiere_equipo?: Json | null
          tipo: Database["public"]["Enums"]["tipo_servicio"]
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          duracion_estimada_hrs?: number | null
          id?: string
          nombre?: string
          precio_base?: number
          requiere_equipo?: Json | null
          tipo?: Database["public"]["Enums"]["tipo_servicio"]
          updated_at?: string | null
        }
        Relationships: []
      }
      contactos: {
        Row: {
          activo: boolean | null
          apellido: string
          celular: string | null
          created_at: string | null
          email: string | null
          empresa_id: string
          es_contacto_principal: boolean | null
          es_decisor: boolean | null
          id: string
          nombre: string
          notas: string | null
          puesto: string | null
          sucursal_id: string | null
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          apellido: string
          celular?: string | null
          created_at?: string | null
          email?: string | null
          empresa_id: string
          es_contacto_principal?: boolean | null
          es_decisor?: boolean | null
          id?: string
          nombre: string
          notas?: string | null
          puesto?: string | null
          sucursal_id?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          apellido?: string
          celular?: string | null
          created_at?: string | null
          email?: string | null
          empresa_id?: string
          es_contacto_principal?: boolean | null
          es_decisor?: boolean | null
          id?: string
          nombre?: string
          notas?: string | null
          puesto?: string | null
          sucursal_id?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contactos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contactos_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      cotizacion_items: {
        Row: {
          cantidad: number
          catalogo_id: string | null
          cotizacion_id: string
          created_at: string | null
          descripcion: string
          descuento_pct: number | null
          id: string
          precio_unitario: number
          subtotal: number | null
          tipo_item: Database["public"]["Enums"]["cotizacion_item_tipo"]
        }
        Insert: {
          cantidad?: number
          catalogo_id?: string | null
          cotizacion_id: string
          created_at?: string | null
          descripcion: string
          descuento_pct?: number | null
          id?: string
          precio_unitario?: number
          subtotal?: number | null
          tipo_item: Database["public"]["Enums"]["cotizacion_item_tipo"]
        }
        Update: {
          cantidad?: number
          catalogo_id?: string | null
          cotizacion_id?: string
          created_at?: string | null
          descripcion?: string
          descuento_pct?: number | null
          id?: string
          precio_unitario?: number
          subtotal?: number | null
          tipo_item?: Database["public"]["Enums"]["cotizacion_item_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "cotizacion_items_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      cotizaciones: {
        Row: {
          condiciones: string | null
          contacto_id: string | null
          created_at: string | null
          empresa_id: string
          estado: Database["public"]["Enums"]["cotizacion_estado"] | null
          folio: string | null
          id: string
          iva: number | null
          notas: string | null
          numero_cotizacion: number
          oportunidad_id: string | null
          subtotal: number | null
          tipo: string | null
          token_aprobacion: string | null
          total: number | null
          total_mxn: number | null
          updated_at: string | null
          vendedor_id: string | null
          vigencia_dias: number | null
        }
        Insert: {
          condiciones?: string | null
          contacto_id?: string | null
          created_at?: string | null
          empresa_id: string
          estado?: Database["public"]["Enums"]["cotizacion_estado"] | null
          folio?: string | null
          id?: string
          iva?: number | null
          notas?: string | null
          numero_cotizacion?: number
          oportunidad_id?: string | null
          subtotal?: number | null
          tipo?: string | null
          token_aprobacion?: string | null
          total?: number | null
          total_mxn?: number | null
          updated_at?: string | null
          vendedor_id?: string | null
          vigencia_dias?: number | null
        }
        Update: {
          condiciones?: string | null
          contacto_id?: string | null
          created_at?: string | null
          empresa_id?: string
          estado?: Database["public"]["Enums"]["cotizacion_estado"] | null
          folio?: string | null
          id?: string
          iva?: number | null
          notas?: string | null
          numero_cotizacion?: number
          oportunidad_id?: string | null
          subtotal?: number | null
          tipo?: string | null
          token_aprobacion?: string | null
          total?: number | null
          total_mxn?: number | null
          updated_at?: string | null
          vendedor_id?: string | null
          vigencia_dias?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cotizaciones_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_oportunidad_id_fkey"
            columns: ["oportunidad_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotizaciones_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_usuario: {
        Row: {
          created_at: string | null
          id: string
          nombre: string
          storage_path: string
          tamanio: number | null
          tipo: string | null
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nombre: string
          storage_path: string
          tamanio?: number | null
          tipo?: string | null
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nombre?: string
          storage_path?: string
          tamanio?: number | null
          tipo?: string | null
          usuario_id?: string
        }
        Relationships: []
      }
      empresas: {
        Row: {
          activo: boolean | null
          ciudad: string | null
          condiciones_pago: Database["public"]["Enums"]["condicion_pago"] | null
          contacto1_cargo: string | null
          contacto1_nombre: string | null
          contacto2_cargo: string | null
          contacto2_nombre: string | null
          cp: string | null
          created_at: string | null
          direccion_fiscal: string | null
          email: string | null
          email2: string | null
          estado: string | null
          giro: string | null
          id: string
          nombre_comercial: string | null
          notas: string | null
          persona_encargada: string | null
          razon_social: string | null
          rfc: string | null
          sitio_web: string | null
          sucursal: string | null
          telefono: string | null
          telefono2: string | null
          telefono3: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          ciudad?: string | null
          condiciones_pago?:
            | Database["public"]["Enums"]["condicion_pago"]
            | null
          contacto1_cargo?: string | null
          contacto1_nombre?: string | null
          contacto2_cargo?: string | null
          contacto2_nombre?: string | null
          cp?: string | null
          created_at?: string | null
          direccion_fiscal?: string | null
          email?: string | null
          email2?: string | null
          estado?: string | null
          giro?: string | null
          id?: string
          nombre_comercial?: string | null
          notas?: string | null
          persona_encargada?: string | null
          razon_social?: string | null
          rfc?: string | null
          sitio_web?: string | null
          sucursal?: string | null
          telefono?: string | null
          telefono2?: string | null
          telefono3?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          ciudad?: string | null
          condiciones_pago?:
            | Database["public"]["Enums"]["condicion_pago"]
            | null
          contacto1_cargo?: string | null
          contacto1_nombre?: string | null
          contacto2_cargo?: string | null
          contacto2_nombre?: string | null
          cp?: string | null
          created_at?: string | null
          direccion_fiscal?: string | null
          email?: string | null
          email2?: string | null
          estado?: string | null
          giro?: string | null
          id?: string
          nombre_comercial?: string | null
          notas?: string | null
          persona_encargada?: string | null
          razon_social?: string | null
          rfc?: string | null
          sitio_web?: string | null
          sucursal?: string | null
          telefono?: string | null
          telefono2?: string | null
          telefono3?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      encuestas: {
        Row: {
          calificacion_general: number | null
          calificacion_tecnico: number | null
          calificacion_tiempo: number | null
          comentarios: string | null
          contacto_id: string | null
          fecha_envio: string | null
          fecha_respuesta: string | null
          id: string
          respondida: boolean | null
          ticket_id: string
          token_acceso: string | null
        }
        Insert: {
          calificacion_general?: number | null
          calificacion_tecnico?: number | null
          calificacion_tiempo?: number | null
          comentarios?: string | null
          contacto_id?: string | null
          fecha_envio?: string | null
          fecha_respuesta?: string | null
          id?: string
          respondida?: boolean | null
          ticket_id: string
          token_acceso?: string | null
        }
        Update: {
          calificacion_general?: number | null
          calificacion_tecnico?: number | null
          calificacion_tiempo?: number | null
          comentarios?: string | null
          contacto_id?: string | null
          fecha_envio?: string | null
          fecha_respuesta?: string | null
          id?: string
          respondida?: boolean | null
          ticket_id?: string
          token_acceso?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encuestas_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encuestas_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      evidencias: {
        Row: {
          archivo_url: string
          created_at: string | null
          descripcion: string | null
          id: string
          subido_por: string | null
          ticket_id: string
          tipo: Database["public"]["Enums"]["tipo_evidencia"]
        }
        Insert: {
          archivo_url: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          subido_por?: string | null
          ticket_id: string
          tipo: Database["public"]["Enums"]["tipo_evidencia"]
        }
        Update: {
          archivo_url?: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          subido_por?: string | null
          ticket_id?: string
          tipo?: Database["public"]["Enums"]["tipo_evidencia"]
        }
        Relationships: [
          {
            foreignKeyName: "evidencias_subido_por_fkey"
            columns: ["subido_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidencias_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      firmas: {
        Row: {
          created_at: string
          firma_url: string | null
          firmado: boolean
          firmante_nombre: string | null
          id: string
          orden_id: string
          tipo: string
          token: string
        }
        Insert: {
          created_at?: string
          firma_url?: string | null
          firmado?: boolean
          firmante_nombre?: string | null
          id?: string
          orden_id: string
          tipo?: string
          token?: string
        }
        Update: {
          created_at?: string
          firma_url?: string | null
          firmado?: boolean
          firmante_nombre?: string | null
          id?: string
          orden_id?: string
          tipo?: string
          token?: string
        }
        Relationships: []
      }
      inventario: {
        Row: {
          activo: boolean | null
          codigo_interno: string | null
          costo_unitario: number | null
          created_at: string | null
          freno_id: string | null
          id: string
          nombre: string
          precio_venta: number | null
          producto_tipo: Database["public"]["Enums"]["producto_tipo"]
          refaccion_id: string | null
          stock_actual: number
          stock_minimo: number
          ubicacion: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          codigo_interno?: string | null
          costo_unitario?: number | null
          created_at?: string | null
          freno_id?: string | null
          id?: string
          nombre: string
          precio_venta?: number | null
          producto_tipo: Database["public"]["Enums"]["producto_tipo"]
          refaccion_id?: string | null
          stock_actual?: number
          stock_minimo?: number
          ubicacion?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          codigo_interno?: string | null
          costo_unitario?: number | null
          created_at?: string | null
          freno_id?: string | null
          id?: string
          nombre?: string
          precio_venta?: number | null
          producto_tipo?: Database["public"]["Enums"]["producto_tipo"]
          refaccion_id?: string | null
          stock_actual?: number
          stock_minimo?: number
          ubicacion?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventario_freno_id_fkey"
            columns: ["freno_id"]
            isOneToOne: false
            referencedRelation: "cat_frenos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_refaccion_id_fkey"
            columns: ["refaccion_id"]
            isOneToOne: false
            referencedRelation: "cat_refacciones"
            referencedColumns: ["id"]
          },
        ]
      }
      mano_de_obra: {
        Row: {
          activo: boolean | null
          categoria: string
          created_at: string | null
          id: string
          nombre: string
          precio: number
        }
        Insert: {
          activo?: boolean | null
          categoria: string
          created_at?: string | null
          id?: string
          nombre: string
          precio?: number
        }
        Update: {
          activo?: boolean | null
          categoria?: string
          created_at?: string | null
          id?: string
          nombre?: string
          precio?: number
        }
        Relationships: []
      }
      movimientos_inventario: {
        Row: {
          cantidad: number
          created_at: string | null
          created_by: string | null
          id: string
          inventario_id: string
          motivo: Database["public"]["Enums"]["movimiento_motivo"]
          notas: string | null
          oportunidad_id: string | null
          ticket_id: string | null
          tipo: Database["public"]["Enums"]["movimiento_tipo"]
        }
        Insert: {
          cantidad: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          inventario_id: string
          motivo: Database["public"]["Enums"]["movimiento_motivo"]
          notas?: string | null
          oportunidad_id?: string | null
          ticket_id?: string | null
          tipo: Database["public"]["Enums"]["movimiento_tipo"]
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          inventario_id?: string
          motivo?: Database["public"]["Enums"]["movimiento_motivo"]
          notas?: string | null
          oportunidad_id?: string | null
          ticket_id?: string | null
          tipo?: Database["public"]["Enums"]["movimiento_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_inventario_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_inventario_inventario_id_fkey"
            columns: ["inventario_id"]
            isOneToOne: false
            referencedRelation: "inventario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_inventario_oportunidad_id_fkey"
            columns: ["oportunidad_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_inventario_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_credito: {
        Row: {
          created_at: string
          descripcion: string | null
          empresa_id: string | null
          fecha: string
          id: string
          monto: number
          numero_nc: string | null
          os_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          empresa_id?: string | null
          fecha?: string
          id?: string
          monto?: number
          numero_nc?: string | null
          os_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          empresa_id?: string | null
          fecha?: string
          id?: string
          monto?: number
          numero_nc?: string | null
          os_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_credito_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_credito_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordenes_servicio"
            referencedColumns: ["id"]
          },
        ]
      }
      oportunidades: {
        Row: {
          contacto_id: string | null
          created_at: string | null
          descripcion: string | null
          empresa_id: string
          estado: Database["public"]["Enums"]["oportunidad_estado"] | null
          fecha_cierre_estimada: string | null
          id: string
          monto: number | null
          monto_estimado: number | null
          motivo_perdida: string | null
          notas: string | null
          probabilidad: number | null
          tipo: Database["public"]["Enums"]["oportunidad_tipo"] | null
          titulo: string | null
          updated_at: string | null
          vendedor_id: string | null
        }
        Insert: {
          contacto_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          empresa_id: string
          estado?: Database["public"]["Enums"]["oportunidad_estado"] | null
          fecha_cierre_estimada?: string | null
          id?: string
          monto?: number | null
          monto_estimado?: number | null
          motivo_perdida?: string | null
          notas?: string | null
          probabilidad?: number | null
          tipo?: Database["public"]["Enums"]["oportunidad_tipo"] | null
          titulo?: string | null
          updated_at?: string | null
          vendedor_id?: string | null
        }
        Update: {
          contacto_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          empresa_id?: string
          estado?: Database["public"]["Enums"]["oportunidad_estado"] | null
          fecha_cierre_estimada?: string | null
          id?: string
          monto?: number | null
          monto_estimado?: number | null
          motivo_perdida?: string | null
          notas?: string | null
          probabilidad?: number | null
          tipo?: Database["public"]["Enums"]["oportunidad_tipo"] | null
          titulo?: string | null
          updated_at?: string | null
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oportunidades_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      orden_historial: {
        Row: {
          created_at: string
          estado_anterior: string | null
          estado_nuevo: string
          id: string
          nota: string | null
          orden_id: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          estado_anterior?: string | null
          estado_nuevo: string
          id?: string
          nota?: string | null
          orden_id: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          estado_anterior?: string | null
          estado_nuevo?: string
          id?: string
          nota?: string | null
          orden_id?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      ordenes_servicio: {
        Row: {
          abonos: Json | null
          archivada: boolean
          concepto_factura: string | null
          cotizacion_id: string | null
          created_at: string | null
          descripcion_trabajo: string | null
          empresa_id: string
          encuesta_enviada: boolean | null
          estado: string
          estado_facturacion: string
          factura_generada: boolean | null
          fase: number
          fecha_fin: string | null
          fecha_inicio: string | null
          fecha_tentativa: string | null
          fecha_vencimiento: string | null
          firma_cliente: string | null
          firma_tecnico: string | null
          foto_orden_compra: string | null
          foto_os: string | null
          fotos_antes: Json | null
          fotos_despues: Json | null
          id: string
          monto_factura: number | null
          notas: string | null
          numero: string
          numero_factura: string | null
          numero_orden_compra: string | null
          numero_os_manual: string | null
          oportunidad_id: string | null
          tecnico_id: string | null
          updated_at: string | null
        }
        Insert: {
          abonos?: Json | null
          archivada?: boolean
          concepto_factura?: string | null
          cotizacion_id?: string | null
          created_at?: string | null
          descripcion_trabajo?: string | null
          empresa_id: string
          encuesta_enviada?: boolean | null
          estado?: string
          estado_facturacion?: string
          factura_generada?: boolean | null
          fase?: number
          fecha_fin?: string | null
          fecha_inicio?: string | null
          fecha_tentativa?: string | null
          fecha_vencimiento?: string | null
          firma_cliente?: string | null
          firma_tecnico?: string | null
          foto_orden_compra?: string | null
          foto_os?: string | null
          fotos_antes?: Json | null
          fotos_despues?: Json | null
          id?: string
          monto_factura?: number | null
          notas?: string | null
          numero: string
          numero_factura?: string | null
          numero_orden_compra?: string | null
          numero_os_manual?: string | null
          oportunidad_id?: string | null
          tecnico_id?: string | null
          updated_at?: string | null
        }
        Update: {
          abonos?: Json | null
          archivada?: boolean
          concepto_factura?: string | null
          cotizacion_id?: string | null
          created_at?: string | null
          descripcion_trabajo?: string | null
          empresa_id?: string
          encuesta_enviada?: boolean | null
          estado?: string
          estado_facturacion?: string
          factura_generada?: boolean | null
          fase?: number
          fecha_fin?: string | null
          fecha_inicio?: string | null
          fecha_tentativa?: string | null
          fecha_vencimiento?: string | null
          firma_cliente?: string | null
          firma_tecnico?: string | null
          foto_orden_compra?: string | null
          foto_os?: string | null
          fotos_antes?: Json | null
          fotos_despues?: Json | null
          id?: string
          monto_factura?: number | null
          notas?: string | null
          numero?: string
          numero_factura?: string | null
          numero_orden_compra?: string | null
          numero_os_manual?: string | null
          oportunidad_id?: string | null
          tecnico_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_servicio_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_servicio_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_servicio_oportunidad_id_fkey"
            columns: ["oportunidad_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_servicio_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      recordatorios: {
        Row: {
          completado: boolean | null
          created_at: string | null
          fecha_recordatorio: string
          id: string
          mensaje: string
          referencia_id: string | null
          tipo: Database["public"]["Enums"]["recordatorio_tipo"]
          usuario_id: string | null
        }
        Insert: {
          completado?: boolean | null
          created_at?: string | null
          fecha_recordatorio: string
          id?: string
          mensaje: string
          referencia_id?: string | null
          tipo: Database["public"]["Enums"]["recordatorio_tipo"]
          usuario_id?: string | null
        }
        Update: {
          completado?: boolean | null
          created_at?: string | null
          fecha_recordatorio?: string
          id?: string
          mensaje?: string
          referencia_id?: string | null
          tipo?: Database["public"]["Enums"]["recordatorio_tipo"]
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recordatorios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      refacciones: {
        Row: {
          activo: boolean | null
          categoria: string
          created_at: string | null
          id: string
          nombre: string
          numero_parte: string | null
          precio_venta: number
        }
        Insert: {
          activo?: boolean | null
          categoria: string
          created_at?: string | null
          id?: string
          nombre: string
          numero_parte?: string | null
          precio_venta?: number
        }
        Update: {
          activo?: boolean | null
          categoria?: string
          created_at?: string | null
          id?: string
          nombre?: string
          numero_parte?: string | null
          precio_venta?: number
        }
        Relationships: []
      }
      sucursales: {
        Row: {
          activo: boolean | null
          ciudad: string | null
          contacto_principal: string | null
          cp: string | null
          created_at: string | null
          direccion: string | null
          empresa_id: string
          es_matriz: boolean | null
          estado: string | null
          id: string
          nombre: string
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          ciudad?: string | null
          contacto_principal?: string | null
          cp?: string | null
          created_at?: string | null
          direccion?: string | null
          empresa_id: string
          es_matriz?: boolean | null
          estado?: string | null
          id?: string
          nombre: string
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          ciudad?: string | null
          contacto_principal?: string | null
          cp?: string | null
          created_at?: string | null
          direccion?: string | null
          empresa_id?: string
          es_matriz?: boolean | null
          estado?: string | null
          id?: string
          nombre?: string
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sucursales_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_historial: {
        Row: {
          created_at: string | null
          estado_anterior: Database["public"]["Enums"]["ticket_estado"] | null
          estado_nuevo: Database["public"]["Enums"]["ticket_estado"]
          id: string
          metadata: Json | null
          notas: string | null
          ticket_id: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          estado_anterior?: Database["public"]["Enums"]["ticket_estado"] | null
          estado_nuevo: Database["public"]["Enums"]["ticket_estado"]
          id?: string
          metadata?: Json | null
          notas?: string | null
          ticket_id: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          estado_anterior?: Database["public"]["Enums"]["ticket_estado"] | null
          estado_nuevo?: Database["public"]["Enums"]["ticket_estado"]
          id?: string
          metadata?: Json | null
          notas?: string | null
          ticket_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_historial_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_historial_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          contacto_id: string | null
          cotizacion_id: string | null
          created_at: string | null
          descripcion: string
          empresa_id: string
          estado: Database["public"]["Enums"]["ticket_estado"] | null
          fecha_factura: string | null
          fecha_fin_servicio: string | null
          fecha_inicio_servicio: string | null
          fecha_pago: string | null
          fecha_programada: string | null
          id: string
          metodo_pago: string | null
          monto_facturado: number | null
          notas_internas: string | null
          numero_factura: string | null
          numero_ticket: number
          prioridad: Database["public"]["Enums"]["ticket_prioridad"] | null
          requiere_autorizacion: boolean | null
          sucursal_id: string | null
          tecnico_id: string | null
          tipo_servicio: Database["public"]["Enums"]["tipo_servicio"]
          updated_at: string | null
          vendedor_id: string | null
        }
        Insert: {
          contacto_id?: string | null
          cotizacion_id?: string | null
          created_at?: string | null
          descripcion: string
          empresa_id: string
          estado?: Database["public"]["Enums"]["ticket_estado"] | null
          fecha_factura?: string | null
          fecha_fin_servicio?: string | null
          fecha_inicio_servicio?: string | null
          fecha_pago?: string | null
          fecha_programada?: string | null
          id?: string
          metodo_pago?: string | null
          monto_facturado?: number | null
          notas_internas?: string | null
          numero_factura?: string | null
          numero_ticket?: number
          prioridad?: Database["public"]["Enums"]["ticket_prioridad"] | null
          requiere_autorizacion?: boolean | null
          sucursal_id?: string | null
          tecnico_id?: string | null
          tipo_servicio: Database["public"]["Enums"]["tipo_servicio"]
          updated_at?: string | null
          vendedor_id?: string | null
        }
        Update: {
          contacto_id?: string | null
          cotizacion_id?: string | null
          created_at?: string | null
          descripcion?: string
          empresa_id?: string
          estado?: Database["public"]["Enums"]["ticket_estado"] | null
          fecha_factura?: string | null
          fecha_fin_servicio?: string | null
          fecha_inicio_servicio?: string | null
          fecha_pago?: string | null
          fecha_programada?: string | null
          id?: string
          metodo_pago?: string | null
          monto_facturado?: number | null
          notas_internas?: string | null
          numero_factura?: string | null
          numero_ticket?: number
          prioridad?: Database["public"]["Enums"]["ticket_prioridad"] | null
          requiere_autorizacion?: boolean | null
          sucursal_id?: string | null
          tecnico_id?: string | null
          tipo_servicio?: Database["public"]["Enums"]["tipo_servicio"]
          updated_at?: string | null
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          activo: boolean | null
          apellido: string | null
          avatar_url: string | null
          clerk_user_id: string | null
          created_at: string | null
          email: string
          empresa_id: string | null
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_usuario"]
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          apellido?: string | null
          avatar_url?: string | null
          clerk_user_id?: string | null
          created_at?: string | null
          email: string
          empresa_id?: string | null
          id?: string
          nombre: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          apellido?: string | null
          avatar_url?: string | null
          clerk_user_id?: string | null
          created_at?: string | null
          email?: string
          empresa_id?: string | null
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: never; Returns: string }
    }
    Enums: {
      audit_accion: "INSERT" | "UPDATE" | "DELETE"
      condicion_pago: "contado" | "15_dias" | "30_dias" | "45_dias" | "60_dias"
      cotizacion_estado:
        | "borrador"
        | "enviada"
        | "aceptada"
        | "rechazada"
        | "vencida"
      cotizacion_item_tipo: "freno" | "refaccion" | "servicio"
      movimiento_motivo:
        | "compra"
        | "venta"
        | "servicio"
        | "devolucion"
        | "ajuste_manual"
      movimiento_tipo: "entrada" | "salida" | "ajuste"
      oportunidad_estado:
        | "prospecto"
        | "contactado"
        | "cotizado"
        | "negociacion"
        | "ganada"
        | "perdida"
        | "cotizacion_enviada"
        | "lead"
        | "calificacion"
        | "seguimiento_activo"
        | "negociacion_cierre"
        | "ganado"
        | "perdido"
      oportunidad_tipo: "frenos" | "refacciones" | "servicios"
      producto_tipo: "freno" | "refaccion" | "insumo"
      recordatorio_tipo:
        | "seguimiento_cotizacion"
        | "cobranza"
        | "alerta_pago"
        | "tarea"
      refaccion_categoria:
        | "cardan"
        | "cruceta"
        | "material_electrico"
        | "soporteria"
        | "hules"
        | "tornilleria"
        | "placas"
      rol_usuario:
        | "admin"
        | "ventas"
        | "tecnico"
        | "facturacion"
        | "direccion"
        | "cliente"
        | "administrativo"
      ticket_estado:
        | "solicitud_recibida"
        | "cotizacion_enviada"
        | "cotizacion_aceptada"
        | "asignacion_tecnico"
        | "servicio_programado"
        | "documentacion_enviada"
        | "tecnico_en_contacto"
        | "servicio_en_proceso"
        | "autorizacion_adicional"
        | "servicio_concluido"
        | "evidencia_cargada"
        | "documentacion_entregada"
        | "encuesta_enviada"
        | "facturado"
        | "pagado"
      ticket_prioridad: "baja" | "media" | "alta" | "urgente"
      tipo_evidencia:
        | "foto_antes"
        | "foto_despues"
        | "video"
        | "documento"
        | "firma"
      tipo_servicio: "preventivo" | "correctivo" | "instalacion" | "diagnostico"
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
      audit_accion: ["INSERT", "UPDATE", "DELETE"],
      condicion_pago: ["contado", "15_dias", "30_dias", "45_dias", "60_dias"],
      cotizacion_estado: [
        "borrador",
        "enviada",
        "aceptada",
        "rechazada",
        "vencida",
      ],
      cotizacion_item_tipo: ["freno", "refaccion", "servicio"],
      movimiento_motivo: [
        "compra",
        "venta",
        "servicio",
        "devolucion",
        "ajuste_manual",
      ],
      movimiento_tipo: ["entrada", "salida", "ajuste"],
      oportunidad_estado: [
        "prospecto",
        "contactado",
        "cotizado",
        "negociacion",
        "ganada",
        "perdida",
        "cotizacion_enviada",
        "lead",
        "calificacion",
        "seguimiento_activo",
        "negociacion_cierre",
        "ganado",
        "perdido",
      ],
      oportunidad_tipo: ["frenos", "refacciones", "servicios"],
      producto_tipo: ["freno", "refaccion", "insumo"],
      recordatorio_tipo: [
        "seguimiento_cotizacion",
        "cobranza",
        "alerta_pago",
        "tarea",
      ],
      refaccion_categoria: [
        "cardan",
        "cruceta",
        "material_electrico",
        "soporteria",
        "hules",
        "tornilleria",
        "placas",
      ],
      rol_usuario: [
        "admin",
        "ventas",
        "tecnico",
        "facturacion",
        "direccion",
        "cliente",
        "administrativo",
      ],
      ticket_estado: [
        "solicitud_recibida",
        "cotizacion_enviada",
        "cotizacion_aceptada",
        "asignacion_tecnico",
        "servicio_programado",
        "documentacion_enviada",
        "tecnico_en_contacto",
        "servicio_en_proceso",
        "autorizacion_adicional",
        "servicio_concluido",
        "evidencia_cargada",
        "documentacion_entregada",
        "encuesta_enviada",
        "facturado",
        "pagado",
      ],
      ticket_prioridad: ["baja", "media", "alta", "urgente"],
      tipo_evidencia: [
        "foto_antes",
        "foto_despues",
        "video",
        "documento",
        "firma",
      ],
      tipo_servicio: ["preventivo", "correctivo", "instalacion", "diagnostico"],
    },
  },
} as const
