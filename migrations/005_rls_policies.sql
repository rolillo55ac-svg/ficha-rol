-- ============================================================================
-- MIGRACIÓN 005: POLÍTICAS DE SEGURIDAD ROW LEVEL SECURITY (RLS)
-- Fecha: 2026-09-06
-- ============================================================================

-- Helper para comprobar si el usuario actual es GM de la campaña
CREATE OR REPLACE FUNCTION public.is_campaign_gm(p_campaign_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.campaign_members
    WHERE campaign_id = p_campaign_id 
      AND user_id = auth.uid() 
      AND role = 'GM'
  ) OR EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE id = p_campaign_id AND gm_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper para comprobar si el usuario actual es miembro de la campaña (GM o PLAYER)
CREATE OR REPLACE FUNCTION public.is_campaign_member(p_campaign_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.campaign_members
    WHERE campaign_id = p_campaign_id 
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. TABLA: campaigns
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Miembros pueden ver sus campañas" ON public.campaigns
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      gm_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM public.campaign_members WHERE campaign_id = campaigns.id AND user_id = auth.uid())
    )
  );

CREATE POLICY "Solo GM puede modificar su campaña" ON public.campaigns
  FOR UPDATE USING (gm_id = auth.uid());


-- 2. TABLA: campaign_members
ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Miembros pueden ver miembros de su campaña" ON public.campaign_members
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.campaign_members cm WHERE cm.campaign_id = campaign_members.campaign_id AND cm.user_id = auth.uid())
    )
  );


-- 3. TABLA: characters
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera autenticado puede ver personajes de su campaña" ON public.characters
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Dueño o GM pueden actualizar su personaje" ON public.characters
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      owner_id = auth.uid() OR
      public.is_campaign_gm(campaign_id) OR
      EXISTS (
        SELECT 1 FROM public.campaign_members 
        WHERE character_id = characters.id AND user_id = auth.uid()
      )
    )
  );


-- 4. TABLA: maps
ALTER TABLE public.maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos los miembros pueden ver mapas" ON public.maps
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND public.is_campaign_member(campaign_id)
  );

CREATE POLICY "Solo GM puede crear mapas" ON public.maps
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND public.is_campaign_gm(campaign_id)
  );

CREATE POLICY "Solo GM puede actualizar mapas" ON public.maps
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND public.is_campaign_gm(campaign_id)
  );

CREATE POLICY "Solo GM puede borrar mapas" ON public.maps
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND public.is_campaign_gm(campaign_id)
  );


-- 5. TABLA: map_markers (MARCADORES COMPARTIDOS 100% COLABORATIVOS)
-- Requisito de la Fase 9: Cualquier miembro (GM o PLAYER) puede crear, editar y borrar marcadores
ALTER TABLE public.map_markers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos los miembros pueden ver marcadores" ON public.map_markers
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND public.is_campaign_member(campaign_id)
  );

CREATE POLICY "Cualquier miembro puede crear marcadores" ON public.map_markers
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND public.is_campaign_member(campaign_id)
  );

CREATE POLICY "Cualquier miembro puede editar cualquier marcador" ON public.map_markers
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND public.is_campaign_member(campaign_id)
  );

CREATE POLICY "Cualquier miembro puede borrar cualquier marcador" ON public.map_markers
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND public.is_campaign_member(campaign_id)
  );


-- 6. TABLAS DE CATÁLOGOS COMPARTIDOS
ALTER TABLE public.weapons_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Miembros pueden ver catálogo de armas" ON public.weapons_catalog
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "GM puede gestionar armas" ON public.weapons_catalog
  FOR ALL USING (public.is_campaign_gm(campaign_id));

ALTER TABLE public.bestiary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Miembros pueden ver bestiario" ON public.bestiary
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "GM puede gestionar bestiario" ON public.bestiary
  FOR ALL USING (public.is_campaign_gm(campaign_id));

ALTER TABLE public.buff_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Miembros pueden ver buffs" ON public.buff_catalog
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "GM puede gestionar buffs" ON public.buff_catalog
  FOR ALL USING (public.is_campaign_gm(campaign_id));
