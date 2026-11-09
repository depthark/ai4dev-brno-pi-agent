# GLaDOS – my personal pi agent · osnova a študijný materiál

**AI 4 DEV Brno · 12. 11. 2026 · 30 min · Lukas Chylik**
Čísla sú namerané na mojom PC, stav k 2. 11. 2026. Poradie slidov je podľa Keynote verzie, webová verzia má rovnaký obsah a pár slidov naviac.
Slidy aj animácie v Keynote sú po anglicky; poznámky pre prezentujúceho a táto osnova sú po slovensky.

> **Jedna veta, o čom to je:** Na jednom hernom PC beží osobný AI agent GLaDOS. Ovládam ho cez Discord a rozumie textu, hlasu aj obrázkom, kreslí a ovláda prehliadač aj aplikácie. Všetko lokálne, za elektrinu asi 70 Kč týždenne.

---

## Časový plán (30 min)

| Blok | Slidy | Čas | Live demo |
|---|---|---|---|
| 1 Úvod | 1–6 | 5 min | – |
| 2 Inferencia | 7–16 | 9 min | – |
| 3 Qwen a pi | 17–19 | 3 min | – |
| 4 Discord a d1 | 20–25 | 5 min | /add-to-playlist |
| 5 Schopnosti | 26–32 | 6 min | hlas, zrak, obrázok, browser, desktop |
| 6 Realita | 33–36 | 2 min | – |

Rezerva nie je, plán je na 30 minút presne: keď sa niečo natiahne, skráť históriu modelov (9 a 12) alebo parametre (15). Ak demo zlyhá, ukáž slide a choď ďalej, na každom slide je výsledok.

**Ovládanie prezenterom:** jedno stlačenie = jeden slide. Obsah slidu sa po prechode objaví sám, postupne. Animácie (oko, experti, pamäť, MTP) sú videá a spustia sa samé. Netreba klikať navyše, takže sa nemôžeš „stratiť v animáciách“. Ak je slide ešte rozbehnutý a stlačíš ďalej, preskočí rovno na ďalší.

**Animované slidy (čo kedy ukazujú):**
- **1, 2, 36 – oko GLaDOS:** pomaly rotuje a rozhliada sa, beží dokola.
- **10 – Mixture of Experts (10 s, dokola):** päť vrstiev ako 3D mriežky 16 × 16 = 256 expertov. Pod tým sa píše veta token po tokene a pri každom tokene router rozsvieti v každej vrstve iných 8 expertov. Na tom vysvetlíš „8 z 256“.
- **11 – Kde čo beží (12,5 s, raz, ostane posledný obraz):**
  1. súbor modelu 21,1 GiB sa rozdelí na attention (2,4 GB, modrá) a expertov (18,7 GB, oranžová);
  2. attention letí na grafiku, experti do RAM;
  3. na GPU narastie KV cache, MTP, výpočtový buffer a Windows, v RAM zrak, d1 a Windows;
  4. cez PCIe priletí cache horúcich expertov (6,4 GB) a stĺpce sa dopočítajú na 11 549 / 12 282 MiB a ~26 / 48 GB.
  Rozprávaj podľa toho, čo práve letí.
- **14 – MTP (8 s, dokola):** hore píše model bez MTP, dole s MTP. Fialové prerušované tokeny sú tipy, zelené prijaté, červené zahodené. Spodný riadok je zakaždým vpredu.

**Pred talkom:**
- `!status` v Discorde: vidno model, router a kontext.
- `/reset` v demo kanáloch.
- Mobil nabitý, hlasovku si raz vyskúšaj.
- Na PC zatvor nepotrebné okná: agent-desktop robí screenshot okna, nie celej plochy.

---

## 1 · Úvod

### 1. Cover: „GLaDOS – my personal pi agent“
- **Povedz:** toto je GLaDOS, môj osobný pi agent. Beží lokálne, žiadne API, nič neodchádza do cloudu.
- **Hook:** áno, podľa AI z Portalu, a áno, osobnosť má podobnú.
- **Na slide** je animované oko AI jadra (video). Ak chceš skutočný GLaDOS, vlož vlastný klip z Portal 2 (pozri koniec dokumentu).
- **Lama** je len na slide s WattLlamou.

### 2. Agenda
- Šesť „testovacích komôr“ (motív Portal/GLaDOS), z toho 6 živých ukážok. Oko sa pri prechode zmenší do rohu.

### 3. „Jeden herný počítač. Šesť AI modelov. 0 Kč za API.“
- Tri vety sa objavia postupne, nechaj ich dočítať. Potom: ovládam ho z Discordu, z mobilu aj z PC, beží 24/7.
- Persona je obyčajný súbor `SOUL.md`.
- Odpovedá v ktoromkoľvek kanáli môjho Discord servera „Pi Agent“ bez tagovania, ale **len mne** (allow-list user ID).

