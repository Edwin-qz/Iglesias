import type {
  Announcement,
  Attendance,
  Church,
  ChurchEvent,
  Database,
  Donation,
  Member,
  Ministry,
  Role,
  User,
} from '../types'
import { addDays, addMonths, hashPassword, normalize, toISO } from '../lib/utils'

const DEMO_PASSWORD = 'demo1234'

const churches: Church[] = [
  {
    id: 'iglesia-san-ildefonso',
    name: 'Catedral de San Ildefonso',
    shortName: 'San Ildefonso',
    address: 'Calle 60 s/n, entre 61 y 63',
    colonia: 'Centro Histórico',
    lat: 20.9671302,
    lng: -89.6225405,
    phone: '+52 999 924 1001',
    email: 'hola@sanildefonso.mx',
    pastor: 'Pbro. David Ceballos',
    founded: '1561',
    photo: {
      src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bf/Catedral_de_San_Ildefonso%2C_M%C3%A9rida%2C_Yucat%C3%A1n%2C_fachada_principal.jpg/1280px-Catedral_de_San_Ildefonso%2C_M%C3%A9rida%2C_Yucat%C3%A1n%2C_fachada_principal.jpg',
      alt: 'Fachada principal de la Catedral de San Ildefonso en el Centro de Mérida',
      credit: 'Gideonximi',
      license: 'CC BY 4.0',
      source:
        'https://commons.wikimedia.org/wiki/File:Catedral_de_San_Ildefonso,_M%C3%A9rida,_Yucat%C3%A1n,_fachada_principal.jpg',
    },
    description:
      'El corazón espiritual del Centro Histórico. Una comunidad que ora, celebra y camina junta desde hace más de cuatro siglos.',
    history: {
      summary: 'La construcción comenzó en 1562 y el templo se terminó el 1 de enero de 1597; su cierre formal fue en 1598.',
      architecture: 'Basílica de lenguaje renacentista-manierista, integrada con el Sagrario Metropolitano y otros espacios históricos.',
      timeline: [
        { year: '1562', event: 'Inicia la construcción de la Catedral.' },
        { year: '1597–1598', event: 'Se concluye el templo y se formaliza su terminación.' },
        { year: '1935', event: 'Es declarada Monumento Histórico.' },
      ],
      sources: [
        { label: 'INAH · Catálogo Nacional', url: 'https://catalogonacionalmhi.inah.gob.mx/consulta_publica/detalle/79018' },
        { label: 'INAH · Restauración de la Catedral', url: 'https://www.inah.gob.mx/boletines/investigacion-e-innovacion-ejes-de-la-restauracion-de-la-catedral-de-merida-en-yucatan' },
      ],
    },
    mission:
      'Ser una casa abierta donde cada persona encuentre acogida, propósito y un lugar para servir.',
    theme: {
      primary: '#8A5A2B',
      deep: '#2A1E13',
      accent: '#D8B36A',
      soft: '#F3E8D5',
      tint: '#EFE0C8',
    },
    schedules: [
      { day: 'Domingo', time: '08:00', label: 'Misa de aurora' },
      { day: 'Domingo', time: '12:00', label: 'Misa de comunidad' },
      { day: 'Miércoles', time: '19:00', label: 'Oración y alabanza' },
    ],
  },
  {
    id: 'iglesia-san-cristobal',
    name: 'Templo de San Cristóbal',
    shortName: 'San Cristóbal',
    address: 'Calle 50 x 69, Barrio de San Cristóbal',
    colonia: 'San Cristóbal',
    lat: 20.9611506,
    lng: -89.6174098,
    phone: '+52 999 925 4024',
    email: 'contacto@sancristobal.mx',
    pastor: 'Pbro. Jorge Medina',
    founded: '1542',
    photo: {
      src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/22/Fachada_principal_de_la_Parroquia_de_San_Crist%C3%B3bal.jpg/960px-Fachada_principal_de_la_Parroquia_de_San_Crist%C3%B3bal.jpg',
      alt: 'Fachada principal del Templo de San Cristóbal en Mérida',
      credit: 'Lilitharq',
      license: 'CC BY 4.0',
      source:
        'https://commons.wikimedia.org/wiki/File:Fachada_principal_de_la_Parroquia_de_San_Crist%C3%B3bal.jpg',
    },
    description:
      'Una iglesia de barrio con vocación de servicio. Aquí las puertas se abren temprano y la mesa siempre tiene un lugar más.',
    history: {
      summary: 'El templo actual corresponde al último tercio del siglo XVIII y forma parte del histórico barrio de San Cristóbal.',
      architecture: 'Barroco sobrio: su portada central se distingue por la gran concha que la corona, un rasgo singular en Mérida.',
      timeline: [
        { year: '1542', event: 'Se forma el barrio para población indígena aliada de la conquista.' },
        { year: 'Siglo XVIII', event: 'Se construye la parroquia actual.' },
        { year: '1796', event: 'La iglesia queda registrada entre los monumentos históricos de Mérida.' },
      ],
      sources: [
        { label: 'INEGI · Compendio municipal', url: 'https://www.inegi.org.mx/contenidos/app/mexicocifras/datos_geograficos/31/31050.pdf' },
        { label: 'Historia del Santuario Guadalupano', url: 'https://sipse.com/novedades-yucatan/yucatan-historia-iglesia-nuestra-senora-guadalupe-san-cristobal-225152.html' },
      ],
    },
    mission:
      'Vivir el evangelio en lo cotidiano: acompañar familias, formar discípulos y servir a la ciudad.',
    theme: {
      primary: '#A34E36',
      deep: '#2B1A15',
      accent: '#E0A96D',
      soft: '#F7E5DB',
      tint: '#F1D5C7',
    },
    schedules: [
      { day: 'Domingo', time: '09:00', label: 'Culto de celebración' },
      { day: 'Domingo', time: '18:00', label: 'Culto vespertino' },
      { day: 'Jueves', time: '19:30', label: 'Estudio bíblico' },
    ],
  },
  {
    id: 'iglesia-santa-lucia',
    name: 'Iglesia de Santa Lucía',
    shortName: 'Santa Lucía',
    address: 'Calle 60 #502, esquina con 55',
    colonia: 'Centro Histórico',
    lat: 20.9710283,
    lng: -89.6219182,
    phone: '+52 999 923 3170',
    email: 'bienvenida@santalucia.mx',
    pastor: 'Pbro. Andrés Pech',
    founded: '1575',
    photo: {
      src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b8/IGLESIA_DE_SANTA_LUC%C3%8DA_EN_M%C3%89RIDA_FACHADA.jpg/960px-IGLESIA_DE_SANTA_LUC%C3%8DA_EN_M%C3%89RIDA_FACHADA.jpg',
      alt: 'Fachada de cantera de la Iglesia de Santa Lucía, en el Centro de Mérida',
      credit: 'Jami.rc.08',
      license: 'CC0',
      source:
        'https://commons.wikimedia.org/wiki/File:IGLESIA_DE_SANTA_LUC%C3%8DA_EN_M%C3%89RIDA_FACHADA.jpg',
      position: '50% 20%',
    },
    description:
      'Frente al parque más querido de Mérida, una comunidad pequeña de corazón grande que hace de la música una forma de oración.',
    history: {
      summary: 'Su construcción comenzó a finales del siglo XVI y concluyó en 1620. El atrio fue cementerio de la ciudad hasta 1821.',
      architecture: 'Templo colonial de fachada sobria, entrada rectangular de cantera, vitral y espadaña; conserva un mural de Ermilo Torre Gamboa.',
      timeline: [
        { year: 'Finales del siglo XVI', event: 'Comienza la construcción del templo.' },
        { year: '1620', event: 'Se concluye la iglesia.' },
        { year: '1950', event: 'Ermilo Torre Gamboa pinta el mural del martirio de Santa Lucía.' },
      ],
      sources: [
        { label: 'Secretaría de Turismo de Yucatán · guía histórica', url: 'https://www.sefotur.yucatan.gob.mx/files-content/general/3b6a0016f39669e0a7990758f065cd10.pdf' },
        { label: 'Catálogo Federal de Monumentos', url: 'https://sitiosymonumentos.cultura.gob.mx/monumentos-inmuebles-de-propiedad-federal/santa-lucia-5/' },
      ],
    },
    mission:
      'Cultivar la belleza, la escucha y el servicio como caminos para encontrarnos con Dios y con la ciudad.',
    theme: {
      primary: '#64714A',
      deep: '#1F261B',
      accent: '#C7B576',
      soft: '#EDECDC',
      tint: '#E2E2CE',
    },
    schedules: [
      { day: 'Domingo', time: '07:30', label: 'Misa temprana' },
      { day: 'Domingo', time: '11:00', label: 'Misa de familia' },
      { day: 'Viernes', time: '19:00', label: 'Noche de música y oración' },
    ],
  },
  {
    id: 'iglesia-fatima',
    name: 'Parroquia de Nuestra Señora de Fátima',
    shortName: 'Fátima',
    address: 'Calle 20 #204, entre 23 y 25',
    colonia: 'García Ginerés',
    lat: 20.9865101,
    lng: -89.6326413,
    phone: '+52 999 925 3554',
    email: 'secretaria@fatima.mx',
    pastor: 'Pbro. Ricardo Alcocer',
    founded: '1956',
    photo: {
      src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/3/32/Parroquia_de_Nuestra_Se%C3%B1ora_de_F%C3%A1tima_-_2015-02-25_M%C3%A9rida%2C_Yucat%C3%A1n.jpg/1280px-Parroquia_de_Nuestra_Se%C3%B1ora_de_F%C3%A1tima_-_2015-02-25_M%C3%A9rida%2C_Yucat%C3%A1n.jpg',
      alt: 'Fachada de la Parroquia de Nuestra Señora de Fátima en García Ginerés',
      credit: 'Cecilia Ortiz',
      license: 'CC BY 2.0',
      source:
        'https://commons.wikimedia.org/wiki/File:Parroquia_de_Nuestra_Se%C3%B1ora_de_F%C3%A1tima_-_2015-02-25_M%C3%A9rida,_Yucat%C3%A1n.jpg',
    },
    description:
      'En el corazón de García Ginerés, una parroquia mariana que reúne a las familias alrededor de la Virgen de Fátima y acompaña los ciclos de la vida del barrio.',
    history: {
      summary: 'El templo actual se levantó entre 1952 y 1956 en la colonia García Ginerés, junto al Parque de las Américas.',
      architecture: 'Arquitectura religiosa de mediados del siglo XX, vinculada al desarrollo urbano de García Ginerés; destaca por sus vitrales.',
      timeline: [
        { year: '1901', event: 'Joaquín García Ginerés impulsa la colonia que llevaría su nombre.' },
        { year: '1952–1956', event: 'Ulises González Torres y Álvaro Ponce Peón construyen el templo actual.' },
        { year: '13 de mayo', event: 'La comunidad celebra anualmente a Nuestra Señora de Fátima.' },
      ],
      sources: [
        { label: 'Historia urbana de García Ginerés', url: 'https://meridaenlahistoria.com.mx/2020/06/21/historia-del-parque-de-las-americas-de-san-cosme-a-la-garcia-gineres/' },
        { label: 'Archivo Histórico parroquial · Gobierno de México', url: 'https://www.archivos.gob.mx/DatosAbiertos/Historico/2019/Registro_Nacional_de_Archivos_Historicos.pdf' },
      ],
    },
    mission:
      'Formar una comunidad cercana, misericordiosa y comprometida con la formación de las nuevas generaciones.',
    theme: {
      primary: '#7B3C48',
      deep: '#261419',
      accent: '#D6A96B',
      soft: '#F4E3E5',
      tint: '#EFD6D9',
    },
    schedules: [
      { day: 'Sábado', time: '18:00', label: 'Misa de anticipación' },
      { day: 'Domingo', time: '08:30', label: 'Misa de comunidad' },
      { day: 'Domingo', time: '12:30', label: 'Misa de jóvenes' },
    ],
  },
  {
    id: 'iglesia-itzimna',
    name: 'Parroquia de Nuestra Señora del Perpetuo Socorro',
    shortName: 'Itzimná',
    address: 'Calle 20 x 19, Barrio de Itzimná',
    colonia: 'Itzimná',
    lat: 20.9917578,
    lng: -89.6105779,
    phone: '+52 999 926 2231',
    email: 'hola@perpetuosocorro.mx',
    pastor: 'Pbro. Fernando Uc',
    founded: '1572',
    photo: {
      src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/Parroquia_de_Nuestra_Se%C3%B1ora_del_Perpetuo_Socorro.JPG/1280px-Parroquia_de_Nuestra_Se%C3%B1ora_del_Perpetuo_Socorro.JPG',
      alt: 'Fachada roja de la Parroquia de Nuestra Señora del Perpetuo Socorro en Itzimná, Mérida',
      credit: 'Aubolio',
      license: 'CC BY-SA 3.0',
      source:
        'https://commons.wikimedia.org/wiki/File:Parroquia_de_Nuestra_Se%C3%B1ora_del_Perpetuo_Socorro.JPG',
    },
    description:
      'La iglesia histórica de Itzimná, una comunidad que crece al ritmo de sus niños, jóvenes y vecinos y que mantiene viva la memoria del barrio.',
    history: {
      summary: 'En el sitio hubo una capilla de 1572; el templo conservado se edificó en 1710 y su pila bautismal recuerda la etapa temprana.',
      architecture: 'Fachada sobria con espadaña de tres vanos, portada de medio punto y ventana coral; conserva una imagen traída de París a inicios del siglo XX.',
      timeline: [
        { year: '1572', event: 'Se levanta una primera capilla en el antiguo Itzimná.' },
        { year: '1710', event: 'Se edifica el templo que permanece hoy.' },
        { year: '1944', event: 'Se dedica a Nuestra Señora del Perpetuo Socorro.' },
      ],
      sources: [
        { label: 'Catálogo Federal de Monumentos', url: 'https://sitiosymonumentos.cultura.gob.mx/monumentos-inmuebles-de-propiedad-federal/nuestra-senora-del-perpetuo-socorro-2/' },
        { label: 'Secretaría de Turismo de Yucatán · guía histórica', url: 'https://www.sefotur.yucatan.gob.mx/files-content/general/3b6a0016f39669e0a7990758f065cd10.pdf' },
      ],
    },
    mission:
      'Ser semilla de esperanza en Itzimná, formando comunidades pequeñas que se cuidan y sirven entre sí.',
    theme: {
      primary: '#44557C',
      deep: '#191D2A',
      accent: '#D3B578',
      soft: '#E5E8F1',
      tint: '#D8DCEA',
    },
    schedules: [
      { day: 'Domingo', time: '09:30', label: 'Misa de familia' },
      { day: 'Domingo', time: '19:00', label: 'Misa de jóvenes' },
      { day: 'Martes', time: '19:00', label: 'Grupo de oración' },
    ],
  },
  {
    id: 'iglesia-santa-ana',
    name: 'Templo de Santa Ana',
    shortName: 'Santa Ana',
    address: 'Calle 45, esquina con 60',
    colonia: 'Centro · Parque de Santa Ana',
    lat: 20.9764989,
    lng: -89.6209715,
    phone: '+52 999 928 1240',
    email: 'hola@santaanamerida.mx',
    pastor: 'Pbro. Manuel Solís',
    founded: '1733',
    photo: {
      src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cf/Fachada_principal_Templo.jpg/1280px-Fachada_principal_Templo.jpg',
      alt: 'Fachada principal del Templo de Santa Ana, en Mérida',
      credit: 'Veronicat01',
      license: 'CC BY-SA 3.0',
      source: 'https://commons.wikimedia.org/wiki/File:Fachada_principal_Templo.jpg',
    },
    description:
      'Una comunidad de artesanos, familias y vecinos que se reúne bajo las torres de Santa Ana, a unos pasos del Paseo de Montejo y del bullicio sereno del parque.',
    history: {
      summary:
        'El templo se levantó entre 1726 y 1733 por orden del gobernador Antonio de Figueroa y Silva, sobre un basamento maya y una antigua capilla abierta.',
      architecture:
        'Fachada de dos torres, portada de cantera y un nicho central con la imagen de Santa Ana. El conjunto se asoma al parque y al antiguo mercado del barrio.',
      timeline: [
        {
          year: '1726',
          event: 'El gobernador Antonio de Figueroa y Silva ordena construir el templo y el paseo de Santa Ana.',
        },
        { year: '1733', event: 'Se concluye el conjunto de templo, atrio y alameda.' },
        {
          year: '1867',
          event: 'El parque de Santa Ana es escenario de una batalla decisiva para la República en Yucatán.',
        },
      ],
      sources: [
        {
          label: 'Wikipedia · Barrio de Santa Ana',
          url: 'https://es.wikipedia.org/wiki/Barrio_de_Santa_Ana_(M%C3%A9rida,_M%C3%A9xico)',
        },
        { label: 'INAH · Catálogo Nacional', url: 'https://catalogonacionalmhi.inah.gob.mx/consulta_publica' },
      ],
    },
    mission:
      'Ser una comunidad abierta y cercana, donde la fe se vuelve servicio y la ciudad encuentra un lugar para descansar.',
    theme: {
      primary: '#C0653F',
      deep: '#261A14',
      accent: '#E9C98E',
      soft: '#F7E7DC',
      tint: '#F0D7C8',
    },
    schedules: [
      { day: 'Domingo', time: '08:00', label: 'Misa de aurora' },
      { day: 'Domingo', time: '11:00', label: 'Misa de comunidad' },
      { day: 'Miércoles', time: '19:00', label: 'Oración y alabanza' },
    ],
  },
  {
    id: 'iglesia-santiago-apostol',
    name: 'Iglesia de Santiago Apóstol',
    shortName: 'Santiago',
    address: 'Calle 59 x 72, Barrio de Santiago',
    colonia: 'Santiago',
    lat: 20.9700911,
    lng: -89.6294126,
    phone: '+52 999 928 5670',
    email: 'contacto@santiagoapostol.mx',
    pastor: 'Pbro. Gabriel Uc',
    founded: '1637',
    photo: {
      src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/Iglesia_de_Santiago_Ap%C3%B3stol%2C_M%C3%A9rida%2C_Yucat%C3%A1n_%2801%29.jpg/1280px-Iglesia_de_Santiago_Ap%C3%B3stol%2C_M%C3%A9rida%2C_Yucat%C3%A1n_%2801%29.jpg',
      alt: 'Fachada blanca de la Iglesia de Santiago Apóstol, en Mérida',
      credit: 'Inri',
      license: 'CC0',
      source:
        'https://commons.wikimedia.org/wiki/File:Iglesia_de_Santiago_Ap%C3%B3stol,_M%C3%A9rida,_Yucat%C3%A1n_(01).jpg',
    },
    description:
      'La iglesia del barrio más antiguo de Mérida, donde la memoria maya, la vida de la ciudad y la devoción a Santiago se encuentran desde el siglo XVI.',
    history: {
      summary:
        'El barrio se organizó desde 1542 como pueblo de indios. La iglesia se concluyó en 1637 y su capilla lateral conserva la memoria de la primera misa celebrada en una capilla de la ciudad.',
      architecture:
        'Fachada barroca de espadaña escalonada, tres campanas y portada de cantera. El conjunto conserva la capilla de la Tercera Orden y un atrio de escala barrial.',
      timeline: [
        { year: '1542', event: 'El barrio de Santiago queda integrado como pueblo de indios a la naciente Mérida.' },
        { year: '1637', event: 'Se concluye la iglesia.' },
        { year: '1925', event: 'Se reconstruye casi por completo la capilla lateral.' },
      ],
      sources: [
        {
          label: 'Wikipedia · Barrio de Santiago',
          url: 'https://es.wikipedia.org/wiki/Barrio_de_Santiago_(M%C3%A9rida,_Yucat%C3%A1n)',
        },
        { label: 'INAH · Catálogo Nacional', url: 'https://catalogonacionalmhi.inah.gob.mx/consulta_publica' },
      ],
    },
    mission:
      'Caminar con el barrio, cuidar su memoria y hacer del templo una casa de encuentro para todas las generaciones.',
    theme: {
      primary: '#3E6173',
      deep: '#16232A',
      accent: '#D8A85E',
      soft: '#E7EFF2',
      tint: '#D8E4E9',
    },
    schedules: [
      { day: 'Domingo', time: '07:30', label: 'Misa de aurora' },
      { day: 'Domingo', time: '12:00', label: 'Misa de comunidad' },
      { day: 'Jueves', time: '19:00', label: 'Adoración y oración' },
    ],
  },
  {
    id: 'iglesia-mejorada',
    name: 'Templo de Nuestra Señora del Tránsito de Mejorada',
    shortName: 'La Mejorada',
    address: 'Calle 50, entre 59 y 57',
    colonia: 'Centro · Parque de La Mejorada',
    lat: 20.9677044,
    lng: -89.615909,
    phone: '+52 999 924 7890',
    email: 'secretaria@mejorada.mx',
    pastor: 'Pbro. Francisco Escalante',
    founded: '1640',
    photo: {
      src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/55/Fachada_del_Templo_de_la_Mejorada%2C_M%C3%A9rida%2C_Yucat%C3%A1n.jpg/1280px-Fachada_del_Templo_de_la_Mejorada%2C_M%C3%A9rida%2C_Yucat%C3%A1n.jpg',
      alt: 'Fachada de cantera del Templo de la Mejorada, en Mérida',
      credit: 'Luis Alvaz',
      license: 'CC BY-SA 4.0',
      source:
        'https://commons.wikimedia.org/wiki/File:Fachada_del_Templo_de_la_Mejorada,_M%C3%A9rida,_Yucat%C3%A1n.jpg',
    },
    description:
      'Un templo franciscano que hoy comparte su historia con la Facultad de Arquitectura y con el parque donde se instaló el primer riel de Yucatán.',
    history: {
      summary:
        'La construcción comenzó en 1621 con recursos de Diego Montalvo de García y fue concluida por los franciscanos en 1640. El convento anexo, edificado entre 1688 y 1694, hoy alberga la Facultad de Arquitectura de la UADY.',
      architecture:
        'Templo colonial de una nave con fachada de cantera, dos espadañas y un claustro conventual. Frente al parque se instaló el primer riel de la península en 1870.',
      timeline: [
        { year: '1621', event: 'Comienza la construcción del templo con recursos de Diego Montalvo de García.' },
        { year: '1640', event: 'Los franciscanos concluyen la obra.' },
        { year: '1688–1694', event: 'Se construye el convento anexo.' },
        { year: '1870', event: 'Se instala en el parque el primer riel de ferrocarril de Yucatán.' },
      ],
      sources: [
        {
          label: 'Wikipedia · Parque de La Mejorada',
          url: 'https://es.wikipedia.org/wiki/Parque_de_La_Mejorada',
        },
        { label: 'INAH · Catálogo Nacional', url: 'https://catalogonacionalmhi.inah.gob.mx/consulta_publica' },
      ],
    },
    mission:
      'Honrar una historia de más de cuatro siglos y seguir siendo una casa de oración, arte y encuentro para el centro de Mérida.',
    theme: {
      primary: '#6C7059',
      deep: '#20231B',
      accent: '#CBB37B',
      soft: '#ECEDE1',
      tint: '#E0E2D1',
    },
    schedules: [
      { day: 'Domingo', time: '09:00', label: 'Misa de familia' },
      { day: 'Domingo', time: '18:00', label: 'Misa vespertina' },
      { day: 'Viernes', time: '19:00', label: 'Oración ante el Santísimo' },
    ],
  },
  {
    id: 'iglesia-san-sebastian',
    name: 'Parroquia de San Sebastián',
    shortName: 'San Sebastián',
    address: 'Calle 75 x 69, Barrio de San Sebastián',
    colonia: 'San Sebastián',
    lat: 20.9588896,
    lng: -89.6320711,
    phone: '+52 999 923 4560',
    email: 'parroquia@sansebastian.mx',
    pastor: 'Pbro. Jorge Medina',
    founded: '1796',
    photo: {
      src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f8/San_Sebasti%C3%A1n%2C_M%C3%A9rida%2C_Yucat%C3%A1n.jpg/1280px-San_Sebasti%C3%A1n%2C_M%C3%A9rida%2C_Yucat%C3%A1n.jpg',
      alt: 'Parroquia de San Sebastián iluminada al anochecer, en Mérida',
      credit: 'Mario Morales Rubí',
      license: 'CC BY-SA 4.0',
      source:
        'https://commons.wikimedia.org/wiki/File:San_Sebasti%C3%A1n,_M%C3%A9rida,_Yucat%C3%A1n.jpg',
    },
    description:
      'Una parroquia de barrio conocida por sus fiestas de agosto, sus gremios y su vocación de acogida. Aquí la comunidad se reconoce y se celebra.',
    history: {
      summary:
        'La primera ermita del barrio se levantó a mediados del siglo XVI. El templo actual fue concluido en 1796 por Juan Esteban Quijana y un grupo de vecinos, y en 1889 fue elevado a parroquia.',
      architecture:
        'Fachada de cantera con espadaña central, dos torres laterales y un atrio que conserva la escala de los antiguos barrios de Mérida.',
      timeline: [
        { year: 'Siglo XVI', event: 'Se construye una humilde ermita en el barrio.' },
        { year: '1796', event: 'Se concluye el templo actual.' },
        { year: '1889', event: 'El obispo Crescencio Carrillo y Ancona la eleva a parroquia.' },
        { year: 'Agosto', event: 'La comunidad celebra sus fiestas patronales con gremios y vaquerías.' },
      ],
      sources: [
        {
          label: 'Wikipedia · Barrio de San Sebastián',
          url: 'https://es.wikipedia.org/wiki/Barrio_de_San_Sebasti%C3%A1n_(M%C3%A9rida,_Yucat%C3%A1n)',
        },
        { label: 'INAH · Catálogo Nacional', url: 'https://catalogonacionalmhi.inah.gob.mx/consulta_publica' },
      ],
    },
    mission:
      'Ser una parroquia de puertas abiertas, donde las familias del barrio encuentren acompañamiento, fiesta y servicio.',
    theme: {
      primary: '#8F4F5C',
      deep: '#29181D',
      accent: '#DDB66F',
      soft: '#F4E5E5',
      tint: '#ECD4D4',
    },
    schedules: [
      { day: 'Sábado', time: '18:00', label: 'Misa de anticipación' },
      { day: 'Domingo', time: '08:00', label: 'Misa de aurora' },
      { day: 'Domingo', time: '11:30', label: 'Misa de comunidad' },
    ],
  },
  {
    id: 'ermita-santa-isabel',
    name: 'Ermita de Santa Isabel',
    shortName: 'Santa Isabel',
    address: 'Calle 66 sur x 77, Barrio de San Sebastián',
    colonia: 'San Sebastián',
    lat: 20.9567861,
    lng: -89.629633,
    phone: '+52 999 923 8901',
    email: 'ermita@santaisabel.mx',
    pastor: 'Pbro. Andrés Pech',
    founded: 'Siglo XVII',
    photo: {
      src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fe/Ermita_de_Santa_Isabel_1.jpg/1280px-Ermita_de_Santa_Isabel_1.jpg',
      alt: 'Fachada amarilla de la Ermita de Santa Isabel, en Mérida',
      credit: 'Muñoz LC',
      license: 'CC BY-SA 4.0',
      source: 'https://commons.wikimedia.org/wiki/File:Ermita_de_Santa_Isabel_1.jpg',
    },
    description:
      'La pequeña ermita amarilla que marcaba el inicio del Camino Real a Campeche, hoy un refugio de silencio y memoria en el sur del centro.',
    history: {
      summary:
        'La ermita fue construida por Gaspar González de Ledezma en el siglo XVII, al inicio del Camino Real a Campeche. Sobre su puerta mayor se lee la inscripción de 1748.',
      architecture:
        'Pequeña capilla de fachada amarilla con espadaña de tres vanos, atrio escalonado y muros de cantera. Fue conocida como Ermita de Nuestra Señora del Buen Viaje.',
      timeline: [
        { year: 'Siglo XVII', event: 'Gaspar González de Ledezma manda construir la ermita.' },
        { year: '1748', event: 'Se graba la inscripción de la puerta mayor.' },
        { year: '1790', event: 'El camino real a Campeche pasa frente a la ermita y le da nueva vida.' },
      ],
      sources: [
        {
          label: 'Wikipedia · Ermita de Santa Isabel',
          url: 'https://es.wikipedia.org/wiki/Ermita_de_Santa_Isabel_(M%C3%A9rida,_Yucat%C3%A1n)',
        },
        { label: 'INAH · Catálogo Nacional', url: 'https://catalogonacionalmhi.inah.gob.mx/consulta_publica' },
      ],
    },
    mission:
      'Guardar la memoria del camino y ofrecer a quien pasa un lugar de pausa, oración y hospitalidad.',
    theme: {
      primary: '#B07F2E',
      deep: '#2A2112',
      accent: '#EBD08B',
      soft: '#F6EDD9',
      tint: '#EFE0C2',
    },
    schedules: [
      { day: 'Sábado', time: '17:30', label: 'Rosario en la ermita' },
      { day: 'Domingo', time: '08:00', label: 'Misa de la ermita' },
      { day: 'Jueves', time: '18:30', label: 'Oración por los viajeros' },
    ],
  },
]

