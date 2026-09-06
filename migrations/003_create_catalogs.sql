-- ============================================================================
-- MIGRACIÓN 003: SEPARACIÓN DE CATÁLOGO COMPARTIDO Y BESTIARIO
-- Fecha: 2026-09-06
-- ============================================================================

-- 1. Catálogo de Armas
CREATE TABLE IF NOT EXISTS public.weapons_catalog (
  id TEXT PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dano TEXT DEFAULT '',
  alcance TEXT DEFAULT '',
  critico TEXT DEFAULT '',
  "desc" TEXT DEFAULT '',
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bestiario
CREATE TABLE IF NOT EXISTS public.bestiary (
  id TEXT PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT DEFAULT 'Animal',
  continente TEXT DEFAULT 'Todos',
  rareza TEXT DEFAULT 'Común',
  montable BOOLEAN DEFAULT false,
  absorcion TEXT DEFAULT '0',
  defensa TEXT DEFAULT '10',
  movilidad TEXT DEFAULT '6',
  notas TEXT DEFAULT '',
  habilidades TEXT DEFAULT '',
  stats JSONB DEFAULT '{}'::jsonb,
  visible BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Catálogo de Buffs
CREATE TABLE IF NOT EXISTS public.buff_catalog (
  id TEXT PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tipo TEXT DEFAULT 'buff',
  "desc" TEXT DEFAULT '',
  attr TEXT DEFAULT 'todo',
  bonus TEXT DEFAULT '1',
  visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_weapons_campaign ON public.weapons_catalog(campaign_id);
CREATE INDEX IF NOT EXISTS idx_bestiary_campaign ON public.bestiary(campaign_id);
CREATE INDEX IF NOT EXISTS idx_buffs_campaign ON public.buff_catalog(campaign_id);

-- 5. Migrar datos existentes desde campaign_map ('world_compendium')
DO $$
DECLARE
  v_comp_json JSONB;
  v_item RECORD;
BEGIN
  SELECT data INTO v_comp_json FROM public.campaign_map WHERE id = 'world_compendium';
  
  IF v_comp_json IS NOT NULL THEN
    -- A) Migrar weaponsCatalog
    IF v_comp_json->'weaponsCatalog' IS NOT NULL AND jsonb_typeof(v_comp_json->'weaponsCatalog') = 'array' THEN
      FOR v_item IN SELECT * FROM jsonb_to_recordset(v_comp_json->'weaponsCatalog') AS x(id text, name text, dano text, alcance text, critico text, "desc" text, visible boolean)
      LOOP
        INSERT INTO public.weapons_catalog (id, campaign_id, name, dano, alcance, critico, "desc", visible, updated_at)
        VALUES (
          COALESCE(v_item.id, 'wp_' || substr(md5(random()::text), 1, 8)),
          'c0000000-0000-0000-0000-000000000001'::uuid,
          COALESCE(v_item.name, 'Arma'),
          COALESCE(v_item.dano, ''),
          COALESCE(v_item.alcance, ''),
          COALESCE(v_item.critico, ''),
          COALESCE(v_item."desc", ''),
          COALESCE(v_item.visible, true),
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          dano = EXCLUDED.dano,
          alcance = EXCLUDED.alcance,
          critico = EXCLUDED.critico,
          "desc" = EXCLUDED."desc",
          visible = EXCLUDED.visible,
          updated_at = NOW();
      END LOOP;
    END IF;

    -- B) Migrar bestiary
    IF v_comp_json->'bestiary' IS NOT NULL AND jsonb_typeof(v_comp_json->'bestiary') = 'array' THEN
      FOR v_item IN SELECT * FROM jsonb_to_recordset(v_comp_json->'bestiary') AS y(id text, nombre text, name text, tipo text, continente text, rarity text, rareza text, montable boolean, absorcion text, defensa text, movilidad text, notas text, habilidades text, visible boolean, image text)
      LOOP
        INSERT INTO public.bestiary (id, campaign_id, nombre, tipo, continente, rareza, montable, absorcion, defensa, movilidad, notas, habilidades, visible, image_url, updated_at)
        VALUES (
          COALESCE(v_item.id, 'bst_' || substr(md5(random()::text), 1, 8)),
          'c0000000-0000-0000-0000-000000000001'::uuid,
          COALESCE(v_item.nombre, v_item.name, 'Criatura'),
          COALESCE(v_item.tipo, 'Animal'),
          COALESCE(v_item.continente, 'Todos'),
          COALESCE(v_item.rareza, v_item.rarity, 'Común'),
          COALESCE(v_item.montable, false),
          COALESCE(v_item.absorcion, '0'),
          COALESCE(v_item.defensa, '10'),
          COALESCE(v_item.movilidad, '6'),
          COALESCE(v_item.notas, ''),
          COALESCE(v_item.habilidades, ''),
          COALESCE(v_item.visible, true),
          v_item.image,
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          nombre = EXCLUDED.nombre,
          tipo = EXCLUDED.tipo,
          continente = EXCLUDED.continente,
          rareza = EXCLUDED.rareza,
          montable = EXCLUDED.montable,
          absorcion = EXCLUDED.absorcion,
          defensa = EXCLUDED.defensa,
          movilidad = EXCLUDED.movilidad,
          notas = EXCLUDED.notas,
          habilidades = EXCLUDED.habilidades,
          visible = EXCLUDED.visible,
          image_url = EXCLUDED.image_url,
          updated_at = NOW();
      END LOOP;
    END IF;

    -- C) Migrar buffCatalog
    IF v_comp_json->'buffCatalog' IS NOT NULL AND jsonb_typeof(v_comp_json->'buffCatalog') = 'array' THEN
      FOR v_item IN SELECT * FROM jsonb_to_recordset(v_comp_json->'buffCatalog') AS z(id text, name text, nombre text, tipo text, "desc" text, attr text, bonus text, visible boolean)
      LOOP
        INSERT INTO public.buff_catalog (id, campaign_id, name, tipo, "desc", attr, bonus, visible, updated_at)
        VALUES (
          COALESCE(v_item.id, 'buf_' || substr(md5(random()::text), 1, 8)),
          'c0000000-0000-0000-0000-000000000001'::uuid,
          COALESCE(v_item.name, v_item.nombre, 'Efecto'),
          COALESCE(v_item.tipo, 'buff'),
          COALESCE(v_item."desc", ''),
          COALESCE(v_item.attr, 'todo'),
          COALESCE(v_item.bonus, '1'),
          COALESCE(v_item.visible, true),
          NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          tipo = EXCLUDED.tipo,
          "desc" = EXCLUDED."desc",
          attr = EXCLUDED.attr,
          bonus = EXCLUDED.bonus,
          visible = EXCLUDED.visible,
          updated_at = NOW();
      END LOOP;
    END IF;
  END IF;
END $$;
