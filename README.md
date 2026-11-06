# 71Three Creative Agency - Clone & Import

Projeto estático importado e analisado a partir de [https://71three.com/](https://71three.com/).

---

## 📋 Análise do Site

A **71Three** é uma agência criativa e boutique digital de Houston, Texas, especializada em web design premium, branding, desenvolvimento e marketing digital.

### 🌟 Destaques de Design e Efeitos Visuais
1. **Preloader com SVG Stroke**: Animação de traçado contínuo da marca com efeito de divisão de obturador (*shutter split*).
2. **Smooth Scroll Nativo**: Integração com a biblioteca **Lenis** para rolagem ultra fluida.
3. **Motion Trail & Microinterações**: Rastro de movimento interativo no hero e cursor reativo.
4. **Carrossel 3D Interativo**: Showcase tridimensional empilhado com cards inclinados para exibição de cases de portfólio (Aquila, JF Vegan, Mr Reward).
5. **Tipografia Premium**:
   - `Maison Neue` (Book, Medium, Demi, Bold)
   - `Apparel` (Regular Italic)
6. **WebGL Neon Tubes Canvas no Rodapé**: Efeito tridimensional interativo no footer alimentado por Three.js / WebGL (`TubesCursor`), gerando tubos neon que seguem o cursor e alternam cores no clique.

---

## 🛠️ Stack Tecnológico

- **HTML5 Semântico**: Estruturação moderna com acessibilidade e seções bem definidas.
- **CSS3 Avançado**: Flexbox, CSS Grid, transformações 3D (`perspective`, `rotate3d`), variáveis CSS e tipografia @font-face customizada.
- **JavaScript & Animações**:
  - `GSAP 3.15` (GreenSock Animation Platform)
  - `ScrollTrigger` (efeitos de scroll e pinning)
  - `SplitText` (animação de corte e revelação tipográfica)
  - `Splitting.js` (divisão de caracteres e palavras)
  - `Lenis 1.0.42` (smooth scrolling)
  - `Three.js` (WebGL Tubes Cursor no rodapé)
  - `imagesLoaded` & `jQuery 3.7.1`

---

## 📂 Estrutura de Arquivos

```text
├── index.html                   # Página inicial principal com animações e 3D
├── about.html                   # Página Sobre
├── contact.html                 # Página de Contato
├── design-development.html       # Página de Design & Desenvolvimento
├── digital-marketing-services.html # Serviços de Marketing Digital
├── latest-work.html             # Portfólio de Projetos
├── README.md                    # Documentação do projeto
└── assets/
    ├── css/
    │   ├── common-header.css    # Estilos globais, menu drawer, fontes
    │   ├── new-home.css         # Estilos da homepage e seções 3D
    │   ├── fontawesome-6.css    # Ícones FontAwesome
    │   └── ...                  # Estilos complementares das subpáginas
    ├── fonts/
    │   ├── maison/              # Família Maison Neue (woff / woff2)
    │   ├── apparel/             # Família Apparel Italic (woff / woff2)
    │   └── webfonts/            # FontAwesome webfonts
    ├── images/
    │   ├── 3d-carrousle/        # Imagens para o carrossel 3D (Aquila, JF Vegan, Mr Reward)
    │   ├── moving-img/          # Galeria de imagens em movimento
    │   ├── new-home/            # Cards de scroll
    │   ├── portfolio-image/     # Imagens de cases e trabalhos
    │   ├── site-logo.svg        # Logotipo principal
    │   └── site-logo-white.svg  # Logotipo versão branca
    ├── js/
    │   ├── common-header.js     # Header, controle de menu drawer, Lenis
    │   ├── new-home.js          # Controladores de animação da home e 3D
    │   └── vendor/              # Bibliotecas locais (GSAP, SplitText, Lenis, Tubes, etc.)
    └── videos/
        ├── 7d.mp4               # Vídeo de background desktop
        └── 7m.mp4               # Vídeo de background mobile
```

---

## 🚀 Como Executar Localmente

Como o projeto utiliza módulos ES (`import` para o Three.js TubesCursor) e carregamento de vídeos/fontes locais, ele deve ser servido através de um servidor HTTP local.

### Opção 1: Via Node.js (npx)
```bash
npx serve
```
ou
```bash
npx live-server
```

### Opção 2: Extensão do VS Code
- Abra a pasta no VS Code e clique em **Go Live** na barra inferior (extensão *Live Server*).

