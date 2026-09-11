# Light Delay — Biblia de Voces de Personajes (EN/ES)

**Propósito:** describir la voz de cada personaje con el detalle suficiente para generar audio de referencia (clonación / voces preestablecidas) en Higgsfield u otra herramienta de voz IA, en inglés y en castellano, manteniendo el mismo timbre entre ambos idiomas.

**Alcance vigente:** la narrativa maestra WIP tiene seis personajes: Zao, Elin Rao, Harlan, Voss, Sorell y Okoye. Sus datos estructurados viven en `data/voice-profiles.json`; esta guía explica el criterio autoral. Los perfiles restantes se conservan al final sólo como archivo de continuidades deprecadas y no deben orientar diálogo nuevo del master.

**Metodología de acento:**
- **Timbre** = cualidad física de la voz (altura, resonancia, textura). No cambia entre idiomas — es lo que hace que sea "la misma persona" hablando en inglés o en castellano.
- **Prosodia de origen (inglés):** ritmo, entonación y articulación que el personaje conserva de su primera comunidad lingüística al hablar inglés. Se dirige en interpretación y audio; nunca se imita mediante faltas, gramática rota u ortografía fonética.
- **Castellano del elenco maestro:** variedad **latinoamericana** de formación (léxico, sintaxis, tratamientos, ritmo regional). En las viñetas y refs de español **no** se arrastra el acento de otra lengua (mandarín, germánico, británico, hindi, francés, igbo, etc.): el castellano suena a la región donde lo aprendió.
- **Formación lingüística** = lugar y comunidad donde el personaje aprendió a usar inglés o español de manera habitual.
- **Diálogo escrito** = combinación sutil de variedad aprendida, relación entre hablantes y presión dramática. La relación y la intención de la escena prevalecen sobre tics mecánicos: una variedad no obliga a usar siempre el mismo tratamiento ni a insertar localismos.
- **Género:** confirmado por el texto existente en la mayoría de los casos; marcado como "sin confirmar" donde el material previo no lo especifica — ajustable sin tocar el resto del perfil.

**Regla bilingüe:** editar primero el diálogo inglés. El español se traduce desde esa fuente conservando intención, jerarquía, precisión técnica y personalidad mediante su variedad propia; si se posterga, debe quedar marcado como desactualizado.

---

## ELENCO DE LA NARRATIVA MAESTRA

### ZAO — Ingeniera Jefe
*Género: femenino (confirmado). 40–50 años.*

- **Timbre:** contralto, registro medio-bajo, ligera sequedad/aspereza (años de ambientes ruidosos de maquinaria), resonancia de pecho, casi sin vibrato — voz sin pulir a propósito, funcional antes que agradable.
- **Inglés — Singapur (`en-SG`):** formó su inglés técnico en ámbitos científicos de Singapur. Usa un inglés internacional preciso, con pocas contracciones y sin partículas coloquiales singapurenses; conserva consonantes marcadas, ritmo parejo y cierres descendentes de base mandarín.
- **Español — Bogotá (`es-CO`):** formó su español profesional en Bogotá. Emplea un registro bogotano formal y técnico, prefiere `usted` en relaciones profesionales y frases completas; bajo presión recorta la sintaxis sin perder exactitud.
- **Nota de continuidad:** el mensaje final de auxilio debe sonar más rápido y con la voz ligeramente quebrada — es la única vez que se le nota el miedo, en ambos idiomas.

### CAPITÁN ELIAS VOSS
*Género: masculino (confirmado). 50s.*

- **Timbre:** barítono, resonancia plena de pecho, fundamental grave, respiración estable (entrenamiento de mando), casi sin aspereza.
- **Inglés — Toronto (`en-CA`):** formó su inglés institucional en Toronto. Habla un inglés canadiense estándar, formal y medido, con consonantes firmes y vocales definidas por su base germánica o nórdica; pregunta antes de ordenar y reserva las contracciones para cercanía o urgencia.
- **Español — Lima (`es-PE`):** formó su español formal en Lima. Usa dicción institucional, instrucciones ordenadas y pocas muletillas. Emplea `usted` al ejercer mando, pero puede tutear a colegas de confianza cuando la relación dramática lo justifica.
- **Nota de continuidad:** su calma vocal debe mantenerse estable incluso en el clímax — es el ancla sonora de la nave; cuando finalmente sube el volumen, tiene que sentirse como una ruptura real del patrón.

