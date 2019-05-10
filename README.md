# Ukradyjam: HD edition
Ponořte se do pivem zalité starořecké politiky v nejlepší budovatelské strategii!  
[odkaz](https://ukradyjam.netlify.com) na vývojový server, [odkaz](http://jira.zby.cz/content/UkradyjamHD/) na produkční aplikaci

Ukradyjam je parodií na jistou dobře známou online hru, avšak není online a lze zde interagovat jen s prostředím, což ale nevadí, i to hráči poskytne dostatek zábavy!

Jedná se o čistě frontendovou aplikaci napsanou v HTML/CSS/JS za pomoci frameworku [AngularJS](https://angularjs.org/).

Děkuji [@M4ch](https://github.com/M4ch) za vytvoření grafiky!

## Struktura aplikace

Téměř veškeré HTML je v **index.html**, veškeré statické CSS je v **app/style.css** (dynamické je pak nastaveno v příslušných Angular controllerech)

### Javascript

**app/misc.js** obsahuje různý nepořádek, co nepatří nikam jinam - obecné globální a prototypové funkce, event listenery neposkytované Angularem,
image preloading a objekt `saveService`, který slouží na ukládání/načítání uživatelských dat do Local Storage (automaticky) či do souborů (manuálně)

**app/middle.js** obsahuje angular controller. Tedy vše, co se týká view/controller vrstvy aplikace a není definované v direktivách, je právě zde, naházeno bez ladu a skladu

**app/game.js** obsahuje model aplikace, který je rozdělen do dvou objektů:  
`s`, definovaný pomocí factory `S`, obsahuje veškerý stav aplikace - který se zase nenachází nikde jinde než zde. Právě tento objekt je tedy ukládán a načítán pomocí saveService  
`game` obsahuje téměř veškerou funkcionalitu samotné hry - jedná se tedy o model aplikace, avšak bez stavu

**app/war.js** funkcionalita související s bojem je z *game.js* vyčleněna sem jakožto factory `War`. Její instance je zařazena do objektu *game*.
Též se zde nachází direktiva `battleCanvas`, která propojuje view funkce *war* s příslušným canvas elementem, avšak časovač je spouštěn z hlavního controlleru.

**app/data.js** obsahuje konstantní data pro hru:  
`consts` různé obecné parametry  
`buildings` parametry různých druhů budov  
`units` parametry různých vojenských jednotek  
`enemyArmies` tabulka nepřátelských armád  
`miracles` popisky zázraků (jejich efekty jsou zabudované přímo v příslušných funkcích objektu *game*)  
`achievements` popisky achievementů (platí totéž co u *miracles*)

**app/dataWis.js** data týkající se výzkumů jsou pro svůj značný objem vyčleněna z *data.js* právě sem

**app/ng/directives.js** zde jsou definovány různé direktivy, ty jsou vytvářeny buďto z důvodu jejich opakovaného použití, nebo jen vyčleněny z hlavního controlleru pro jeho zmenšení.
Pouze následující direktivy obsahují složitější logiku v controlleru:
`buildingDetails` obecné informace o budově a možnosti jejího vylepšování, vyskytuje se v každém okně budovy  
`resourceSlider` posuvník na rozdělení daňových poplatníků a dělníků, vystkytuje se v každém dole  
`tradeSlider` rozhraní na obchod, vyskytuje se pouze v přístavu  
`training` rozhraní na trénink příslušných jednotek podle typu bodovy, vyskytuje se v kasárně, dílně a zkušebně

**app/ng/ \* .html** všechny HTML soubory v tomto adresáři jsou templates pro ng-include nebo pro direktivy definované v *directives.js*
