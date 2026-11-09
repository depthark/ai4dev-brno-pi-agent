# Pi agent — poznámky k slidom

Speaker notes zo slidov v `Pi-agent-Keynote.pptx` (vygenerované z `zdroj/build.js`). Slidy sú v angličtine, poznámky po slovensky.

## 1. GLaDOS — my personal pi agent

Ahojte, som Lukáš. Toto je GLaDOS, môj osobný pi agent. Beží celý doma na hernom PC: žiadne API, nič neodchádza do cloudu. Áno, je pomenovaná podľa umelej inteligencie z Portalu, a áno, osobnosť má podobnú. Pripravte si mobily, budeme skúšať naživo.

## 2. Six test chambers

Šesť komôr, ako to volá GLaDOS. Kto to je a z čoho sa skladá. Technika: ako sa 35-miliardový model zmestí do 12 GB grafiky. Qwen a pi. Discord a rozhodovací model d1. Potom zábava: hlas, zrak, obrázky, prehliadač a desktop naživo. Na koniec poctivo: čo sa pokazilo a koľko to stojí.

## 3. One gaming PC. Six AI models. Zero API bills.

GLaDOS píšem na Discorde z mobilu aj z PC, v ktoromkoľvek kanáli môjho servera. Za tým je jedno herné PC a šesť lokálnych modelov: veľký jazykový, malý rozhodovací, zrak, reč a dva na obrázky. Za API neplatím nič, len elektrinu. Beží non-stop: ráno pošle AI novinky, cez deň robí veci na pozadí.

## 4. Four layers, one PC

Štyri vrstvy. Discord je rozhranie. Bridge je Node aplikácia s discord.js, z každej správy spraví požiadavku pre agenta a pre každý kanál drží konverzáciu. Agent je pi cez SDK. Dole je llama.cpp v režime routera: jeden server na :8080, ktorý načítava a uvoľňuje modely. Popri tom naplánované úlohy: AI brief, CSS novinky, hry zadarmo, kino, watchdog a WattLlama na meranie spotreby.

## 5. Herdr: mission control for agents

Kde pi vlastne beží, keď nie je v Discorde: v Herdri. Je to open-source multiplexer pre coding agentov, niečo ako tmux, ale vie, čo agenti robia. Mám v ňom viac agentov naraz a pri každom vidím, či pracuje, skončil, alebo čaká, kým mu niečo schválim, a príde mi notifikácia. Session beží aj po zatvorení okna. Pri štarte PC sa sám otvorí Windows Terminal, v ňom Herdr a v ňom pi. Pi mu cez malú extension hlási svoj stav: začiatok, koniec, otázku na schválenie a ID session, takže po reštarte sa vráti tá istá konverzácia. Mimo Herdru extension nerobí nič, preto GLaDOS v Discorde neovplyvní. Prešiel som naň z Warpu 3. novembra.

## 6. Every model, one PC

Celý inventár, namerané. Qwen 3.6 je mozog. d1 rozhoduje bez písania textu, LFM3-VL je zrak, oba na procesore. Kreslenie sa s Qwenom na kartu nezmestí, preto sa striedajú. Whistle má 17 MB. Spolu ~40 GB na disku, v pokoji 11,5 z 12 GB VRAM.

## 7. 02 · Inference on a gaming PC

Prvá technická časť: ako dostať veľký model do herného PC.

## 8. The lab = a gaming PC

Žiadny server. RTX 4070 s 12 GB, i7-9700K deviatej generácie, 48 GB RAM (bežia na 2400 MHz). Doska má len PCIe 3.0, to bude dôležité. Otázka: ako sa sem zmestí model, ktorý má sám 21 GB?

## 9. Finding a brain that fits 12 GB