### COMANDANTE RYLEN HARLAN
*Género: masculino (asumido por descriptores físicos previos — mandíbula marcada, sin pronombre explícito confirmado). 40s.*

- **Timbre:** barítono más filoso que el de Voss — colocación más adelante/nasal que da un brillo metálico, tensión de mandíbula audible en las consonantes.
- **Inglés — Portsmouth (`en-GB`):** formó su inglés en el servicio naval de Portsmouth. Es británico meridional, preciso, persuasivo y estratégicamente cortés; usa understatement y preguntas que ya contienen una conclusión. Al perder control abandona la cortesía antes que la lógica.
- **Español — Buenos Aires (`es-AR`):** formó su español rioplatense en Buenos Aires. Usa voseo natural, ironía porteña contenida y formulaciones pulidas que convierten su ideología en aparente sentido común; bajo presión acorta las frases y aflora el imperativo.
- **Nota de continuidad:** la sonrisa "que nunca llega del todo a los ojos" tiene que oírse — un tono cálido en la superficie con algo frío debajo, en los dos idiomas.

### ELIN RAO — Especialista en IA
*Género: femenino (confirmado por "la involucra"). 30s.*

- **Timbre:** mezzosoprano ligera, aspiración/aire perceptible en reposo, resonancia delgada — pero se endurece y acelera (mismo tono fundamental, más energía) cuando trabaja con sistemas. Este contraste es el rasgo central de su voz.
- **Inglés — Bengaluru (`en-IN`):** formó su inglés tecnológico en Bengaluru. Usa inglés indio urbano, técnico y directo, con base prosódica del sur de India; fuera del trabajo matiza y vacila, mientras que ante datos concluyentes formula declaraciones breves y absolutas.
- **Español — Medellín (`es-CO`):** formó su español profesional en Medellín. Su variedad paisa urbana es cercana pero contenida; alterna tratamientos según confianza. En situaciones sociales deja frases incompletas y al trabajar con sistemas encadena diagnósticos breves sin rodeos.
- **Nota de continuidad:** es la transición Zao→Rao como motor activo de la historia — su voz "de sistemas" debería, en el clímax, empezar a acercarse a la precisión/seguridad de Zao sin imitarla del todo.

### DRA. LIAN SORELL — Xenolingüista
*Género: femenino (confirmado, "Dra."). 30s.*

- **Timbre:** mezzo cálida, rango de alturas amplio y expresivo, resonancia adelante en la máscara (voz que proyecta, hecha para aulas).
- **Inglés — Montréal (`en-CA`):** formó su inglés canadiense en un entorno francófono de Montréal. Conserva una inflexión francesa suave y dicción deliberadamente clara; usa contracciones naturales y preguntas que abren ideas, con elecciones semánticas propias de una lingüista.
- **Español — Santiago del Estero (`es-AR`):** formó su español académico en el noroeste argentino (Santiago del Estero). Usa un castellano argentino interior claro y expresivo, con ll/y menos rehiladas que el porteño; alterna `vos` y `usted` según relación, sin exhibir localismos ni arrastrar inflexión francesa al castellano.
- **Nota de continuidad:** su escena breve con Zao (quince segundos, sobre una traducción Velari) debería sonar genuinamente relajada — es el contraste de referencia antes de la acusación, que le endurece la voz por el resto de la historia.

### LT. CMDR. DARA OKOYE — Jefa de Seguridad
*Género: femenino, fijado por la continuidad vigente.*

