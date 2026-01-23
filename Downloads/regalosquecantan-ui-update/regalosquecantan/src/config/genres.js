// Complete Genre Configuration for RegalosQueCantan
// Each genre has detailed prompts optimized for Kie.ai music generation

export const genres = {
  // ==========================================
  // REGIONAL MEXICANO
  // ==========================================
  
  corrido: {
    name: "Corrido",
    emoji: "🎺",
    description: "Historias épicas con acordeón y bajo sexto",
    basePrompt: "traditional Mexican corrido, norteño ensemble, accordion lead melody, bajo sexto rhythm guitar, polka-influenced beat, storytelling ballad structure, 95-110 BPM, male baritone vocals, narrative style, regional Mexican folk, NO electronic elements, NO synthesizers",
    subGenres: {
      tradicional: {
        name: "Tradicional",
        prompt: "classic Mexican corrido, Los Tigres del Norte style, accordion and bajo sexto, polka rhythm, storytelling narrative, 100 BPM, male vocals, raw authentic recording, regional Mexican, brass accents, NO modern production"
      },
      tumbado: {
        name: "Tumbado",
        prompt: "corrido tumbado, trap-influenced Mexican corrido, 808 bass, hi-hats, requinto guitar, slow tempo 75-85 BPM, Peso Pluma style, melancholic minor key, modern urban Mexican, laid-back flow, reverb vocals, tuba bass drops"
      },
      alterado: {
        name: "Alterado",
        prompt: "corrido alterado, aggressive norteño, fast accordion runs, intense bajo sexto, 120+ BPM, Movimiento Alterado style, raw energy, powerful male vocals, heavy brass, narco corrido intensity, NO pop elements"
      },
      romantico: {
        name: "Romántico",
        prompt: "corrido romántico, romantic storytelling ballad, gentle accordion, soft bajo sexto, 90-100 BPM, emotional male vocals, love story narrative, Los Tucanes style romance, tender Mexican folk"
      }
    }
  },

  norteno: {
    name: "Norteño",
    emoji: "🪗",
    description: "Acordeón y bajo sexto tradicional",
    basePrompt: "norteño music, accordion lead, bajo sexto guitar, polka rhythm, tololoche bass, drums, 110-130 BPM, Tex-Mex influence, conjunto style, male vocals, regional Mexican, NO electronic beats, NO synthesizers",
    subGenres: {
      tradicional: {
        name: "Tradicional",
        prompt: "traditional norteño, Ramon Ayala style, dominant accordion melody, bajo sexto accompaniment, simple polka beat, tololoche bass, 115 BPM, raw recording, cantina atmosphere, authentic conjunto, male rough vocals"
      },
      moderno: {
        name: "Moderno",
        prompt: "modern norteño, Intocable style, polished production, accordion and bajo sexto, full drum kit, electric bass, 120 BPM, romantic lyrics, clear male vocals, radio-friendly norteño, slight reverb"
      },
      sax: {
        name: "Norteño-Sax",
        prompt: "norteño with saxophone, norteño-sax fusion, saxophone melody alongside accordion, bajo sexto, cumbia-influenced rhythm, 118 BPM, party atmosphere, Grupo Firme energy, danceable"
      },
      progresivo: {
        name: "Progresivo",
        prompt: "progressive norteño, Los Tigres del Norte influence, accordion virtuosity, complex arrangements, storytelling lyrics, 105 BPM, full band sound, brass section, professional studio production"
      }
    }
  },

  banda: {
    name: "Banda Sinaloense",
    emoji: "🎺",
    description: "Música de viento poderosa",
    basePrompt: "banda sinaloense, full brass band, tubas, clarinets, trumpets, trombones, tambora drum, tarola snare, powerful sound, 100-130 BPM, Sinaloa style, NO accordion, NO guitars, pure brass band",
    subGenres: {
      romantica: {
        name: "Romántica",
        prompt: "romantic banda, Banda MS style, lush brass arrangements, emotional clarinet melodies, powerful trumpet lines, 95-105 BPM, passionate male vocals, ballad structure, sweeping tuba bass, cinematic brass swells"
      },
      quebradita: {
        name: "Quebradita",
        prompt: "quebradita banda, fast tempo 140+ BPM, energetic brass, driving tambora beat, dance rhythm, party banda, Banda El Recodo energy, athletic dance music, powerful and fast"
      },
      ranchera: {
        name: "Banda Ranchera",
        prompt: "banda ranchera, traditional Mexican themes, brass ensemble playing ranchera style, mariachi influence with banda instruments, 100 BPM, emotional delivery, Jenni Rivera style passion"
      },
      popular: {
        name: "Popular/Fiesta",
        prompt: "popular banda, party atmosphere, catchy brass hooks, singalong choruses, 115-125 BPM, Banda Cuisillos style, celebratory mood, wedding/quinceañera music, danceable grooves"
      }
    }
  },

  ranchera: {
    name: "Ranchera",
    emoji: "🎻",
    description: "Mariachi clásico mexicano",
    basePrompt: "Mexican ranchera, full mariachi ensemble, violin section, trumpet fanfares, vihuela strumming, guitarrón bass, classical guitar, 85-110 BPM, passionate vocals, Mexican folk tradition, grito shouts, NO accordion, NO electronic elements",
    subGenres: {
      brava: {
        name: "Brava/Alegre",
        prompt: "ranchera brava, uptempo mariachi, triumphant trumpet calls, energetic violin runs, 115-125 BPM, powerful male vocals, Vicente Fernandez style bravado, major key celebration, gritos, fiesta energy, guitarrón driving bass"
      },
      romantica: {
        name: "Romántica",
        prompt: "romantic ranchera, slow mariachi ballad, weeping violins, tender trumpet, 70-85 BPM, emotional male vocals, Pedro Infante style romance, heartfelt delivery, soft vihuela, intimate and passionate"
      },
      huapango: {
        name: "Huapango",
        prompt: "huapango ranchero, fast 6/8 rhythm, violin virtuosity, falsetto vocals, 140+ BPM, Huasteca style, rapid guitar strumming, technical mariachi, traditional Mexican huapango"
      },
      lenta: {
        name: "Lenta/Triste",
        prompt: "slow ranchera, sorrowful mariachi, minor key melancholy, crying trumpets, 60-75 BPM, José Alfredo Jiménez style pain, dramatic pauses, emotional suffering, tearful vocals, tragic love"
      }
    }
  },

  sierreno: {
    name: "Sierreño",
    emoji: "🏔️",
    description: "Acústico de la sierra",
    basePrompt: "sierreño music, acoustic Mexican folk, tuba bass, guitar, requinto, minimal production, mountain folk style, 90-110 BPM, raw authentic sound, El Fantasma style, unplugged regional Mexican",
    subGenres: {
      tradicional: {
        name: "Tradicional",
        prompt: "traditional sierreño, acoustic guitar and requinto, tuba bass, minimal drums, 100 BPM, raw mountain folk, El Fantasma style, honest vocals, rustic recording, campfire atmosphere, NO production tricks"
      },
      moderno: {
        name: "Moderno",
        prompt: "modern sierreño, Carin León style, acoustic base with light production, tuba and guitar, 105 BPM, emotional male vocals, contemporary lyrics, polished but authentic, radio-friendly acoustic"
      },
      romantico: {
        name: "Romántico",
        prompt: "romantic sierreño, love ballad acoustic style, gentle requinto picking, soft tuba, 85 BPM, tender vocals, intimate atmosphere, Christian Nodal acoustic vibes, heartfelt and simple"
      }
    }
  },

  mariachi: {
    name: "Mariachi",
    emoji: "🎺",
    description: "Mariachi tradicional instrumental",
    basePrompt: "traditional mariachi, violin section melody, trumpet harmonies, vihuela rhythm, guitarrón bass, Mexican son style, 100-120 BPM, formal mariachi arrangement, NO modern elements, Mariachi Vargas quality",
    subGenres: {
      tradicional: {
        name: "Tradicional",
        prompt: "classic mariachi, Mariachi Vargas de Tecalitlán style, pristine violin section, bright trumpets, perfect vihuela strumming, 110 BPM, formal arrangement, Mexican son jarocho influence, professional ensemble"
      },
      moderno: {
        name: "Moderno",
        prompt: "modern mariachi, contemporary arrangements, full mariachi with slight pop influence, 105 BPM, radio-friendly production, Aida Cuevas style, classical mariachi with modern clarity"
      },
      son: {
        name: "Son Jalisciense",
        prompt: "son jalisciense, traditional Jalisco style, rapid violin passages, trumpet calls, complex vihuela patterns, 130+ BPM, virtuoso mariachi, traditional Mexican son, zapateado rhythm"
      }
    }
  },

  // ==========================================
  // TROPICAL / CARIBBEAN
  // ==========================================

  cumbia: {
    name: "Cumbia",
    emoji: "💃",
    description: "Ritmo tropical bailable",
    basePrompt: "cumbia rhythm, syncopated beat, güiro scraping, congas, bass guitar, 90-110 BPM, danceable Latin groove, Colombian/Mexican cumbia, tropical party music",
    subGenres: {
      sonidera: {
        name: "Sonidera (Mexicana)",
        prompt: "cumbia sonidera, Mexican cumbia, synthesizer leads, heavy bass, güiro, 100 BPM, Sonido La Changa style, urban Mexican cumbia, sound system culture, rebajada slow-pitch effect possible"
      },
      colombiana: {
        name: "Colombiana",
        prompt: "Colombian cumbia, traditional accordion cumbia, gaita flutes, llamador drum, alegre drum, maracas, 95 BPM, Lucho Bermúdez style, authentic Caribbean coast sound, NO synthesizers"
      },
      texana: {
        name: "Texana",
        prompt: "Tejano cumbia, Selena style, keyboard-driven cumbia, tight rhythm section, 105 BPM, polished Tex-Mex production, singalong chorus, romantic cumbia, radio-friendly"
      },
      villera: {
        name: "Villera (Argentina)",
        prompt: "cumbia villera, Argentine cumbia, simple keyboard riffs, basic beat, 100 BPM, working-class party music, Damas Gratis style, raw and direct, barrio atmosphere"
      },
      norteña: {
        name: "Cumbia Norteña",
        prompt: "cumbia norteña, accordion-driven cumbia, norteño fusion, bajo sexto, 108 BPM, Celso Piña style, Colombian-Mexican fusion, rebajada influence, danceable"
      }
    }
  },

  salsa: {
    name: "Salsa",
    emoji: "🎹",
    description: "Ritmo caribeño con sabor",
    basePrompt: "salsa music, piano montuno, congas, timbales, bongos, brass section, Cuban son influence, 180-220 BPM, New York/Puerto Rico salsa, call and response, NO rock elements",
    subGenres: {
      dura: {
        name: "Dura/Clásica",
        prompt: "salsa dura, Fania All-Stars style, aggressive piano montuno, powerful brass, hard-hitting timbales, 200 BPM, Héctor Lavoe energy, New York salsa brava, raw and powerful"
      },
      romantica: {
        name: "Romántica",
        prompt: "salsa romántica, smooth romantic salsa, lush piano, soft brass, 175 BPM, Gilberto Santa Rosa style, love ballad salsa, sweet vocals, romantic arrangement, radio-friendly"
      },
      cubana: {
        name: "Cubana/Timba",
        prompt: "Cuban timba, complex rhythms, heavy bass tumbaos, aggressive piano, 190 BPM, Los Van Van style, modern Cuban salsa, sophisticated arrangements, call and response"
      },
      choke: {
        name: "Salsa Choke",
        prompt: "salsa choke, Colombian Pacific coast style, urban salsa, hip-hop influence, 170 BPM, Cali Colombia sound, street salsa, modern party music"
      }
    }
  },

  bachata: {
    name: "Bachata",
    emoji: "🌹",
    description: "Romántica dominicana",
    basePrompt: "bachata music, requinto guitar lead, rhythm guitar, bongos, bass, güira, 130-140 BPM, Dominican romantic style, sensual rhythm, heartbreak lyrics",
    subGenres: {
      tradicional: {
        name: "Tradicional",
        prompt: "traditional bachata, acoustic guitars, bongos, maracas, 125 BPM, Anthony Santos style, raw Dominican bachata, amargue heartbreak, simple production, cantina atmosphere"
      },
      moderna: {
        name: "Moderna",
        prompt: "modern bachata, Romeo Santos style, polished production, electric guitar effects, R&B influence, 130 BPM, sensual smooth bachata, pop crossover appeal, romantic and urban"
      },
      sensual: {
        name: "Sensual",
        prompt: "bachata sensual, slow tempo 120 BPM, heavy reverb guitar, intimate atmosphere, Prince Royce style, bedroom bachata, smooth and seductive, modern production"
      },
      urbana: {
        name: "Urbana",
        prompt: "urban bachata, bachata with reggaeton influence, 808 bass additions, 135 BPM, crossover appeal, Manuel Turizo style, Latin urban bachata fusion"
      }
    }
  },

  merengue: {
    name: "Merengue",
    emoji: "🥁",
    description: "Ritmo dominicano rápido",
    basePrompt: "Dominican merengue, tambora drum, güira scraping, accordion or saxophone, bass, 160-180 BPM, fast 2/4 rhythm, high energy dance music, party atmosphere",
    subGenres: {
      tipico: {
        name: "Típico",
        prompt: "merengue típico, accordion lead, tambora and güira, 170 BPM, traditional Cibao style, raw authentic merengue, Tatico Henríquez influence, rural Dominican sound"
      },
      urbano: {
        name: "Urbano/Mambo",
        prompt: "merengue mambo, Proyecto Uno style, hip-hop influenced merengue, 165 BPM, urban production, synthesizers, party merengue, 90s New York Dominican sound"
      },
      orquesta: {
        name: "De Orquesta",
        prompt: "merengue de orquesta, full horn section, piano, 175 BPM, Juan Luis Guerra style, sophisticated arrangements, big band merengue, professional production"
      },
      electronico: {
        name: "Electrónico",
        prompt: "electronic merengue, EDM influenced, synthesizer leads, 170 BPM, modern club merengue, Omega style, merengue electronico, festival energy"
      }
    }
  },

  vallenato: {
    name: "Vallenato",
    emoji: "🪗",
    description: "Folclor colombiano del Caribe",
    basePrompt: "Colombian vallenato, accordion lead, caja drum, guacharaca scraper, bass, 120-140 BPM, Caribbean Colombia folk, romantic storytelling, Carlos Vives influence",
    subGenres: {
      tradicional: {
        name: "Tradicional",
        prompt: "traditional vallenato, accordion virtuosity, caja vallenata drum, guacharaca, 125 BPM, Diomedes Díaz style, pure Colombian folk, four-air rhythms (paseo, merengue, son, puya), storytelling"
      },
      romantico: {
        name: "Romántico",
        prompt: "romantic vallenato, love ballad style, gentle accordion, 115 BPM, Silvestre Dangond style, emotional delivery, modern production, radio-friendly Colombian romantic"
      },
      nueva_ola: {
        name: "Nueva Ola",
        prompt: "vallenato nueva ola, Carlos Vives style, pop-rock fusion with vallenato, full band, 130 BPM, crossover appeal, modern Colombian sound, international production"
      }
    }
  },

  // ==========================================
  // URBANO / MODERN
  // ==========================================

  reggaeton: {
    name: "Reggaeton",
    emoji: "🔥",
    description: "Urbano latino con dembow",
    basePrompt: "reggaeton, dembow rhythm, 808 bass, hi-hats, synthesizers, 90-100 BPM, Latin urban, perreo beat, Puerto Rican influence, club music",
    subGenres: {
      clasico: {
        name: "Clásico",
        prompt: "classic reggaeton, Daddy Yankee style, hard dembow beat, aggressive 808s, 95 BPM, 2000s reggaeton, raw perreo, Puerto Rican underground influence, Luny Tunes production style"
      },
      romantico: {
        name: "Romántico",
        prompt: "romantic reggaeton, soft dembow, R&B influence, 90 BPM, Romeo Santos crossover style, sensual and smooth, love song reggaeton, radio-friendly"
      },
      perreo: {
        name: "Perreo Intenso",
        prompt: "perreo intenso, aggressive dembow, heavy 808 bass, 98 BPM, club banger, Bad Bunny energy, intense party reggaeton, dance floor focused"
      },
      chill: {
        name: "Chill/Sad",
        prompt: "chill reggaeton, melancholic dembow, minor key, 88 BPM, sad boy aesthetic, Bad Bunny Un Verano Sin Ti vibes, emotional urban, introspective lyrics"
      }
    }
  },

  latin_trap: {
    name: "Latin Trap",
    emoji: "💀",
    description: "Trap en español",
    basePrompt: "Latin trap, heavy 808s, dark melodies, hi-hat rolls, 70-80 BPM half-time feel, Auto-Tune vocals, minor keys, atmospheric pads, street lyrics",
    subGenres: {
      duro: {
        name: "Duro/Calle",
        prompt: "hard Latin trap, aggressive 808s, distorted bass, 75 BPM, Anuel AA style, street trap, raw lyrics, dark atmosphere, heavy auto-tune, gun sounds optional"
      },
      melodico: {
        name: "Melódico",
        prompt: "melodic Latin trap, emotional melodies, soft 808s, 78 BPM, Rauw Alejandro style, singing trap, romantic themes, polished production, sad vibes"
      },
      drill: {
        name: "Latin Drill",
        prompt: "Latin drill, UK drill influence, sliding 808s, dark piano, 140 BPM, aggressive flow, minor key, menacing atmosphere, Spanish drill"
      }
    }
  },

  pop_latino: {
    name: "Pop Latino",
    emoji: "⭐",
    description: "Pop moderno en español",
    basePrompt: "Latin pop, modern production, polished vocals, full arrangement, 100-120 BPM, radio-friendly, Spanish language pop, Shakira/Enrique Iglesias influence",
    subGenres: {
      bailable: {
        name: "Bailable",
        prompt: "uptempo Latin pop, danceable pop, electronic elements, 118 BPM, Shakira style, catchy hooks, summer hit vibes, mainstream Latin pop, festival energy"
      },
      balada: {
        name: "Balada Pop",
        prompt: "Latin pop ballad, emotional piano, strings, 75 BPM, Luis Miguel style, romantic power ballad, big chorus, sweeping production, heartfelt vocals"
      },
      urbano: {
        name: "Pop Urbano",
        prompt: "urban pop Latino, pop with reggaeton elements, light dembow, 95 BPM, crossover appeal, J Balvin style, radio-friendly urban pop"
      },
      alternativo: {
        name: "Alternativo",
        prompt: "alternative Latin pop, indie influence, unique production, 105 BPM, Natalia Lafourcade style, artistic pop, Mexican indie pop, creative arrangements"
      }
    }
  },

  // ==========================================
  // BALADAS / ROMANTIC
  // ==========================================

  balada: {
    name: "Balada",
    emoji: "💝",
    description: "Balada romántica clásica",
    basePrompt: "Spanish ballad, romantic, piano-driven, string orchestra, emotional vocals, 65-80 BPM, Latin romantic tradition, power ballad structure, heartfelt delivery",
    subGenres: {
      clasica: {
        name: "Clásica",
        prompt: "classic Spanish ballad, grand piano, full orchestra, 70 BPM, José José style, dramatic crescendos, powerful tenor vocals, 70s-80s Mexican ballad, emotional peaks"
      },
      pop: {
        name: "Pop Ballad",
        prompt: "Latin pop ballad, modern production, acoustic guitar and piano, 75 BPM, Luis Fonsi style, radio-friendly romantic, contemporary arrangement, clear vocals"
      },
      ranchera: {
        name: "Balada Ranchera",
        prompt: "ranchera ballad, mariachi backing slow ballad, 65 BPM, Juan Gabriel style, theatrical delivery, violin swells, emotional Mexican ballad, dramatic performance"
      },
      acustica: {
        name: "Acústica",
        prompt: "acoustic ballad, intimate guitar, minimal production, 70 BPM, singer-songwriter style, Pablo Alborán influence, stripped-down romantic, honest and raw"
      }
    }
  },

  bolero: {
    name: "Bolero",
    emoji: "🌙",
    description: "Romántico clásico cubano",
    basePrompt: "Cuban bolero, romantic ballad, guitar trio, soft percussion, bass, 70-90 BPM, classic Latin romance, Trio Los Panchos influence, intimate nightclub atmosphere",
    subGenres: {
      tradicional: {
        name: "Tradicional",
        prompt: "traditional bolero, guitar trio, requinto lead, soft bongos, 75 BPM, Trio Los Panchos style, 1950s romance, intimate and tender, acoustic warmth, NO modern production"
      },
      moderno: {
        name: "Moderno",
        prompt: "modern bolero, Luis Miguel Romances style, full orchestra, 80 BPM, cinematic production, lush strings, classic songs reimagined, sophisticated arrangement"
      },
      feeling: {
        name: "Bolero Feeling",
        prompt: "bolero feeling, jazz-influenced bolero, piano and bass, 85 BPM, Nat King Cole en español style, sophisticated harmony, smooth crooner vocals, intimate club"
      }
    }
  },

  // ==========================================
  // TRADITIONAL / FOLK
  // ==========================================

  grupera: {
    name: "Grupera",
    emoji: "🎤",
    description: "Pop mexicano de los 80s-90s",
    basePrompt: "grupera music, Mexican group pop, keyboards, drums, bass, guitar, 110-130 BPM, Los Bukis influence, romantic pop mexicano, 80s-90s Mexican sound",
    subGenres: {
      romantica: {
        name: "Romántica",
        prompt: "romantic grupera, Los Bukis style, synthesizer pads, emotional male vocals, 105 BPM, power ballad grupera, dramatic chorus, Mexican romantic pop, radio hits"
      },
      bailable: {
        name: "Bailable",
        prompt: "danceable grupera, uptempo Mexican pop, Bronco style, 125 BPM, party grupera, catchy hooks, wedding music, celebration songs, full band energy"
      },
      tropical: {
        name: "Tropical",
        prompt: "tropical grupera, Los Caminantes style, cumbia-influenced grupera, 115 BPM, keyboard leads, danceable rhythm, Mexican tropical pop"
      }
    }
  },

  tejano: {
    name: "Tejano",
    emoji: "⛰️",
    description: "Tex-Mex de Texas",
    basePrompt: "Tejano music, Tex-Mex sound, accordion and keyboards, polished production, 110-130 BPM, Texas Mexican American style, Selena influence, bilingual possible",
    subGenres: {
      cumbia: {
        name: "Cumbia Tejana",
        prompt: "Tejano cumbia, Selena style, tight keyboard cumbia, polished drums and bass, 108 BPM, danceable Tex-Mex, romantic lyrics, radio-ready production, singalong chorus"
      },
      country: {
        name: "Tejano Country",
        prompt: "Tejano country, Little Joe style, country-western influence with Mexican elements, 100 BPM, bilingual possible, accordion and steel guitar, Tex-Mex country fusion"
      },
      ranchera: {
        name: "Ranchera Tejana",
        prompt: "Tejano ranchera, Emilio Navaira style, full band ranchera, 95 BPM, powerful vocals, Tex-Mex interpretation of ranchera, modern production"
      },
      pop: {
        name: "Tejano Pop",
        prompt: "Tejano pop, modern Tex-Mex pop, polished production, 115 BPM, crossover appeal, young Tejano sound, radio-friendly, contemporary"
      }
    }
  },

  duranguense: {
    name: "Duranguense",
    emoji: "🎷",
    description: "Pasito duranguense bailable",
    basePrompt: "duranguense music, pasito duranguense, saxophone lead, heavy bass drum, tambora-like beat, 130-145 BPM, Durango Mexico style, K-Paz de la Sierra influence, dance music",
    subGenres: {
      tradicional: {
        name: "Tradicional",
        prompt: "traditional duranguense, dominant saxophone, heavy kick drum pattern, 140 BPM, K-Paz de la Sierra style, pasito dance rhythm, regional party music, full band"
      },
      romantico: {
        name: "Romántico",
        prompt: "romantic duranguense, love song duranguense, saxophone ballad moments, 125 BPM, Alacranes Musical style, emotional duranguense, slower pasito"
      }
    }
  },

  huapango: {
    name: "Huapango",
    emoji: "👢",
    description: "Folclor huasteco con falsete",
    basePrompt: "huapango huasteco, violin lead, jarana huasteca, quinta huapanguera guitar, 140-180 BPM fast 6/8 rhythm, falsetto vocals, zapateado dance rhythm, Huasteca region folk",
    subGenres: {
      huasteco: {
        name: "Huasteco",
        prompt: "huapango huasteco, trio huasteco, virtuoso violin, falsetto singing, 160 BPM, traditional Huasteca folk, jarana strumming, zapateado rhythm, Los Camperos style, NO modern elements"
      },
      arribeño: {
        name: "Arribeño",
        prompt: "huapango arribeño, son arribeño from Guanajuato, two violins, vihuela and guitar, 150 BPM, decimal poetry, traditional Mexican son, rustic folk"
      }
    }
  }
};