Ako som sa k tomuto modelu dopracoval, krok za krokom. Začiatok: Qwen2.5-14B-Instruct, hustý model celý na grafike. Na chat stačil, ale v reťazcoch nástrojov sa strácal a odpovede boli slabé. V júni Qwen3-14B: stále dense, 11,9 GB VRAM, 32k kontext, okolo 25 tokenov za sekundu. Tri lekcie z neho: premýšľal asi 300 tokenov pred každou odpoveďou, tak som zapol reasoning-budget 0. Keď našiel skutočný článok o GPT-6, nazval ho špekuláciou, lebo bol novší než jeho tréning, preto má SOUL.md pravidlo, že výstup nástroja je pravda. A viackrokové ovládanie agent-browsera cez shell trvalo cez 280 sekúnd, tak som ho zabalil ako nástroj a je to 0,4 až 1,1 sekundy. Piateho septembra prechod na Qwen 3.6. Hustý 27B by sa na jednu 12 GB kartu nezmestil, kamoš ho púšťa na dvoch grafikách. Zvolil som MoE verziu 35B-A3B. Odhadoval som 12 až 18 tokenov za sekundu, reálne 34,5, lebo má len 2 KV hlavičky a malú KV cache. Prvé odpovede ale prišli prázdne: Qwen 3.6 ignoruje reasoning-budget, celú odpoveď dal do premýšľania a Discord dostal prázdnu správu. Pomohol až nový prepínač reasoning off.

## 10. 35 billion parameters. 3 billion per token.

Trik je architektúra. Qwen 3.6 je Mixture of Experts: v každej zo 40 vrstiev je 256 expertov a pre každý token router vyberie osem — presne to svieti na animácii. Model má 35,5 miliardy parametrov, počíta sa s ~3 miliardami. To, čo sa používa stále (attention a KV cache), dám na grafiku. Expertov do RAM.

## 11. Attention on the GPU. Experts in RAM.

Toto je skutočné rozloženie, z výpisu llama.cpp pri štarte. Súbor má 21,1 GiB: attention a zdieľané váhy sú len 2,4 GB, zvyšok, 18,7 GB, sú experti. Attention ide na grafiku, s KV cache pre 64k tokenov — len 680 MB, lebo len 10 zo 40 vrstiev má plnú attention, ostatné sú lineárne s malým stavom 188 MB. MTP hlava 344 MB. Všetci experti ležia v RAM ako mapovaný súbor, vedľa nich d1 a zrak. A najväčší kus grafiky, 6,4 GB, je cache horúcich expertov — asi tretina. Studení prídu cez PCIe 3.0, keď ich treba. Spolu 11,5 z 12 GB.

## 12. Then making it fast

Keď model sedel, prišlo ladenie. Pravidlo: každý krok zmerať a nechať len to, čo je rýchlejšie. Piateho septembra n-cpu-moe 24: experti z 24 vrstiev v RAM, 34,5 tokenu za sekundu pri 11,4 GB. Pri 20 je útes: grafika je plná, ovládač začne swapovať a rýchlosť padne na 14,9. Dvadsiateho siedmeho septembra MTP verzia toho istého modelu: rovnaké váhy, navyše pol gigabajtu draft hlavy. Kód z 36,5 na 52,4, plus 44 percent, a zároveň kontext 64k. Tri tipy dopredu už nepridali nič. V ten istý deň ubatch 2048: experti idú cez PCIe raz za dávku, takže väčšia dávka znamená menej prenosov a prefill dvojnásobný, z 338 na 656. Pri 4096 sa to zrúti na 154. Šestnásteho októbra priniesol llama.cpp v0.7.0 cache expertov na GPU: všetci experti v RAM a 6,4 GB horúcich na karte, kód 56 tokenov za sekundu, generovanie pri 50k z 40 na 49. 6,9 GB pri dlhom kontexte pretečie. Čo som vyskúšal a zahodil: KAT-Coder-V2.5, doučený Qwen na kód, len 41,9 tok/s a horší v agentických úlohách. Režim premýšľania: 24 tok/s a asi 10-tisíc tokenov na úlohu. A 27B model na Kaggle TPU, ktorý stroskotal na chybe platformy.