- **Timbre:** contralto firme, resonancia de pecho marcada y ataque directo. Sus órdenes son entrenadas y precisas, nunca teatrales; el conflicto aparece en pausas mínimas antes de recuperar la autoridad.
- **Inglés — Enugu (`en-NG`):** formó su inglés educado en Enugu, dentro de un entorno igbo. Conserva ritmo silábico, consonantes muy claras y cierres descendentes; da órdenes inequívocas y expresa duda mediante una pausa o una pregunta exacta.
- **Español — Caracas (`es-VE`):** formó su español operativo en Caracas. Usa español venezolano directo y plenamente gramatical, con verbos operativos, tratamientos respetuosos y cadencia caribeña contenida; sin inflexión igbo ni caricatura fonética en el castellano.
- **Nota de continuidad:** frente a una apelación personal de Harlan, una pausa mínima puede revelar conflicto; la respuesta recupera enseguida la firmeza porque la decisión se expresa mediante la acción, no mediante exposición.

---

## PERFILES ARCHIVADOS DE CONTINUIDADES DEPRECADAS

Estos perfiles no pertenecen al elenco maestro vigente. Se conservan para rescatar material útil y procedencia; no deben usarse para ampliar el master sin una decisión narrativa explícita.

### LT. JUNO CAEL — Piloto / Comunicaciones
*Género: femenino ("Pragmática", confirmado por concordancia). 30s.*

- **Timbre:** alto claro, buena proyección, poca aspiración, ataque rápido en las consonantes (articulación eficiente, de cabina de mando).
- **Inglés:** inflexión galesa/irlandesa — rítmica, rápida, usa muchas contracciones, las frases suelen cerrarse en un corte breve, casi cortante.
- **Castellano (Argentina, cordobés o porteño informal):** voseo, ritmo rápido, tuteo directo, sin rodeos ni formalidades — es la voz más informal de todo el elenco principal.
- **Nota de continuidad:** "voz de la razón" — su tono debería mantenerse estable como contraste incluso cuando todos los demás suben la tensión.

---

### Otros perfiles heredados de la historia completa / versión larga

### ENSIGN PETRA VOLKOV — Ingeniera Junior, protégée de Zao
*Género: femenino (confirmado, "Petra"). Probablemente 20s.*

- **Timbre:** soprano/mezzo joven, más aguda y menos asentada que Zao — todavía sin la "aspereza" ganada por experiencia.
- **Inglés:** inflexión rusa/eslava sobre inglés — vocales más cerradas, ritmo algo más lento y deliberado, tensión audible cuando está nerviosa.
- **Castellano (Perú):** dicción cuidadosa (como quien todavía está formalizando su forma de hablar en el trabajo), se acelera visiblemente en momentos de duelo/tensión.
- **Nota de continuidad:** debería tener ecos audibles del patrón de habla de Zao (mismo tipo de pausa antes de un término técnico) — es su aprendiz, y eso puede vivir en la voz.

### DR. ELENA CARVALHO — Antropóloga / Especialista Cultural
*Género: femenino (confirmado, "Elena"). 30s–40s.*

- **Timbre:** mezzo cálida, resonancia media, cadencia reflexiva (habla como quien piensa en voz alta).
- **Inglés:** inflexión portuguesa/brasileña sobre inglés — vocales abiertas, entonación fluida y algo cantada, ritmo relajado.
- **Castellano (Argentina):** voseo suave, ritmo conversacional, tono cercano — la sospecha por asociación con Sorell debería tensar levemente su cadencia sin cambiar el timbre.

### DR. YUKI TANAKA — Xenobióloga
*Género: sin confirmar en el material previo (Yuki es unisex en japonés) — ajustable.*

- **Timbre:** registro medio, resonancia contenida, voz "de laboratorio" — controlada, sin grandes variaciones de volumen.
- **Inglés:** inflexión japonesa sobre inglés — consonantes suavizadas, ritmo uniforme, pausas breves y regulares entre ideas.
- **Castellano (Argentina):** tono neutro y medido, ritmo parejo, muy poca variación emocional — coherente con un perfil científico observacional.

### DR. RASHID HASSAN — Físico Cuántico
*Género: masculino (confirmado, "Rashid"). 40s–50s probable.*

- **Timbre:** barítono grave, resonancia profunda, textura suave (voz de alguien acostumbrado a explicar cosas complejas con calma).
- **Inglés:** inflexión árabe (levantina/del Golfo) sobre inglés — consonantes marcadas, ritmo pausado, tendencia a alargar levemente las vocales en palabras clave.
- **Castellano (Perú):** ritmo pausado, dicción clara, tono paciente — el mismo carácter "profesor" en los dos idiomas.