const firstNames = [
  'María José',
  'Carlos',
  'Ana Sofía',
  'Luis Fernando',
  'Gabriela',
  'Jorge',
  'Valeria',
  'Miguel Ángel',
  'Daniela',
  'Ricardo',
  'Andrea',
  'Emmanuel',
  'Fernanda',
  'Alejandro',
  'Lucía',
  'Rodrigo',
  'Ximena',
  'Diego',
  'Paola',
  'Santiago',
  'Regina',
  'Mauricio',
  'Camila',
  'Iván',
]

const lastNames = [
  'Pech',
  'Canul',
  'Herrera',
  'Ceballos',
  'Dzul',
  'Barrera',
  'Uc',
  'Cauich',
  'May',
  'Alcocer',
  'Poot',
  'Chi',
  'Medina',
  'Xool',
  'Ucán',
  'Escalante',
  'Solís',
  'Cárdenas',
  'Mena',
  'Aguilar',
]

const ministryBlueprints = [
  {
    name: 'Alabanza y adoración',
    description: 'Equipo de música, canto y producción para los encuentros de la comunidad.',
    meetingDay: 'Sábado',
    meetingTime: '17:00',
  },
  {
    name: 'Jóvenes',
    description: 'Encuentros, retiros y servicio para las nuevas generaciones.',
    meetingDay: 'Viernes',
    meetingTime: '19:00',
  },
  {
    name: 'Niños',
    description: 'Formación, juego y cuidado para la niñez de la iglesia.',
    meetingDay: 'Domingo',
    meetingTime: '10:00',
  },
  {
    name: 'Enseñanza',
    description: 'Estudio bíblico, catequesis y formación de líderes.',
    meetingDay: 'Miércoles',
    meetingTime: '19:30',
  },
  {
    name: 'Servicio y hospitalidad',
    description: 'Acogida, logística, visitas y apoyo a familias de la comunidad.',
    meetingDay: 'Sábado',
    meetingTime: '10:00',
  },
]

