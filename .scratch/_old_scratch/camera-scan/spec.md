# Skenovanie DMC kódu cez kameru tabletu

Status: ready-for-agent (počká na tablety a vzorové fotky)

## Problém

Operátor dnes skenuje DMC štítky (Data Matrix) čítačkou, ktorá zapíše kód do inputu `barcode` na obrazovke `scandmclabel`. V budúcnosti sa budú používať Android tablety (spočiatku možno aj mobily), prípadne iPady, a čítačka tam nebude. Aplikácia beží v internej sieti bez HTTPS, takže prehliadač nepovolí `getUserMedia` (živý náhľad kamery) ani `BarcodeDetector` (vyžadujú secure context). Zariadenia s kamerou preto potrebujú iný spôsob načítania kódu.

## Riešenie

Pri inpute na skenovanie sa na dotykových zariadeniach zobrazí malá nenápadná ikona kamery. Po jej stlačení sa otvorí natívna aplikácia fotoaparátu (zadná kamera). Operátor odfotí DMC kód, aplikácia ho z fotky dekóduje priamo v prehliadači, vyplní input, pípne a formulár odošle automaticky. Ak sa kód nepodarí prečítať, operátor dostane hlášku a môže fotiť znova alebo kód dopísať ručne. Na PC s čítačkou sa UI nemení.

Cesta cez `<input type="file" capture="environment">` funguje na HTTP aj na iPade (žiadny live náhľad, ale jednotné správanie na všetkých zariadeniach).

## Používateľské príbehy

1. Ako operátor na tablete chcem kliknúť na ikonu kamery pri inpute, aby som mohol naskenovať diel bez čítačky.
2. Ako operátor chcem, aby sa otvorila zadná kamera, aby som nemusel prepínať kamery.
3. Ako operátor chcem, aby sa po odfotení kód sám vyplnil a odoslal, aby som nemusel klikať navyše.
4. Ako operátor chcem počuť rovnaké pípnutie úspechu ako pri čítačke, aby som vedel, že sken prebehol.
5. Ako operátor chcem pri nečitateľnej fotke počuť chybové pípnutie a vidieť hlášku „Kód sa nepodarilo prečítať, skús znova“, aby som vedel, že treba fotiť znova.
6. Ako operátor chcem po neúspešnom čítaní vedieť kód dopísať ručne, aby ma zlá fotka neblokovala.
7. Ako operátor chcem, aby sa po neúspechu nič automaticky neodoslalo ani neopakovalo, aby sa neodoslal zlý kód.
8. Ako operátor chcem, aby ikona kamery nerušila a bola nenápadná, aby UI zostalo prehľadné.
9. Ako operátor pri PC s čítačkou chcem, aby ikona kamery vôbec nebola vidieť, aby sa UI nezmenilo.
10. Ako operátor chcem, aby ikona bola zablokovaná počas načítavania skenu (`isScanning`), aby som neodoslal dva kódy naraz.
11. Ako operátor na iPade chcem rovnaké správanie ako na Androide, aby sa zariadenia nelíšili.
12. Ako admin chcem, aby riešenie fungovalo bez HTTPS, aby sa nemusela meniť infraštruktúra.
13. Ako admin chcem, aby dekodér bežal lokálne v prehliadači a wasm súbor sa servoval z aplikácie (bez CDN), aby fungoval v internej sieti.
14. Ako vývojár chcem dekódovanie v samostatnej generickej funkcii, aby sa dalo použiť aj v iných projektoch a testovať samostatne.

## Implementačné rozhodnutia

- **Tlačidlo:** nový atóm `CameraScanButton.svelte` v `$lib/components/atoms/` (schválené používateľom). Props: `onDecoded(value: string)`, `disabled`, voliteľne `onError`. Vnútri skrytý `<input type="file" accept="image/*" capture="environment">`, ktorý tlačidlo spúšťa. Vzhľad: ikona `CameraIcon`, `variant="ghost"`, malá, umiestnená vedľa existujúcej odosielacej ikony; len sémantické tokeny témy.
- **Viditeľnosť:** tlačidlo sa zobrazí len pri `matchMedia('(pointer: coarse)')`. Na HTTP `navigator.mediaDevices` neexistuje, takže prítomnosť kamery sa nedá zistiť inak.
- **Dekódovanie:** generická funkcia `decodeDataMatrix(file: File): Promise<string | null>` v `$lib/utils`, postavená na `zxing-wasm` (čítanie formátu Data Matrix). Vracia `null`, ak sa kód nenašiel. Pred dekódovaním sa fotka zmenší na rozumný rozmer (výkon). Wasm sa bundluje lokálne. Najprv sa skontroluje `$lib/utils`, či už niečo podobné neexistuje.
- **Tok po dekódovaní:** `onDecoded` nastaví `barcodeValue`, prehrá `playBeep('ok')` a odošle formulár (`requestSubmit`), pričom využije existujúci `use:enhance` handler. Pri `null` sa prehrá `playBeep('error')`, zobrazí hláška a input ostane bez odoslania.
- **Bez dialógu:** natívna kamera nahrádza dialóg, ktorý bol pôvodne v návrhu.
- **Žiadne zmeny servera:** `scanDmc` action a schéma ostávajú nezmenené, žiadna zmena DB.
- **Kamera:** len zadná, bez prepínača, zoomu a baterky.

## Rozhodnutia o testovaní

- Dobrý test kontroluje len vonkajšie správanie: pre daný súbor obrázka vráti `decodeDataMatrix` správny text alebo `null`; nie interné volania knižnice.
- **Seam:** funkcia `decodeDataMatrix`. Komponenty sa neskúšajú samostatne.
- **Prvý krok pred implementáciou:** overiť čítanie reálnych DMC kódov (malé, gravírované, lesklé) z fotiek z tabletu. Vzorové fotky zatiaľ neexistujú; treba ich získať (3 až 5, aj slabšie) a uložiť napr. do `.scratch/camera-scan/samples/`. Ak knižnica kódy neprečíta, riešenie sa musí prehodnotiť skôr, než sa napíše UI.
- Testy nezapisujú do DB.
- Prior art: pozrieť existujúce testy utilít v repozitári a znovu použiť ich nastavenie.

## Mimo rozsah

- Živý náhľad z kamery (`getUserMedia`, `BarcodeDetector`); možné pokračovanie, ak sa na tabletoch nastaví Chrome flag alebo MDM politika, alebo ak sa zavedie HTTPS.
- Zavedenie HTTPS alebo interného certifikátu.
- Prepínač kamier, baterka, zoom.
- Natívny wrapper (Capacitor) alebo PWA.
- Skenovanie iných kódov ako Data Matrix (QR a iné).
- Automatické opakovanie pokusov o dekódovanie.

## Ďalšie poznámky

- Hlavné riziko je spoľahlivosť čítania fyzických DMC z fotky; preto vzorové fotky pred implementáciou.
- Realizácia je odložená do doby, kým budú k dispozícii tablety a vzorové fotky.
