/*
This is a separate file because of the sheer size. Example of a research object:

{id: 'ID', class: 'Eco' || 'Pol' || 'Wis' || 'Arm', name: 'Display name', cost: WP costs,
	teaser: 'advertisement to pursue this tech'
	result: 'message after, part I (flavour)'
	effect: 'message after, part II (effect)'
	reqs: [IDs of requirement techs], f: function() {
		code to execute when successfully bought
	}},
*/

const research = [
{id: 'EcoA1', class: 'Eco', name: 'Pazourková sekera', cost: 20,
	teaser: 'To bude naprostá revoluce v dobývání rostlinného materiálů, už nebudeme muset lámat jednotlivé větvičky, budeme moci kácet celé stromy!',
	result: 'Geniální, těžba stromů je nyní opravdu efektivní.',
	effect: 'těžba dřeva +20%',
	reqs: [], f: function() {
		s.p.drevo += 0.20;
	}},
{id: 'EcoA2', class: 'Eco', name: 'Bohatství', cost: 100,
	teaser: 'Zatím neznáme nic než dřevo a peníze – jíme klobásy z dřevěných pilin a pijeme dřevný líh. To není úplně zdravé, je proto čas obohatit náš život o nové substance!',
	result: 'Nová filozofická studie podložená chemickým rozborem ukazuje, že se vesmír skládá z 5 živlů: nejen peníze a dřevo, ale také kamení, sýra a pivo.',
	effect: 'odemknuta těžba kamení, sýry a piva. Zdarma bonus 100 ks od každého',
	reqs: ['EcoA1'], f: function() {
		s.p.unlockLuxus = true;
		s.sur[2] += 100;
		s.sur[3] += 100;
		s.sur[4] += 100;
	}},
{id: 'EcoA3', class: 'Eco', name: 'Hospoda', cost: 300,
	teaser: 'Popište ráj na zemi: kamarádi z vojny, šipky, fotbálek a hlavně pivo tekoucí proudem – a přesně to můžeme mít i v našem městě!',
	result: 'Teď ty prasata můžeme ožrat do němoty a odvést tak pozornost od jiných vládních vyhlášek.',
	effect: 'odemknuta hospoda',
	reqs: ['EcoA2', 'EcoB2'], f: function() {
		s.p.unlockBuild.push('hospoda');
	}},
{id: 'EcoA4', class: 'Eco', name: 'Logistika', cost: 700,
	teaser: 'Ve velkých polisech prý mají jakýsi "logistický systém", což znamená, že staví obrovské sklady surovin. Takové chci mít taky!',
	result: 'To bude určitě dobrý nápad, zkuste jeden postavit. Snad lidem nebudou vadit hovna od povozů a nevzhledné krabice.',
	effect: 'odemknut sklad',
	reqs: ['EcoA3'], f: function() {
		s.p.unlockBuild.push('sklad');
	}},
{id: 'EcoA5', class: 'Eco', name: 'Železná sekera', cost: 4000,
	teaser: 'Nová železná sekera je hezčí, ostřejší a vydrží mnohem déle, proto ji doporučuje 9 z 10 dřevorubců. Nyní i s dvouletou zárukou. Úžasné!',
	result: 'Nechali jsme se přesvědčit reklamou z amfiteátru a koupili jsme výhodný balíček 10 seker + 1 zdarma, tak snad je prodejce brzo doručí.',
	effect: 'těžba dřeva +20%',
	reqs: ['EcoA4'], f: function() {
		s.p.drevo += 0.20;
	}},
{id: 'EcoA6a', class: 'Eco', name: 'Vozíky na kamení', cost: 2000,
	teaser: 'Dělníci dosud táhli kameny ručně a to moc efektivní není.',
	result: 'Dělníci šutry stále nosí po jednom, ale jedou přitom ve vozíku a jde to tedy rychleji.',
	effect: 'těžba kamení +20%',
	reqs: ['EcoA4'], f: function() {
		s.p.kamen += 0.20;
	}},
{id: 'EcoA6b', class: 'Eco', name: 'Morálka na moři', cost: 2000,
	teaser: 'Na pivní plošině furt všichni jen chlastají! Je třeba zavést disciplínu a omezit tak ztráty piva.',
	result: 'Uzavřel se přístup k hlavní nádrži. Většina dělníků tedy chlastá u ventilu, ale aspoň ti blbí už nepijou a ztráty piva byly omezeny.',
	effect: 'těžba piva +20%',
	reqs: ['EcoA6a'], f: function() {
		s.p.pivo += 0.20;
	}},
{id: 'EcoA6c', class: 'Eco', name: 'Kýbly na mléko', cost: 2000,
	teaser: 'Mléko pracovníci dosud nosili v dlaních. S kýblem to určitě půjde rychleji!',
	result: 'Dělníci nechápou, proč nemají mléko nosit ve dlaních, to se nezměnilo, ale dali si kýbly na hlavu a snížila se tak úrazovost následkem pokopání krávou, takže efektivita práce se zvedla.',
	effect: 'těžba sýry +20%',
	reqs: ['EcoA6b'], f: function() {
		s.p.syra += 0.20;
	}},
{id: 'EcoA7', class: 'Eco', name: 'Splachovadlo', cost: 10000,
	teaser: 'A potom že se prý nezajímáme o komfort obyčejných lidi! Moderní a čistý záchod ubytuje i početnou rodinu.',
	result: 'No to je ale luxus! Naše překrásná toaletní zařízení nyní přitáhnou více lidí.',
	effect: 'kapacita veřejných záchodů +10%',
	reqs: ['EcoA5'], f: function() {
		s.p.WC += 0.10;
	}},
{id: 'EcoA8', class: 'Eco', name: 'Oblouková pila', cost: 25000,
	teaser: 'To bude druhá revoluce v dřevorubectví! Budeme stromy moci i řezat, nejen do nich sekat!',
	result: 'Excelentní! Teď budeme mít dostatek dřeva na stavbu velkolepé megalopole!',
	effect: 'těžba dřeva +10%',
	reqs: ['EcoA7'], f: function() {
		s.p.drevo += 0.10;
	}},
{id: 'EcoB1', class: 'Eco', name: 'Truhlička na peníze', cost: 50,
	teaser: 'Možná, že když vynalezneme uzamykatelnou pokladnici, nebudou prachy stále tak záhadně mizet.',
	result: 'Jen co jsme peníze dali pod zámek, hned je jich mnohem více. Že nás tohle nenapadlo dřív!',
	effect: 'daňový výběr +20%',
	reqs: ['EcoA1'], f: function() {
		s.p.prachy += 0.20;
	}},
{id: 'EcoB2', class: 'Eco', name: 'Pravidelné daně z příjmu', cost: 200,
	teaser: 'Peníze nyní vybíráme jen tak namátkově, kdykoliv je to zrovna potřeba. Když místo tohoto chaotického sběru zavedeme důmyslný systém pravidelných plateb, okrademe lid mnohem více!',
	result: 'Peníze sice do státní poklady tečou proudem, ale lidé se bouří! Měli bychom je nějak usmířit.',
	effect: 'daňový výběr +30%, vygebenost -40',
	reqs: ['EcoB1'], f: function() {
		s.p.prachy += 0.30;
		s.p.happy -= 40;
	}},
{id: 'EcoB3', class: 'Eco', name: 'Podvod', cost: 999,
	teaser: 'Proč se při obchodování otravovat s přesným měřením? Kilo sem, tuna tam, a hned vyděláme trochu více!',
	result: 'Cizí obchodníci odcházeji spokojeni, když se naše váhy honosí Národním Certifikátem Přesnosti! My jsme ještě spokojenější.',
	effect: 'účinnost obchodu +10%',
	reqs: ['EcoB2', 'EcoA3'], f: function() {
		s.p.obchod += 0.10;
	}},
{id: 'EcoB4', class: 'Eco', name: 'Chodníkový zákon', cost: 5000,
	teaser: 'Každej na svůj chodník jenom sere a město pak musí platit údržbu. Od nynějška bude majitel zasraného chodníku pokutován, což zvýší incentivu k uklízení.',
	result: 'Konečně ty prasata zametaj aspoň ty největší hovna! Bohužel se jim to moc nelíbí, ale alespoň konečně to tu nevypadá jako ve chlévě.',
	effect: 'údržba města -10%, vygebenost -60',
	reqs: ['EcoB3'], f: function() {
		s.p.udrzba -= 0.10;
		s.p.happy -= 60;
	}},
{id: 'EcoB5', class: 'Eco', name: 'Novela zákonu o daních', cost: 12000,
	teaser: 'Zrušíme velice nepopulární daň z příjmu, zato zavedeme spoustu menších daní a správních poplatků za všechno možné.',
	result: 'Ach, to kouzlo byrokracie! Obíráme lid ještě více a oni si přitom myslí pravý opak!',
	effect: 'daňový výběr +10%, vygebenost +60',
	reqs: ['EcoB4', 'EcoA5'], f: function() {
		s.p.prachy += 0.10;
		s.p.happy += 60;
	}},
{id: 'EcoB6', class: 'Eco', name: 'Eurozóna', cost: 18000,
	teaser: 'Zavedeme jednotnou měnu pro meziostrovní obchod, to bude pokrokové a vyplatí se to skutečně VŠEM!',
	result: 'Ano! To je rozumné a dobré. Kdo bude tuto univerzální měnu razit? No přece my, samozřejmě. Ostatním se to už tolik nevyplatí...',
	effect: 'účinnost obchodu +10%',
	reqs: ['EcoB5'], f: function() {
		s.p.obchod += 0.10;
	}},
{id: 'EcoB7', class: 'Eco', name: 'Stravenky', cost: 35000,
	teaser: 'Zlatá kolečka hladový krk nezasytí, dělný lid chce poukaz na jídlo a pití!',
	result: 'Výborně, snížili jsme platy a ta šlichta, co dáváme v kantýně, nás stojí jen zlomek ušetřených peněz. Všichni jsou spokojení.',
	effect: 'platy dělníků -10%',
	reqs: ['EcoB6'], f: function() {
		s.p.plat -= 0.10;
	}},
{id: 'EcoGrand', class: 'Eco', name: 'Budoucnost ekonomiky', cost: 99999,
	teaser: 'Dovedete si vůbec představit, že všichni pilně pracují a státní úřady fungují tak, jak mají? To je naše budoucnost!',
	result: 'Pořádek v ulicích a ekonomický růst. To se líbí občanům i mě!',
	effect: 'těžba všech surovin +10%, daňový výběr +10%, údržba města -10%',
	reqs: ['EcoA8', 'EcoB7', 'EcoA6c'], f: function() {
		s.p.prachy += 0.10;
		s.p.drevo += 0.10;
		s.p.kamen += 0.10; s.p.syra += 0.10; s.p.pivo += 0.10;
		s.p.udrzba -= 0.10;
	}},



{id: 'PolA1', class: 'Pol', name: 'Schránka na vzkazy', cost: 29,
	teaser: 'Lidi potřebujou na vládu anonymně nadávat a vylít si tak srdíčko beze strachu z možné represe. Umožněme jim to, vždyť to přece pak ani nemusíme číst!',
	result: 'Schránka byla ihned ucpána vzkazy typu CHCI PIVO VOLOVÉ a lidé jsou vygebení, jak pěkně nás "vochcali". Inu, proč ne.',
	effect: 'vygebenost +50',
	reqs: [], f: function() {
		s.p.happy += 50;
	}},
{id: 'PolA2', class: 'Pol', name: 'Koblihy', cost: 299,
	teaser: 'JO! Bude úplně nejvíc nejlíp! Nejsme jako politici, my makáme a prostě všecko spravíme! To je motto, které hlásáme při rozdávání sladkého pečiva. Lid pak skousne úplně všechno.',
	result: 'Mám dojem, že někteří vykutálení šibalové si pro naše střevní ucpávky přišli vícekrát, ale to vůbec nevadí, přízeň lidu je nyní na naší straně.',
	effect: 'vygebenost +180',
	reqs: ['PolA1'], f: function() {
		s.p.happy += 180;
	}},
{id: 'PolA3', class: 'Pol', name: 'Úsporná opatření', cost: 899,
	teaser: 'No je přece kríze, tak se musí šetřit! Ale samozřejmě že zrovna vás se to vůbec nedotkne, peníze najdeme v jiných sektorech!',
	result: 'Lidé tuto tíži přeci jen pocítili a moc se jim to nelíbí. Státní rozpočet však vypadá slibně!',
	effect: 'údržba města -10%, platy dělníků -10%, vygebenost -90',
	reqs: ['PolA2'], f: function() {
		s.p.udrzba -= 0.10;
		s.p.plat -= 0.10;
		s.p.happy -= 90;
	}},
{id: 'PolA4', class: 'Pol', name: 'Dopravní zklidnění', cost: 2499,
	teaser: 'Všudypřítomné plachetnice jen dělají hluk, zabírají místo a prostě nepatří na moderní ostrov -5. století. Aktivisté požadují nápravu: omezit rychlost, zavést rezidentní kotvení a postavit cyklostezky!',
	result: 'Pod hladinu moře jsme umístili retardéry a na celé pobřeží značky zákazu stání, takže na prázdných plážích mohou začít sousedské slavnosti. Bez ošklivých lodí naše město konečně žije a dýchá! Jupí!',
	effect: 'vygebenost +350, účinnost obchodu -10%',
	reqs: ['PolA3'], f: function() {
		s.p.happy += 350;
		s.p.obchod -= 0.10;
	}},
{id: 'PolA5', class: 'Pol', name: 'Státní náboženství', cost: 7999,
	teaser: 'To by nešlo, aby lidi jen tak v něco věřili a jen tak se někde modlili jak se jim zachce. Vytvoříme pořádně zregulovanou oficiální církev, která bude kázat submisivitu vůči posvěcené státní vrchnosti!',
	result: 'Úžasné, naše nová církev je organizace tak neschopná a zkorumpovaná, že se nám o tom ani nesnilo! Nyní můžeme postavit svatý chrám a nahnat do něj věřící, ať už je to zajímá nebo ne.',
	effect: 'odemknut kostel',
	reqs: ['PolA4'], f: function() {
		s.p.unlockBuild.push('kostel');
	}},
{id: 'PolA6', class: 'Pol', name: 'Honosný palác', cost: 16999,
	teaser: 'Vládce musí být přece důstojný a reprezentovat naší zem svou vznešeností. Velkolepé vládní sídlo bude chloubou naší země, a občané to svému milovanému oligarchovi jistě rádi zacálují.',
	result: 'Paráda, můžeme zahájit stavbu! Lidé se asi rozhořčí nad vysáváním státního rozpočtu na stavbu Holubího Hnízda, ale tak už to holt chodí. Všichni jsou si rovni, ale někteří jsou si rovnější.',
	effect: 'odemknut palác',
	reqs: ['PolA5'], f: function() {
		s.p.unlockBuild.push('palac');
	}},
{id: 'PolA7', class: 'Pol', name: 'Populismus', cost: 28999,
	teaser: 'Převratný traktát v oboru politické filozofie, který má prý v praxi přinést harmonizaci vztahů mezi plebsem a oligarchií, jakož i pozvednout politickou kulturu v zemi.',
	result: 'Portrét vypaseného vládce visí na všech rozích a lidé přikyvují: no ano, chceme lepší budoucnost! Rozhazovat peníze je spravedlivé, úspory jsou stejně jenom výmysl nějakých ročíldů z volstrýtu.',
	effect: 'vygebenost +700, platy dělníků +10%, daňový výběr -10%',
	reqs: ['PolA6'], f: function() {
		s.p.happy += 700;
		s.p.plat += 0.10;
		s.p.prachy -= 0.10;
	}},
{id: 'PolC1', class: 'Pol', name: 'Novoroční ohňostroj', cost: 92235,
	teaser: 'Oslavy náhodného dne v kalendáři jsou vhodnou záminkou k chlastání a dělání bordelu. Dáme občanům den svátku, odpálíme ohňostroj a budou spokojení!',
	result: 'Po několika případech těžkých popálenin jsme ohňostroj raději zakázali a oslavy zrušili. Můžeme však tyto zbraně hromadného ničení vypustit na nepřátelské armády a proměnit tak bojiště v krvavá jatka!',
	effect: 've zkušebně ohňostrojů odemčen novoroční ohňostroj',
	reqs: ['PolA7', 'ArmB5'], f: function() {
		s.p.unlockNuke = true;
	}},
{id: 'PolGrand', class: 'Pol', name: 'Budoucnost politiky', cost: 99999,
	teaser: 'Dovedete si vůbec představit, že máme přitažlivé PR kampaně a sviňárny nám beztrestně prochází? To je naše budoucnost!',
	result: 'Rostoucí preference v průzkumech veřejného mínění a malá domů pro mě. Přesně jak to má být!',
	effect: 'vygebenost +1600, platy dělníků -20%',
	reqs: ['PolA7'], f: function() {
		s.p.happy += 1600;
		s.p.plat -= 0.20;
	}},



{id: 'WisA1', class: 'Wis', name: 'Křída', cost: 32,
	teaser: 'Tyto kusy slepeného kamenného prášku umožní učiteli psát na tabuli různé symboly, což je velice poučné. Případně mohou být vrženy na rušící studenty.',
	result: 'Skvělé! Teď, když se vyrušující žáci musí vyhýbat minerálním projektilům, jsou mnohem pozornější a nedělají tolik bordel!',
	effect: 'účinnost školství +20%',
	reqs: [], f: function() {
		s.p.skola += 0.20;
	}},
{id: 'WisA2', class: 'Wis', name: 'Tužka', cost: 128,
	teaser: 'Když zabalíme uhlí do dřeva, budou si žáci moci dokonce opsat vyučovanou látku.',
	result: 'Je to zdravá strava pro děti – žáci můžou tužku okousávat a ušetřili jsme tak za svačiny!',
	effect: 'účinnost školství +20%',
	reqs: ['WisA1'], f: function() {
		s.p.skola += 0.20;
	}},
{id: 'WisA3', class: 'Wis', name: 'Učebnice', cost: 512,
	teaser: 'Kusy papyru s poznámkami se dají spojit dohromady, aby mohly být propůjčeny žákům.',
	result: 'Skvělé, teď už při zkoušení nebudou žádné plané výmluvy, že "to sme přece nebrali"!',
	effect: 'účinnost školství +20%',
	reqs: ['WisA2'], f: function() {
		s.p.skola += 0.20;
	}},
{id: 'WisA4', class: 'Wis', name: 'Školní řád', cost: 2048,
	teaser: 'Abychom mohli žáky ukrutně trestat! Ten ksindl študáckej si to zaslouží! Poznámka: Ukradyjam: HD edition nenabádá k násilí na dětech.',
	result: 'Školní byrošikana je nyní podpořena oficiální žákovskou knihou. Není žádná lepší motivace k studijním úspěchům nežli systematická represe!',
	effect: 'účinnost školství +20%',
	reqs: ['WisA3'], f: function() {
		s.p.skola += 0.20;
	}},
{id: 'WisA5', class: 'Wis', name: 'Zábavné učivo', cost: 8192,
	teaser: 'Když žákům řekneme, že matika je přece kůl, tak se budou mnohem lépe učit!',
	result: 'Žáci se vysmívají dementním pokusům o humor v nových učebnicích, ale to splnilo cíl – nyní s učebnicemi tráví více času.',
	effect: 'účinnost školství +20%',
	reqs: ['WisA4'], f: function() {
		s.p.skola += 0.20;
	}},
{id: 'WisB1', class: 'Wis', name: 'Kulturní bohatství', cost: 4096,
	teaser: 'Měli bychom podpořit vlasteneckého ducha dělného lidu uspořádáním výstavy, ať mají všichni na očích výdobytky naší skvělé kultury.',
	result: 'Sehnali jsme nejrůznější smetí po babičkách a máme tak vytvořenou kulturní sbírku. Nyní můžeme začít stavět muzeum a zlepšit tak dopravní situaci ve městě!',
	effect: 'odemknuto muzeum',
	reqs: ['WisA4'], f: function() {
		s.p.unlockBuild.push('muzeum');
	}},
{id: 'WisB2', class: 'Wis', name: 'Občanská nauka', cost: 16384,
	teaser: 'Účelem vzdělání není jen předat dětem nějaké znalosti, ale také je řádně připravit na konformní život v autoritativní diktatuře. Vtlučeme jim do hlav, že náš systém je nejlepší možný.',
	result: 'Děti jsou naše budoucnost, a z těch příštích určitě vyrostou naprostí ignoranti bez ponětí o svých právech. Nad takovými ovcemi se nám bude dobře vládnout.',
	effect: 'vygebenost +400, cena jednotek -10%, účinnost školství -10%',
	reqs: ['WisB1', 'WisA5'], f: function() {
		s.p.happy += 400;
		s.p.cena -= 0.10;
		s.p.skola -= 0.10;
	}},
{id: 'WisC1', class: 'Wis', name: 'Praktické činnosti', cost: 32768,
	teaser: 'Je třeba prohloubit technickou zručnost našich žáků a zlepšit tak perspektivu jejich uplatnění – mohou pak udělat kariéru třeba v montovně!',
	result: 'Výborně, máme cvičené pracanty, kteří mohou v dílně montovat obrovské válečné stroje! Nepřátelé se budou třást před výtvory našich zlatých řemeslných ručiček!',
	effect: 'odemknut parní kolos (dílna)',
	reqs: ['WisB2', 'ArmB4'], f: function() {
		s.p.unlockUnit.push('obr');
	}},
{id: 'WisGrand', class: 'Wis', name: 'Budoucnost školství', cost: 65536,
	teaser: 'Dovedete si vůbec představit, že žáci rádi chodí do školy a pilně se učí? To je naše budoucnost!',
	result: 'Kvalitní výuka a motivovaní studenti. Čeká nás technický pokrok a zářná budoucnost!',
	effect: 'účinnost školství +60%',
	reqs: ['WisA5', 'WisB2'], f: function() {
		s.p.skola += 0.60;
	}},



{id: 'ArmA1', class: 'Arm', name: 'Bojový výcvik', cost: 90,
	teaser: 'Naučme vojáky, kterým koncem se kopí drží a do čeho se má bodat!',
	result: 'Skvělé! Naše "armáda" už nevypadá jako mateřská školka, ale alespoň jako pouliční gang!',
	effect: 'síla jednotek +20%',
	reqs: [], f: function() {
		s.p.power += 0.20;
	}},
{id: 'ArmA2', class: 'Arm', name: 'Motivační kouč', cost: 1800,
	teaser: 'Bojovat se nedá individuálně, vojáci potřebují tvrdé vedení. Určeme proto ty nejvíce arogantní a namyšlené slizouny jako lídry, aby mužstvo nahecovali a popohnali vstříc krvavému masakru!',
	result: 'Vojáci už mají motivačních proslovů plné zuby, tak se radši bezhlavě vrhají do boje než aby ty kecy museli poslouchat. Účinnost armády je značně zvýšena!',
	effect: 'síla jednotek +10%',
	reqs: ['ArmC1'], f: function() {
		s.p.power += 0.10;
	}},
{id: 'ArmA3', class: 'Arm', name: 'Příděl piva', cost: 9500,
	teaser: 'Vojákům rozdáme před bojem pivo, abychom podpořili jejich agresivitu.',
	result: 'Ožralí vojáci se sice neumí pořádně trefit do nepřátel, ale zase ztrácí pud sebezáchovy a zapomínají pak dezertovat. Bojová síla našich pluků se tedy značně zvýšila.',
	effect: 'síla jednotek +10%',
	reqs: ['ArmC2'], f: function() {
		s.p.power += 0.10;
	}},
{id: 'ArmC1', class: 'Arm', name: 'Konfiskace', cost: 650,
	teaser: 'Vojáci nyní všechen lup schovávají do kapes a my tedy máme jen to, co neunesou a odpadne jim. Loupež musíme zlegalizovat, a především zorganizovat ku státnímu prospěchu!',
	result: 'Vojáci jsou zklamaní, že už loupení není takové dobrodružství, ale my můžeme z války přivézt mnoho surovin pro rozvoj města!',
	effect: 'účinnost drancování +40%',
	reqs: ['ArmA1'], f: function() {
		s.p.dranc += 0.40;
	}},
{id: 'ArmC2', class: 'Arm', name: 'Káry na brakování', cost: 3000,
	teaser: 'Drancování je ta nejdůležitější část boje, proto musíme zajistit funkční logistiku vyplundrovaných surovin!',
	result: 'Skvělé! Intenzita loupení a vykrádání se zlepšila a do našeho města může proudit tučná kořist. Alespoň NĚCO v tomhle státě funguje přesně podle očekávání.',
	effect: 'účinnost drancování +30%',
	reqs: ['ArmA2'], f: function() {
		s.p.dranc += 0.30;
	}},
{id: 'ArmC3', class: 'Arm', name: 'Detektor kovu', cost: 29000,
	teaser: 'Existuje teorie o zvláštním artefaktu posvěceném samotným Hefaistem, který nám umožní hledat skryté poklady v nepřátelských městech!',
	result: 'Vědci přišli s hyperinflačním protonakadriovým homonitorem, který po náležité termoexaltační evisceraci provede širokospektrální paralytickou analýzu. ABYCHOM MOHLI UKRÁST VÍCE ZLATA!!!',
	effect: 'účinnost drancování +30%',
	reqs: ['ArmA3', 'ArmB4'], f: function() {
		s.p.dranc += 0.30;
	}},
{id: 'ArmB1', class: 'Arm', name: 'Luk', cost: 250,
	teaser: 'Jiná města umí házet nože pomocí klacku! To zní velice nebezpečně, tak proč to nezkusit?',
	result: 'Vrhače nožů se v rukou těch trotlů chovají víceméně náhodně. Někdy je zasažen nepřítel, někdy spolubojovník. Válka je holt krutá a z krvavého pekla není úniku žádným směrem...',
	effect: 'odemknut lučištník (kasárna)',
	reqs: ['ArmA1'], f: function() {
		s.p.unlockUnit.push('luk');
	}},
{id: 'ArmB2', class: 'Arm', name: 'Zoo', cost: 1300,
	teaser: 'Vědci by rádi zřídili ohrádku s cizokrajnými zvířaty, aby je mohli zevrubně studovat. Prý by to bylo i velice poučné a zábavné pro měšťany. Co je to za blbost, to jim nestačí ovce a krávy?',
	result: 'Ztřeštěného nápadu vědců se chytli naši vojenští inženýři a zoo přestavěli na velkochov bitevních příšer. Pět tun masa s ohromnými kly se řítí po bojišti vražednou rychlostí – paráda!',
	effect: 'odemknut slon (kasárna)',
	reqs: ['ArmB1'], f: function() {
		s.p.unlockUnit.push('sln');
	}},
{id: 'ArmB3', class: 'Arm', name: 'Hopliti', cost: 2400,
	teaser: 'Nový kopiníci budou větší, lepší, hezčí, delší a když se tito tvrdí hoši postaví do hrozivě vypadající formace, určitě hluboce penetrují nepřátelské linie.',
	result: 'Tyto elitní jednotky s nablýskanou zbrojí jsou zlatým hřebem každé vojenské přehlídky!',
	effect: 'odemknut hoplit (kasárna)',
	reqs: ['ArmB2'], f: function() {
		s.p.unlockUnit.push('hop');
	}},
{id: 'ArmB4', class: 'Arm', name: 'Sochařství', cost: 5500,
	teaser: 'Sochy jsou krásné a vznešené, měli bychom jimi zvelebit naši armádu. Třeba tak usmíříme své sveřepé soky!',
	result: 'Dřevěné koně lze vydávat za umělecké dílo, takže můžeme část výdajů na armádu zahrnout pod kulturu a náš rozpočet hned vypadá přívětivěji! V útrobách koní zatím čekají chrabří bratři ve zbrani.',
	effect: 'odemknuta dílna a v ní trojský kůň',
	reqs: ['ArmB3', 'ArmC2'], f: function() {
		s.p.unlockBuild.push('dilna');
		s.p.unlockUnit.push('trj');
	}},
{id: 'ArmB5', class: 'Arm', name: 'Zkušebna ohňostrojů', cost: 13500,
	teaser: 'BUM PRÁSK! Vědci s výbušnou povahou mohou být zapojeni přímo do vojensko-průmyslového komplexu a rozflákat tak všechno, na co přijdou!',
	result: 'FIASKO! Budova byla při uvítacím ohňostroji srovnána se zemí, budeme muset postavit novou! A jestli jí ti vědci zase vyhodí do povětří, vyženeme je s jejich třaskavými experimenty přímo na bitevní pole.',
	effect: 'odemknuta zkušebna ohňostrojů a v ní ohňostrojčík',
	reqs: ['ArmB4'], f: function() {
		s.p.unlockBuild.push('zkusebna');
		s.p.unlockUnit.push('baz');
	}},
{id: 'ArmB6', class: 'Arm', name: 'Měchy na vzduch', cost: 22500,
	teaser: 'To je ale šílený nápad – měchy na vzduch prý umožní potápěčům setrvat pod vodou a dobýt tak mořské hlubiny. Kdyby se to však povedlo, znamenalo by to převrat v námořním boji.',
	result: 'Dostavil se nečekaný výsledek, měchy sice nelze využít na potápění, ale zase se umí VZNÁŠET! Dílna může tedy začít chrlit létající válečné stroje. Zmizte, ptáci – vzdušný prostor je náš!',
	effect: 'odemknut balón (dílna)',
	reqs: ['ArmB5'], f: function() {
		s.p.unlockUnit.push('bal');
	}},
{id: 'ArmB7', class: 'Arm', name: 'Létající řeznictví', cost: 34000,
	teaser: 'Gyros je tradiční řecká pochoutka z masa. Dává proto smysl opatřit řezníky létajícím vrtulovým strojem, aby mohli ze vzduchu sytit hladové krky našich vojáků lahodným kafilerním odpadem.',
	result: 'Letecké zásobování se ukázalo být neekonomické, ale když už jsme kvůli tomu vynalezli létající stroj pobitý ostrými čepelemi, můžeme jej nasadit do boje! Gyrosáři budou postrachem nebe!',
	effect: 'odemknut gyrosář (dílna)',
	reqs: ['ArmB6'], f: function() {
		s.p.unlockUnit.push('gyr');
	}},
{id: 'ArmD1', class: 'Arm', name: 'Povinná vojna', cost: 44000,
	teaser: 'Další buzerace občanů, tentokrát pro vojenské účely! Nevím, jestli budou rekruti bojeschopní, ale to je jedno – kvantita nad kvalitou, vždy a všude!',
	result: 'Každý dospělý občan je zbuzerován a vycvičen, aby uměl salutovat, obléct si uniformu a vypotácet se ze stanu na ranní nástup. To značně pomůže produkci kanonenfutru v případě války.',
	effect: 'cena jednotek -12%, síla jednotek -10%',
	reqs: ['ArmB7', 'ArmC3'], f: function() {
		s.p.cena -= 0.12;
		s.p.power -= 0.10;
	}},
{id: 'ArmGrand', class: 'Arm', name: 'Budoucnost války', cost: 99999,
	teaser: 'Dovedete si vůbec představit, že se vojáci krvelačně vrhají do bitevní vřavy a poslušně poslouchají rozkazy? To je naše budoucnost!',
	result: 'Po zuby ozbrojená banda lačnící po krveprolití. Naše válečná mašinerie může dobýt svět!',
	effect: 'síla jednotek +20%',
	reqs: ['ArmD1'], f: function() {
		s.p.power += 0.20;
	}}
];