// Artist genre mapping for smart suggestions
export const artistGenreMap = {
  // Norteño
  "ramon ayala": "norteno",
  "intocable": "norteno",
  "los tigres del norte": "corrido",
  "los tucanes de tijuana": "corrido",
  
  // Banda
  "banda ms": "banda",
  "banda el recodo": "banda",
  "julion alvarez": "banda",
  "jenni rivera": "banda",
  
  // Ranchera/Mariachi
  "vicente fernandez": "ranchera",
  "pedro fernandez": "ranchera",
  "alejandro fernandez": "ranchera",
  "pepe aguilar": "ranchera",
  "antonio aguilar": "ranchera",
  "pedro infante": "ranchera",
  "jose alfredo jimenez": "ranchera",
  "juan gabriel": "balada",
  "ana gabriel": "balada",
  
  // Sierreño
  "el fantasma": "sierreno",
  "carin leon": "sierreno",
  "christian nodal": "sierreno",
  
  // Corridos Tumbados
  "peso pluma": "corrido",
  "natanael cano": "corrido",
  "junior h": "corrido",
  "fuerza regida": "corrido",
  
  // Cumbia
  "celso piña": "cumbia",
  "los angeles azules": "cumbia",
  "selena": "tejano",
  "grupo cañaveral": "cumbia",
  
  // Salsa
  "marc anthony": "salsa",
  "hector lavoe": "salsa",
  "celia cruz": "salsa",
  "gilberto santa rosa": "salsa",
  "ruben blades": "salsa",
  
  // Bachata
  "romeo santos": "bachata",
  "prince royce": "bachata",
  "aventura": "bachata",
  
  // Reggaeton
  "daddy yankee": "reggaeton",
  "bad bunny": "reggaeton",
  "j balvin": "reggaeton",
  "rauw alejandro": "reggaeton",
  "anuel aa": "latin_trap",
  
  // Vallenato
  "carlos vives": "vallenato",
  "silvestre dangond": "vallenato",
  "diomedes diaz": "vallenato",
  
  // Bolero
  "luis miguel": "bolero",
  "armando manzanero": "bolero",
  
  // Pop Latino
  "shakira": "pop_latino",
  "enrique iglesias": "pop_latino",
  "luis fonsi": "pop_latino",
  "juanes": "pop_latino",
  
  // Grupera
  "los bukis": "grupera",
  "bronco": "grupera",
  "los caminantes": "grupera",
  "los temerarios": "grupera"
};