### 4. Architektúra
**Discord → bridge → pi agent → llama.cpp router :8080**
- **Bridge:** Node, discord.js v14 a pi SDK, asi 1 900 riadkov. Jedna pi session na kanál.
- **Router:** jeden llama-server bez `-m`, s `--models-dir`, `--models-preset models.ini`, `--models-autoload`, `--models-max 3`. Modely načítava a uvoľňuje podľa potreby (`POST /models/load|unload`).
- **Na pozadí (Windows Task Scheduler):**
  - hodinový AI brief;
  - CSS CzechoSlovakia novinky (#novinky, #ai, #tipy-a-triky, #udalosti);
  - hry zadarmo (2× denne);
  - kino;
  - watchdog;
  - nočný update o 00:00 s testami;
  - WattLlama.

### 5. Herdr: velín pre agentov
Kde pi beží, keď nie je v Discorde. **Herdr** (herdr.dev, open source, Apache 2.0) je multiplexer pre coding agentov, niečo ako tmux, ale vie, čo agenti robia. Z Warpu som naň prešiel 3. 11. 2026.

**Pridaná hodnota:**
- viac agentov naraz v panes, tabs a workspaces (pi, Claude Code, OpenCode…);
- pri každom pane stav: working, done, blocked (čaká na schválenie), a notifikácia, keď ma agent potrebuje;
- session beží aj po zatvorení okna; po reštarte sa vráti tá istá pi konverzácia;
- štartuje s PC: Windows Terminal → Herdr → pi (`start-herdr.ps1` v HKCU Run).

**Extension pre pi** (`~/.pi/agent/extensions/herdr-agent-state.ts`, `herdr integration install pi`): pi hlási Herdru svoj stav namiesto toho, aby ho Herdr odhadoval z obrazovky.
- `session_start` → ID session (kvôli obnoveniu po reštarte);
- `agent_start` → working, `agent_settled` → idle / done;
- dialóg so schválením (`ui.custom` s `blocked`, novinka pi 1.5) → blocked aj s textom otázky.

Mimo pane v Herdri (`HERDR_ENV`) a mimo TUI režimu nerobí nič, takže GLaDOS v Discorde (pi cez SDK) sa ho netýka.

### 6. Všetky modely

| Model | Úloha | Disk | VRAM | RAM | Kedy |
|---|---|---|---|---|---|
| Qwen 3.6 35B-A3B MTP (UD-Q4_K_M) | mozog | 22,7 GB | ~10,8 GB | experti 18,7 GB (mmap) | stále |
| d1-2B Q4_K_M | rozhodnutia | 1,1 GB | 0 | 1,0 GB | stále, CPU 4 vlákna |
| LFM3-VL-2B Q4_K_M + mmproj Q8 | zrak | 1,3 GB | 0 | 1,9 GB | stále, CPU 4 vlákna |
| Qwen-Image 2.1 base Q4_K + Turbo Q4_K_M | kreslenie | 8,4 GB | ~6 GB spolu | ~15 GB spolu | len pri kreslení |
| Qwen3-VL-8B Q4_K_M + mmproj F16 + VAE bf16 | text encoder a dekodér obrázkov | 6,9 GB | (v riadku vyššie) | (v riadku vyššie) | s Qwen-Image |
| Cactus Whistle | reč na text, EN | 17 MB | 0 | málo | na hlasovku |

- **Spolu:** približne 40 GB na disku.
- **V pokoji:** 11,5 z 12 GB VRAM a približne 26 zo 48 GB RAM celého PC.

---

## 2 · Inferencia

### 7. Divider „Inferencia na hernom PC“

### 8. Hardvér
- RTX 4070 12 GB, i7-9700K (8 jadier, 8 vlákien), 48 GB DDR4.
- RAM beží na **2400** MHz, hoci je to 2666 kit (XMP v BIOSe nie je zapnuté).
- Doska B360 má **PCIe 3.0 x16**, teda približne 16 GB/s teoreticky. To je úzke hrdlo pri prefille.

### 9. História modelov 1/2: mozog, ktorý sa zmestí do 12 GB
Postupne, ako jeden krok viedol k ďalšiemu:
1. **Qwen2.5-14B-Instruct (do júna 2026):** dense, celý na GPU. Na chat stačil, v reťazcoch nástrojov sa strácal, odpovede boli slabé.
2. **Qwen3-14B (jún – september):** dense, 11,9 GB VRAM, 32k context, ~25 tok/s (25,4 na 5k prompte). Tri lekcie:
   - pred každou odpoveďou premýšľal ~300 tokenov → `reasoning-budget 0`;
   - skutočný článok o GPT-6 z `web_search` nazval „špekuláciou“, lebo bol novší ako jeho tréning → pravidlo v `SOUL.md`: výstup nástroja je pravda, pamäť modelu nie;
   - viackrokové ovládanie agent-browsera cez shell trvalo > 280 s → zabalený ako tool priamo v extension: 0,4–1,1 s.
3. **Qwen3.6-35B-A3B (5. 9. 2026):** dense 27B by sa na jednu 12 GB kartu nezmestil (kamoš ho púšťa na dvoch GPU), preto MoE verzia: 35B parametrov, ~3B aktívnych na token.
   - Odhadoval som 12–18 tok/s, reálne **34,5 tok/s** pri 11,4 GB, lebo má len 2 KV heads a malú KV cache.
   - Prvé odpovede prišli **prázdne**: Qwen3.6 ignoruje `reasoning-budget 0`, celú odpoveď dal do `reasoning_content`, `content` ostal prázdny. Pomohol až `reasoning = off`.
   - Prefill bol 3,2× pomalší ako pri 14B (545 vs 1 772 tok/s), generovanie o 28 % rýchlejšie. Pre chat výhra.

### 10. Mixture of Experts
- **Qwen3.6-35B-A3B:** 35,51 mld. parametrov, 40 vrstiev, v každej 256 expertov, na token sa použije 8. Aktívne sú približne 3 mld. parametrov, odtiaľ „A3B“.
- **Hybridná architektúra:** iba **10 zo 40 vrstiev má plnú attention** (s KV cache). Zvyšných 30 je lineárna attention (Gated DeltaNet) s malým rekurentným stavom. Preto je KV cache pre 64k kontextu len 680 MB.
- **Dimenzie:** n_embd 2048, 16 hlavičiek, 2 KV hlavičky, trénovaný kontext 262 144.
- **Kvantizácia:** súbor UD-Q4_K_M od unsloth, 21,10 GiB, 5,10 bitu na váhu. „UD“ znamená Unsloth Dynamic: dôležité vrstvy majú vyššiu presnosť.

### 11. 3D mapa „Kde čo beží“
Namerané z buffer reportu llama.cpp (`-lv 4`) 2. 11. 2026.

**VRAM (CUDA0):**

| Časť | MiB |
|---|---|
| váhy na GPU (attention, embeddingy, router, MTP váhy) | 2 426 |
| KV cache (10 vrstiev × 65 536 tokenov, K a V q8_0, každé 340) | 680 |
| rekurentný stav lineárnej attention | 188 |
| MTP draft kontext (KV f16 128, compute 2 × 108) | 344 |
| **MoE cache** | **6 399** (pre 18 662 MiB expertov, ~34 %) |
| compute buffer | 738 |
| Windows a plocha | ~775 |
| **spolu (nvidia-smi)** | **11 549 z 12 282** |

**RAM:**
- experti ako mapovaný súbor `CPU_Mapped`, spolu 19 177 MiB (vrátane výstupnej vrstvy);
- pinned buffery `CUDA_Host` približne 460 MiB;
- d1 1 GB, LFM3-VL 1,9 GB.

**Ako to funguje:**
1. Token prejde attention na GPU.
2. Router vyberie 8 expertov.
3. Experti, ktorí sú v LRU cache na GPU, počíta GPU. Ostatných počíta CPU z RAM (`n-cpu-moe 40`).
4. Pri prefille (veľké dávky) llama.cpp posiela expertov cez PCIe na GPU, raz za ubatch.

**Prompt cache:** llama-server drží v RAM cache promptov až do 8 GB (`--cache-ram`, predvolené). Opakovaný začiatok konverzácie sa preto neprepočítava.

### 12. História modelov 2/2: potom zrýchlenie
Pravidlo pri ladení: každý krok zmerať, nechať len to, čo je rýchlejšie.

| Dátum | Zmena | Čo priniesla | Čo som pri tom zistil |
|---|---|---|---|
| 5. 9. | `n-cpu-moe 24` | 34,5 tok/s, 11,4 GB | pri 20 útes: VRAM plná, driver stránkuje, 14,9 tok/s |
| 27. 9. | MTP variant + 64k context | kód 36,5 → 52,4 tok/s (+44 %) | rovnaké váhy + 0,5 GB draft head; 3 drafty nepridali nič |
| 27. 9. | `batch 4096 / ubatch 2048` | prefill 338 → 656 tok/s pri 19k | experti idú cez PCIe raz za batch; ubatch 4096 padne na 154 |
| 16. 10. | `n-cpu-moe 40` + `moe-cache-mib 6400` | kód 45 → 56 tok/s, 50k generovanie 40 → 49 | novinka llama.cpp v0.7.0; 6 900 MiB pri 50k pretečie |

**Vyskúšané a zahodené:**
- **KAT-Coder-V2.5-Dev** (Qwen3.6 doučený na kód): 41,9 tok/s, qeval 39/44 vs 41/44, pi agent 8/10 vs 9/10. Menší súbor (IQ4_XS) neznamená rýchlejší, IQ quanty sú pomalé na CPU expertoch.
- **Thinking mode:** ~24 tok/s a ~10k tokenov na úlohu, ako default príliš pomalý.
- **Qwen3.8-27B na Kaggle TPU:** stroskotal na chybe platformy (TPU worker hostname).
- **ik_llama.cpp:** na Qwen3.6 MoE pomalší ako mainline.

### 13. Ladenie (graf)
Meranie zo 16. 10., llama.cpp b11669. Formát: vrstvy expertov v RAM + MoE cache.

| Nastavenie | Kód tok/s | Generovanie pri 50k tok/s | Poznámka |
|---|---|---|---|
| 26, bez cache | 45,4 | 40,5 | pôvodné |
| 30 + 1 GB | 27,9 | 24,6 | malá cache prehráva |
| 34 + 3 GB | 39,7 | 37,3 | |
| 40 + 5 GB | 45,6 | 41,4 | |
| **40 + 6,4 GB** | **55,9** | **48,7** | **zvolené** |
| 40 + 6,9 GB | 58,0 | **33,6** | VRAM pretečie pri 50k |

**Ponaučenie:** všetci experti v RAM s veľkou LRU cache porazia statické „časť vrstiev na GPU“.

### 14. MTP +44 %
- **Princíp:** model má vlastnú multi-token-prediction hlavu, ktorá navrhne ďalšie 2 tokeny (`spec-draft-n-max 2`). llama.cpp ich overí v jednom forward passe a prijme tie, čo sedia.
- **Zapnutie:** `spec-type = draft-mtp`. Model musí byť MTP GGUF (unsloth Qwen3.6-35B-A3B-MTP-GGUF).
- **Merania (s MTP oproti bez):**
  - kód 36,5 → 52,4 tok/s (+44 %);
  - próza 40,1 → 43,5 tok/s;
  - JSON 37,8 → 46,6 tok/s.
- `spec-draft-n-max 3` už nepridal nič. `spec-draft-n-ubatch 512` ušetrí približne 100 MB VRAM.
- **Prečo pri kóde najviac:** kód je predvídateľný (zátvorky, kľúčové slová), takže tipy sa častejšie trafia.

### 15. Parametre (`models.ini`): čo znamenajú a čo priniesli
| Parameter | Čo znamená | Čo mi to prinieslo |
|---|---|---|
| `n-gpu-layers = 99` | všetky vrstvy na GPU (attention, embeddingy, router) | základ, bez neho beží attention na CPU |
| `n-cpu-moe = 40` | z týchto vrstiev vráti do RAM len expert tensory, všetkých 40 vrstiev | 35B model na 12 GB; bez neho llama.cpp presúva len celé vrstvy aj s attention a je to nepoužiteľné |
| `moe-cache-mib = 6400` | LRU (od v0.8.0 SLRU) cache horúcich expertov na GPU | kód 45 → 56 tok/s, 50k generovanie 40 → 49; 6 900 pri 50k padne na 33,6 |
| `ctx-size = 65536` | 64k tokenov kontextu (predtým 32k) | dlhé konverzácie bez compaction; KV cache len 680 MB, lebo plnú attention má iba 10 zo 40 vrstiev |
| `cache-type-k/v = q8_0` | KV cache v 8 bitoch namiesto 16 | polovičná pamäť; pri 64k 50 vs 26 tok/s, kódový test 28/33 vs 26/33 (f16/q8: 30 tok/s, 28/33) |
| `batch-size 4096`, `ubatch-size 2048` | koľko tokenov promptu sa spracuje naraz | prefill 338 → 656 tok/s (19k), 310 → 562 (41k); ubatch 4096 sa zrúti na 154/110 |
| `spec-type = draft-mtp`, `spec-draft-n-max = 2` | MTP head tipuje 2 tokeny dopredu, overia sa v jednom forward passe | kód +44 %, próza +8 %, JSON +23 % |
| `spec-draft-n-ubatch = 512` | menší batch pre draft context | ~100 MB VRAM ušetrené, bez straty |
| `flash-attn = on` | rýchlejšia attention s menšou pamäťou | potrebné pre q8_0 KV cache |
| `parallel = 1` | jeden slot, jeden používateľ | celá KV cache pre jednu konverzáciu |
| `reasoning = off` | vypne premýšľanie | Qwen3.6 ignoruje `reasoning-budget`; bez toho prázdne odpovede v Discorde |
| `--models-max 3` (router) | koľko modelov drží router naraz | Qwen na GPU, d1 a LFM3-VL na CPU (`device = none`, `n-gpu-layers = 0`, `threads = 4`) súčasne |

**Tip na otázku „čo ďalej“:** llama.cpp pri štarte radí `--load-mode none` (namiesto mmap pri tensor overrides). Zatiaľ nemerané.

### 16. Rýchlosť

| Meranie | Hodnota |
|---|---|
| generovanie bežného textu | ~70 tok/s (69–73) |
| generovanie kódu | 64–67 tok/s |
| prefill na 27k prompte | ~805 tok/s |
| kontext | 64k |
| VRAM | 11,6 GB |

Grafika je na hrane: o 0,5 GB väčšia MoE cache (6 900 MiB) spôsobí, že pri dlhých promptoch výkon spadne asi o tretinu.

---

## 3 · Qwen a pi

### 17. Divider „Mozog a agent“

### 18. Na čo používam Qwen
- chat s osobnosťou;
- web: `web_search` (Google → Bing → DuckDuckGo → Mojeek) a `browse` (skutočný Chromium);
- kódovanie v #coding;
- CSS novinky po česky;
- preklad promptov pre obrázky;
- súkromné dáta (všetko ostáva doma).

### 19. pi: agent ako knižnica
- **pi** (`@earendil-works/pi-coding-agent`, pi.dev) je open-source coding agent ako Claude Code. Používam ho cez SDK `createAgentSession`.
- **Inštalácia:** cez **bun**. Dnes je to **pi 1.5.0**, `selfUpdateCommand` je nastavený na bun, aby nevznikla druhá kópia cez npm.
- **Nástroje:** bash, read/write/edit, web_search, browse a **codemode** (model píše skript, ktorý volá nástroje, a ušetrí tak kolá).
- **Skilly:** markdown návody (hry zadarmo, agent-browser, agent-desktop).
- **d1** je pre pi natívny „classifier“ cez llama.cpp provider (`output_modalities: decisions`).
- **Kontext:** 64k. Pri zaplnení pi kompaktuje (zhrnutie starších správ robí ten istý Qwen).
- **Nočný update** (00:00):
  - aktualizuje llama.cpp (stabilná vetva), pi a závislosti bridge;
  - potom 11 testov: odpovedá, nástroje, d1, **zrak**, brief, hry, browse, search;
  - ak padne kritický test, nasleduje **automatický rollback**.

---

## 4 · Discord a decision model

### 20. Divider „Discord a decision model“

### 21. Discord bridge
- **Kanál = konverzácia:** sessions sa ukladajú do `sessions/channel-sessions.json`, po 180 min nečinnosti začne nová.
- **Bez tagovania** v celom serveri „Pi Agent“. Na verejnom serveri CSS CzechoSlovakia môže GLaDOS volať len vlastník.
- **Len ja:** `DISCORD_ALLOWED_USERS`, fail-closed (prázdny zoznam znamená nikto).
- **Priebežné správy:** nástroj `progress_update` posiela ⏳ správy a je jediná cesta, ako poslať súbory (max 4, 8 MB).
- **Model na kanál:** `/model`, lokálny alebo free model z OpenRouter.
- **Tokeny** Discordu a GitHubu sa pri štarte vymažú z prostredia, agent ich cez shell nevidí. Overené: predtým ich vedel prečítať.
- **Hlasovka** funguje v ľubovoľnom kanáli, **obrázok** v ľubovoľnom kanáli (zrak), **#image-generator** kreslí.

### 22. Slash commandy: všetkých 18
**Coding a agent (9):**
- `/ask`: bežná otázka pre GLaDOS.
- `/search`: web search priamo cez tool, bez toho, aby model hádal (raz tvrdil, že vyhľadávanie nefunguje).
- `/browse`: otvorí stránku v skutočnom prehliadači (agent-browser) a prečíta ju.
- `/skill`: spustí jeden zo skillov (s voliteľnými inštrukciami).
- `/model`: ukáže alebo prepne model kanála.
- `/switch-free-coding-models`: vyberie bezplatný coding model z OpenRouteru pre kanál, default je lokálny Qwen; pri chybe fallback na Qwen.
- `/get-new-models`: nové stealth a bezplatné coding modely z OpenRouteru.
- `/status`: model, zdravie routera, zaplnenie kontextu (aj `!status`).
- `/reset`: nová konverzácia v kanáli (aj `!reset`).

**Osobné (6):**
- `/get-news`: AI brief hneď, voliteľne aj do #ai-news.
- `/check-games`: hry zadarmo (Epic, GOG, Steam), voliteľne aj claim.
- `/key`: aktivuje Steam kľúč, správu potom zmaže.
- `/what-the-track`: čo práve hrá Rádio FM, s odkazom na Spotify.
- `/add-to-playlist`: pridá skladbu do správnych Spotify playlistov (kód + MusicBrainz + d1).
- `/cinema [deň]`: program Cinema City Velký Špalíček, JSON API bez kľúča.

**CSS CzechoSlovakia, verejný server, len ja (3):** `/css-news` (Chrome a WebKit), `/css-ai-news` (AI v CSS a frontende), `/css-tips-and-tricks`. Bežní členovia ich nevidia a každý funguje len vo svojom kanáli.

**Princíp:** fakty rieši kód, model je len tam, kde treba úsudok.

### 23. d1-2B
- **Čo to je:** LiquidAI d1 negeneruje text. Dostane stav a otázky a vráti pravdepodobnosti.
- **Endpoint:** llama.cpp `/v1/systemone`.
- **Typy otázok:** `noul` (áno/nie, vráti P), `choice` (výber z možností), `score`.
- **Výkon:** CPU, 4 vlákna, 1 GB. Krátka otázka 1,0 s, otázka na novinku 4,0 s.
- **Výmena 3B → 2B** (28. 10.), na ručne označených dátach:

| Test | 3B | 2B |
|---|---|---|
| novinky (z 8 skutočných / 58 šumu) | 4/4 | 5/0 |
| duplicity (zo 6) | 4 | 6 |
| oblasti llama.cpp (z 35) | 23 | 26 |
| hudba DnB (z 12) / falošné (z 24) | 11/1 | 10/0 |
| čas na otázku | 6,4 s | 4,0 s |

- 2B dáva vyššie P, preto prah briefu stúpol z 0,6 na 0,85.

### 24. /add-to-playlist (LIVE)
1. Kód zistí, čo hrá Rádio FM, a nájde skladbu na Spotify.
2. Kód sa pozrie do MusicBrainz, či je interpret z CZ/SK.
3. d1 dostane otázky „je to DnB?“ a „je to indie?“. Prahy: áno pri P ≥ 0,8, nie pri P ≤ 0,4, medzi tým sa pýta mňa.
4. Kód pridá skladbu do playlistu „DnB [2026]“ a ponúkne menu ďalších playlistov s tlačidlom Späť.

**Výsledok na 36 skladbách:** 10/12 DnB spoznal, 0/24 omylom označil.

**Záloha:** ak rádio hrá reklamu, demo zopakuj o minútu alebo ukáž slide.

### 25. AI brief
- Každú hodinu stiahne približne 1 400 titulkov: RSS (HN frontpage cez hnrss), weby bez RSS, commity llama.cpp.
- **Filter:** d1 pustí P ≥ 0,85 (5 z 8 skutočných noviniek, 0 z 58 šumu). Ďalšia otázka d1 stráži duplicity.
- **Pravidlo:** nič nové znamená nič neposlať.
- Rovnaký mechanizmus plní CSS kanály.

---

## 5 · Schopnosti

### 26. Divider „Hlas, zrak a ruky“

### 27. Hlas (LIVE)
1. Bridge stiahne hlasovku.
2. ffmpeg ju prevedie na 16 kHz mono WAV.
3. **Whistle** (Cactus Compute, 17 MB, vlastný CPU engine) ju prepíše: 10 s nahrávky za 0,3 s.
4. GLaDOS najprv vypíše, čo počul (`> 🎙️ …`), potom odpovie.

**Jazyk:** len angličtina. „Slovenský jazyk“ prepísal ako „Somenski y Azik“.

**Prečo nie LFM3-Audio/Omni:** jeho reč nepodporuje slovenčinu ani češtinu (ar, da, de, el, en, fi, fr, he, it, ja, ko, nl, pl, pt, es, sv, tr, zh).

### 28. Zrak (LIVE)
- **Problém:** Qwen 3.6 je text-only a GPU je plná.
- **Riešenie:** LFM3-VL-2B na CPU.
- **Postup:**
  1. Obrázok (príloha, alebo správa, na ktorú odpovedám) ide do `lib/vision.mjs`.
  2. Model ho opíše a odcituje všetok text.
  3. Opis ide Qwenu ako „[Image attached … described by a separate vision model]“.
- **Nastavenie:** `reasoning = off` (inak premýšľal a nezmestil sa do limitu). Otázku používateľa mu **neposielam**, lebo malý model potom rozoberal otázku namiesto obrázka.
- **Na slide (test z 2. 11. večer):** screenshot horných štyroch panelov dashboardu WattLlama. LFM3-VL za **18,8 s** prepísal všetky panely (NOW, TODAY, HISTORY, TOKENS) a **každé číslo sedí**, aj desatinné miesta (89 W, 1.61 kWh, 11.69 kWh · CZK 70.14, 5,176 tokens, CZK 42.82 …). Na slide je skrátený výpis.
- **Ďalšie testy:** prečítal „pi-stack“, „CSS Secrets“ a „ANEŽKA“ na torte.
- **Výkon:** 7–30 s na obrázok, 0 VRAM, 1,9 GB RAM.
- **Zamietnuté:**
  - LFM3-Omni-2B vidí rovnako, ale jeho obrazový enkodér je 2,5× väčší;
  - d1-Omni-2B na žáner zo zvuku: 5/12 DnB pri 3/31 omyloch, horšie ako textový d1.
- **Demo:** pošli fotku publika s otázkou „How many people are in the first row?“ alebo „What is written on the banner?“.

### 29. Obrázky (LIVE)
- **Na slide je skutočný chat z #image-generator:**
  1. Prompt „DoLorain flying above High Tatras on Slovakia“ (s preklepom) dal Tatry bez auta (vľavo).
  2. Na obrázok som odpovedal „Don't see flying car above Tatras“ a GLaDOS auto dokreslil: malé, hore v strede (vpravo).
  3. **Pointa:** úprava odpoveďou funguje, ale prompt treba písať konkrétne.
- **Model:** Qwen-Image 2.1 cez **stable-diffusion.cpp** (sd-cli, CUDA build).
- **Base Q4_K:** 20 krokov, CFG 4,0, približne 56–82 s pri 1 MP. Predvolený.
- **Turbo Q4_K_M:** 8 krokov, `--sigmas qwen-image-2.1-turbo`, CFG 1, približne 20 s. Zapne sa, keď prompt začína „rýchlo“ alebo „fast“.
- **Text encoder** Qwen3-VL-8B číta prompt, pri úprave aj vstupný obrázok (`--llm_vision`, `-r obrázok`). **VAE** skladá pixely.
- Vstup sa normalizuje na najviac ~1 MP, strany sú násobky 32. `--offload-to-cpu`.
- Slovenský prompt najprv preloží Qwen do angličtiny, text, ktorý má byť na obrázku, ostáva v pôvodnom jazyku.
- Base model pri CFG 1 nevedel upravovať, preto CFG 4.

### 30. Výmena modelov na GPU
1. Qwen preloží prompt.
2. `POST /models/unload` Qwen (najprv počká, kým nie je „loading“ a nespracúva).
3. sd-cli kreslí: VRAM približne 5,8–6,5 GB, GPU na 100 %, RAM približne 14–16 GB.
4. `POST /models/load` Qwen, späť je približne o 20 s.

**GPU zámok** `state/gpu-lent.json` (po 20 min alebo pri mŕtvom procese sa považuje za neplatný):
- brief, CSS novinky aj codepen čakajú (`waitForGpu`);
- bridge čaká na `imagegen.idle()`.

**Bug, ktorý som našiel:** WattLlama sa pýtala routera na stav a ten pri tom model **autoloadol**, za 150 ms. Oprava je `?autoload=false`.

### 31. agent-browser (LIVE)
- Vercel Labs CLI, Chromium. Model dostane **accessibility strom s ref** (@e12), nie pixely.
- Teplá session drží Chromium v pamäti (približne 640 MB), takže príkaz trvá približne 0,4–1,1 s.
- **Lekcia:** malý model nezvládal orchestráciu CLI cez shell (timeout > 280 s), preto `browse` je vlastný nástroj, ktorý volá CLI priamo.
- **Na Windows:** volať JS entry cez node, nie `.cmd` shim, inak Node 24 vráti `spawn EINVAL`.

### 32. agent-desktop (LIVE)
- Vercel Labs, verzia 1.0.2. Windows UI Automation strom, príkazy `snapshot`, `click`, `set-value`, `launch`, `close-app`, `screenshot`. Nehýbe myšou.
- **Pravidlo:** len keď kanál beží na **lokálnom** modeli. Pri vzdialenom modeli bridge príkaz zablokuje (`DESKTOP_CMD` regex), lebo obsah obrazovky by odišiel von.

---

## 6 · Realita

### 33. Divider „Čo sa pokazilo“

### 34. Štyri chyby, štyri lekcie
- **Armoury Crate (Asus):** únik handle-ov v ArmourySocketServer vyčerpal commit limit Windows a llama.cpp aj Warp padali s `0xc0000409`. Riešenie: zabiť proces (vyžaduje UAC).
- **Qwen premýšľal:** `reasoning-budget = 0` ignoruje, pomohlo `reasoning = off`.
- **WattLlama budila modely:** poll routera spôsoboval autoload. Oprava je `autoload=false`, v CHANGELOG pod [Unreleased].
- **5 zabudnutých dev serverov,** 4 na `0.0.0.0`:
  - zabité;
  - firewall pre node len Private;
  - v inštrukciách teraz platí 127.0.0.1 a po teste vypnúť.
- **Ďalšie (na otázky):**
  - Node 24 a `.cmd` (`spawn EINVAL`);
  - undici 8 z pi SDK rozbil multipart upload v discord.js (vlastný undici 6 Agent);
  - časové pásmo: dátumy sa formátovali ako UTC, pri DST plánovač bežal o hodinu skôr;
  - vyhľadávače rate-limitujú (DDG vracia 202, Google captcha), riešením je circuit breaker.

### 35. Koľko to stojí (WattLlama)
**Týždeň 27. 10. – 2. 11., 6 Kč/kWh:**

| Ukazovateľ | Hodnota |
|---|---|
| celé PC | 11,67 kWh = **70 Kč** |
| kľudová spotreba | 67,4 W |
| energia počas práce modelov (všetky) | 0,16 kWh = **0,97 Kč** |
| Qwen týždeň | 30 718 vygenerovaných + 296 382 prompt tokenov, 295 požiadaviek |
| Qwen nad kľudom | ~0,99 Wh na 1k vygenerovaných tokenov (prefill započítaný), teda **1M tokenov ≈ 1 kWh ≈ 6 Kč** |

**Ako WattLlama meria:**
- CPU cez RAPL (namerané), GPU cez nvidia-smi.
- Zvyšok PC je odhad 35 W, účinnosť zdroja 0,88.
- Energiu priraďuje modelom podľa času, keď llama.cpp sloty spracúvali.

**Pozor, dva rôzne čísla:**
- Dashboard ukazuje „cost per 1M tokens“ napríklad **45 Kč**. To je **celé PC počas práce** (vrátane 67 W kľudu) delené tokenmi dňa.
- 6 Kč je **len energia navyše nad kľudom**.

Obe sú správne, merajú iné veci.

### 36. Ďakujem
- **QR:** github.com/depthark/wattllama, open-source, Windows/Linux, pluginy pre llama.cpp, Ollama a LM Studio.
- **Kontakt:** github.com/depthark.

---

## Otázky, ktoré môžu prísť

**Prečo llama.cpp a nie Ollama / LM Studio?**
Router s presetmi, MTP, MoE cache a `n-cpu-moe` prídu najprv do llama.cpp. Ollama za ním zaostáva a jemné ladenie nedovolí. Nočný update ide po stabilnej vetve (nie každý nightly) a s testami.

**Je to kvalitou porovnateľné s GPT/Claude?**
Nie na najťažšie úlohy. Na každodenného agenta (web, súbory, kód v repozitári, zhrnutia) je Qwen 3.6 35B dostatočný. Výhody sú súkromie, nulová cena za tokeny a to, že beží 24/7. Ťažké veci riešim cloudom vedome, nie automaticky.

**Prečo Q4?**
Pri MoE je Q4_K_M (5,1 bitu priemerne) rozumný kompromis. Vyšší kvant by sa nezmestil do RAM a VRAM s takou cache. UD verzia drží citlivé vrstvy vo vyššej presnosti.

**Čo by najviac pomohlo k rýchlosti?**
- **Prefill:** PCIe 4.0 (nová doska a CPU). Na AM4 alebo Intel 12.–14. gen s DDR4 by som RAM zachoval.
- **Generovanie:** priepustnosť RAM, teda zapnúť XMP 2666 a viac kanálov.
- **Najviac:** GPU s väčšou VRAM (24 GB = viac expertov v cache).

**Pomôže „GPU unlock“ (odomknutie výkonu na consumer kartách)?**
- Nie. Projekt je pre Linux, na Windows len RTX 30.
- Naše cesty v llama.cpp nie sú obmedzené: prefill brzdí PCIe, generovanie RAM.
- A riziko pre kartu nestojí za to.

**Koľko používateľov to zvládne?**
`parallel = 1`, jeden slot. Je to osobný agent. Ďalšie správy idú do frontu (⏳ reakcia).

**Ako riešiš bezpečnosť, keď má agent shell?**
- Allow-list jedného user ID, fail-closed.
- Tokeny sa mažú z prostredia.
- agent-desktop len lokálny model.
- Dev servery len 127.0.0.1, firewall Private.
- Verejný Discord: príkazy len vlastník.
- Riziko **prompt injection** z webu ostáva. Agent číta cudzie stránky, preto výsledky nástrojov berie ako dáta a nie ako príkazy, a destruktívne veci robí až po potvrdení.

**Prečo Discord?**
Mobil aj PC zadarmo, hlasovky, obrázky, tlačidlá, slash commandy a vlákna. Bridge je jediná vlastná vrstva.

**Prečo Windows, nie Linux?**
Je to môj herný počítač. Všetko beží aj na Linuxe (WattLlama má Linux podporu). Windows má svoje pasce (`.cmd` shimy, PowerShell 5.1 stderr, Armoury Crate).

**Dá sa to na Macu?**
Áno. llama.cpp má Metal a unified memory je pre MoE ideálna (všetko v jednej pamäti, žiadne PCIe). Mac s 64 GB by tento model zvládol celý.

**Čo je MTP vs. klasický speculative decoding?**
Klasický používa malý samostatný draft model. MTP je hlava priamo v modeli, trénovaná spolu s ním, takže nepotrebuje ďalší model a lepšie sa trafí.

**Prečo nie väčší kontext?**
64k stačí na agenta. Väčší kontext zaberie VRAM, ktorú dáva MoE cache. KV je pri hybride malá, ale compute buffer a prefill rastú.

**Ako vie, aký je dátum, a prečo neodmieta nové veci?**
Bridge vkladá dátum a čas do system promptu. V SOUL.md je pravidlo „výstup nástroja je pravda, tvoja pamäť nie“. Predtým odmietal nové správy ako „špekulácie“.

**Kompakcia kontextu?**
pi zhrnie staršie správy, keď sa blíži limit, a robí to ten istý Qwen. Trvá to desiatky sekúnd a bridge vtedy píše „summarising…“. Najlacnejší je `/reset`.

**Licencie modelov?**
- Qwen: otvorené váhy (Apache 2.0).
- LiquidAI LFM/d1: vlastná licencia LFM. Na osobné použitie OK, pri komerčnom si skontroluj podmienky.
- Whistle: od Cactus Compute.

**Koľko to stálo celé?**
Hardvér som už mal. Prevádzka je približne 70 Kč za týždeň (PC 24/7), samotná AI menej než 1 Kč za týždeň.

**Čo ďalej?**
- otestovať `--load-mode none`;
- zapnúť XMP 2666;
- viac vecí cez d1 namiesto veľkého modelu.

---

## Ťahák čísel (naspamäť)

| Údaj | Hodnota |
|---|---|
| parametre | 35,5 mld., aktívne ~3 mld., 256 expertov, aktívnych 8, 40 vrstiev (10 plná attention) |
| súbor modelu | 21,1 GiB (5,1 b/váha) |
| VRAM | 11,5 / 12 GB |
| MoE cache | 6,4 GB (~34 % expertov) |
| KV pre 64k | 680 MB |
| rýchlosť | ~70 tok/s, prefill ~805 tok/s, MTP +44 % pri kóde |
| d1-2B | 1 GB, 4 s, 0/58 šumu |
| LFM3-VL-2B | 1,9 GB RAM, ~20 s na obrázok |
| Qwen-Image | ~70 s, Turbo ~20 s, ~6 GB VRAM |
| Whistle | 17 MB, 0,3 s |
| energia za týždeň | 70 Kč celé PC, 0,97 Kč AI, ~6 Kč za 1M tokenov nad kľudom, kľud 67 W |

---

## Skutočný GLaDOS na úvodnom slide

Podoba GLaDOS je autorské dielo Valve, preto ju do prezentácie nevkladám ja. Pridáš ju takto.

**Najjednoduchšie, v Keynote:**
1. Otvor slide 1, klikni na oko a daj **Format → Movie → Replace** (oko je video).
2. Vyber svoje video. Funguje aj krátke nahrávanie z vlastnej kópie Portal 2.
3. V paneli **Movie** zapni **Repeat: Loop**. Čierne pozadie klipu splynie so slidom.

Tak isto vymeň oko aj na slide 2 (malé v rohu) a na slide 36.

**Cez skript:**
1. Ulož klip ako `zdroj/img/glados.mp4` (štvorcový, čierne pozadie) a jeho prvý obrázok ako `zdroj/img/glados-poster.png`.
2. V priečinku `zdroj` spusti `node build.js`. Skript ho sám použije na slidoch 1, 2 a 36.

Prvý obrázok z klipu a štvorcový výrez spravíš napríklad takto:

```
ffmpeg -i portal.mp4 -vf "crop=ih:ih,scale=1080:1080" -an -c:v libx264 -crf 18 -pix_fmt yuv420p glados.mp4
ffmpeg -i glados.mp4 -frames:v 1 glados-poster.png
```

## Keď Keynote niečo neprenesie

Deck je .pptx, Keynote ho otvorí, ale nie všetko z PowerPointu prenesie rovnako. Skontroluj na Macu deň vopred:
- **Prechody Morph / Magic Move** (do slidov 2, 8, 27, 36): `pptx-to-keynote.applescript` ich na Macu nastaví sám. V Keynote patrí prechod slidu, z ktorého odchádzaš, preto je Magic Move na slidoch 1, 7, 26 a 35. Na úvodných slidoch sekcií (7, 26) je ten istý obrázok ako na nasledujúcom slide, takže Magic Move ho plynulo zmenší do rohu. Pred talkom to skontroluj v Play móde.
- **Postupné objavovanie obsahu** (Fade + mierny pohyb hore): ak by sa nezobrazovalo, obsah je stále na slide, len sa objaví hneď.
- **Videá:** v paneli Movie má byť zapnuté prehrávanie automaticky (nie „Start movie on click“). Pri slidoch 1, 2, 10, 14 a 36 aj Repeat: Loop. Videá sú aj tak dlhé (oko 60 s, MoE a MTP po 24–30 s), takže dokola nemusia ísť.
- **Farebný prechod v nadpisoch** (napr. „GLaDOS“, „+44 %“): ak by bol jednofarebný, v Keynote ho vrátiš cez Format → Text → Gradient Fill.
- **Písmo:** Helvetica Neue je na každom Macu.
- Záložná verzia je PDF (`Pi-agent-Keynote-zaloha.pdf`), statické slidy bez animácií.
