# TechGuide - Guia Integral de Hardware, Mantenimiento y Redes

Plataforma educativa 100% en espanol con guias completas de ensamblaje, mantenimiento y redes de computadoras. Responsiva, modo oscuro/claro y navegacion por modulos.

## Visita la guia

**[https://apaza-victor.github.io/Guia-de-mantenimiento-de-PC/](https://apaza-victor.github.io/Guia-de-mantenimiento-de-PC/)**

## Contenido

### Ensamblaje de PC
- **Herramientas**: ESD, pulsera antiestatica, espacio de trabajo, herramientas de mano
- **Componentes**: CPU, GPU, RAM, motherboard, PSU, almacenamiento, refrigeracion, compatibilidad
- **Paso a Paso**: 9 pasos optimizados (CPU, cooler, RAM, M.2, PSU, GPU, cables, BIOS)
- **Cableado**: alimentacion, datos, video, legados, T568A/T568B, formatos SSD, 80 Plus
- **Checklist**: lista interactiva de verificacion
- **Instalacion Detallada**: procedimiento tecnico de cada componente
- **Sistema Operativo**: instalacion del SO y drivers
- **Electronica Gabinete**: panel frontal, headers, F_PANEL
- **Guia de Puertos**: 20+ puertos y conectores
- **Gabinete**: tipos, flujo de aire, cable management
- **Atajos BIOS**: acceso por fabricante
- **Conceptos Clave**: BIOS/UEFI, overclocking, XMP/EXPO, POST, CMOS

### Mantenimiento de PC
- **Preventivo**: limpieza, pasta termica, monitoreo termico
- **Correctivo**: BSOD, sobrecalentamiento, PC no enciende, lentitud
- **Software de Diagnostico**: HWMonitor, CrystalDiskInfo, MemTest86, CPU-Z, GPU-Z, FurMark, Prime95, AIDA64, HWiNFO, MSI Afterburner, Cinebench, 3DMark, BlueScreenView, WhoCrashed
- **Malware**: virus, troyano, ransomware, spyware, adware, rootkit, keylogger, cryptominer
- **Kit del Tecnico**: 11 herramientas con prioridades
- **Diagnostico**: por sintomas en 10 escenarios
- **Conceptos Clave**: BIOS/UEFI, overclocking, undervolting, XMP/EXPO, POST, CMOS
- **Cables de PSU**: especificaciones y colores de cable
- **Headers**: USB 3.0, USB-C, HD Audio, RGB/ARGB, Fans

### Redes de Computadoras
- **TCP/IP y OSI**: 7 capas, 4 capas, tabla comparativa, protocolos, puertos
- **Topologias**: bus, estrella, anillo, malla, ad-hoc, infraestructura
- **Dispositivos**: NIC, switch, router, hub, repetidor, gateway
- **Direccionamiento IP**: IPv4 (RFC 1918, CIDR, calculadora interactiva), IPv6, Wi-Fi
- **SO de Red**: Windows Server, Linux Server, NAS OS
- **Componentes**: servidor, estacion de trabajo, nodo, NIC
- **Medios**: coaxial, par trenzado, fibra optica, inalambrico
- **Arquitectura**: cliente-servidor vs P2P, dominio broadcast

### Comandos y Atajos
- Comandos tecnicos: CMD/PowerShell, Linux/Bash
- Comandos de red: ping, ipconfig, tracert, nslookup, netstat, arp, nmap
- Puertos de red: tabla de 17 puertos TCP/UDP
- CMD vs PowerShell: tabla de equivalencias
- Variables de entorno Windows
- Atajos de teclado: Windows, Linux, navegadores, Office

### Recursos
- 140+ recursos web organizados en 8 categorias filtrables: hardware y benchmarks, redes, sistemas operativos, herramientas de diagnostico, simuladores y practica, seguridad y privacidad, formacion y certificaciones, comunidades y soporte
- Videos de descarga de simuladores: enlaces a tutoriales de YouTube (Packet Tracer, GNS3, VirtualBox, VMware, PC Building Simulator)

### Referencia de Hardware
- Referencia rapida de hardware: RAM, Cache, PCIe, SATA, Voltajes de PSU
- Formatos de motherboard: E-ATX, ATX, Micro-ATX, Mini-ITX, Nano-ITX, Pico-ITX
- Codigos POST beep

### Instalacion y Almacenamiento
- Sistemas de archivos: FAT32, exFAT, NTFS, ext4, Btrfs, APFS
- Niveles RAID: 0, 1, 5, 6, 10
- Guia USB booteable: Rufus y Ventoy
- Particionado de disco: Windows 11 y Ubuntu
- Checklist post-instalacion (10 items)
- Ajustes de BIOS: Boot Order, XMP, Secure Boot, TPM, Virtualizacion

### Glosario
- Terminos de hardware A-G: BIOS, BCLK, Cache, Chipset, CMOS, Die
- Terminos de hardware I-Z: NVMe, POST, 80 Plus, RAID, SATA, TDP, UEFI, VRM
- Terminos de redes y conectividad: DHCP, DNS, Gateway, IP, LAN/WAN, Latencia, NAT, VPN

## Caracteristicas

- **Responsiva**: se adapta desde 368px hasta pantallas grandes
- **Modo oscuro/claro**: toggle con persistencia en localStorage
- **Navbar horizontal**: enlaces directos a modulos y dropdown de Referencia en el header
- **Logo enlazado**: click en TechGuide lleva al inicio
- **Animaciones**: transiciones suaves con AOS (Animate On Scroll)
- **Calculadora de subred**: herramienta interactiva para calcular rangos IP
- **Filtro de recursos**: pills de categoria para filtrar los 140+ recursos web
- **Tips de simuladores**: lista de consejos para descargar y ejecutar los simuladores de practica
- **Checklist interactivo**: marcar pasos completados del ensamblaje
- **Bloques de codigo**: con boton de copiar al portapapeles
- **Acordeones**: contenido expandible/colapsable en todas las secciones
- **Scroll spy**: resalta la seccion actual en la navegacion

## Tecnologias

- HTML5
- CSS3 (custom properties, grid, flexbox, responsive)
- JavaScript vanilla
- Bootstrap Icons
- AOS (Animate On Scroll)

## Estructura

```
index.html              → Pagina principal (hero + modulos)
assets/
  img/                  → Imagenes y recursos graficos
  css/
    styles.css          → Entry point (tokens, reset y @import de modulos)
    layout.css          → Topbar, navbar, hero, main content, footer
    components.css      → Cards, acordeones, checklist, tablas, code blocks
    responsive.css      → Media queries (breakpoints)
  js/
    theme.js            → Modo oscuro/claro
    nav.js              → Hamburguesa, dropdowns moviles
    ui.js               → Acordeones, checklist, pasos, copiar codigo, busqueda
    subnet.js           → Calculadora de subred
pages/
  ensamblaje/           → Modulo de ensamblaje
    ensamblaje.html     → Hub (indice de subsecciones)
    ens-*.html          → Subsecciones (herramientas, componentes, paso a paso, ...)
  mantenimiento/        → Modulo de mantenimiento
    mantenimiento.html  → Hub (indice de subsecciones)
    man-*.html          → Subsecciones (preventivo, correctivo, software diag, ...)
  redes/                → Modulo de redes
    redes.html          → Hub (indice de subsecciones)
    red-*.html          → Subsecciones (tcp-osi, topologias, ip-address, ...)
  comandos.html         → Comandos tecnicos y atajos de teclado (unidos)
  recursos.html         → Recursos web (webs y enlaces curados)
  referencia.html       → Referencia rapida de hardware (RAM, PCIe, SATA, PSU, MB, beep)
  instalacion.html      → Instalacion y almacenamiento (FS, RAID, USB boot, particionado, post-install)
  glosario.html         → Glosario de terminos tecnicos
```

## License

© 2026 TechGuide · Apaza-Victor. Todos los derechos reservados.

Ninguna parte de esta guia puede ser copiada, reproducida, modificada, distribuida, publicada ni utilizada de ninguna otra forma sin la autorizacion escrita previa del titular de los derechos de autor.
