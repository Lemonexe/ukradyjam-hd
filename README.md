# Ukradyjam: HD edition
Ponořte se do pivem zalité starořecké politiky v nejlepší budovatelské strategii všech dob!  
[odkaz](https://ukradyjam.netlify.com) na vývojový server, [odkaz](http://jira.zby.cz/content/UkradyjamHD/) na produkční aplikaci

Ukradyjam je parodií na jistou dobře známou online hru, avšak není online a lze zde interagovat jen s prostředím, což ale nevadí, i to hráči poskytne dostatek zábavy!

Jedná se o čistě frontendovou aplikaci napsanou v HTML/CSS/JS za pomoci frameworku [AngularJS](https://angularjs.org/).

Děkuji [@M4ch](https://github.com/M4ch) za vytvoření značné části grafiky!

:grey_exclamation: _POZOR: za žádných okolností ve hře nevolejte funkci_ `get_HACKER_achievement()`, _aby nebyl Ukradyjam nahackován_ :grey_exclamation:  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_(to se NEDĚLÁ tak, že se stiskne F12, vybere konzole, napíše se výše uvedený výraz včetně `()` a stiskne se Enter)_

## Struktura aplikace

Téměř veškeré HTML je v **index.html** (angular HTML), veškeré statické CSS je v **app/style.css** (dynamické je pak nastaveno v příslušných Angular controllerech – viz *middle.js*)

### Javascript

**app/misc.js** obsahuje různý nepořádek, co nepatří nikam jinam – obecné globální a prototypové funkce, event listenery neposkytované Angularem,
image preloading, funkce zajišťující zpětnou kompatibilitu verzí a objekt `saveService`,
který slouží na ukládání/načítání uživatelských dat do Local Storage (automaticky) či do souborů (manuálně)

**app/middle.js** obsahuje angular controller. Tedy vše, co se týká view/controller vrstvy aplikace a není definované v direktivách, je právě zde, naházeno bez ladu a skladu.
Jsou zde tedy funkce týkající se stylu, event listenery, a hlavně funkce zprostředkující přístup k `s` a `game` (viz níže). Timeouty jsou také právě zde.  
Právě zde se nejspíše nachází porouchaný kód způsobující zvláštní bug, když pojmenujete své město `dinnerbone`

**app/game.js** definuje objekt `game`, který jakožto aplikační model obsahuje téměř veškerou funkcionalitu samotné hry, avšak kromě stavu aplikace

**app/state.js** definuje factory `S` a instancuje jí jako objekt `s`, který obsahuje veškerý stav aplikace – který se zase nenachází nikde jinde než zde.
Stav aplikace znamená zaprvé stav GUI a nastavení, ale především stav hry, čili savegame.
Právě tento objekt je tedy celý ukládán a načítán pomocí saveService.

**app/war.js** funkcionalita související s bojem je z *game.js* vyčleněna sem jakožto konstruktor `War`. Jeho instance je zařazena do objektu *game*. Zde jsou pouze funkce týkající se modelu.

**app/warView.js** definuje konstruktor `WarView`. Ten není sám instancován, ale `War` jej dědí – zde je z něj vyčleněn controller a view (canvas).
Též se zde nachází direktiva `battleCanvas`, která propojuje view funkce s příslušným canvas elementem, avšak časovač je spouštěn z hlavního controlleru.

**app/data.js** obsahuje konstantní data pro hru:  
`consts` různé obecné parametry  
`buildings` parametry různých druhů budov  
`units` parametry různých vojenských jednotek  
`enemyArmies` tabulka nepřátelských armád  
`miracles` popisky zázraků (jejich efekty jsou zabudované přímo v příslušných funkcích objektu *game*)  
`achievements` popisky achievementů (platí totéž co u *miracles*)

**app/dataWis.js** data týkající se výzkumů jsou pro svůj značný objem vyčleněna z *data.js* právě sem

**app/directives.js** zde jsou definovány různé direktivy, ty jsou vytvářeny buďto z důvodu jejich opakovaného použití, nebo jen vyčleněny z hlavního controlleru pro jeho zmenšení.
Pouze následující direktivy obsahují složitější logiku v controlleru:
`buildingDetails` obecné informace o budově a její možnosti, vyskytuje se v každém okně budovy  
`resourceSlider` posuvník na rozdělení daňových poplatníků a dělníků, vystkytuje se v každém dole  
`tradeSlider` rozhraní na obchod, vyskytuje se pouze v přístavu  
`training` rozhraní na trénink příslušných jednotek podle typu bodovy, vyskytuje se v kasárně, dílně a zkušebně

**app/ng/ \* .html** HTML soubory v tomto adresáři jsou templates (jak statické, tak dynamické) pro ng-include nebo pro direktivy definované v *directives.js*