## 13. Six runs, one winner

Toto je ladenie z 16. októbra, llama.cpp b11669. Prvý stĺpec je pôvodné nastavenie: 26 vrstiev expertov v RAM, zvyšok na karte. Malá cache prehráva, ale všetci experti v RAM plus 6,4 GB LRU cache na GPU dá 55,9 tok/s pri kóde. Pri 6,9 GB je kód ešte rýchlejší, ale pri 50-tisícovom kontexte grafike dôjde pamäť a generovanie padne na 33,6. Preto 6400.

## 14. Multi-token prediction: +44 %

Moje obľúbené číslo. Qwen 3.6 má vlastnú MTP hlavu: popri tokene si tipne ďalšie dva a llama.cpp ich overí v jednom kroku. Keď tip sedí, máte viac tokenov za cenu jedného — na animácii zelené; keď nesedí, zahodí sa, červené. Pri kóde plus 44 percent, z 36,5 na 52,4 tokenu za sekundu. Jeden parameter.

## 15. The parameters, and why these

Výťah z models.ini, čo ktorý parameter znamená a čo mi priniesol. n-gpu-layers 99: všetky vrstvy na GPU, teda attention, embeddingy a router. n-cpu-moe 40: z nich vráti do RAM len expert tensory všetkých 40 vrstiev; bez neho llama.cpp presúva iba celé vrstvy aj s attention a bolo by to nepoužiteľné. moe-cache-mib 6400: LRU cache horúcich expertov na GPU, od llama.cpp v0.7.0; kód zo 45 na 56 tok/s, generovanie pri 50k zo 40 na 49; 6900 pri 50k pretečie na 33,6. ctx-size 65536: kontext 64k namiesto 32k; KV cache má len 680 MB, lebo plnú attention má iba 10 zo 40 vrstiev. cache-type-k a -v q8_0: KV cache v 8 bitoch namiesto 16, polovičná pamäť, kvalita 28 z 33 proti 26 z 33 pri f16 a pri 64k dvojnásobná rýchlosť, 50 proti 26 tok/s. batch-size 4096 a ubatch-size 2048: koľko tokenov promptu sa spracuje naraz; experti sa cez PCIe prenášajú raz za dávku, prefill z 338 na 656 tok/s; ubatch 4096 sa zrúti na 154. spec-type draft-mtp so spec-draft-n-max 2: MTP hlava tipuje dva tokeny dopredu a overia sa v jednom kroku, kód plus 44 percent; tri tipy nepomohli. spec-draft-n-ubatch 512: menšia dávka pre draft, ušetrí asi 100 MB VRAM. flash-attn on: rýchlejšia attention s menšou pamäťou. reasoning off: vypne premýšľanie; Qwen 3.6 ignoruje reasoning-budget 0 a Discord dostával prázdne správy. parallel 1: jeden slot, celá cache pre mňa. models-max 3: router drží naraz Qwen na GPU a d1 s LFM3-VL na CPU.

## 16. How fast it runs

Generovanie okolo 70 tokenov za sekundu (kód 64–67, text 69–73). Prefill okolo 800 tokenov za sekundu na 27k prompte. Kontext 64k. Grafika na hrane: pol gigabajtu cache navyše a dlhé prompty spadnú o tretinu.

## 17. 03 · Brain and agent

Tretia časť: čo s tým modelom robím a ako ho riadi agent.

## 18. What I use Qwen 3.6 for

Qwen je ťažný kôň. Osobnosť GLaDOS je obyčajný súbor SOUL.md. Vyhľadáva a otvára stránky v skutočnom prehliadači. V #coding pracuje v mojich repozitároch. Píše CSS novinky po česky. Prekladá prompty pre obrázky. A keďže je lokálny, môže čítať aj súkromné veci.

## 19. pi: an agent as a library

