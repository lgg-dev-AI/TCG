import { query, run, get } from './db.js';

async function seed() {
  console.log('🌱 Iniciando seeding completo Multi-TCG y ventas en PokéVault...');

  // 1. Asegurar usuarios clientes
  const users = [
    { id: 'usr_carlos_01', email: 'carlos.mendez@coleccion.mx', name: 'Carlos Méndez', phone: '5512345678', city: 'Monterrey', state: 'Nuevo León' },
    { id: 'usr_sofia_02', email: 'sofia.tcg@gmail.com', name: 'Sofía Ramírez', phone: '3398765432', city: 'Guadalajara', state: 'Jalisco' },
    { id: 'usr_diego_03', email: 'diego.torres@outlook.com', name: 'Diego Torres', phone: '5587654321', city: 'CDMX', state: 'CDMX' },
    { id: 'usr_mostrador_04', email: 'mostrador@pokevault.mx', name: 'Cliente Mostrador Local', phone: '8110002233', city: 'San Pedro', state: 'Nuevo León' },
  ];

  const userMap = {};
  for (const u of users) {
    let existing = await get('SELECT id FROM users WHERE email = ?', [u.email]);
    if (!existing) {
      await run(
        `INSERT INTO users (id, email, name, role, phone, city, state) VALUES (?, ?, ?, 'CUSTOMER', ?, ?, ?)`,
        [u.id, u.email, u.name, u.phone, u.city, u.state]
      );
      userMap[u.email] = u.id;
      console.log(`👤 Usuario creado: ${u.email}`);
    } else {
      userMap[u.email] = existing.id;
    }
  }

  // 2. Catálogo Multi-TCG: Pokémon, Yu-Gi-Oh!, Magic, One Piece, Videojuegos y Accesorios
  const products = [
    // --- POKÉMON TCG ---
    {
      id: 'poke_charizard_151_sir',
      name: 'Charizard ex SIR #199/165',
      price: 2850,
      category: 'single',
      image_url: 'https://images.pokemontcg.io/sv3pt5/199_hires.png',
      description: 'Charizard ex ilustración especial rara de Scarlet & Violet 151. Condición Near Mint garantizada.',
      stock: 5,
      expansion: 'Scarlet & Violet: 151',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Scarlet & Violet: 151 Booster Pack',
      card_condition: 'NM',
      game_type: 'POKEMON',
      subcategory: 'pokemon',
      is_first_edition: 'No',
      market_price: 2800,
      market_price_low: 2600,
      market_price_high: 3100
    },
    {
      id: 'poke_pikachu_vmax_rainbow',
      name: 'Pikachu VMAX Rainbow Rare #188/185',
      price: 3200,
      category: 'single',
      image_url: 'https://images.pokemontcg.io/swsh4/188_hires.png',
      description: 'El legendario Chonkachu Arcoíris de Vivid Voltage. Secret Rare en perfecto estado.',
      stock: 3,
      expansion: 'Vivid Voltage',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Vivid Voltage Booster Pack',
      card_condition: 'NM',
      game_type: 'POKEMON',
      subcategory: 'pokemon',
      is_first_edition: 'No',
      market_price: 3150,
      market_price_low: 2900,
      market_price_high: 3500
    },
    {
      id: 'poke_rayquaza_vmax_alt',
      name: 'Rayquaza VMAX Alternate Art #218/203',
      price: 6400,
      category: 'single',
      image_url: 'https://images.pokemontcg.io/swsh7/218_hires.png',
      description: 'Rayquaza VMAX Arte Alterno sobrevolando las montañas. Una de las cartas más codiciadas de Evolving Skies.',
      stock: 2,
      expansion: 'Evolving Skies',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Evolving Skies Booster Pack',
      card_condition: 'NM',
      game_type: 'POKEMON',
      subcategory: 'pokemon',
      is_first_edition: 'No',
      market_price: 6300,
      market_price_low: 5800,
      market_price_high: 7000
    },
    {
      id: 'poke_umbreon_vmax_alt',
      name: 'Umbreon VMAX Alt Art "Moonbreon" #215/203',
      price: 14500,
      category: 'single',
      image_url: 'https://images.pokemontcg.io/swsh7/215_hires.png',
      description: 'La joya indiscutible de la era Sword & Shield: Moonbreon alcanzando la luna. Centrado impecable.',
      stock: 2,
      expansion: 'Evolving Skies',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Evolving Skies Booster Pack',
      card_condition: 'NM',
      game_type: 'POKEMON',
      subcategory: 'pokemon',
      is_first_edition: 'No',
      market_price: 14200,
      market_price_low: 13500,
      market_price_high: 15500
    },
    {
      id: 'poke_gengar_vmax_alt',
      name: 'Gengar VMAX Alternate Art #271/264',
      price: 4900,
      category: 'single',
      image_url: 'https://images.pokemontcg.io/swsh8/271_hires.png',
      description: 'Gengar VMAX tragándose edificios con su Gigamax. Arte alterno épico de Fusion Strike.',
      stock: 4,
      expansion: 'Fusion Strike',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Fusion Strike Booster Pack',
      card_condition: 'NM',
      game_type: 'POKEMON',
      subcategory: 'pokemon',
      is_first_edition: 'No',
      market_price: 4850,
      market_price_low: 4500,
      market_price_high: 5300
    },
    {
      id: 'poke_lugia_v_alt',
      name: 'Lugia V Alternate Art #186/195',
      price: 3800,
      category: 'single',
      image_url: 'https://images.pokemontcg.io/swsh12/186_hires.png',
      description: 'Lugia V surcando los mares de Silver Tempest. Ilustración de kawayoo, condición Near Mint.',
      stock: 3,
      expansion: 'Silver Tempest',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Silver Tempest Booster Pack',
      card_condition: 'NM',
      game_type: 'POKEMON',
      subcategory: 'pokemon',
      is_first_edition: 'No',
      market_price: 3750,
      market_price_low: 3400,
      market_price_high: 4100
    },
    {
      id: 'poke_mewtwo_vstar_gg',
      name: 'Mewtwo VSTAR Galarian Gallery #GG44/GG70',
      price: 1750,
      category: 'single',
      image_url: 'https://images.pokemontcg.io/swsh12pt5/GG44_hires.png',
      description: 'Mewtwo combatiendo a Charizard en el aire. Arte espectacular de Crown Zenith.',
      stock: 6,
      expansion: 'Crown Zenith',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Crown Zenith Booster Pack',
      card_condition: 'NM',
      game_type: 'POKEMON',
      subcategory: 'pokemon',
      is_first_edition: 'No',
      market_price: 1700,
      market_price_low: 1550,
      market_price_high: 1900
    },
    {
      id: 'poke_giratina_v_alt',
      name: 'Giratina V Alternate Art #186/196',
      price: 5600,
      category: 'single',
      image_url: 'https://images.pokemontcg.io/swsh11/186_hires.png',
      description: 'Giratina en el Mundo Distorsión. Arte hipercomplejo y psicodélico de Shinji Kanda en Lost Origin.',
      stock: 2,
      expansion: 'Lost Origin',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Lost Origin Booster Pack',
      card_condition: 'NM',
      game_type: 'POKEMON',
      subcategory: 'pokemon',
      is_first_edition: 'No',
      market_price: 5500,
      market_price_low: 5100,
      market_price_high: 6000
    },
    {
      id: 'poke_blastoise_151_sir',
      name: 'Blastoise ex SIR #200/165',
      price: 1250,
      category: 'single',
      image_url: 'https://images.pokemontcg.io/sv3pt5/200_hires.png',
      description: 'Blastoise nadando en las profundidades del océano. Especial Illustration Rare de 151.',
      stock: 7,
      expansion: 'Scarlet & Violet: 151',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Scarlet & Violet: 151 Booster Pack',
      card_condition: 'NM',
      game_type: 'POKEMON',
      subcategory: 'pokemon',
      is_first_edition: 'No',
      market_price: 1200,
      market_price_low: 1100,
      market_price_high: 1400
    },
    {
      id: 'poke_venusaur_151_sir',
      name: 'Venusaur ex SIR #198/165',
      price: 1100,
      category: 'single',
      image_url: 'https://images.pokemontcg.io/sv3pt5/198_hires.png',
      description: 'Venusaur ex en la selva tropical. Especial Illustration Rare de 151.',
      stock: 5,
      expansion: 'Scarlet & Violet: 151',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Scarlet & Violet: 151 Booster Pack',
      card_condition: 'NM',
      game_type: 'POKEMON',
      subcategory: 'pokemon',
      is_first_edition: 'No',
      market_price: 1050,
      market_price_low: 950,
      market_price_high: 1200
    },
    {
      id: 'poke_greninja_ex_sir',
      name: 'Greninja ex SIR #214/167',
      price: 4200,
      category: 'single',
      image_url: 'https://images.pokemontcg.io/sv6/214_hires.png',
      description: 'Greninja ex en técnica tradicional japonesa de tinta. Carta estrella de Twilight Masquerade.',
      stock: 3,
      expansion: 'Twilight Masquerade',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Twilight Masquerade Booster Pack',
      card_condition: 'NM',
      game_type: 'POKEMON',
      subcategory: 'pokemon',
      is_first_edition: 'No',
      market_price: 4100,
      market_price_low: 3800,
      market_price_high: 4500
    },
    {
      id: 'poke_magikarp_ir',
      name: 'Magikarp Illustration Rare #203/193',
      price: 2100,
      category: 'single',
      image_url: 'https://images.pokemontcg.io/sv2/203_hires.png',
      description: 'El viral e icónico Magikarp saltando la cascada. Una de las cartas más deseadas de Paldea Evolved.',
      stock: 5,
      expansion: 'Paldea Evolved',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Paldea Evolved Booster Pack',
      card_condition: 'NM',
      game_type: 'POKEMON',
      subcategory: 'pokemon',
      is_first_edition: 'No',
      market_price: 2050,
      market_price_low: 1900,
      market_price_high: 2300
    },
    {
      id: 'poke_iono_sir',
      name: 'Iono Special Illustration Rare #269/193',
      price: 1950,
      category: 'single',
      image_url: 'https://images.pokemontcg.io/sv2/269_hires.png',
      description: 'Iono (e-Nigma) streamer en vivo. Staple competitivo y grial de colección en Paldea Evolved.',
      stock: 4,
      expansion: 'Paldea Evolved',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Paldea Evolved Booster Pack',
      card_condition: 'NM',
      game_type: 'POKEMON',
      subcategory: 'pokemon',
      is_first_edition: 'No',
      market_price: 1900,
      market_price_low: 1750,
      market_price_high: 2150
    },
    {
      id: 'poke_arceus_vstar_gold',
      name: 'Arceus VSTAR Gold Secret #GG70/GG70',
      price: 1800,
      category: 'single',
      image_url: 'https://images.pokemontcg.io/swsh12pt5/GG70_hires.png',
      description: 'Arceus VSTAR Dorado creando el cosmos. El grial dorado de Crown Zenith.',
      stock: 4,
      expansion: 'Crown Zenith',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Crown Zenith Booster Pack',
      card_condition: 'NM',
      game_type: 'POKEMON',
      subcategory: 'pokemon',
      is_first_edition: 'No',
      market_price: 1750,
      market_price_low: 1600,
      market_price_high: 2000
    },
    {
      id: 'poke_lugia_neo_genesis_1st',
      name: 'Lugia Holo 1st Edition #9/111',
      price: 22000,
      category: 'single',
      image_url: 'https://images.pokemontcg.io/neo1/9_hires.png',
      description: 'El santo grial vintage de Neo Genesis. Primera edición auténtica de los 2000 con sello original 1st Edition.',
      stock: 1,
      expansion: 'Neo Genesis',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Neo Genesis 1st Edition Booster Pack',
      card_condition: 'NM',
      game_type: 'POKEMON',
      subcategory: 'pokemon',
      is_first_edition: 'Sí',
      market_price: 21500,
      market_price_low: 19500,
      market_price_high: 25000
    },
    {
      id: 'poke_sealed_twilight_bb',
      name: 'Caja de Sobres (Booster Box) Scarlet & Violet: Twilight Masquerade',
      price: 2899,
      category: 'booster_box',
      image_url: 'https://images.pokemoncenter.com/images/products/P9832/712-98696/712-98696_1.jpg',
      description: 'Contiene 36 sobres sellados de fábrica de Twilight Masquerade. ¡Busca las cartas de Greninja ex SIR!',
      stock: 12,
      expansion: 'Twilight Masquerade',
      game_type: 'POKEMON',
      subcategory: 'pokemon',
      is_promo: 1
    },
    {
      id: 'poke_sealed_151_etb',
      name: 'Elite Trainer Box (ETB) Pokémon 151',
      price: 1499,
      category: 'etb',
      image_url: 'https://images.pokemoncenter.com/images/products/P9411/712-98442/712-98442_1.jpg',
      description: 'Edición especial de colección. Incluye 9 sobres de Pokémon 151, 1 carta promo foil de Snorlax, dados y micas.',
      stock: 8,
      expansion: 'Pokémon 151',
      game_type: 'POKEMON',
      subcategory: 'pokemon',
      is_promo: 1
    },

    // --- YU-GI-OH! ---
    {
      id: 'ygo_blue_eyes_lob_1st',
      name: 'Blue-Eyes White Dragon 1st Edition #LOB-001',
      price: 24500,
      category: 'single',
      image_url: 'https://images.ygoprodeck.com/images/cards/89631139.jpg',
      description: 'El legendario Dragón Blanco de Ojos Azules del Legend of Blue Eyes White Dragon. Primera edición vintage original del 2002.',
      stock: 1,
      expansion: 'Legend of Blue Eyes White Dragon',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'LOB 1st Edition Booster Pack',
      card_condition: 'NM',
      game_type: 'YUGIOH',
      subcategory: 'yugioh',
      is_first_edition: 'Sí',
      market_price: 24000,
      market_price_low: 21000,
      market_price_high: 28000
    },
    {
      id: 'ygo_dark_magician_girl_ghost',
      name: 'Dark Magician Girl Ghost Rare #GFP2-EN177',
      price: 7800,
      category: 'single',
      image_url: 'https://images.ygoprodeck.com/images/cards/38033121.jpg',
      description: 'Chica Maga Oscura en rareza Ghost Rare tridimensional de Ghosts From the Past 2. Una de las cartas más codiciadas de Yu-Gi-Oh! moderno.',
      stock: 2,
      expansion: 'Ghosts From the Past: The 2nd Haunting',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Ghosts From the Past Booster Box',
      card_condition: 'NM',
      game_type: 'YUGIOH',
      subcategory: 'yugioh',
      is_first_edition: 'Sí',
      market_price: 7600,
      market_price_low: 7000,
      market_price_high: 8500
    },
    {
      id: 'ygo_ash_blossom_starlight',
      name: 'Ash Blossom & Joyous Spring Starlight Rare #ETCO-EN100',
      price: 11500,
      category: 'single',
      image_url: 'https://images.ygoprodeck.com/images/cards/14558127.jpg',
      description: 'La handtrap reina del juego competitivo en su rareza suprema Starlight Rare de Eternity Code. Condición Near Mint.',
      stock: 2,
      expansion: 'Eternity Code',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Eternity Code Booster Pack',
      card_condition: 'NM',
      game_type: 'YUGIOH',
      subcategory: 'yugioh',
      is_first_edition: 'Sí',
      market_price: 11200,
      market_price_low: 10500,
      market_price_high: 12500
    },
    {
      id: 'ygo_exodia_the_forbidden_one',
      name: 'Exodia the Forbidden One Ultra Rare #LOB-124',
      price: 3600,
      category: 'single',
      image_url: 'https://images.ygoprodeck.com/images/cards/33396948.jpg',
      description: 'La cabeza de Exodia, el Prohibido. La condición de victoria automática más legendaria del anime y el juego de cartas.',
      stock: 3,
      expansion: 'Legend of Blue Eyes White Dragon',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'LOB 25th Anniversary Booster',
      card_condition: 'NM',
      game_type: 'YUGIOH',
      subcategory: 'yugioh',
      is_first_edition: 'No',
      market_price: 3500,
      market_price_low: 3200,
      market_price_high: 4000
    },
    {
      id: 'ygo_slifer_prismatic_secret',
      name: 'Slifer the Sky Dragon Prismatic Secret #TN19-EN012',
      price: 1950,
      category: 'single',
      image_url: 'https://images.ygoprodeck.com/images/cards/10000020.jpg',
      description: 'Dios Egipcio Slifer el Dragón del Cielo con arte alternativo de Kazuki Takahashi en Prismatic Secret Rare.',
      stock: 4,
      expansion: '2019 Gold Sarcophagus Tin',
      is_promo: 1,
      region: 'Inglés (USA)',
      pulled_from: 'Gold Sarcophagus Tin Promo Pack',
      card_condition: 'NM',
      game_type: 'YUGIOH',
      subcategory: 'yugioh',
      is_first_edition: 'No',
      market_price: 1900,
      market_price_low: 1700,
      market_price_high: 2200
    },
    {
      id: 'ygo_red_eyes_black_dragon',
      name: 'Red-Eyes Black Dragon Ultra Rare #LOB-070',
      price: 4200,
      category: 'single',
      image_url: 'https://images.ygoprodeck.com/images/cards/74677422.jpg',
      description: 'El legendario Dragón Negro de Ojos Rojos de Joey Wheeler. Ilustración clásica original del set LOB.',
      stock: 2,
      expansion: 'Legend of Blue Eyes White Dragon',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'LOB Booster Pack',
      card_condition: 'NM',
      game_type: 'YUGIOH',
      subcategory: 'yugioh',
      is_first_edition: 'No',
      market_price: 4100,
      market_price_low: 3800,
      market_price_high: 4600
    },

    // --- MAGIC: THE GATHERING ---
    {
      id: 'mtg_the_one_ring_borderless_foil',
      name: 'The One Ring (El Anillo Único) Borderless Foil #0451',
      price: 8900,
      category: 'single',
      image_url: 'https://cards.scryfall.io/large/front/d/e/de225645-1988-4217-a065-27a31b64cf27.jpg',
      description: 'The One Ring en acabado Borderless Foil de The Lord of the Rings: Tales of Middle-earth. Carta reina de Modern y Commander.',
      stock: 2,
      expansion: 'The Lord of the Rings: Tales of Middle-earth',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Collector Booster Box',
      card_condition: 'NM',
      game_type: 'MAGIC',
      subcategory: 'magic',
      is_first_edition: 'No',
      market_price: 8700,
      market_price_low: 8200,
      market_price_high: 9500
    },
    {
      id: 'mtg_black_lotus_ce',
      name: 'Black Lotus (Collector\'s Edition Vintage)',
      price: 68000,
      category: 'single',
      image_url: 'https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg',
      description: 'El artefacto más famoso de la historia de los juegos de cartas. Power Nine oficial con bordes dorados de Collector\'s Edition.',
      stock: 1,
      expansion: 'Collector\'s Edition',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Collector\'s Edition Box Set (1993)',
      card_condition: 'NM',
      game_type: 'MAGIC',
      subcategory: 'magic',
      is_first_edition: 'Sí',
      market_price: 65000,
      market_price_low: 60000,
      market_price_high: 75000
    },
    {
      id: 'mtg_mana_crypt_special_guests',
      name: 'Mana Crypt Borderless Foil #SPG-0017',
      price: 5200,
      category: 'single',
      image_url: 'https://cards.scryfall.io/large/front/4/d/4d9a265d-503d-426c-9457-432e6ba70b04.jpg',
      description: 'Mana Crypt de la serie Special Guests con arte alternativo de Lost Caverns of Ixalan. Aceleración inigualable para Commander.',
      stock: 3,
      expansion: 'Lost Caverns of Ixalan',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Collector Booster Pack',
      card_condition: 'NM',
      game_type: 'MAGIC',
      subcategory: 'magic',
      is_first_edition: 'No',
      market_price: 5100,
      market_price_low: 4700,
      market_price_high: 5800
    },
    {
      id: 'mtg_ragavan_nimble_pilferer',
      name: 'Ragavan, Nimble Pilferer Borderless Foil #MH2-358',
      price: 1650,
      category: 'single',
      image_url: 'https://cards.scryfall.io/large/front/a/9/a9738cda-adb1-47fb-9f4c-ecd930228c4d.jpg',
      description: 'El mono más temido del formato Modern. Drop de 1 maná rojo capaz de generar tesoros y exiliar cartas del oponente.',
      stock: 4,
      expansion: 'Modern Horizons 2',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Modern Horizons 2 Booster Pack',
      card_condition: 'NM',
      game_type: 'MAGIC',
      subcategory: 'magic',
      is_first_edition: 'No',
      market_price: 1600,
      market_price_low: 1450,
      market_price_high: 1800
    },
    {
      id: 'mtg_force_of_will_borderless',
      name: 'Force of Will Borderless Foil #DMR-405',
      price: 2400,
      category: 'single',
      image_url: 'https://cards.scryfall.io/large/front/8/9/89f612d6-7c59-4a7b-a87d-45f789e88ba5.jpg',
      description: 'El contrahechizo libre por excelencia de Magic en arte sin bordes de Dominaria Remastered.',
      stock: 3,
      expansion: 'Dominaria Remastered',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Dominaria Remastered Collector Pack',
      card_condition: 'NM',
      game_type: 'MAGIC',
      subcategory: 'magic',
      is_first_edition: 'No',
      market_price: 2350,
      market_price_low: 2100,
      market_price_high: 2700
    },

    // --- ONE PIECE CARD GAME ---
    {
      id: 'op_monkey_d_luffy_manga_alt',
      name: 'Monkey D. Luffy Manga Alternate Art #OP05-119',
      price: 36000,
      category: 'single',
      image_url: 'https://images.ygoprodeck.com/images/cards/89631139.jpg',
      description: 'La carta Manga Secreta de Luffy Gear 5 en Awakening of the New Era (OP-05). La carta más cotizada del juego de One Piece.',
      stock: 1,
      expansion: 'Awakening of the New Era (OP-05)',
      is_promo: 0,
      region: 'Japonés / Inglés',
      pulled_from: 'OP-05 Booster Pack',
      card_condition: 'NM',
      game_type: 'ONE_PIECE',
      subcategory: 'onepiece',
      is_first_edition: 'No',
      market_price: 35000,
      market_price_low: 32000,
      market_price_high: 40000
    },
    {
      id: 'op_roronoa_zoro_manga_alt',
      name: 'Roronoa Zoro Manga Alternate Art #OP06-118',
      price: 21500,
      category: 'single',
      image_url: 'https://images.pokemontcg.io/swsh7/218_hires.png',
      description: 'Zoro estilo viñeta de manga original de Eiichiro Oda en Wings of the Captain (OP-06). Centrado y esquinas impecables.',
      stock: 1,
      expansion: 'Wings of the Captain (OP-06)',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'OP-06 Booster Pack',
      card_condition: 'NM',
      game_type: 'ONE_PIECE',
      subcategory: 'onepiece',
      is_first_edition: 'No',
      market_price: 21000,
      market_price_low: 19500,
      market_price_high: 23500
    },
    {
      id: 'op_shanks_manga_alt',
      name: 'Shanks Manga Alternate Art #OP01-120',
      price: 18900,
      category: 'single',
      image_url: 'https://images.pokemontcg.io/swsh11/186_hires.png',
      description: 'La primera carta Manga de la historia de One Piece TCG en Romance Dawn (OP-01). El grial original de la serie.',
      stock: 2,
      expansion: 'Romance Dawn (OP-01)',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Romance Dawn Booster Pack',
      card_condition: 'NM',
      game_type: 'ONE_PIECE',
      subcategory: 'onepiece',
      is_first_edition: 'No',
      market_price: 18500,
      market_price_low: 17000,
      market_price_high: 21000
    },
    {
      id: 'op_portgas_d_ace_manga_alt',
      name: 'Portgas D. Ace Manga Alternate Art #OP02-013',
      price: 15400,
      category: 'single',
      image_url: 'https://images.pokemontcg.io/sv3pt5/199_hires.png',
      description: 'Ace Puño de Fuego en estilo manga de Paramount War (OP-02). Condición Near Mint.',
      stock: 2,
      expansion: 'Paramount War (OP-02)',
      is_promo: 0,
      region: 'Inglés (USA)',
      pulled_from: 'Paramount War Booster Pack',
      card_condition: 'NM',
      game_type: 'ONE_PIECE',
      subcategory: 'onepiece',
      is_first_edition: 'No',
      market_price: 15000,
      market_price_low: 14000,
      market_price_high: 17000
    },
    {
      id: 'op_sealed_op05_booster_box',
      name: 'Caja de Sobres (Booster Box) One Piece OP-05 Awakening of the New Era',
      price: 3450,
      category: 'booster_box',
      image_url: 'https://images.pokemoncenter.com/images/products/P9832/712-98696/712-98696_1.jpg',
      description: 'Caja sellada con 24 sobres de la aclamada expansión OP-05 con la oportunidad de obtener el Luffy Gear 5 Manga.',
      stock: 8,
      expansion: 'Awakening of the New Era (OP-05)',
      game_type: 'ONE_PIECE',
      subcategory: 'onepiece',
      is_promo: 1
    },

    // --- VIDEOJUEGOS ---
    {
      id: 'vg_switch_oled_pokemon',
      name: 'Consola Nintendo Switch OLED - Edición Especial Pokémon Escarlata y Púrpura',
      price: 6499,
      category: 'videogame',
      image_url: 'https://images.pokemoncenter.com/images/products/P9411/712-98442/712-98442_1.jpg',
      description: 'Consola Nintendo Switch OLED con pantalla de 7 pulgadas en perfecto estado. Incluye Joy-Con edición temática y dock oficial.',
      stock: 2,
      platform: 'Nintendo Switch',
      completeness: 'Completo con Accesorios',
      game_type: 'POKEMON',
      subcategory: 'switch'
    },
    {
      id: 'vg_pokemon_scarlet',
      name: 'Pokémon Escarlata (Nintendo Switch Físico)',
      price: 1199,
      category: 'videogame',
      image_url: 'https://images.pokemoncenter.com/images/products/P8895/710-95880/710-95880_1.jpg',
      description: 'Juego físico original para Nintendo Switch. Explora la región de Paldea en un mundo abierto sin límites. Caja y cartucho CIB.',
      stock: 4,
      platform: 'Nintendo Switch',
      completeness: 'CIB (Completo en Caja)',
      game_type: 'POKEMON',
      subcategory: 'switch'
    },

    // --- ACCESORIOS ---
    {
      id: 'acc_sleeves_pokevault',
      name: 'Micas Protectoras PokéVault Standard Matte (65 piezas)',
      price: 149,
      category: 'accessory',
      image_url: 'https://images.pokemoncenter.com/images/products/P9159/712-97066/712-97066_1.jpg',
      description: 'Micas protectoras de calidad de torneo para cartas de tamaño estándar. Textura mate antideslizante con diseño oficial PokéVault.',
      stock: 50,
      subcategory: 'sleeves'
    },
    {
      id: 'acc_binder_9pocket',
      name: 'Carpeta de Colección PokéVault (9 Bolsillos, 360 Cartas)',
      price: 399,
      category: 'accessory',
      image_url: 'https://images.pokemoncenter.com/images/products/P9159/712-97069/712-97069_1.jpg',
      description: 'Carpeta con bolsillos de carga lateral y cierre elástico. Ideal para mantener protegidas tus cartas más valiosas.',
      stock: 25,
      subcategory: 'binders'
    }
  ];

  for (const p of products) {
    const existing = await get('SELECT id FROM products WHERE id = ?', [p.id]);
    if (!existing) {
      await run(`
        INSERT INTO products (
          id, name, price, category, image_url, description, stock, expansion, 
          is_promo, region, pulled_from, card_condition, game_type, subcategory, is_first_edition, 
          market_price, market_price_low, market_price_high, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        p.id, p.name, p.price, p.category, p.image_url, p.description, p.stock, p.expansion || '',
        p.is_promo || 0, p.region || '', p.pulled_from || '', p.card_condition || '', p.game_type || 'POKEMON', 
        p.subcategory || '', p.is_first_edition || 'No',
        p.market_price || p.price, p.market_price_low || (p.price * 0.9), p.market_price_high || (p.price * 1.1)
      ]);
      console.log(`🃏 Producto creado [${p.game_type || 'GENERAL'} / ${p.subcategory}]: ${p.name}`);
    } else {
      await run(`
        UPDATE products SET 
          price = ?, stock = ?, image_url = ?, category = ?, is_first_edition = ?, game_type = ?, subcategory = ?
        WHERE id = ?
      `, [p.price, p.stock, p.image_url, p.category, p.is_first_edition || 'No', p.game_type || 'POKEMON', p.subcategory || '', p.id]);
      console.log(`🔄 Producto actualizado: ${p.name}`);
    }
  }

  // Normalizar cualquier producto viejo que tuviera 'Cartas Sueltas' o similar
  await run(`UPDATE products SET category = 'single' WHERE category = 'Cartas Sueltas' OR category = 'Single'`);
  await run(`UPDATE products SET subcategory = 'pokemon' WHERE (game_type = 'POKEMON' OR game_type IS NULL) AND (subcategory IS NULL OR subcategory = '')`);

  // Comprobar totales finales en la base de datos
  const totalOrders = await get('SELECT COUNT(*) as count, SUM(total) as revenue FROM orders WHERE status IN ("PAGADO", "ENVIADO", "ENTREGADO")');
  const countProducts = await get('SELECT COUNT(*) as count FROM products');
  const gamesCount = await query('SELECT game_type, COUNT(*) as count FROM products GROUP BY game_type');
  
  console.log('\n=============================================');
  console.log('✅ SEEDING MULTI-TCG COMPLETADO');
  console.log(`Total de Productos en Catálogo: ${countProducts.count}`);
  console.log('Desglose por Juego:');
  gamesCount.forEach(g => console.log(`  - ${g.game_type || 'SIN_JUEGO'}: ${g.count} productos`));
  console.log(`Total de Órdenes Válidas: ${totalOrders.count}`);
  console.log(`Ingresos Reales Registrados: $${Number(totalOrders.revenue).toLocaleString('es-MX')} MXN`);
  console.log('=============================================\n');

  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Error en seeding:', err);
  process.exit(1);
});
