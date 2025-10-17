# DanceArena
DanceArena je web platforma za organizaciju plesnih natjecanja. Cilj platforme je omogućiti organizatorima jednostavno kreiranje natjecanja i kategorija, voditeljima plesnih klubova praktičnu prijavu svojih grupa i nastupa, te sucima jednostavno ocjenjivanje nastupa. 

Ovaj projekt je reultat timskog rada u sklopu projeknog zadatka kolegija [Programsko inženjerstvo](https://www.fer.unizg.hr/predmet/proinz) na Fakultetu elektrotehnike i računarstva Sveučilišta u Zagrebu. 

# Funkcijski zahtjevi

**Organizator:**

> Kreiranje natjecanja
>
> -  Unos naziva, datuma, lokacije i opisa događaja
> -  Definiranje kategorija (dobne skupine, stilovi, veličine grupa)

> Upravljanje prijavama
>
> -  Pregled prijavljenih nastupa
> -  Potvrđivanje, izmjena ili odbijanje prijava

> Odabir sudaca
>
> -  Odabir minimalno 3 suca (neparan broj: 3, 5, 7)
> -  Slanje poziva putem e-maila ako sudac nije registriran

> Upravljanje kotizacijama
>
> -  Plaćanje kotizacija kreditnom karticom prilikom prijave

> Zaključavanje prijava
>
> -  Generiranje PDF dokumenta s popisom nastupa po kategorijama
> -  Omogućavanje preuzimanja PDF-a svim korisnicima


**Voditelj:**

> Registracija i prijava u sustav
>
> -  Autentifikacija putem vanjskog servisa (Google OAuth2)

> Upravljanje profilom
>
> -  Naziv plesnog kluba, lokacija, e-mail
> -  Uređivanje podataka profila

> Prijava grupe na natjecanje
>
> -  Odabir natjecanja i kategorije
> -  Unos naziva koreografije, trajanja i imena koreografa
> -  Upload glazbene datoteke
> -  Plaćanje kotizacije ako je potrebno

> Pregled statusa prijava
>
> -  Pregled potvrđenih, odbijenih i prijava na čekanju

> Pregled rezultata
>
> -  Pregled ocjena i poretka nakon završetka natjecanja

**Sudac:**

> Prijava u sustav (Google OAuth2)
>
> -  Autentifikacija putem vanjskog servisa

> Pregled dodijeljenih natjecanja
>
> -  Pregled natjecanja na kojima je imenovan za suca

> Ocjenjivanje nastupa
>
> -  Unos ocjene (0–30 bodova) za svaku koreografiju
> -  Mogućnost izmjene ocjene prije zaključavanja natjecanja

> Pregled vlastitih ocjena
>
> -  Pregled i potvrda ocjena nakon završetka natjecanja

**Administrator:**

> Upravljanje korisnicima
>
> -  Dodavanje i brisanje korisnika
> -  Postavljanje uloga (organizator, sudac, voditelj)

> Postavljanje godišnje članarine
>
> -  Definiranje cijene članarine
> -  Upravljanje naplatom članarina

> Nadgledanje sustava
>
> -  Pregled svih prijava, natjecanja i aktivnosti korisnika

**Server:**

> Obrada zahtjeva
>
> -   Dohvat podataka
> -   Izmjena podataka
> -   Spremanje podataka

> Upravljanje korisnicima
>
> -   Registracija i prijava korisnika putem Google OAuth2
> -   Provjera uloga (organizator, voditelj, sudac, administrator)
> -   Autentifikacija i autorizacija korisnika

> Upravljanje natjecanjima
>
> -   Kreiranje natjecanja (naziv, datum, lokacija, opis)
> -   Dodavanje kategorija (dobne skupine, stilovi, veličine grupa)
> -   Uređivanje i brisanje natjecanja

> Upravljanje prijavama
>
> -   Zaprimanje prijava od voditelja
> -   Potvrđivanje, izmjena ili odbijanje prijava od strane organizatora
> -   Zaključavanje prijava i generiranje PDF-a s listom nastupa

> Ocjenjivanje nastupa
>
> -   Spremanje ocjena (0–30 bodova)
> -   Izračun ukupnih bodova po kategoriji
> -   Generiranje rang liste po kategorijama

> Učitavanje i pohrana datoteka
>
> -  Upload glazbe uz prijavu nastupa
> -  Pohrana i dohvat datoteka s poslužitelja

> Obrada plaćanja
>
> -  Plaćanje kotizacija putem kreditne kartice
> -  Plaćanje godišnje članarine

> Generiranje dokumenata
>
> -  Izrada PDF-a s listom prijavljenih natjecatelja
> -  Generiranje PDF-a s rezultatima po kategorijama

> Komunikacija s vanjskim servisima
>
> -  Google OAuth2 za autentifikaciju korisnika
> -  API integracije za plaćanja i e-mail obavijesti

# Tehnologije

-   Frontend: [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/)
-   Backend: [ASP.NET Core](https://dotnet.microsoft.com/apps/aspnet)
-   Baza podataka: [PostgreSQL](https://www.postgresql.org/)
-   Dokumentacija: [Github](https://github.com/)
-   Plačanje: [Stripe](https://stripe.com/en-hr)
-   Autetnikacija: [Google Cloud](https://console.cloud.google.com/)
-   Mail: [Twilio SendGrid](https://sendgrid.com/en-us)
  
# Instalacija

### 1. Klonirati repozitorij

Klonirati GitHub repozitorij:

```console
    git clone https://github.com/filip-fabijanec/DanceArena.git
    cd DanceArena/src
```

### 2. Postavljanje backend okruženja

1. Navigirajte do DanceArena.API direktorija.
2. Stvorite "appsettings.development.json" datoteku.
3. Kopirajte sadržaj "appsettings.development.json.txt" u stvorenu datoteku.
4. Dodajte JWT ključ u datoteku.
5. Dodajte ostale "secrets" ako ih imate.

### 3. Postavljanje baze podataka

1. Napravite novog PostgreSQL korisnika s imenom "dancearena_backend" i dodijeliti mu lozinku.
2. Kreirajte bazu podataka s imenom "dancearena" i schemom "backend".
3. Popunite ConnectionString u "appsettings.development.json" datoteci.
4. Ako nemate instaliran dotnet tools, pokrenuti sljedeću naredbu:

```console
    dotnet tool install --global dotnet-ef --version 8.*
```

5. Za kreiranje tablica u bazi podataka, pokrenite iduću naredbu iz "DanceArena/src" direktorija:

```console
    dotnet ef database update -s Dancearena.API -p DanceArena.Model
```

### 4. Pokretanje backend-a

```console
    dotnet restore
    dotnet run
```

### 5. Postavljanje i pokretanje frontend-a

1. Navigirajte do "DanceArena.Front" direktorija.
2. Kreirajte ".env.development" datoteku.
3. Kopirajte sadržaj ".env.development.txt" u stvorenu datoteku.
4. Pokrenite sljedeće naredbe iz "DanceArena.Front" direktorija:

```console
    npm install
    npm run dev
```

### 6. Pristupanje aplikaciji

Nakon ovih koraka otvoiti preglednik i navigirajte do https://localhost:3000 kako bi pristupili "DanceArena" aplikaciji.

# Članovi tima 
| Članovi          | Uloge            |
| :-------------   | :--------------- |
| Filip Fabijanec  | Backend          |
| Josip Petričević | Frontend         |
| Vito Cindor      | Frontend         |
| Marija Jurić     | Frontend         |
| Martin Tomišić   | Database         |
| David Premuš     | Backend          |
| Ivona Gašparić   | Backend          |


# Kontribucije
>Pravila ovise o organizaciji tima i su često izdvojena u CONTRIBUTING.md


# 📝 Kodeks ponašanja [![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)
Kao studenti sigurno ste upoznati s minimumom prihvatljivog ponašanja definiran u [KODEKS PONAŠANJA STUDENATA FAKULTETA ELEKTROTEHNIKE I RAČUNARSTVA SVEUČILIŠTA U ZAGREBU](https://www.fer.hr/_download/repository/Kodeks_ponasanja_studenata_FER-a_procisceni_tekst_2016%5B1%5D.pdf), te dodatnim naputcima za timski rad na predmetu [Programsko inženjerstvo](https://wwww.fer.hr).
Očekujemo da ćete poštovati [etički kodeks IEEE-a](https://www.ieee.org/about/corporate/governance/p7-8.html) koji ima važnu obrazovnu funkciju sa svrhom postavljanja najviših standarda integriteta, odgovornog ponašanja i etičkog ponašanja u profesionalnim aktivnosti. Time profesionalna zajednica programskih inženjera definira opća načela koja definiranju  moralni karakter, donošenje važnih poslovnih odluka i uspostavljanje jasnih moralnih očekivanja za sve pripadnike zajenice.

Kodeks ponašanja skup je provedivih pravila koja služe za jasnu komunikaciju očekivanja i zahtjeva za rad zajednice/tima. Njime se jasno definiraju obaveze, prava, neprihvatljiva ponašanja te  odgovarajuće posljedice (za razliku od etičkog kodeksa). U ovom repozitoriju dan je jedan od široko prihvačenih kodeks ponašanja za rad u zajednici otvorenog koda.
>### Poboljšajte funkcioniranje tima:
>* definirajte načina na koji će rad biti podijeljen među članovima grupe
>* dogovorite kako će grupa međusobno komunicirati.
>* ne gubite vrijeme na dogovore na koji će grupa rješavati sporove primjenite standarde!
>* implicitno podrazmijevamo da će svi članovi grupe slijediti kodeks ponašanja.
 
>###  Prijava problema
>Najgore što se može dogoditi je da netko šuti kad postoje problemi. Postoji nekoliko stvari koje možete učiniti kako biste najbolje riješili sukobe i probleme:
>* Obratite mi se izravno [e-pošta](mailto:vlado.sruk@fer.hr) i  učinit ćemo sve što je u našoj moći da u punom povjerenju saznamo koje korake trebamo poduzeti kako bismo riješili problem.
>* Razgovarajte s vašim asistentom jer ima najbolji uvid u dinamiku tima. Zajedno ćete saznati kako riješiti sukob i kako izbjeći daljnje utjecanje u vašem radu.
>* Ako se osjećate ugodno neposredno razgovarajte o problemu. Manje incidente trebalo bi rješavati izravno. Odvojite vrijeme i privatno razgovarajte s pogođenim članom tima te vjerujte u iskrenost.

# 📝 Licenca
Važeča (1)
[![CC BY-NC-SA 4.0][cc-by-nc-sa-shield]][cc-by-nc-sa]

Ovaj repozitorij sadrži otvoreni obrazovni sadržaji (eng. Open Educational Resources)  i licenciran je prema pravilima Creative Commons licencije koja omogućava da preuzmete djelo, podijelite ga s drugima uz 
uvjet da navođenja autora, ne upotrebljavate ga u komercijalne svrhe te dijelite pod istim uvjetima [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License HR][cc-by-nc-sa].
>
> ### Napomena:
>
> Svi paketi distribuiraju se pod vlastitim licencama.
> Svi upotrijebleni materijali  (slike, modeli, animacije, ...) distribuiraju se pod vlastitim licencama.

[![CC BY-NC-SA 4.0][cc-by-nc-sa-image]][cc-by-nc-sa]

[cc-by-nc-sa]: https://creativecommons.org/licenses/by-nc/4.0/deed.hr 
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg

Orginal [![cc0-1.0][cc0-1.0-shield]][cc0-1.0]
>
>COPYING: All the content within this repository is dedicated to the public domain under the CC0 1.0 Universal (CC0 1.0) Public Domain Dedication.
>
[![CC0-1.0][cc0-1.0-image]][cc0-1.0]

[cc0-1.0]: https://creativecommons.org/licenses/by/1.0/deed.en
[cc0-1.0-image]: https://licensebuttons.net/l/by/1.0/88x31.png
[cc0-1.0-shield]: https://img.shields.io/badge/License-CC0--1.0-lightgrey.svg

### Reference na licenciranje repozitorija
