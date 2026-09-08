function getOfficialCharacters(){
  return [
    // 1. CHERK
    {
      id: "char_cherk",
      db_id: "a8039428-8ee7-4e31-baba-c6a1d8b6d8f3",
      name: "Cherk",
      theme: "teal",
      portrait: "https://raw.githubusercontent.com/rolillo55ac-svg/ficha-rol/main/images/personajes/cherk.jpg",
      isNPC: false,
      owner_id: "a8039428-8ee7-4e31-baba-c6a1d8b6d8f3",
      ownerEmail: "",
      nivel: "1",
      lugarNacimiento: "Trysar",
      altura: "1,52",
      peso: "50",
      edad: "57",
      trabajo: "Pescador",
      ojos: "marrones",
      pelo: "largo, pobre y gris",
      descripcion: "",
      attrs: { fisico: 4, destreza: 8, inteligencia: 8, percepcion: 6, carisma: 4 },
      skillBonus: {
        advertir: 4, distancia: 2, melee: 1, atletismo: 1, buscar: 2,
        cabalgar: 0, callejeo: 0, comercio: 5, disfraz: 0, escalar: 0,
        esquivar: 2, etiqueta: 0, fauna: 4, leyes: 0, musica: 0,
        navegar: 4, nadar: 1, rastrear: 3, reflejos: 0, religion: 3,
        sigilo: 2, rumores: 2, bolsillos: 1, herboristeria: 6, auxilios: 1,
        supervivencia: 3, tradicion: 1, manos: 3, carisma_sk: 2, piedras: 1
      },
      skillProgress: {},
      skillPointsUnlocked: false,
      skillHybrid: { musica: "destreza", rumores: "percepcion" },
      customSkills: [
        { id: "csk_cherk_pesca", name: "Pesca", attr: "destreza", bonus: 5 }
      ],
      combat: {
        iniciativa: 6,
        movilidad: 8,
        defensa: 15,
        defensaMagica: 0,
        pvActual: 16,
        pvMax: 16,
        escudoActual: 0,
        manaActual: 40,
        manaMax: 40
      },
      weapons: [
        { id: "wp_inst_cherk_1", name: "Arpón con cuerda", dano: "1D6+2", alcance: "8m", critico: "", desc: "" },
        { id: "wp_inst_cherk_2", name: "Cerbatana", dano: "1D4+Veneno", alcance: "15m", critico: "", desc: "" },
        { id: "wp_inst_cherk_3", name: "Daga", dano: "1d4+2 / 1d4", alcance: "10m", critico: "", desc: "" }
      ],
      armors: [
        { id: "arm_cherk_cuero", name: "Cuero", absorcion: "2", estorbo: "0" }
      ],
      inventory: [
        { id: uid(), name: "Mochila", qty: 1 },
        { id: uid(), name: "Cuerda", qty: 1 },
        { id: uid(), name: "Caña de pescar", qty: 1 },
        { id: uid(), name: "Cebo", qty: 20 },
        { id: uid(), name: "Raciones de comida", qty: 10 },
        { id: uid(), name: "Tienda de campaña", qty: 1 },
        { id: uid(), name: "Dardos", qty: 25 },
        { id: uid(), name: "Muda", qty: 1 },
        { id: uid(), name: "Kit de yonki", qty: 1 },
        { id: uid(), name: "Kit de herboristería", qty: 1 },
        { id: uid(), name: "Pedernal", qty: 1 },
        { id: uid(), name: "Bases de venenos", qty: 30 },
        { id: uid(), name: "Vial: Seta del sueño", qty: 3 },
        { id: uid(), name: "Vial: Seta terrosa", qty: 2 },
        { id: uid(), name: "Vial: Nenúfar de Pantano", qty: 3 },
        { id: uid(), name: "Vial: Nenúfar de Manglar", qty: 4 },
        { id: uid(), name: "Vial: Flor de sombra", qty: 1 },
        { id: uid(), name: "Vial: Cactus", qty: 2 },
        { id: uid(), name: "Vial: Pez globo", qty: 1 }
      ],
      money: { oro: 25, plata: 0 },
      magiaTipo: "Toxicómano",
      spells: [
        { id: uid(), name: "Seta del sueño", coste: 3, rango: "3", efecto: "1 - No necesitas dormir (Máximo 1 noche)", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Seta terrosa", coste: 3, rango: "2", efecto: "1 - + Mitad de movilidad (4 Turnos)", statAttr: "movilidad", statMod: "+4", active: false },
        { id: uid(), name: "Nenúfar de Pantano", coste: 4, rango: "3", efecto: "1 - +2 a Percepción (20 min)", statAttr: "percepcion", statMod: "+2", active: false },
        { id: uid(), name: "Nenúfar de Manglar", coste: 4, rango: "4", efecto: "1 - +3 de vida falsa (hasta perderla)", statAttr: "Escudo / Vida Falsa", statMod: "+3", active: false },
        { id: uid(), name: "Flor de sombra", coste: 4, rango: "1", efecto: "1 - Visión en la oscuridad (20 min)", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Cactus", coste: 5, rango: "2", efecto: "1 - +1 a las acciones (3 Turnos)", statAttr: "", statMod: "+1", active: false },
        { id: uid(), name: "Pez globo", coste: 5, rango: "1", efecto: "1 - Respiración acuática (20 min)", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Amplificación del éxtasis", coste: 15, rango: "", efecto: "Reactiva el efecto del veneno", statAttr: "", statMod: "", active: false }
      ],
      stones: [],
      passivesNeg: [
        { id: uid(), text: "El mono: necesita pincharse un veneno mínimo cada 12h (máximo 2 veces seguidas el mismo). Si no se inyecta, -1 a todas las tiradas hasta que se chute y estaría muy ansioso." }
      ],
      passivesPos: [
        { id: uid(), text: "Inmune al veneno y si esta drogado con algún veneno, +1 a Destreza. (Un 0 en la columna de la izquierda sigue siendo un 0)." }
      ],
      goddessCurses: [],
      goddessBlessings: [],
      goddessTable: [],
      summons: [],
      buffs: {},
      customBuffs: [],
      poisons: [
        { id: uid(), name: "Seta del sueño", dosis: 3, efectoEnemigo: "Sueño / Paralización", efectoCherk: "No necesitas dormir (Máximo 1 noche)", estado: "descubierto" },
        { id: uid(), name: "Seta terrosa", dosis: 2, efectoEnemigo: "Entumecer", efectoCherk: "+ Mitad de movilidad (4 Turnos)", estado: "descubierto" },
        { id: uid(), name: "Nenúfar de Pantano", dosis: 3, efectoEnemigo: "Reduce Percepción rival", efectoCherk: "+2 a Percepción (20 min)", estado: "descubierto" },
        { id: uid(), name: "Nenúfar de Manglar", dosis: 4, efectoEnemigo: "Daño continuo", efectoCherk: "+3 de vida falsa (hasta perderla)", estado: "descubierto" },
        { id: uid(), name: "Flor de sombra", dosis: 1, efectoEnemigo: "", efectoCherk: "Visión en la oscuridad (20 min)", estado: "descubierto" },
        { id: uid(), name: "Cactus", dosis: 2, efectoEnemigo: "", efectoCherk: "+1 a las acciones (3 Turnos)", estado: "descubierto" },
        { id: uid(), name: "Pez globo", dosis: 1, efectoEnemigo: "", efectoCherk: "Respiración acuática (20 min)", estado: "descubierto" }
      ],
      skillPoints: 0,
      activeBuffs: [],
      personalNotes: ""
    },

    // 2. INK
    {
      id: "char_ink",
      db_id: "ece1cdb6-f8c6-4010-b3e8-045887dc92a3",
      name: "Ink",
      theme: "purple",
      portrait: "https://raw.githubusercontent.com/rolillo55ac-svg/ficha-rol/main/images/personajes/ink.jpg",
      isNPC: false,
      owner_id: "ece1cdb6-f8c6-4010-b3e8-045887dc92a3",
      ownerEmail: "",
      nivel: "1",
      lugarNacimiento: "Krysalis",
      altura: "1,60",
      peso: "X",
      edad: "240",
      trabajo: "Adiestradora",
      ojos: "Amarillos",
      pelo: "Blanco con coleta",
      descripcion: "",
      attrs: { fisico: 8, destreza: 8, inteligencia: 4, percepcion: 6, carisma: 4 },
      skillBonus: {
        advertir: 5, distancia: 1, melee: 4, atletismo: 3, buscar: 2,
        cabalgar: 2, callejeo: 2, comercio: 0, disfraz: 2, escalar: 2,
        esquivar: 5, etiqueta: 1, fauna: 6, leyes: 1, musica: 1,
        navegar: 1, nadar: 1, rastrear: 1, reflejos: 1, religion: 3,
        sigilo: 3, rumores: 0, bolsillos: 0, herboristeria: 0, auxilios: 3,
        supervivencia: 4, tradicion: 0, manos: 4, carisma_sk: 0, piedras: 0
      },
      skillProgress: {},
      skillPointsUnlocked: false,
      skillHybrid: { musica: "destreza", rumores: "percepcion" },
      customSkills: [
        { id: "csk_ink_adiestrar", name: "Adiestrar / Doma", attr: "destreza", bonus: 3 }
      ],
      combat: {
        iniciativa: 7,
        movilidad: 8,
        defensa: 18,
        defensaMagica: 0,
        pvActual: 32,
        pvMax: 32,
        escudoActual: 0,
        manaActual: 40,
        manaMax: 40
      },
      weapons: [
        { id: "wp_inst_ink_1", name: "Guadaña", dano: "2D6", alcance: "Melé", critico: "", desc: "" },
        { id: "wp_inst_ink_2", name: "Arco", dano: "1D6+3", alcance: "Distancia", critico: "", desc: "" },
        { id: "wp_inst_ink_3", name: "Mordisco Vampírico", dano: "1D6+3", alcance: "Melé", critico: "", desc: "" }
      ],
      armors: [
        { id: "arm_ink_cuero", name: "Cuero", absorcion: "2", estorbo: "0" }
      ],
      inventory: [
        { id: uid(), name: "Mochila", qty: 1 },
        { id: uid(), name: "Cuerda", qty: 1 },
        { id: uid(), name: "Raciones de comida", qty: 10 },
        { id: uid(), name: "Tienda de campaña", qty: 1 },
        { id: uid(), name: "Karcaj con 20 flechas", qty: 1 },
        { id: uid(), name: "Muda", qty: 1 },
        { id: uid(), name: "Pedernal", qty: 1 },
        { id: uid(), name: "Queso", qty: 10 },
        { id: uid(), name: "Candil con poción luminosa", qty: 1 },
        { id: uid(), name: "Baratijas", qty: 11 },
        { id: uid(), name: "Peluche de Ratita", qty: 1 }
      ],
      money: { oro: 140, plata: 0 },
      magiaTipo: "Vampiresa Animal",
      spells: [
        { id: uid(), name: "Ratita favorita", coste: 2, rango: "5m", efecto: "24h invocada, más inteligente", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Animales pequeños", coste: 4, rango: "5m", efecto: "(Máximo tamaño Rata)", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Animales medianos", coste: 8, rango: "5m", efecto: "(Máximo tamaño Lobo)", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Forma murciélago", coste: 6, rango: "", efecto: "(Maximo 2 veces dia / 30 min)", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Mordisco vampírico", coste: 8, rango: "", efecto: "(Te sanas la mitad del daño causado)", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Intimidación animal / Sumisión de criaturas", coste: 12, rango: "15m", efecto: "Sumisión de criaturas", statAttr: "", statMod: "", active: false }
      ],
      stones: [],
      passivesNeg: [
        { id: uid(), text: "Repetir sangre: Tienes que beber sangres distintas cada 2 mordiscos." },
        { id: uid(), text: "Sol: Reduce la vida máxima a la mitad y -1 a las acciones." },
        { id: uid(), text: "Plata: Recibe daño del contacto de la plata, sufres 1d6 de daño directo." },
        { id: uid(), text: "Fuego: Impide sanar cualquier daño causado por el fuego." }
      ],
      passivesPos: [
        { id: uid(), text: "Inmunidad al Sol." },
        { id: uid(), text: "1 más en ataque a mele o ataque a distancias." },
        { id: uid(), text: "2 más Percepción y ventaja en Advertir / Notar si hay sangre involucrada." }
      ],
      goddessCurses: [],
      goddessBlessings: [],
      goddessTable: [],
      summons: [
        {
          id: "summon_ink_rata",
          name: "Rata",
          vida: "4",
          defensa: "12",
          absorcion: "1",
          dano: "1d4+1",
          movilidad: "6 (T) / 3 (N)",
          inteligencia: "2",
          habilidades: "Melé 8+1d10, Atletismo 2+1d10, Inteligencia 2+1d10, Percepción 7+1d10, Sigilo 12+1d10, Supervivencia 10+1d10, Esquivar 7+1d10. Obtienen un +1 a acertar los ataques cuando otra rata o Ink están al lado del enemigo (+4 Máximo)."
        },
        {
          id: "summon_ink_murcielago",
          name: "Murciélago",
          vida: "5",
          defensa: "12",
          absorcion: "1",
          dano: "1d4+1",
          movilidad: "3 (T) / 7 (V)",
          inteligencia: "2",
          habilidades: "Melé 8+1d10, Atletismo 2+1d10, Inteligencia 2+1d10, Percepción 7+1d10, Sigilo 12+1d10, Supervivencia 8+1d10, Esquivar 8+1d10. Tiene ventaja en las tiradas de Percepción que se basen en sonido. Ruidos fuertes y estar ensordecido le impiden localizar."
        },
        {
          id: "summon_ink_cuervo",
          name: "Cuervo",
          vida: "8",
          defensa: "14",
          absorcion: "1",
          dano: "1d4+2",
          movilidad: "3 (T) / 9 (V)",
          inteligencia: "3",
          habilidades: "Melé 9+1d10, Atletismo 3+1d10, Inteligencia 3+1d10, Percepción 9+1d10, Sigilo 12+1d10, Supervivencia 12+1d10, Esquivar 9+1d10. Obtienen +1 a atacar si Ink u otro cuervo están cerca (+2 máximo). Percepción +2 para buscar objetos brillantes."
        }
      ],
      buffs: {},
      customBuffs: [],
      poisons: [],
      skillPoints: 0,
      activeBuffs: [],
      personalNotes: ""
    },

    // 3. BUCKY
    {
      id: "char_baky",
      db_id: "4d8dd9b1-b5aa-430e-ae19-79c35b6c3c5e",
      name: "Bucky",
      theme: "blue",
      portrait: null,
      isNPC: false,
      owner_id: "bcfb51f6-4916-4650-b842-0eaf7f8335f4",
      ownerEmail: "",
      nivel: "1",
      lugarNacimiento: "Asland",
      altura: "1,70",
      peso: "70",
      edad: "18",
      trabajo: "Emisario (Lameculos)",
      ojos: "azul",
      pelo: "marrón corto",
      descripcion: "",
      attrs: { fisico: 5, destreza: 7, inteligencia: 8, percepcion: 6, carisma: 4 },
      skillBonus: {
        advertir: 4, distancia: 5, melee: 4, atletismo: 5, buscar: 3,
        cabalgar: 1, callejeo: 1, comercio: 0, disfraz: 0, escalar: 3,
        esquivar: 6, etiqueta: 1, fauna: 2, leyes: 0, musica: 0,
        navegar: 2, nadar: 3, rastrear: 1, reflejos: 2, religion: 3,
        sigilo: 4, rumores: 2, bolsillos: 0, herboristeria: 0, auxilios: 2,
        supervivencia: 2, tradicion: 0, manos: 2, carisma_sk: 1, piedras: 0
      },
      skillProgress: {},
      skillPointsUnlocked: false,
      skillHybrid: { musica: "destreza", rumores: "carisma" },
      customSkills: [],
      combat: {
        iniciativa: 8,
        movilidad: 7,
        defensa: 18,
        defensaMagica: 0,
        pvActual: 20,
        pvMax: 20,
        escudoActual: 0,
        manaActual: 35,
        manaMax: 35
      },
      weapons: [
        { id: "wp_inst_baky_1", name: "Kusarigama", dano: "1D6+2", alcance: "2m", critico: "", desc: "" },
        { id: "wp_inst_baky_2", name: "Daga", dano: "1d4+2 / 1d4", alcance: "10m", critico: "", desc: "" },
        { id: "wp_inst_baky_3", name: "Arco", dano: "1D6+3", alcance: "Distancia", critico: "", desc: "" }
      ],
      armors: [
        { id: "arm_baky_cuero", name: "Cuero", absorcion: "2", estorbo: "0" }
      ],
      inventory: [
        { id: uid(), name: "Mochila", qty: 1 },
        { id: uid(), name: "Cuerda", qty: 1 },
        { id: uid(), name: "Raciones de comida", qty: 10 },
        { id: uid(), name: "Tienda de campaña", qty: 1 },
        { id: uid(), name: "Karcaj con 20 flechas", qty: 1 },
        { id: uid(), name: "Muda", qty: 1 },
        { id: uid(), name: "Pedernal", qty: 1 },
        { id: uid(), name: "Candil", qty: 1 },
        { id: uid(), name: "Aceite de candil", qty: 10 },
        { id: uid(), name: "Tés y set de tés", qty: 1 }
      ],
      money: { oro: 25, plata: 0 },
      magiaTipo: "Marionetista",
      spells: [
        { id: uid(), name: "Marioneta humanoide normal", coste: 5, rango: "15m", efecto: "Tirada enfrentada: Inteligencia+nivel+dado (Combate 1 turno, fuera de combate 1min)", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Marioneta humanoide con magia", coste: 8, rango: "15m", efecto: "Marioneta humanoide con magia", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Marioneta discreta", coste: 6, rango: "15m", efecto: "Marioneta discreta", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Marioneta animal (pequeño)", coste: 4, rango: "15m", efecto: "Marioneta animal pequeño", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Re-atadura", coste: 10, rango: "15m", efecto: "Re-atadura de marioneta", statAttr: "", statMod: "", active: false }
      ],
      stones: [],
      passivesNeg: [],
      passivesPos: [],
      goddessCurses: [],
      goddessBlessings: [],
      goddessTable: [],
      summons: [],
      buffs: {},
      customBuffs: [],
      poisons: [],
      skillPoints: 0,
      activeBuffs: [],
      personalNotes: ""
    },

    // 4. SCARLETH / WINTER
    {
      id: "char_scarleth",
      db_id: "5e9c545e-176a-4e99-a3e7-299f89fa0779",
      name: "Scarleth",
      theme: "default",
      portrait: "https://raw.githubusercontent.com/rolillo55ac-svg/ficha-rol/main/images/personajes/scarleth.jpg",
      isNPC: false,
      owner_id: "5e9c545e-176a-4e99-a3e7-299f89fa0779",
      ownerEmail: "",
      nivel: "1",
      lugarNacimiento: "Krysalis",
      altura: "1,72",
      peso: "x",
      edad: "192",
      trabajo: "Noble",
      ojos: "verdes",
      pelo: "pelirrojo y liso",
      descripcion: "",
      attrs: { fisico: 6, destreza: 8, inteligencia: 4, percepcion: 5, carisma: 7 },
      skillBonus: {
        advertir: 6, distancia: 3, melee: 5, atletismo: 4, buscar: 1,
        cabalgar: 2, callejeo: 1, comercio: 1, disfraz: 0, escalar: 2,
        esquivar: 4, etiqueta: 1, fauna: 0, leyes: 1, musica: 1,
        navegar: 0, nadar: 2, rastrear: 1, reflejos: 3, religion: 3,
        sigilo: 4, rumores: 3, bolsillos: 0, herboristeria: 0, auxilios: 3,
        supervivencia: 0, tradicion: 2, manos: 2, carisma_sk: 3, piedras: 1
      },
      skillProgress: {},
      skillPointsUnlocked: false,
      skillHybrid: { musica: "destreza", rumores: "carisma" },
      customSkills: [
        { id: "csk_scarleth_bailar", name: "Bailar", attr: "destreza", bonus: 1 }
      ],
      combat: {
        iniciativa: 8,
        movilidad: 8,
        defensa: 17,
        defensaMagica: 0,
        pvActual: 24,
        pvMax: 24,
        escudoActual: 0,
        manaActual: 40,
        manaMax: 40
      },
      weapons: [
        { id: "wp_inst_scar_1", name: "Látigo", dano: "1D6+3", alcance: "1m", critico: "", desc: "" },
        { id: "wp_inst_scar_2", name: "Guja", dano: "1D6+3", alcance: "1m", critico: "", desc: "" },
        { id: "wp_inst_scar_3", name: "Arco", dano: "1D6+3", alcance: "Distancia", critico: "", desc: "" },
        { id: "wp_inst_scar_4", name: "Mordisco Vampírico", dano: "1D6+3", alcance: "Melé", critico: "", desc: "" }
      ],
      armors: [
        { id: "arm_scar_cuero", name: "Cuero", absorcion: "2", estorbo: "0" }
      ],
      inventory: [
        { id: uid(), name: "Mochila", qty: 1 },
        { id: uid(), name: "Cuerda", qty: 1 },
        { id: uid(), name: "Viales de sangre", qty: 10 },
        { id: uid(), name: "Karcaj con 20 flechas", qty: 1 },
        { id: uid(), name: "Mudas", qty: 2 },
        { id: uid(), name: "Candil con poción luminosa", qty: 1 },
        { id: uid(), name: "Daga bonita cara", qty: 1 },
        { id: uid(), name: "Joyas", qty: 4 },
        { id: uid(), name: "Sombrilla", qty: 1 },
        { id: uid(), name: "Capa de terciopelo", qty: 1 },
        { id: uid(), name: "Peine bueno", qty: 1 },
        { id: uid(), name: "Perfume", qty: 1 },
        { id: uid(), name: "Espejo útil", qty: 1 },
        { id: uid(), name: "Kit médico", qty: 1 },
        { id: uid(), name: "Pamela", qty: 1 },
        { id: uid(), name: "Broche para capa", qty: 1 },
        { id: uid(), name: "Viales vacíos", qty: 5 },
        { id: uid(), name: "Pañuelos de seda", qty: 1 },
        { id: uid(), name: "Maquillaje", qty: 1 },
        { id: uid(), name: "Cáliz de oro", qty: 1 },
        { id: uid(), name: "Guantes", qty: 1 },
        { id: uid(), name: "Mantita Astarion", qty: 1 }
      ],
      money: { oro: 200, plata: 0 },
      magiaTipo: "Vampiresa",
      spells: [
        { id: uid(), name: "Control mental", coste: 5, rango: "15 metros", efecto: "(1 turno combate / 1 min fuera). Tirada enfrentada: Carisma+nivel+dado", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Leer pensamientos", coste: 7, rango: "15 metros", efecto: "(Instante de uso)", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Crear con sangre", coste: 6, rango: "5 metros", efecto: "(objetos pequeños, máx una daga) (24h)", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Forma murciélago", coste: 6, rango: "", efecto: "(Maximo 2 veces dia / 30 min)", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Mordisco vampírico (sanar)", coste: 8, rango: "", efecto: "Sanar la mitad del daño causado", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Hablar con los vástagos", coste: 2, rango: "50 metros", efecto: "Comunicación con los Vástagos", statAttr: "", statMod: "", active: false },
        { id: uid(), name: "Mordisco vampírico (crear vástago)", coste: 6, rango: "", efecto: "1d4 - Comer y crear vástago (Coste 0 ó 6)", statAttr: "", statMod: "", active: false }
      ],
      stones: [
        { id: uid(), color: "Roja", efecto: "Piedra mágica roja" },
        { id: uid(), color: "Arcoíris", efecto: "Piedra mágica multicolor" }
      ],
      passivesNeg: [
        { id: uid(), text: "Repetir sangre: Tienes que beber sangres distintas cada 2 mordiscos." },
        { id: uid(), text: "Sol: Reduce la vida máxima a la mitad y -1 a las acciones." },
        { id: uid(), text: "Plata: Recibe daño del contacto de la plata, sufres 1d6 de daño directo." },
        { id: uid(), text: "Fuego: Impide sanar cualquier daño causado por el fuego." }
      ],
      passivesPos: [
        { id: uid(), text: "Inmunidad al Sol." },
        { id: uid(), text: "1 más en ataque a mele o ataque a distancias." },
        { id: uid(), text: "2 más Percepción y ventaja en Advertir / Notar si hay sangre involucrada." }
      ],
      goddessCurses: [],
      goddessBlessings: [],
      goddessTable: [
        { id: uid(), name: "Luna", gustos: "Noche", disgustos: "" }
      ],
      summons: [],
      buffs: {},
      customBuffs: [],
      poisons: [],
      skillPoints: 0,
      activeBuffs: [],
      personalNotes: ""
    },

    // 5. DEREK (Personaje jugable de Scarleth)
    {
      id: "char_derek",
      db_id: "d9dee50e-051d-4058-b4a5-d46c809fbb25",
      name: "Derek",
      theme: "purple",
      portrait: "https://raw.githubusercontent.com/rolillo55ac-svg/ficha-rol/main/images/personajes/derek.jpg",
      isNPC: false,
      owner_id: "5e9c545e-176a-4e99-a3e7-299f89fa0779",
      ownerEmail: "",
      nivel: "1 Vástago",
      lugarNacimiento: "Krysalis",
      altura: "1,69",
      peso: "65",
      edad: "20+76",
      trabajo: "Vástago",
      ojos: "heterocromía (azul y rojo)",
      pelo: "Bicolor negro blanco",
      descripcion: "Vástago de Krysalis",
      attrs: { fisico: 8, destreza: 6, inteligencia: 8, percepcion: 8, carisma: 5 },
      skillBonus: {
        advertir: 3, distancia: 4, melee: 5, atletismo: 3, buscar: 1,
        cabalgar: 2, callejeo: 0, comercio: 1, disfraz: 0, escalar: 3,
        esquivar: 6, etiqueta: 0, fauna: 0, leyes: 1, musica: 0,
        navegar: 0, nadar: 2, rastrear: 0, reflejos: 0, religion: 3,
        sigilo: 4, rumores: 0, bolsillos: 0, herboristeria: 0, auxilios: 1,
        supervivencia: 1, tradicion: 0, manos: 2, carisma_sk: 1, piedras: 0
      },
      skillProgress: {},
      skillPointsUnlocked: false,
      skillHybrid: { musica: "destreza", rumores: "percepcion" },
      customSkills: [],
      combat: {
        iniciativa: 8,
        movilidad: 6,
        defensa: 17,
        defensaMagica: 0,
        pvActual: 32,
        pvMax: 32,
        escudoActual: 0,
        manaActual: 30,
        manaMax: 30
      },
      weapons: [
        { id: "wp_inst_derek_1", name: "Sable bonito", dano: "1D6+3", alcance: "Melé", critico: "", desc: "" },
        { id: "wp_inst_derek_2", name: "Garras lobezno", dano: "1d4+2 / 1d4", alcance: "Melé", critico: "", desc: "" },
        { id: "wp_inst_derek_3", name: "Martillo a dos manos", dano: "2d6", alcance: "Melé", critico: "", desc: "" },
        { id: "wp_inst_derek_4", name: "Arco", dano: "1D6+3", alcance: "Distancia", critico: "", desc: "" },
        { id: "wp_inst_derek_5", name: "Mordisco Vampírico", dano: "1D6+3", alcance: "Melé", critico: "", desc: "" }
      ],
      armors: [
        { id: "arm_derek_cuero", name: "Cuero", absorcion: "2", estorbo: "0" }
      ],
      inventory: [
        { id: uid(), name: "Mochila", qty: 1 },
        { id: uid(), name: "Cuerda", qty: 1 },
        { id: uid(), name: "Raciones de comida", qty: 10 },
        { id: uid(), name: "Tienda de campaña", qty: 1 },
        { id: uid(), name: "Karcaj con 20 flechas", qty: 1 },
        { id: uid(), name: "Muda", qty: 1 },
        { id: uid(), name: "Pedernal", qty: 1 }
      ],
      money: { oro: 0, plata: 0 },
      magiaTipo: "Vástago",
      spells: [
        { id: uid(), name: "Mordisco Vampírico", coste: 8, rango: "Melé", efecto: "Sanas la mitad del daño causado", statAttr: "", statMod: "", active: false }
      ],
      stones: [],
      passivesNeg: [
        { id: uid(), text: "Repetir sangre: Tienes que beber sangres distintas cada 2 mordiscos." },
        { id: uid(), text: "Sol: Reduce la vida máxima a la mitad y -1 a las acciones." },
        { id: uid(), text: "Plata: Recibe daño del contacto de la plata, sufres 1d6 de daño directo." },
        { id: uid(), text: "Fuego: Impide sanar cualquier daño causado por el fuego." }
      ],
      passivesPos: [
        { id: uid(), text: "El Sol solo le reduce 1/5 de su vida maxima." },
        { id: uid(), text: "1 más en ataque a mele o ataque a distancias." },
        { id: uid(), text: "1 en advertir notar." }
      ],
      goddessCurses: [],
      goddessBlessings: [],
      goddessTable: [],
      summons: [],
      buffs: {},
      customBuffs: [],
      poisons: [],
      skillPoints: 0,
      activeBuffs: [],
      personalNotes: ""
    }
  ];
}

function resetCharactersToOfficial(keepPortraits){
  var officials = getOfficialCharacters();
  state.characters = state.characters || [];

  var scarlethChar = state.characters.find(function(c){
    var n = (c.name || "").toLowerCase();
    return n === "scarleth" || n.includes("scarleth") || n.includes("winter");
  });
  var scarlethOwner = scarlethChar ? scarlethChar.owner_id : null;
  var scarlethEmail = scarlethChar ? scarlethChar.ownerEmail : "";

  officials.forEach(function(off){
    var existing = state.characters.find(function(c){
      var cName = (c.name || "").trim().toLowerCase();
      var oName = off.name.trim().toLowerCase();
      if(oName === "derek") return cName === "derek";
      if(oName === "scarleth") return cName === "scarleth" || cName.includes("scarleth") || cName.includes("winter");
      if(oName === "bucky") return cName === "bucky" || cName === "baky" || cName.includes("bucky") || cName.includes("baky");
      if(oName === "cherk") return cName === "cherk" || cName.includes("cherk");
      if(oName === "ink") return cName === "ink" || cName.includes("ink");
      return cName === oName;
    });
    if(existing){
      var savedPortrait = (keepPortraits !== false) ? (existing.portrait || off.portrait) : off.portrait;
      var savedOwner = existing.owner_id || (off.name === "Derek" && scarlethOwner ? scarlethOwner : off.owner_id);
      var savedTheme = existing.theme || off.theme;
      var savedDbId = existing.db_id;
      var savedEmail = existing.ownerEmail || (off.name === "Derek" && scarlethEmail ? scarlethEmail : off.ownerEmail);
      var savedId = existing.id;
      Object.assign(existing, JSON.parse(JSON.stringify(off)));
      existing.id = savedId;
      if(savedDbId) existing.db_id = savedDbId;
      existing.portrait = savedPortrait;
      existing.owner_id = savedOwner;
      existing.ownerEmail = savedEmail;
      existing.theme = savedTheme;
      existing.officialDataVersion = 4;
    } else {
      var nOff = JSON.parse(JSON.stringify(off));
      if(nOff.name === "Derek" && scarlethOwner){
        nOff.owner_id = scarlethOwner;
        nOff.ownerEmail = scarlethEmail;
      }
      nOff.officialDataVersion = 4;
      state.characters.push(nOff);
    }
  });

  state.characters = state.characters.filter(function(c){
    var n = (c.name || "").trim().toLowerCase();
    return n !== "sin personaje" && n !== "nuevo personaje" && n !== "kaelen mago";
  });

  if(!state.characters.some(function(c){ return c.id === state.activeId; })){
    state.activeId = state.characters[0] ? state.characters[0].id : "";
  }
}


async function pullAllFromSupabase(){
  if(!supabaseClient) return;
  isRemoteSyncing = true;
  try{
    var charRes = await supabaseClient.from('characters').select('*');
    if(charRes.data && charRes.data.length){
      var pulledChars = charRes.data.map(function(r){ 
        var c = r.data || {}; 
        c.db_id = r.id;
        if(r.owner_id) c.owner_id = r.owner_id;
        c._serverUpdatedAt = r.updated_at ? new Date(r.updated_at).getTime() : 0;
        c._isDirty = false;
        return c; 
      });

      pulledChars = pulledChars.filter(function(c){
        var n = (c.name || "").trim().toLowerCase();
        return n && n !== "sin personaje" && n !== "nuevo personaje" && n !== "kaelen mago";
      });

      // Ensure all official characters exist in the database (never overwrite existing player modifications)
      var officials = getOfficialCharacters();
      officials.forEach(function(off){
        var exists = pulledChars.some(function(c){
          var cName = (c.name || "").trim().toLowerCase();
          var oName = off.name.trim().toLowerCase();
          if(oName === "derek") return cName === "derek";
          if(oName === "scarleth") return cName === "scarleth" || cName.includes("scarleth") || cName.includes("winter");
          if(oName === "bucky") return cName === "bucky" || cName === "baky" || cName.includes("bucky") || cName.includes("baky");
          if(oName === "cherk") return cName === "cherk" || cName.includes("cherk");
          if(oName === "ink") return cName === "ink" || cName.includes("ink");
          return cName === oName;
        });
        if(!exists){
          var nOff = JSON.parse(JSON.stringify(off));
          nOff.officialDataVersion = 5;
          pulledChars.push(nOff);
          if(isGM()){
            pushCharacterById(nOff.id);
          }
        }
      });

      // Apply official GitHub portrait URLs if character doesn't have a valid web URL
      pulledChars.forEach(function(c){
        var cName = (c.name || "").trim().toLowerCase();
        var off = officials.find(function(o){
          var oName = o.name.trim().toLowerCase();
          if(oName === "derek") return cName === "derek";
          if(oName === "scarleth") return cName === "scarleth" || cName.includes("scarleth") || cName.includes("winter");
          if(oName === "bucky") return cName === "bucky" || cName === "baky" || cName.includes("bucky") || cName.includes("baky");
          if(oName === "cherk") return cName === "cherk" || cName.includes("cherk");
          if(oName === "ink") return cName === "ink" || cName.includes("ink");
          return cName === oName;
        });
        if(off && off.portrait && (!c.portrait || !c.portrait.startsWith("http"))){
          c.portrait = off.portrait;
        }
      });

      // Match owner_id with user if email matches
      if(currentUser && currentUser.email){
        var userEmail = currentUser.email.trim().toLowerCase();
        pulledChars.forEach(function(c){
          if(c.ownerEmail && c.ownerEmail.trim().toLowerCase() === userEmail){
            c.owner_id = currentUser.id;
          }
        });
      }

      // Merge: Supabase es la fuente de verdad única para personajes y NPCs
      var mergedChars = pulledChars.map(function(remoteC){
        remoteC._isDirty = false;
        dirtyCharIds.delete(remoteC.id);

        var localC = (state.characters || []).find(function(lc){ 
          return lc.id === remoteC.id || (lc.db_id && lc.db_id === remoteC.db_id) || (lc.name && remoteC.name && lc.name.trim().toLowerCase() === remoteC.name.trim().toLowerCase()); 
        });

        // Solo mantener cambios locales si el usuario tiene permiso para editar,
        // tiene cambios sucios pendientes en ESTA sesión y son más recientes que el servidor
        if(localC && localC._isDirty && dirtyCharIds.has(localC.id) && canEditChar(localC)){
          if(remoteC._serverUpdatedAt && localC._lastLocalEdit && remoteC._serverUpdatedAt > localC._lastLocalEdit){
            console.warn("El servidor tiene datos más recientes para " + remoteC.name + ", priorizando servidor.");
            return remoteC;
          }
          return localC;
        }
        return remoteC;
      });

      // Limpiar personajes locales: si ya tenían db_id y NO vinieron de Supabase,
      // fueron ELIMINADOS del servidor. ¡NO RESUCITAR!
      (state.characters || []).forEach(function(localC){
        var alreadyIn = mergedChars.some(function(mc){ 
          return mc.id === localC.id || (mc.db_id && mc.db_id === localC.db_id) || (mc.name && localC.name && mc.name.trim().toLowerCase() === localC.name.trim().toLowerCase()); 
        });
        if(!alreadyIn){
          if(localC.db_id){
            console.log("Personaje eliminado del servidor descartado de local:", localC.name);
            dirtyCharIds.delete(localC.id);
            dirtyCharIds.delete(localC.db_id);
            return;
          }
          if(localC.isNPC && !isGM()){
            console.log("Cliente jugador descarta NPC no presente en servidor:", localC.name);
            dirtyCharIds.delete(localC.id);
            return;
          }
          // Solo mantener si es un personaje nuevo creado localmente en esta sesión por un usuario autorizado
          if(canEditChar(localC) && localC._isDirty && dirtyCharIds.has(localC.id)){
            mergedChars.push(localC);
          } else {
            dirtyCharIds.delete(localC.id);
          }
        }
      });

      state.characters = mergedChars;
      state.characters.forEach(function(c){ ensureCharDefaults(c); });

      var validChars = getUserCharacters();
      var savedActiveId = localStorage.getItem("krysalis_active_id");
      if(savedActiveId && validChars.some(function(x){ return x.id === savedActiveId; })){
        state.activeId = savedActiveId;
      } else if(validChars.length > 0){
        state.activeId = validChars[0].id;
      }
      updateSyncBadge("synced");
    } else if(charRes.data && charRes.data.length === 0){
      var seedOfficials = getOfficialCharacters();
      state.characters = seedOfficials;
      if(isGM()){
        state.characters.forEach(function(c){ pushCharacterById(c.id); });
      }
      updateSyncBadge("synced");
    }
    saveState(true); renderTopbar(); renderTabbar();
    if(!document.activeElement || !document.activeElement.matches("input, textarea")) renderTab();
  }catch(e){ console.error('Supabase error:', e); }
  isRemoteSyncing = false;
  
  var hasLegitDirty = Array.from(dirtyCharIds).some(function(cid){
    var c = (state.characters||[]).find(function(x){ return x.id === cid || x.db_id === cid; });
    return c && canEditChar(c);
  });
  if(hasLegitDirty){
    flushPendingSync();
  }
}

function sendKeepalivePush(c){
  if(!c || !c.name || c.id==="empty") return;
  if(!canEditChar(c)) return;
  try{
    var n = (c.name||"").trim().toLowerCase();
    var dbId = c.db_id;
    if(!dbId){
      if(n === "derek") dbId = "d9dee50e-051d-4058-b4a5-d46c809fbb25";
      else if(n.includes("scarleth") || n.includes("winter")) dbId = "5e9c545e-176a-4e99-a3e7-299f89fa0779";
      else if(n.includes("bucky") || n.includes("baky")) dbId = "4d8dd9b1-b5aa-430e-ae19-79c35b6c3c5e";
      else if(n.includes("cherk")) dbId = "a8039428-8ee7-4e31-baba-c6a1d8b6d8f3";
      else if(n.includes("ink")) dbId = "ece1cdb6-f8c6-4010-b3e8-045887dc92a3";
    }
    var cleanData = JSON.parse(JSON.stringify(c));
    delete cleanData._isDirty;
    delete cleanData._lastLocalEdit;
    delete cleanData._serverUpdatedAt;

    var payload = { name: c.name, data: cleanData, updated_at: new Date().toISOString() };
    if(dbId) payload.id = dbId;
    
    var url = SUPABASE_URL + "/rest/v1/characters";
    fetch(url, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON,
        "Authorization": "Bearer " + SUPABASE_ANON,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(function(){});
  }catch(e){}
}

async function pushCharacterById(charId, forceOverwrite){
  if(!supabaseClient) return;
  var c = (state.characters||[]).find(function(x){ return x.id === charId || x.db_id === charId; });
  if(!c || !c.name || c.id==="empty") return;

  // VERIFICACIÓN DE PERMISOS: Solo GM o dueño
  if(!canEditChar(c)){
    console.warn("pushCharacterById: Permiso denegado para", c.name);
    dirtyCharIds.delete(c.id);
    if(c.db_id) dirtyCharIds.delete(c.db_id);
    c._isDirty = false;
    return;
  }

  if(!c.db_id){
    var n = (c.name||"").trim().toLowerCase();
    if(n === "derek") c.db_id = "d9dee50e-051d-4058-b4a5-d46c809fbb25";
    else if(n.includes("scarleth") || n.includes("winter")) c.db_id = "5e9c545e-176a-4e99-a3e7-299f89fa0779";
    else if(n.includes("bucky") || n.includes("baky")) c.db_id = "4d8dd9b1-b5aa-430e-ae19-79c35b6c3c5e";
    else if(n.includes("cherk")) c.db_id = "a8039428-8ee7-4e31-baba-c6a1d8b6d8f3";
    else if(n.includes("ink")) c.db_id = "ece1cdb6-f8c6-4010-b3e8-045887dc92a3";
  }

  // Control de conflicto robusto: verificar si el servidor tiene datos más recientes
  if(c.db_id && c._serverUpdatedAt && !forceOverwrite){
    try{
      var checkRes = await supabaseClient.from('characters').select('updated_at, data').eq('id', c.db_id).maybeSingle();
      if(checkRes.data && checkRes.data.updated_at){
        var remoteTs = new Date(checkRes.data.updated_at).getTime();
        // Si el servidor fue actualizado después de nuestra última sincronización conocida (+500ms contra jitter de red)
        if(remoteTs > (c._serverUpdatedAt || 0) + 500){
          console.warn("Conflicto detectado: la ficha en el servidor es más reciente para", c.name, "Remoto:", remoteTs, "LocalSync:", c._serverUpdatedAt);

          var hasLocalDirty = c._isDirty || dirtyCharIds.has(c.id) || (c.db_id && dirtyCharIds.has(c.db_id));

          if(hasLocalDirty){
            // 1. Guardar copia de seguridad local de inmediato para garantizar CERO pérdida de datos
            try {
              var backupKey = 'krysalis_conflict_backup_' + c.id;
              var conflictEntry = {
                timestamp: new Date().toISOString(),
                charId: c.id,
                charDbId: c.db_id,
                charName: c.name,
                serverUpdatedAt: remoteTs,
                localLastEdit: c._lastLocalEdit || Date.now(),
                data: JSON.parse(JSON.stringify(c))
              };
              localStorage.setItem(backupKey, JSON.stringify(conflictEntry));
              var historyKey = 'krysalis_conflict_history';
              var hist = JSON.parse(localStorage.getItem(historyKey) || '[]');
              hist.unshift(conflictEntry);
              if(hist.length > 10) hist.pop();
              localStorage.setItem(historyKey, JSON.stringify(hist));
            } catch(eB){ console.warn("Error guardando backup de conflicto:", eB); }

            // 2. Detener la subida para evitar sobrescritura silenciosa en el servidor
            dirtyCharIds.delete(c.id);
            if(c.db_id) dirtyCharIds.delete(c.db_id);
            c._isDirty = false;

            // 3. Abrir modal interactivo de resolución de conflicto
            if(typeof showConflictModal === "function" && checkRes.data.data){
              showConflictModal(c, checkRes.data.data, remoteTs);
            } else {
              showToast("⚠️ Conflicto: " + c.name + " fue modificado por otro jugador. Cambios locales respaldados.", "warning");
            }
            return;
          } else {
            // Sin cambios locales pendientes: sincronizar de forma limpia con la verdad del servidor
            if(checkRes.data.data){
              var updatedRemote = checkRes.data.data;
              updatedRemote.db_id = c.db_id;
              updatedRemote._serverUpdatedAt = remoteTs;
              updatedRemote._isDirty = false;
              dirtyCharIds.delete(c.id);
              if(c.db_id) dirtyCharIds.delete(c.db_id);
              var idx = state.characters.findIndex(function(x){ return x.id === c.id || x.db_id === c.db_id; });
              if(idx !== -1) state.characters[idx] = ensureCharDefaults(updatedRemote);
              saveState(true);
              renderTopbar();
              renderTab();
              showToast("Aviso: " + c.name + " actualizado con la versión más reciente del servidor.", "info");
              return;
            }
          }
        }
      }
    }catch(errCheck){
      console.warn("Error verificando versión del servidor:", errCheck);
    }
  }

  // Sanitizar payload: nunca guardar banderas de runtime transitorias en Supabase
  var cleanData = JSON.parse(JSON.stringify(c));
  delete cleanData._isDirty;
  delete cleanData._lastLocalEdit;
  delete cleanData._serverUpdatedAt;

  var payload = {name: c.name, data: cleanData, updated_at: new Date().toISOString()};
  if(c.db_id) payload.id = c.db_id;

  supabaseClient.from('characters').upsert(payload).select().then(function(res){
    if(res.error) {
      console.error('Supabase error:', res.error);
      sendKeepalivePush(c);
      return;
    }
    if(res.data && res.data[0]){
      c.db_id = res.data[0].id;
      c._serverUpdatedAt = res.data[0].updated_at ? new Date(res.data[0].updated_at).getTime() : Date.now();
    }
    c._isDirty = false;
    dirtyCharIds.delete(c.id);
    if(c.db_id) dirtyCharIds.delete(c.db_id);
    saveState(true);
    updateSyncBadge("synced");
  }).catch(function(e){
    console.error('Supabase error:', e);
    sendKeepalivePush(c);
  });
}

function pushActiveChar(){
  var c = activeChar();
  if(c && c.id) pushCharacterById(c.id);
}