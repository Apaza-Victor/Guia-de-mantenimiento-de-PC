# TechGuide - Guia Integral de Hardware, Mantenimiento y Redes

Plataforma educativa 100% en espanol con guias completas de ensamblaje, mantenimiento y redes de computadoras. Responsiva, modo oscuro/claro y navegacion por dropdowns.

## Visita la guia

**[https://apaza-victor.github.io/Guia-de-mantenimiento-de-PC/](https://apaza-victor.github.io/Guia-de-mantenimiento-de-PC/)**

## Contenido

### Ensamblaje de PC
- Herramientas y seguridad (ESD, pulsera antiestatica, espacio de trabajo)
- Componentes: CPU, GPU, RAM, motherboard, PSU, almacenamiento, refrigeracion
- Compatibilidad CPU Intel vs AMD (sockets, TDP, DDR)
- VRAM y tipos de memoria de video (GDDR6/GDDR6X/HBM)
- DDR4 vs DDR5: frecuencias, latencias, ancho de banda
- Anatomia detallada de motherboard (socket, VRM, chipset, PCIe, M.2, CMOS)
- Guia paso a paso (9 pasos: CPU, cooler, RAM, M.2, PSU, GPU, cables, BIOS)
- Cableado: conectores de alimentacion (ATX 24-pin, EPS 8-pin, PCIe 6+2, SATA, Molex)
- Cableado: datos y video (SATA III, HDMI, DisplayPort, USB, Thunderbolt)
- Conectores legados: LPT, PS/2, FireWire, eSATA, SCSI, RCA, BNC, Toslink
- Normas RJ-45 T568A/T568B con tabla de colores
- Tabla de formatos SSD (2.5", M.2, NVMe Gen3/4/5, U.2)
- Certificaciones PSU 80 Plus (efficiency table)
- Nomenclatura y abreviaturas de componentes
- Instalacion detallada de cada componente
- Instalacion del sistema operativo
- Electronica del gabinete y panel frontal (headers, F_PANEL)
- Checklist interactivo (25 items)

### Mantenimiento de PC
- Preventivo: limpieza interna/externa, pasta termica, monitoreo termico
- Correctivo: BSOD, sobrecalentamiento, PC no enciende, lentitud
- Codigo BSOD: 9 codigos especificos con soluciones
- Software de diagnostico: HWMonitor, CrystalDiskInfo, MemTest86, CPU-Z, GPU-Z, FurMark, Prime95, AIDA64, HWiNFO, MSI Afterburner, Cinebench, 3DMark, BlueScreenView, WhoCrashed
- Comandos de diagnostico: DISM, mdsched, powercfg, wmic, systeminfo
- Tipos de malware: virus, troyano, ransomware, spyware, adware, rootkit, keylogger, cryptominer
- Kit del tecnico: 11 herramientas con prioridades
- Diagnostico rapido por sintomas (10 escenarios)
- Conceptos clave: BIOS/UEFI, overclocking, undervolting, XMP/EXPO, POST, CMOS
- Cables de alimentacion con especificaciones y colores de cable
- Headers internos: USB 3.0, USB-C, HD Audio, RGB/ARGB, Fans

### Redes de Computadoras
- TCP/IP y modelo OSI (7 capas, 4 capas, tabla comparativa)
- Tipos de redes: PAN, LAN, MAN, WAN, GAN
- Ethernet: normas 10BaseT hasta 10GBaseT
- Protocolos: HTTP, FTP, DNS, DHCP, SMTP, SSH, Telnet, SNMP, TCP, UDP, IP, ICMP, ARP
- Topologias: bus, estrella, anillo, malla, ad-hoc, infraestructura
- Dispositivos: NIC, switch, router, hub, repetidor, gateway
- Cableado: UTP, STP, FTP, fibra optica, coaxial, catalogo CAT
- IPv4: rangos privados RFC 1918, CIDR, calculadora de subred interactiva
- IPv6: comparativa con IPv4
- Wi-Fi: 802.11n/ac/ax/be
- Componentes de red: servidor, estacion de trabajo, nodo, NIC
- Medios de transmision: coaxial, par trenzado, fibra optica, inalambrico
- Arquitectura de red: cliente-servidor vs P2P, dominio broadcast
- Guia visual de 20+ puertos y conectores (USB, video, red, audio, serial)
- Gabinete: tipos, panel frontal, flujo de aire, cable management
- Sistemas operativos de red: Windows Server, Linux Server, NAS OS
- Atajos de teclado: Windows, Linux, navegadores, Office
- Atajos de BIOS por fabricante (ASUS, MSI, Gigabyte, Dell, HP, Lenovo)
- Comandos de red: ping, ipconfig, tracert, nslookup, netstat, arp, nmap
- Comandos tecnicos: CMD/PowerShell, Linux/Bash
- Puertos de red: tabla de 17 puertos TCP/UDP
- CMD vs PowerShell: tabla de equivalencias
- Variables de entorno Windows
- Conceptos clave: BIOS/UEFI, overclocking, undervolting, XMP, POST, CMOS

### Referencia y Recursos
- Atajos de teclado: Windows (16), Linux (10), BIOS/UEFI (8), Navegadores, Office
- Referencia rapida de hardware: RAM, Cache, PCIe, SATA, Voltajes de PSU
- Formatos de motherboard: E-ATX, ATX, Micro-ATX, Mini-ITX, Nano-ITX, Pico-ITX
- Codigos POST beep
- Sistemas de archivos: FAT32, exFAT, NTFS, ext4, Btrfs, APFS
- Niveles RAID: 0, 1, 5, 6, 10
- Guia USB booteable: Rufus y Ventoy
- Particionado de disco: Windows 11 y Ubuntu
- Checklist post-instalacion (10 items)
- Ajustes de BIOS: Boot Order, XMP, Secure Boot, TPM, Virtualizacion
- Glosario de terminos tecnicos (30+ terminos)
- 65+ recursos web: hardware, redes, SO, certificaciones, comunidades, foros

## Caracteristicas

- **Responsiva**: se adapta desde 368px hasta pantallas grandes
- **Modo oscuro/claro**: toggle con persistencia en localStorage
- **Navbar horizontal**: dropdowns por categoria en el header
- **Logo enlazado**: click en TechGuide lleva al inicio
- **Animaciones**: transiciones suaves con AOS (Animate On Scroll)
- **Calculadora de subred**: herramienta interactiva para calcular rangos IP
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
pages/
  ensamblaje.html       → Guia completa de ensamblaje
  mantenimiento.html    → Mantenimiento preventivo y correctivo
  redes.html            → Fundamentos de redes completos
  recursos.html         → Referencia rapida y recursos web
css/styles.css          → Estilos personalizados (tema oscuro/claro)
js/script.js            → Funcionalidad interactiva
```

## License

MIT