Pi je open-source coding agent, podobný Claude Code, ale dá sa použiť ako knižnica. Vytvorím session, dám jej lokálny model, osobnosť, skilly a vlastné nástroje, a posielam jej správy z Discordu. Skilly sú markdown návody. d1 vidí natívne ako klasifikátor. Od dnes pi 1.5: nočná aktualizácia s 11 testami a automatickým rollbackom.

## 20. 04 · Discord and decisions

Štvrtá časť: ako sa s GLaDOS rozprávam a kde namiesto veľkého modelu rozhoduje malý.

## 21. Discord bridge

Bridge je srdce stacku. Každý kanál je konverzácia a prežije reštart. Na mojom serveri netreba tagovať. Odpovedá len mne, lebo má shell. Dlhé úlohy posielajú priebežné správy. Každý kanál môže mať iný model. A lekcia: tokeny mažem z prostredia pri štarte, lebo agent si ich vedel prečítať cez shell.

## 22. 18 slash commands, mostly plain code

Všetkých 18 slash commandov, rozdelených podľa použitia. Coding a agent: /ask je bežná otázka, /search a /browse volajú nástroj priamo, lebo model raz tvrdil, že vyhľadávanie nefunguje. /skill spustí ľubovoľný skill. /model a /switch-free-coding-models prepnú model kanála, napríklad #coding na bezplatný model z OpenRouteru, a pri chybe sa vráti na lokálny Qwen. /get-new-models ukáže nové stealth a bezplatné coding modely. /status ukáže model, router a zaplnenie kontextu, /reset začne novú konverzáciu. Osobné: /get-news pošle AI brief hneď, /check-games skontroluje a voliteľne vyzdvihne hry zadarmo, /key aktivuje Steam kľúč, /what-the-track a /add-to-playlist pracujú s Rádiom FM a Spotify a /cinema ukáže program kina. Tri CSS príkazy sú na verejnom serveri CSS CzechoSlovakia a smiem ich spustiť len ja. Väčšina z nich je obyčajný kód, model zapojím len tam, kde treba úsudok.

## 23. d1-2B: never writes, only decides

LiquidAI d1 negeneruje text. Dáte mu stav a krátke otázky: áno/nie, výber, alebo skóre, a vráti pravdepodobnosť. Má gigabajt, beží na CPU, llama.cpp ho servíruje cez /v1/systemone. Z 3B na 2B som prešiel po teste na ručne označených dátach: menší je rýchlejší a na mojich dátach presnejší, na 58 šumových titulkoch nepustil ani jeden.

## 24. Code for facts. d1 for judgment.

Zložitejší príkaz. Kód zistí, čo hrá Rádio FM, a nájde to na Spotify. Kód sa pozrie do MusicBrainz, odkiaľ je interpret — to je fakt. Žáner je úsudok: d1 dostane dve otázky. Kód pridá skladbu do playlistu roka. Na 36 skladbách: 10 z 12 DnB, ani jeden omyl. LIVE: /add-to-playlist na to, čo práve hrá.

## 25. 1,400 headlines, three items

Každú hodinu ~1 400 titulkov z RSS, webov a commitov llama.cpp. d1 sa pýta, či je to skutočná AI novinka, a pustí len P ≥ 0,85. Ďalšia otázka stráži duplicity. Vľavo skutočný brief z 31. 10. Rovnaký mechanizmus plní kanály CSS CzechoSlovakia.

## 26. 05 · Voice, vision and hands

Piata časť, tá zábavná: všetko naživo.

## 27. Talk instead of typing

Hlasovka: bridge ju stiahne, ffmpeg prevedie na 16 kHz mono, Whistle od Cactus Compute prepíše. 17 MB, CPU, 10 s nahrávky za 0,3 s. GLaDOS najprv ukáže, čo počul. Slovenčinu nevie, hovorím po anglicky. LIVE: pošlem hlasovku.

## 28. Qwen is blind, so it got eyes