const donationConcepts = [
  'Ofrenda dominical',
  'Diezmo',
  'Donativo especial',
  'Proyecto techo',
  'Ofrenda de gratitud',
  'Cooperación misionera',
]

const donationMethods = ['efectivo', 'transferencia', 'tarjeta', 'deposito'] as const

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(items: readonly T[], random: () => number) {
  return items[Math.floor(random() * items.length)]
}

function nextWeekday(from: Date, weekday: number) {
  const date = new Date(from)
  const delta = (weekday - date.getDay() + 7) % 7
  if (delta === 0) return addDays(date, 7)
  return addDays(date, delta)
}

const roleEmails: Record<Exclude<Role, 'coordinador'> | 'coordinador', string> = {
  administrador: 'admin@casaviva.mx',
  pastor: 'pastor@casaviva.mx',
  secretario: 'secretario@casaviva.mx',
  tesorero: 'tesorero@casaviva.mx',
  coordinador: 'coordinador@casaviva.mx',
}

const mainUserNames: Record<Role, string> = {
  administrador: 'Ana Sofía Herrera',
  pastor: 'David Ceballos',
  secretario: 'María José Pech',
  tesorero: 'Jorge Barrera',
  coordinador: 'Lucía Canul',
}

export function createSeedDatabase(): Database {
  const today = new Date()
  const isoToday = toISO(today)
  const users: User[] = []
  const members: Member[] = []
  const ministries: Ministry[] = []
  const events: ChurchEvent[] = []
  const attendance: Attendance[] = []
  const donations: Donation[] = []
  const announcements: Announcement[] = []

  const roles: Role[] = [
    'administrador',
    'pastor',
    'secretario',
    'tesorero',
    'coordinador',
  ]

  churches.forEach((church, churchIndex) => {
    const random = mulberry32(101 + churchIndex * 37)
    const churchStaff: User[] = []

    if (churchIndex === 0) {
      roles.forEach((role) => {
        const user: User = {
          id: `u_${role}`,
          name: mainUserNames[role],
          email: roleEmails[role],
          passwordHash: hashPassword(DEMO_PASSWORD),
          role,
          churchId: church.id,
          active: true,
          createdAt: '2024-01-15T09:00:00.000Z',
        }
        users.push(user)
        churchStaff.push(user)
      })
    } else {
      const pastorUser: User = {
        id: `u_pastor_${churchIndex}`,
        name: church.pastor.replace(/^(Pbro\.|Dra\.|Lic\.)\s*/, ''),
        email: `pastor.${churchIndex}@casaviva.mx`,
        passwordHash: hashPassword(DEMO_PASSWORD),
        role: 'pastor',
        churchId: church.id,
        active: true,
        createdAt: '2024-05-02T09:00:00.000Z',
      }
      users.push(pastorUser)
      churchStaff.push(pastorUser)
    }

    const pastorUser = churchStaff.find((u) => u.role === 'pastor') ?? churchStaff[0]
    const adminUser = churchStaff.find((u) => u.role === 'administrador') ?? pastorUser

    const churchMembers: Member[] = []
    for (let i = 0; i < 18; i += 1) {
      const firstName = firstNames[(churchIndex * 5 + i) % firstNames.length]
      const lastName = `${lastNames[(churchIndex * 7 + i * 3) % lastNames.length]} ${
        lastNames[(churchIndex * 3 + i * 5 + 4) % lastNames.length]
      }`
      const month = String(1 + Math.floor(random() * 12)).padStart(2, '0')
      const day = String(1 + Math.floor(random() * 27)).padStart(2, '0')
      const joinedYear = 2018 + Math.floor(random() * 8)
      const member: Member = {
        id: `m_${churchIndex}_${i}`,
        churchId: church.id,
        firstName,
        lastName,
        phone: `+52 999 ${100 + Math.floor(random() * 900)} ${1000 + Math.floor(random() * 9000)}`,
        email: `${normalize(firstName).replace(/\s+/g, '.')}.${normalize(lastName.split(' ')[0])}${i}@correo.mx`,
        birthDate: `${1980 + Math.floor(random() * 28)}-${month}-${day}`,
        joinedAt: `${joinedYear}-${String(1 + Math.floor(random() * 12)).padStart(2, '0')}-${String(
          1 + Math.floor(random() * 27),
        ).padStart(2, '0')}`,
        active: i < 15,
        ministryIds: [],
        address: `Calle ${20 + Math.floor(random() * 50)} #${100 + Math.floor(random() * 600)}, ${church.colonia}`,
      }
      churchMembers.push(member)
      members.push(member)
    }

    const churchMinistries: Ministry[] = ministryBlueprints.map((blueprint, index) => {
      const coordinator = churchMembers[index]
      const memberIds = churchMembers
        .filter((_, memberIndex) => memberIndex % 5 === index || memberIndex === index)
        .map((m) => m.id)
      if (!memberIds.includes(coordinator.id)) memberIds.unshift(coordinator.id)
      const ministry: Ministry = {
        id: `min_${churchIndex}_${index}`,
        churchId: church.id,
        name: blueprint.name,
        description: blueprint.description,
        color: ['#B4553B', '#64714A', '#C99A4B', '#44557C', '#7B3C48'][index],
        coordinatorId: coordinator.id,
        memberIds,
        meetingDay: blueprint.meetingDay,
        meetingTime: blueprint.meetingTime,
      }
      memberIds.forEach((memberId) => {
        const member = churchMembers.find((m) => m.id === memberId)
        if (member && !member.ministryIds.includes(ministry.id)) {
          member.ministryIds.push(ministry.id)
        }
      })
      return ministry
    })
    ministries.push(...churchMinistries)

    const activeMembers = churchMembers.filter((m) => m.active)
    const sunday = nextWeekday(today, 0)
    const wednesday = nextWeekday(today, 3)
    const upcoming: ChurchEvent[] = [
      {
        id: `e_${churchIndex}_next_culto`,
        churchId: church.id,
        title: 'Culto de celebración',
        type: 'culto',
        date: toISO(sunday),
        time: '10:00',
        place: 'Templo principal',
        description:
          'Un encuentro para celebrar juntos, escuchar la Palabra y compartir la mesa.',
        responsibleId: churchMembers[0].id,
        ministryId: churchMinistries[0].id,
        status: 'programado',
      },
      {
        id: `e_${churchIndex}_next_oracion`,
        churchId: church.id,
        title: 'Reunión de intercesión',
        type: 'reunion',
        date: toISO(wednesday),
        time: '19:30',
        place: 'Capilla lateral',
        description: 'Tiempo de oración por la ciudad, las familias y los enfermos.',
        responsibleId: churchMembers[3].id,
        ministryId: churchMinistries[3].id,
        status: 'programado',
      },
      {
        id: `e_${churchIndex}_next_jovenes`,
        churchId: church.id,
        title: 'Encuentro de jóvenes',
        type: 'actividad',
        date: toISO(addDays(today, 12)),
        time: '18:00',
        place: 'Patio de la comunidad',
        description: 'Noche de música, testimonio y convivencia para jóvenes y sus amigos.',
        responsibleId: churchMembers[1].id,
        ministryId: churchMinistries[1].id,
        status: 'programado',
      },
      {
        id: `e_${churchIndex}_next_lideres`,
        churchId: church.id,
        title: 'Reunión de líderes',
        type: 'administrativo',
        date: toISO(addDays(today, 18)),
        time: '19:00',
        place: 'Salón parroquial',
        description: 'Revisión de la agenda pastoral, ministerios y próximos pasos.',
        responsibleId: churchMembers[2].id,
        status: 'programado',
      },
      {
        id: `e_${churchIndex}_next_servicio`,
        churchId: church.id,
        title: 'Servicio comunitario',
        type: 'actividad',
        date: toISO(addDays(today, 25)),
        time: '08:00',
        place: 'Punto de encuentro: atrio',
        description: 'Jornada de visitas, despensas y acompañamiento a familias del barrio.',
        responsibleId: churchMembers[4].id,
        ministryId: churchMinistries[4].id,
        status: 'programado',
      },
    ]
    events.push(...upcoming)

    for (let i = 10; i >= 1; i -= 1) {
      const isWednesday = i % 3 === 0
      const date = addDays(today, -i * 7 + (isWednesday ? -2 : 0))
      const event: ChurchEvent = {
        id: `e_${churchIndex}_past_${i}`,
        churchId: church.id,
        title: isWednesday ? 'Oración de mitad de semana' : 'Culto dominical',
        type: isWednesday ? 'reunion' : 'culto',
        date: toISO(date),
        time: isWednesday ? '19:30' : '10:00',
        place: 'Templo principal',
        description: 'Encuentro de la comunidad.',
        responsibleId: churchMembers[(i + churchIndex) % churchMembers.length].id,
        status: 'finalizado',
      }
      events.push(event)
      const presentIds = activeMembers
        .filter(() => random() > 0.22)
        .map((m) => m.id)
      const absentIds = activeMembers
        .filter((m) => !presentIds.includes(m.id))
        .map((m) => m.id)
      attendance.push({
        id: `a_${churchIndex}_${i}`,
        churchId: church.id,
        eventId: event.id,
        date: event.date,
        presentIds,
        absentIds,
        recordedBy: adminUser.id,
        recordedAt: `${event.date}T12:30:00.000Z`,
      })
    }

    for (let monthOffset = 5; monthOffset >= 0; monthOffset -= 1) {
      const monthDate = addMonths(today, -monthOffset)
      const count = monthOffset === 0 ? 4 : 6
      for (let i = 0; i < count; i += 1) {
        const day = Math.min(2 + i * 5, monthOffset === 0 ? today.getDate() : 27)
        const date = toISO(new Date(monthDate.getFullYear(), monthDate.getMonth(), day))
        const anonymous = random() < 0.18
        const donor = pick(churchMembers.filter((m) => m.active), random)
        const amountBase = [250, 400, 500, 800, 1200, 1800, 2500][
          Math.floor(random() * 7)
        ]
        donations.push({
          id: `d_${churchIndex}_${monthOffset}_${i}`,
          churchId: church.id,
          date,
          amount: anonymous ? amountBase + 100 : amountBase,
          concept: pick(donationConcepts, random),
          method: pick(donationMethods, random),
          anonymous,
          memberId: anonymous ? undefined : donor.id,
        })
      }
    }

    const announcementSeeds: Array<{
      title: string
      body: string
      category: Announcement['category']
      daysAgo: number
      pinned: boolean
    }> = [
      {
        title: 'Retiro de comunidad: inscripciones abiertas',
        body: 'Del viernes 21 al domingo 23 viviremos nuestro retiro anual en Celestún. Cupo limitado a 40 personas. Puedes registrarte con tu coordinador de ministerio o en la secretaría después de cada celebración.',
        category: 'evento',
        daysAgo: 2,
        pinned: true,
      },
      {
        title: 'Nuevo horario de secretaría',
        body: 'A partir de este mes la secretaría atenderá de lunes a viernes de 9:00 a 14:00 y de 16:00 a 19:00. Para trámites de documentos, te recomendamos escribir antes al correo de la iglesia.',
        category: 'general',
        daysAgo: 6,
        pinned: false,
      },
      {
        title: 'Colecta para las familias afectadas',
        body: 'Durante todo el mes estaremos recibiendo despensas y artículos de primera necesidad para las familias del sur de la ciudad. Puedes dejar tu aportación en el atrio o sumarte al servicio comunitario del próximo sábado.',
        category: 'servicio',
        daysAgo: 11,
        pinned: false,
      },
    ]

    announcementSeeds.forEach((seed, index) => {
      announcements.push({
        id: `n_${churchIndex}_${index}`,
        churchId: church.id,
        title: seed.title,
        body: seed.body,
        category: seed.category,
        publishedAt: toISO(addDays(today, -seed.daysAgo)),
        pinned: seed.pinned,
        authorId: pastorUser.id,
      })
    })
  })

  return {
    version: 4,
    churches,
    users,
    members,
    ministries,
    events,
    attendance,
    donations,
    announcements,
    passwordResets: [],
  }
}

export const DEMO_ACCOUNTS = [
  {
    role: 'administrador' as Role,
    email: 'admin@casaviva.mx',
    password: DEMO_PASSWORD,
    name: 'Ana Sofía Herrera',
    description: 'Acceso completo, usuarios y configuración',
  },
  {
    role: 'pastor' as Role,
    email: 'pastor@casaviva.mx',
    password: DEMO_PASSWORD,
    name: 'David Ceballos',
    description: 'Visión pastoral, finanzas y reportes',
  },
  {
    role: 'secretario' as Role,
    email: 'secretario@casaviva.mx',
    password: DEMO_PASSWORD,
    name: 'María José Pech',
    description: 'Miembros, asistencia y eventos',
  },
  {
    role: 'tesorero' as Role,
    email: 'tesorero@casaviva.mx',
    password: DEMO_PASSWORD,
    name: 'Jorge Barrera',
    description: 'Donaciones y reportes financieros',
  },
  {
    role: 'coordinador' as Role,
    email: 'coordinador@casaviva.mx',
    password: DEMO_PASSWORD,
    name: 'Lucía Canul',
    description: 'Asistencia y vida de ministerios',
  },
]

export const DEMO_PASSWORD_VALUE = DEMO_PASSWORD