// Helper to detect artist/genre mismatch
export function checkArtistGenreMatch(selectedGenre, artistName) {
  if (!artistName) return { match: true };
  
  const normalizedArtist = artistName.toLowerCase().trim();
  const artistGenre = artistGenreMap[normalizedArtist];
  
  if (!artistGenre) return { match: true, unknown: true };
  
  if (artistGenre !== selectedGenre) {
    return {
      match: false,
      artistGenre: artistGenre,
      suggestion: `${artistName} es más conocido por ${genres[artistGenre]?.name || artistGenre}. ¿Te gustaría cambiar?`
    };
  }
  
  return { match: true };
}

// Build the final style prompt
export function buildStylePrompt(genre, subGenre, voiceType, artistInspiration) {
  const genreConfig = genres[genre];
  if (!genreConfig) return '';
  
  let basePrompt = subGenre && genreConfig.subGenres[subGenre] 
    ? genreConfig.subGenres[subGenre].prompt 
    : genreConfig.basePrompt;
  
  // Add voice type
  const voiceDesc = voiceType === 'female' 
    ? 'female vocals, feminine voice' 
    : voiceType === 'duet' 
    ? 'male and female duet vocals' 
    : 'male vocals, masculine voice';
  
  return `${basePrompt}, ${voiceDesc}`;
}

export default genres;
