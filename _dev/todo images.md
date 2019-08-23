## TODO images

**favicon.ico** `je potřeba 16x16, dosud vůbec neexistuje`  
	Nějaký ikonický obrázeček, co se zobrazuje v prohlížeči jako ikonka stránky

**res/env/BATTLE.png** `je třeba zachovat 600x600`  
	To je opravdu hnusný a to bych si moc přál předělat.
	Avšak je třeba dát pozor, pokud tam budou nějaké ozdoby, aby nebyly v konfliktu s jednotkama.
	Asi by tedy bylo dobré samotný battlefield nechat čistý (ne nutně jednobarevná plocha, ale bez featur) a dát dekorace jen okolo?.  
	Pokud bude změněno nebe, budu muset zprůhlednit pozadí balónu a gyrokoptéry, které zatím mají opaque background o stejné barvě

**res/env/polis_1.png**  
**res/env/polis_2.png**  
**res/env/polis_3.png**  
**res/env/polis_4.png**  
**res/env/polis_E.png**  
	Nyní jsou to dost hnusné šedé obdélníčky  
	Hodilo by se zachovat rozměry a proporce, ale není to vůbec nutné.
	Akorát bych musel připrogramovat offset těch obrázků, kdyby se proporce a rozměry změnily, ale to není problém  
	_Pozn.: polisE je obrázek enemy polis, obsahově shodný s polis1, ale jiné rozměry a pozice_

**res/GUI/icon_kamen.png**  
**res/GUI/icon_pivo.png**  
**res/GUI/icon_syra.png**  
**res/GUI/icon_zlato.png**  
	`je třeba zachovat 32x32, stejně se vyskytují jen jako 32x32 a 16x16`  
	Ikonky surovin - mě přijdou v pohodě, protože jsou vždy dost zmenšený, ale pokud by byla vůle k vylepšení, tak proč ne  
	Dřevo je zcela OK, ale souhlasím, že hlavně kámen a sýra jsou velmi odbyté

**res/env/ISLAND.png** `je třeba zachovat 600x600`  
**res/env/CITY.png** `je třeba zachovat 600x600`  
	Určitě by se daly zkrášlit, ale nevypadá to hrozně, když na tom pak stojí budovy

**res/env/prod_syra.png** `zcela libovolné rozměry`  
	syrná louka je hezká, ale ty krávy jsou moc malý a nejsou vidět

**res/env/prod_kamen.png** `zcela libovolné rozměry`  
	pláž z MS paint spreje, nic moc, ale přijde mi, že to nevypadá špatně

**res/unit/steam.png** `je třeba zachovat 64x64`  
	parní obr - aby držel ceduli rukama a měl nějakou páku. To je vlastně můj obrázek, tak si to třeba udělám sám

**draggable pseudobudovy?**  
	To je jen taková brainstorm idea - že když mám ve městě draggable budovy, tak by se tam daly dát i draggable ozdoby.
	Namísto toho, aby byly statický jako součást CITY.png, tak by tam byly jednotlivé objekty, např:  
	_stromy (či remízky), davy ovcí, stáda demonstrantů, eventuelně fontány, sochy, lodě a takový podobný nesmysly_  
	Některé by tam byly od začátku, jiné bys dostával za stavbu radnice nebo vynálezy techů a mohl bys to libovolně přetahovat po městě :)