Qwen 3.6 je čisto textový a grafika je plná. Riešenie: LFM3-VL od LiquidAI, 2 miliardy parametrov, celé na procesore. Obrázok v chate najprv opíše a prečíta všetok text, opis dostane Qwen spolu s otázkou. Test z dnešného večera: screenshot môjho WattLlama dashboardu. Za 18,8 sekundy prečítal všetky štyri panely a každé číslo sedí, aj desatinné miesta. Skúšal som aj ich model na zvuk: horší ako d1 a slovenčinu nevie, tak ostal len zrak. LIVE: odfotím vás a pošlem to GLaDOS.

## 29. Draws and edits: Qwen-Image 2.1

Kanál image-generator: prompt = nový obrázok, obrázok + prompt alebo odpoveď na obrázok = úprava, aj hlasom. Qwen-Image 2.1 cez stable-diffusion.cpp. Skutočný chat: napísal som DeLorean nad Tatrami (s preklepom) a prišli Tatry bez auta. Odpísal som, že auto nevidím, a GLaDOS ho dokreslil — malé, hore v strede. Ponaučenie: prompt píšte konkrétne. Kvalitný model ~70 s (dnes namerané 56–82 s), Turbo s „rýchlo“ ~20 s. LIVE: rýchlo, nakresli, čo poviete.

## 30. One GPU, two big models

Dva veľké modely sa na 12 GB nezmestia, tak sa striedajú. Qwen preloží prompt, router ho uvoľní, kreslí stable-diffusion.cpp, router Qwen nahrá späť. Dve HTTP volania. Zradné: brief, CSS novinky aj WattLlama sa pýtajú na Qwen a router by ho nahral do plnej karty. Preto spoločný zámok v súbore state/gpu-lent.json.

## 31. A real browser for the agent

Agent-browser od Vercel Labs: model nedostáva pixely, ale strom prvkov s krátkymi odkazmi ako @e12. Textový model s tým pracuje bez problémov. V #coding testuje, čo naprogramoval, a pošle screenshot ako dôkaz. LIVE: otvor stránku AI 4 DEV a pošli screenshot.

## 32. It drives Windows apps too

Agent-desktop, tiež od Vercel Labs: to isté pre aplikácie vo Windows, číta strom prvkov okna a klikne či napíše bez pohybu myšou. Pravidlo: desktop smie ovládať len lokálny model, inak by obrazovka odišla do cloudu. LIVE: otvor Poznámkový blok, napíš pozdrav, pošli screenshot.

## 33. 06 · What broke

Posledná časť: poctivo, čo nefungovalo, a účet za elektrinu.

## 34. Four bugs, four lessons

Llama.cpp náhodne padal s 0xc0000409 — vinník Armoury Crate od Asusu s únikom handle-ov, vyčerpal commit limit Windows. Qwen ignoruje reasoning-budget, pomohlo reasoning off. Môj vlastný WattLlama nahral uvoľnený model späť za 150 ms (opravené: autoload=false). A päť zabudnutých dev serverov, štyri na celej sieti — teraz len 127.0.0.1 a po teste vypnúť.

## 35. What it costs

Vlastný nástroj WattLlama: meria spotrebu PC a priradí ju modelom podľa toho, kedy čo počítali. Za posledný týždeň celé PC 11,7 kWh, teda 70 Kč. Energia, kým modely naozaj pracovali, 0,16 kWh = 97 halierov. Milión vygenerovaných tokenov Qwenu nad kľudovou spotrebou ~1 kWh = ~6 Kč. Väčšinu účtu tvorí PC, ktoré čaká na otázku: 67 W v kľude.

## 36. Thank you

Všetko, čo ste videli, beží na jednom hernom PC doma. Verejná časť je WattLlama, QR kód vás dovedie na GitHub. Dole projekty, na ktorých to stojí, všetky open-source. Ďakujem a pýtajte sa.
