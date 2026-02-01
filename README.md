# 🎸 Guitar Hero React

Una implementación moderna de Guitar Hero construida con **React**, **TypeScript** y **Vite**, utilizando la **Web Audio API** y **HTML5 Canvas** para una experiencia fluida y precisa.

![Guitar Hero React Preview](https://github.com/user-attachments/assets/c66e927f-5d66-4e55-9b2f-7633280fd29e) <!-- Reemplazar con una imagen real si está disponible -->

## ✨ Características

- 🎯 **Sincronización Precisa**: Motor de juego basado en el tiempo del audio (`AudioContext.currentTime`) para una sincronización perfecta.
- 🔊 **Soporte de Audio Multicanal (Stems)**: Capacidad para cargar archivos de audio separados (guitarra, bajo, batería, voz) que se silencian cuando fallas una nota.
- 📊 **Carga de Canciones**: Soporte para archivos `.chart` (Clone Hero/Feedback) y archivos JSON personalizados.
- 🎨 **Renderizado en Canvas**: Gráficos optimizados utilizando la API de Canvas 2D.
- 🎛️ **Calibración en Tiempo Real**: Ajusta el offset de audio/video durante el juego.
- 🎮 **Múltiples Dificultades e Instrumentos**: Soporte para Easy, Medium, Hard, Expert y diferentes instrumentos definidos en el archivo de la canción.

## 🛠️ Tecnologías

- **Framework**: [React 19](https://react.dev/)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Audio**: [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- **Gráficos**: [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

## 🚀 Inicio Rápido

### Requisitos Previos

- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
- npm o yarn

### Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/guitar-hero-react.git
   cd guitar-hero-react
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## 🎮 Cómo Jugar

### Controles

| Acción | Tecla |
| :--- | :--- |
| **Carril 1 (Verde)** | `A` |
| **Carril 2 (Rojo)** | `S` |
| **Carril 3 (Amarillo)** | `D` |
| **Carril 4 (Azul)** | `F` |
| **Carril 5 (Naranja)** | `J` |
| **Pausar / Reanudar** | `Espacio` |
| **Subir Offset (+10ms)** | `+` o `=` |
| **Bajar Offset (-10ms)** | `-` o `_` |

### Instrucciones

1. **Seleccionar Canción**: En el menú principal, carga un archivo `.chart` o selecciona una carpeta de canción que contenga el archivo de notas y los archivos de audio.
2. **Configurar**: Elige el instrumento (Guitar, Bass, Drums, etc.) y la dificultad.
3. **¡Jugar!**: Presiona las teclas correspondientes cuando las notas lleguen a la zona de impacto en la parte inferior.
4. **Sustains**: Para las notas con "cola", mantén presionada la tecla hasta que la cola termine para obtener puntos extra.

## 📁 Estructura del Proyecto

```text
src/
├── features/
│   └── guitar-game/         # Lógica principal del juego
│       ├── components/     # Menús, resultados, elementos UI
│       ├── constants/      # Configuración, colores, tiempos
│       ├── hooks/          # useGuitarGame, useAudioPlayer, etc.
│       ├── types/          # Definiciones de TypeScript
│       └── utils/          # Parsers de .chart y procesos de audio
├── assets/                 # Estilos globales y archivos estáticos
└── main.tsx                # Punto de entrada de la aplicación
```

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

---
Hecho por [JDavidcor23](https://github.com/JDavidcor23)