### CHIEF WARRANT OFFICER JIN WEI — Comunicaciones
*Género: sin confirmar en el material previo (Jin es unisex) — ajustable.*

- **Timbre:** registro medio-agudo, resonancia nasal ligera, ataque rápido (reflejo de trabajar con señales y tiempos de respuesta cortos).
- **Inglés:** inflexión cantonesa sobre inglés — distinta de la de Zao (mandarín) para diferenciarlas claramente; ritmo más rápido y entrecortado, tono que sube en preguntas y alertas.
- **Castellano (Colombia):** ritmo rápido, tono de alerta constante, muy poca pausa entre frases — es quien detecta primero la señal entrante, así que la urgencia debería vivir en el patrón de habla, no solo en el volumen.

### DR. MARCUS KEENE — Médico
*Género: masculino (confirmado, "Marcus"). 40s probable.*

- **Timbre:** barítono suave, resonancia cálida, ritmo lento — voz pensada para calmar a otros, incluso cuando él mismo está en duda.
- **Inglés:** inflexión irlandesa sobre inglés — cadencia musical, consonantes suaves, tendencia a bajar el volumen en momentos delicados.
- **Castellano (Argentina):** voseo suave, tono contenido, ritmo lento y cuidadoso — mismo carácter apaciguador en los dos idiomas.

### ANSEL VEGA — Técnico de Sistemas
*Género: masculino (asumido). 20s–30s.*

- **Timbre:** registro medio, resonancia poco definida (voz "sin entrenar" a propósito — es alguien fácilmente influenciable, no un orador seguro), tendencia a la aspiración cuando está incómodo.
- **Inglés:** inflexión hispana (español como lengua materna) sobre inglés — consonantes suaves, ritmo algo vacilante, se nota que traduce mentalmente antes de hablar en situaciones de presión.
- **Castellano (Colombia — su lengua materna en la ficción, no un acento "adoptado"):** es el único personaje cuyo castellano no es una inflexión sobre un idioma ajeno sino su voz más natural — más suelto, más rápido, con expresiones coloquiales que en inglés desaparecen. Útil narrativamente: es más él mismo en castellano, lo cual refuerza por qué es tan fácil de manipular en el idioma de trabajo de la nave (inglés).

---

## Notas de producción para Higgsfield

- **Capacidad del proveedor:** volver a verificar límites, modelos y cupos de Higgsfield antes de contratar o generar; esta guía no fija cifras comerciales temporales. La producción vigente sólo necesita resolver las seis voces del elenco maestro.
- **Consistencia de timbre EN/ES:** si clonás una voz a partir de una muestra de audio, subí la misma muestra base para generar tanto la versión en inglés como en castellano — el timbre (altura, resonancia, textura) se mantiene porque viene de la misma muestra; el acento lo controla el idioma/prompt del modelo, no la muestra.
- **Multi-hablante:** para escenas de puente de mando con varios personajes a la vez, Seed Audio 1.0 es el modelo indicado — genera el diálogo y la ambientación juntos, así que conviene tener las descripciones de este documento a mano al escribir el prompt de cada escena grupal.

¿Querés que arme también las fichas de las tres naves/entornos (Ardor, Proxima, la estación Velari) con su "voz" sonora — es decir, el diseño de ambiente/zumbido característico de cada uno, para usarlo como referencia de sonido ambiental?


Vehiculos (solo se escucha en tomas de interiores.):

Ardor = latido propulsivo constante (motor de fusión funcionando), con variantes por zona — puente aislado/silencioso, ingeniería cruda y ruidosa, núcleo diplomático con una capa armónica propia que se desafina cuando está corrupto.
Proxima = sin motor, con ciclo en vez de latido — columna central casi silenciosa, hábitats rotantes con un zumbido cíclico ligado al período de rotación real (1,73 rpm).
Velari = sin nada mecánico, un drone casi coral/microtonal que pulsa junto con la bioluminiscencia — la contraparte sonora exacta del "registro Velari" que ya habíamos definido para la partitura.
