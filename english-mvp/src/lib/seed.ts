import type { CefrLevel, Lesson, LessonSource, WordEntry } from "./types";

type LessonBlueprint = {
  unit: string;
  title: string;
  cefr: CefrLevel;
  source: LessonSource;
  items: string;
};

const cefrOrder: Record<CefrLevel, number> = {
  A2: 0,
  B1: 1,
  B2: 2,
  C1: 3,
};

export const sourceNotes = [
  {
    name: "NGSL 1.2",
    url: "https://www.newgeneralservicelist.com/new-general-service-list",
    note: "New General Service List, CC BY-SA 4.0. Used as the main high-frequency vocabulary direction.",
  },
  {
    name: "NAWL 1.2",
    url: "https://www.newgeneralservicelist.com/new-academic-word-list",
    note: "New Academic Word List, CC BY-SA 4.0. Used for academic and C1 bridge vocabulary.",
  },
  {
    name: "Cambridge/Oxford/British Council",
    url: "https://englishprofile.org/?menu=evp-online",
    note: "Used as CEFR and exam-direction references, not copied as protected coursebook content.",
  },
];

const lessonBlueprints: LessonBlueprint[] = [
  {
    unit: "B1/B2 General",
    title: "Daily routine",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "routine|rutyna|n.; habit|nawyk|n.; schedule|harmonogram|n.; prepare|przygotowac|v.; manage|zarzadzac|v.; regular|regularny|adj.; usually|zwykle|adv.; task|zadanie|n.; energy|energia|n.; focus|skupienie|n.",
  },
  {
    unit: "B1/B2 General",
    title: "Home",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "apartment|mieszkanie|n.; furniture|meble|n.; shelf|polka|n.; drawer|szuflada|n.; comfortable|wygodny|adj.; tidy|schludny|adj.; repair|naprawiac|v.; rent|czynsz lub wynajmowac|n./v.; neighbour|sasiad|n.; household|gospodarstwo domowe|n.",
  },
  {
    unit: "B1/B2 General",
    title: "Food",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "meal|posilek|n.; ingredient|skladnik|n.; recipe|przepis|n.; taste|smak lub smakowac|n./v.; fresh|swiezy|adj.; bitter|gorzki|adj.; portion|porcja|n.; boil|gotowac|v.; bake|piec|v.; avoid|unikac|v.",
  },
  {
    unit: "B1/B2 General",
    title: "Travel",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "journey|podroz|n.; destination|cel podrozy|n.; luggage|bagaz|n.; abroad|za granica|adv.; delay|opoznienie|n.; book|rezerwowac|v.; explore|odkrywac|v.; guide|przewodnik|n.; local|lokalny|adj.; arrive|przybyc|v.",
  },
  {
    unit: "B1/B2 General",
    title: "Transport",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "vehicle|pojazd|n.; commute|dojezdzac|v.; platform|peron|n.; route|trasa|n.; traffic|ruch uliczny|n.; passenger|pasazer|n.; fare|oplata za przejazd|n.; transfer|przesiadka|n.; engine|silnik|n.; distance|odleglosc|n.",
  },
  {
    unit: "B1/B2 General",
    title: "Work",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "employee|pracownik|n.; employer|pracodawca|n.; salary|pensja|n.; deadline|termin|n.; meeting|spotkanie|n.; responsibility|odpowiedzialnosc|n.; skill|umiejetnosc|n.; apply|aplikowac|v.; improve|poprawiac|v.; colleague|wspolpracownik|n.",
  },
  {
    unit: "B1/B2 General",
    title: "School",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "subject|przedmiot|n.; assignment|zadanie|n.; grade|ocena|n.; revise|powtarzac material|v.; explain|wyjasniac|v.; attend|uczeszczac|v.; course|kurs|n.; lecture|wyklad|n.; knowledge|wiedza|n.; mistake|blad|n.",
  },
  {
    unit: "B1/B2 General",
    title: "Health",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "symptom|objaw|n.; treatment|leczenie|n.; recover|wyzdrowiec|v.; injury|uraz|n.; pain|bol|n.; appointment|wizyta|n.; prescription|recepta|n.; healthy|zdrowy|adj.; disease|choroba|n.; prevent|zapobiegac|v.",
  },
  {
    unit: "B1/B2 General",
    title: "Money",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "budget|budzet|n.; expense|wydatek|n.; afford|moc sobie pozwolic|v.; borrow|pozyczac od kogos|v.; lend|pozyczac komus|v.; save|oszczedzac|v.; debt|dlug|n.; income|dochod|n.; payment|platnosc|n.; value|wartosc|n.",
  },
  {
    unit: "B1/B2 General",
    title: "Shopping",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "receipt|paragon|n.; discount|znizka|n.; refund|zwrot pieniedzy|n.; purchase|zakup|n.; customer|klient|n.; product|produkt|n.; compare|porownywac|v.; choose|wybierac|v.; quality|jakosc|n.; available|dostepny|adj.",
  },
  {
    unit: "B1/B2 General",
    title: "Relationships",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "trust|zaufanie|n.; support|wsparcie|n.; argue|klocic sie|v.; apologise|przepraszac|v.; respect|szacunek|n.; honest|uczciwy|adj.; close|bliski|adj.; share|dzielic sie|v.; promise|obietnica|n.; relationship|relacja|n.",
  },
  {
    unit: "B1/B2 General",
    title: "Emotions",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "anxious|zaniepokojony|adj.; excited|podekscytowany|adj.; disappointed|rozczarowany|adj.; proud|dumny|adj.; calm|spokojny|adj.; mood|nastroj|n.; relief|ulga|n.; fear|strach|n.; confidence|pewnosc siebie|n.; react|reagowac|v.",
  },
  {
    unit: "B1/B2 General",
    title: "Technology",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "device|urzadzenie|n.; update|aktualizacja|n.; software|oprogramowanie|n.; password|haslo|n.; screen|ekran|n.; connect|laczyc|v.; download|pobierac|v.; data|dane|n.; privacy|prywatnosc|n.; tool|narzedzie|n.",
  },
  {
    unit: "B1/B2 General",
    title: "Media",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "article|artykul|n.; headline|naglowek|n.; audience|publicznosc|n.; source|zrodlo|n.; publish|publikowac|v.; report|relacjonowac|v.; channel|kanal|n.; advert|reklama|n.; opinion|opinia|n.; reliable|wiarygodny|adj.",
  },
  {
    unit: "B1/B2 General",
    title: "Sport",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "competition|zawody|n.; coach|trener|n.; score|wynik|n.; defeat|porazka lub pokonac|n./v.; improve|poprawiac|v.; strength|sila|n.; injury|kontuzja|n.; perform|wystepowac|v.; team|druzyna|n.; challenge|wyzwanie|n.",
  },
  {
    unit: "B1/B2 General",
    title: "Culture",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "tradition|tradycja|n.; custom|zwyczaj|n.; festival|festiwal|n.; audience|widownia|n.; perform|wystepowac|v.; celebrate|swietowac|v.; belief|przekonanie|n.; heritage|dziedzictwo|n.; local|lokalny|adj.; art|sztuka|n.",
  },
  {
    unit: "B1/B2 General",
    title: "City",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "district|dzielnica|n.; pavement|chodnik|n.; crowded|zatloczony|adj.; square|plac|n.; facility|udogodnienie|n.; resident|mieszkaniec|n.; traffic|ruch uliczny|n.; noise|halas|n.; convenient|wygodny|adj.; urban|miejski|adj.",
  },
  {
    unit: "B1/B2 General",
    title: "Nature",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "forest|las|n.; valley|dolina|n.; stream|strumien|n.; species|gatunek|n.; wild|dziki|adj.; soil|gleba|n.; climate|klimat|n.; grow|rosnac|v.; protect|chronic|v.; landscape|krajobraz|n.",
  },
  {
    unit: "B1/B2 General",
    title: "Environment",
    cefr: "B2",
    source: "NGSL 1.2",
    items: "pollution|zanieczyszczenie|n.; waste|odpady|n.; recycle|poddawac recyklingowi|v.; renewable|odnawialny|adj.; reduce|ograniczac|v.; impact|wplyw|n.; damage|szkoda|n.; resource|zasob|n.; emission|emisja|n.; sustainable|zrownowazony|adj.",
  },
  {
    unit: "B1/B2 General",
    title: "Problems",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "issue|kwestia|n.; solve|rozwiazywac|v.; obstacle|przeszkoda|n.; risk|ryzyko|n.; fail|nie powiesc sie|v.; mistake|blad|n.; pressure|presja|n.; difficult|trudny|adj.; handle|radzic sobie z|v.; option|opcja|n.",
  },
  {
    unit: "B1/B2 General",
    title: "Decisions",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "choice|wybor|n.; decide|decydowac|v.; consider|rozwazac|v.; reason|powod|n.; benefit|korzysc|n.; consequence|konsekwencja|n.; doubt|watpliwosc|n.; prefer|wolec|v.; certain|pewny|adj.; final|ostateczny|adj.",
  },
  {
    unit: "B1/B2 General",
    title: "Opinions",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "claim|twierdzenie|n.; agree|zgadzac sie|v.; disagree|nie zgadzac sie|v.; point|argument|n.; view|pogląd|n.; support|popierac|v.; evidence|dowod|n.; personal|osobisty|adj.; fair|uczciwy|adj.; attitude|postawa|n.",
  },
  {
    unit: "B1/B2 General",
    title: "Plans",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "goal|cel|n.; aim|cel lub dazyc|n./v.; intend|zamierzac|v.; arrange|organizowac|v.; schedule|plan|n.; prepare|przygotowac|v.; expect|oczekiwac|v.; likely|prawdopodobny|adj.; future|przyszlosc|n.; step|krok|n.",
  },
  {
    unit: "B1/B2 General",
    title: "Habits",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "regularly|regularnie|adv.; rarely|rzadko|adv.; improve|ulepszac|v.; maintain|utrzymywac|v.; avoid|unikac|v.; repeat|powtarzac|v.; routine|rutyna|n.; consistent|konsekwentny|adj.; progress|postep|n.; effort|wysilek|n.",
  },
  {
    unit: "B1/B2 General",
    title: "Services",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "appointment|termin wizyty|n.; request|prosba|n.; provide|zapewniac|v.; deliver|dostarczac|v.; available|dostepny|adj.; customer|klient|n.; support|obsluga|n.; cancel|anulowac|v.; confirm|potwierdzac|v.; complaint|skarga|n.",
  },
  {
    unit: "B1/B2 General",
    title: "Safety",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "danger|niebezpieczenstwo|n.; warning|ostrzezenie|n.; protect|chronic|v.; avoid|unikac|v.; safe|bezpieczny|adj.; emergency|nagly wypadek|n.; careful|ostrozny|adj.; risk|ryzyko|n.; secure|zabezpieczac|v.; instruction|instrukcja|n.",
  },
  {
    unit: "B1/B2 General",
    title: "Law basics",
    cefr: "B2",
    source: "NGSL 1.2",
    items: "rule|zasada|n.; right|prawo|n.; duty|obowiazek|n.; allow|pozwalac|v.; forbid|zabraniac|v.; legal|prawny|adj.; illegal|nielegalny|adj.; evidence|dowod|n.; judge|sedzia|n.; fine|mandat|n.",
  },
  {
    unit: "B1/B2 General",
    title: "Communication",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "message|wiadomosc|n.; explain|wyjasniac|v.; mention|wspomniec|v.; reply|odpowiadac|v.; discuss|omawiac|v.; suggest|sugerowac|v.; clarify|wyjasniac|v.; express|wyrazac|v.; persuade|przekonywac|v.; interrupt|przerywac|v.",
  },
  {
    unit: "B1/B2 General",
    title: "Time",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "deadline|ostateczny termin|n.; period|okres|n.; temporary|tymczasowy|adj.; permanent|staly|adj.; delay|opozniac|v.; early|wczesny|adj.; lately|ostatnio|adv.; eventually|w koncu|adv.; previous|poprzedni|adj.; current|obecny|adj.",
  },
  {
    unit: "B1/B2 General",
    title: "Describing people",
    cefr: "B1",
    source: "NGSL 1.2",
    items: "patient|cierpliwy|adj.; reliable|niezawodny|adj.; cheerful|pogodny|adj.; stubborn|uparty|adj.; polite|uprzejmy|adj.; generous|hojny|adj.; sensible|rozsadny|adj.; confident|pewny siebie|adj.; curious|ciekawy|adj.; mature|dojrzaly|adj.",
  },
  {
    unit: "B2 First",
    title: "Phrasal verbs: movement",
    cefr: "B2",
    source: "B2 First",
    items: "set off|wyruszyc|phr. v.; get on|wsiasc albo dogadywac sie|phr. v.; get off|wysiasc|phr. v.; turn back|zawrocic|phr. v.; pick up|odebrac|phr. v.; drop off|podrzucic|phr. v.; run into|wpasc na kogos|phr. v.; go through|przechodzic przez|phr. v.; come across|natknac sie|phr. v.; head for|kierowac sie do|phr. v.",
  },
  {
    unit: "B2 First",
    title: "Phrasal verbs: work",
    cefr: "B2",
    source: "B2 First",
    items: "carry out|przeprowadzic|phr. v.; deal with|radzic sobie z|phr. v.; take over|przejac|phr. v.; put off|odlozyc|phr. v.; catch up|nadrobic|phr. v.; work out|opracowac albo cwiczyc|phr. v.; hand in|oddac|phr. v.; fill in|wypelnic|phr. v.; look into|zbadac|phr. v.; keep up|nadazac|phr. v.",
  },
  {
    unit: "B2 First",
    title: "Phrasal verbs: social",
    cefr: "B2",
    source: "B2 First",
    items: "get along|dogadywac sie|phr. v.; fall out|poklocic sie|phr. v.; make up|pogodzic sie|phr. v.; look after|opiekowac sie|phr. v.; put up with|znosic|phr. v.; turn down|odrzucic|phr. v.; open up|otworzyc sie|phr. v.; bring up|wychowywac albo poruszyc temat|phr. v.; count on|liczyc na|phr. v.; let down|zawiesc|phr. v.",
  },
  {
    unit: "B2 First",
    title: "Word formation: nouns",
    cefr: "B2",
    source: "B2 First",
    items: "achievement|osiagniecie|n.; improvement|poprawa|n.; decision|decyzja|n.; requirement|wymog|n.; solution|rozwiazanie|n.; explanation|wyjasnienie|n.; confidence|pewnosc siebie|n.; difference|roznica|n.; behaviour|zachowanie|n.; possibility|mozliwosc|n.",
  },
  {
    unit: "B2 First",
    title: "Word formation: adjectives",
    cefr: "B2",
    source: "B2 First",
    items: "suitable|odpowiedni|adj.; effective|skuteczny|adj.; responsible|odpowiedzialny|adj.; harmful|szkodliwy|adj.; valuable|cenny|adj.; successful|udany|adj.; reasonable|rozsadny|adj.; enjoyable|przyjemny|adj.; reliable|wiarygodny|adj.; flexible|elastyczny|adj.",
  },
  {
    unit: "B2 First",
    title: "Collocations: make and do",
    cefr: "B2",
    source: "B2 First",
    items: "make a decision|podjac decyzje|coll.; make progress|robic postepy|coll.; make an effort|podjac wysilek|coll.; make a mistake|popelnic blad|coll.; make a difference|zrobic roznice|coll.; do research|prowadzic badania|coll.; do your best|dac z siebie wszystko|coll.; do business|prowadzic interesy|coll.; do damage|wyrzadzic szkody|coll.; do exercise|cwiczyc|coll.",
  },
  {
    unit: "B2 First",
    title: "Collocations: take and get",
    cefr: "B2",
    source: "B2 First",
    items: "take responsibility|wziac odpowiedzialnosc|coll.; take part|brac udzial|coll.; take place|odbywac sie|coll.; take advantage|wykorzystac|coll.; take care|dbac|coll.; get permission|uzyskac pozwolenie|coll.; get involved|zaangazowac sie|coll.; get rid of|pozbyc sie|coll.; get used to|przyzwyczaic sie|coll.; get in touch|skontaktowac sie|coll.",
  },
  {
    unit: "B2 First",
    title: "Dependent prepositions",
    cefr: "B2",
    source: "B2 First",
    items: "aware of|swiadomy czegos|adj. prep.; responsible for|odpowiedzialny za|adj. prep.; interested in|zainteresowany czyms|adj. prep.; similar to|podobny do|adj. prep.; different from|rozny od|adj. prep.; depend on|zalezec od|v. prep.; succeed in|odniesc sukces w|v. prep.; apologise for|przeprosic za|v. prep.; complain about|narzekac na|v. prep.; belong to|nalezec do|v. prep.",
  },
  {
    unit: "B2 First",
    title: "Confusing words",
    cefr: "B2",
    source: "B2 First",
    items: "borrow|pozyczyc od kogos|v.; lend|pozyczyc komus|v.; sensible|rozsadny|adj.; sensitive|wrazliwy|adj.; actual|rzeczywisty|adj.; current|obecny|adj.; economic|gospodarczy|adj.; economical|oszczedny|adj.; affect|wplywac na|v.; effect|skutek|n.",
  },
  {
    unit: "B2 First",
    title: "Linking words",
    cefr: "B2",
    source: "B2 First",
    items: "although|chociaz|conj.; however|jednak|adv.; therefore|dlatego|adv.; whereas|podczas gdy|conj.; moreover|co wiecej|adv.; nevertheless|niemniej jednak|adv.; despite|pomimo|prep.; in addition|ponadto|phr.; as a result|w rezultacie|phr.; on the other hand|z drugiej strony|phr.",
  },
  {
    unit: "B2 First",
    title: "Opinion language",
    cefr: "B2",
    source: "B2 First",
    items: "in my view|moim zdaniem|phr.; I would argue|twierdzilbym|phr.; it seems that|wydaje sie ze|phr.; from my perspective|z mojej perspektywy|phr.; I tend to think|sklaniam sie ku opinii|phr.; there is no doubt|nie ma watpliwosci|phr.; it depends on|to zalezy od|phr.; I strongly believe|mocno wierze|phr.; it is worth noting|warto zauwazyc|phr.; to some extent|do pewnego stopnia|phr.",
  },
  {
    unit: "B2 First",
    title: "Essay vocabulary",
    cefr: "B2",
    source: "B2 First",
    items: "advantage|zaleta|n.; disadvantage|wada|n.; argument|argument|n.; conclusion|wniosek|n.; example|przyklad|n.; issue|kwestia|n.; solution|rozwiazanie|n.; suggest|sugerowac|v.; support|popierac|v.; outweigh|przewazac|v.",
  },
  {
    unit: "B2 First",
    title: "Article and review vocabulary",
    cefr: "B2",
    source: "B2 First",
    items: "recommend|polecac|v.; entertaining|zabawny|adj.; gripping|wciagajacy|adj.; disappointing|rozczarowujacy|adj.; suitable|odpowiedni|adj.; audience|publicznosc|n.; plot|fabula|n.; character|postac|n.; atmosphere|atmosfera|n.; worth|wart|adj.",
  },
  {
    unit: "B2 First",
    title: "Describing trends",
    cefr: "B2",
    source: "B2 First",
    items: "increase|wzrost lub wzrastac|n./v.; decrease|spadek lub spadac|n./v.; rise|wzrost|n.; fall|spadek|n.; remain stable|pozostac stabilnym|phr.; gradually|stopniowo|adv.; sharply|gwaltownie|adv.; slightly|nieznacznie|adv.; trend|trend|n.; peak|szczyt|n.",
  },
  {
    unit: "B2 First",
    title: "Comparing",
    cefr: "B2",
    source: "B2 First",
    items: "similar|podobny|adj.; contrast|kontrast|n.; whereas|podczas gdy|conj.; compared with|w porownaniu z|phr.; equally|rownie|adv.; far more|znacznie bardziej|phr.; slightly less|nieco mniej|phr.; unlike|w przeciwienstwie do|prep.; difference|roznica|n.; alternative|alternatywa|n.",
  },
  {
    unit: "B2 First",
    title: "Cause and effect",
    cefr: "B2",
    source: "B2 First",
    items: "cause|powodowac|v.; lead to|prowadzic do|phr. v.; result in|skutkowac|v.; due to|z powodu|prep.; consequence|konsekwencja|n.; influence|wplyw|n.; factor|czynnik|n.; reason|powod|n.; outcome|wynik|n.; therefore|dlatego|adv.",
  },
  {
    unit: "B2 First",
    title: "Agreement and disagreement",
    cefr: "B2",
    source: "B2 First",
    items: "I agree|zgadzam sie|phr.; I disagree|nie zgadzam sie|phr.; exactly|dokladnie|adv.; not necessarily|niekoniecznie|phr.; I see your point|rozumiem twoj punkt widzenia|phr.; that may be true|to moze byc prawda|phr.; I am not convinced|nie jestem przekonany|phr.; fair enough|w porzadku|phr.; partly|czesciowo|adv.; completely|calkowicie|adv.",
  },
  {
    unit: "B2 First",
    title: "Reporting verbs",
    cefr: "B2",
    source: "B2 First",
    items: "claim|twierdzic|v.; suggest|sugerowac|v.; admit|przyznac|v.; deny|zaprzeczyc|v.; warn|ostrzegac|v.; promise|obiecywac|v.; recommend|polecac|v.; refuse|odmawiac|v.; encourage|zachecac|v.; persuade|przekonywac|v.",
  },
  {
    unit: "B2 First",
    title: "Abstract nouns",
    cefr: "B2",
    source: "B2 First",
    items: "freedom|wolnosc|n.; justice|sprawiedliwosc|n.; equality|rownosc|n.; responsibility|odpowiedzialnosc|n.; awareness|swiadomosc|n.; confidence|pewnosc siebie|n.; pressure|presja|n.; identity|tozsamosc|n.; knowledge|wiedza|n.; progress|postep|n.",
  },
  {
    unit: "B2 First",
    title: "Adjectives with prepositions",
    cefr: "B2",
    source: "B2 First",
    items: "keen on|zapalony do|adj. prep.; good at|dobry w|adj. prep.; worried about|zmartwiony czyms|adj. prep.; proud of|dumny z|adj. prep.; capable of|zdolny do|adj. prep.; familiar with|zaznajomiony z|adj. prep.; suitable for|odpowiedni dla|adj. prep.; harmful to|szkodliwy dla|adj. prep.; grateful for|wdzieczny za|adj. prep.; tired of|zmeczony czyms|adj. prep.",
  },
  {
    unit: "B2 First",
    title: "Formal vs informal",
    cefr: "B2",
    source: "B2 First",
    items: "request|prosic formalnie|v.; require|wymagac|v.; inform|informowac|v.; purchase|zakupic|v.; assist|pomoc|v.; receive|otrzymac|v.; enquire|dopytywac|v.; apologise|przepraszac|v.; arrange|zorganizowac|v.; regarding|w sprawie|prep.",
  },
  {
    unit: "B2 First",
    title: "Use of English patterns",
    cefr: "B2",
    source: "B2 First",
    items: "used to|miec zwyczaj w przeszlosci|phr.; be used to|byc przyzwyczajonym do|phr.; so that|tak aby|conj.; unless|chyba ze|conj.; even though|mimo ze|conj.; would rather|wolalby|phr.; had better|lepiej zeby|phr.; in spite of|pomimo|prep.; as long as|dopoki albo pod warunkiem ze|conj.; no matter|bez wzgledu na|phr.",
  },
  {
    unit: "B2 First",
    title: "Speaking exam phrases",
    cefr: "B2",
    source: "B2 First",
    items: "Let me think|daj mi pomyslec|phr.; What I mean is|chodzi mi o to ze|phr.; In this picture|na tym obrazku|phr.; It looks like|wyglada na to ze|phr.; I suppose|przypuszczam|phr.; I am not sure|nie jestem pewien|phr.; Shall we start with|czy zaczniemy od|phr.; What about|a co z|phr.; We could choose|moglibysmy wybrac|phr.; That is a good point|to dobra uwaga|phr.",
  },
  {
    unit: "C1 Bridge",
    title: "Argument",
    cefr: "C1",
    source: "NAWL 1.2",
    items: "assumption|zalozenie|n.; implication|implikacja|n.; perspective|perspektywa|n.; justify|uzasadniac|v.; coherent|spojny|adj.; contradict|zaprzeczac|v.; premise|przeslanka|n.; stance|stanowisko|n.; clarify|wyjasniac|v.; nuance|niuans|n.",
  },
  {
    unit: "C1 Bridge",
    title: "Evidence",
    cefr: "C1",
    source: "NAWL 1.2",
    items: "evidence|dowod|n.; indicate|wskazywac|v.; demonstrate|wykazywac|v.; reliable|wiarygodny|adj.; source|zrodlo|n.; data|dane|n.; estimate|szacowac|v.; survey|ankieta|n.; finding|ustalenie|n.; verify|weryfikowac|v.",
  },
  {
    unit: "C1 Bridge",
    title: "Research",
    cefr: "C1",
    source: "NAWL 1.2",
    items: "hypothesis|hipoteza|n.; methodology|metodologia|n.; sample|proba badawcza|n.; variable|zmienna|n.; analyse|analizowac|v.; interpret|interpretowac|v.; significant|istotny|adj.; outcome|wynik|n.; framework|ramy|n.; limitation|ograniczenie|n.",
  },
  {
    unit: "C1 Bridge",
    title: "Education",
    cefr: "C1",
    source: "NAWL 1.2",
    items: "curriculum|program nauczania|n.; assessment|ocena|n.; literacy|umiejetnosc czytania i pisania|n.; competence|kompetencja|n.; acquire|nabywac|v.; feedback|informacja zwrotna|n.; evaluate|oceniac|v.; learner|uczen|n.; instruction|nauczanie|n.; outcome|rezultat|n.",
  },
  {
    unit: "C1 Bridge",
    title: "Society",
    cefr: "C1",
    source: "NAWL 1.2",
    items: "inequality|nierownosc|n.; community|spolecznosc|n.; welfare|dobrobyt|n.; policy|polityka|n.; minority|mniejszosc|n.; migration|migracja|n.; integration|integracja|n.; social mobility|mobilnosc spoleczna|n.; citizenship|obywatelstwo|n.; exclusion|wykluczenie|n.",
  },
  {
    unit: "C1 Bridge",
    title: "Economy",
    cefr: "C1",
    source: "NAWL 1.2",
    items: "inflation|inflacja|n.; investment|inwestycja|n.; revenue|przychod|n.; expenditure|wydatek|n.; productivity|produktywnosc|n.; consumer|konsument|n.; market|rynek|n.; sector|sektor|n.; labour|praca|n.; resource|zasob|n.",
  },
  {
    unit: "C1 Bridge",
    title: "Environment policy",
    cefr: "C1",
    source: "NAWL 1.2",
    items: "regulation|regulacja|n.; conservation|ochrona przyrody|n.; biodiversity|bioroznorodnosc|n.; carbon footprint|slad weglowy|n.; transition|transformacja|n.; implement|wdrazac|v.; incentive|zacheta|n.; mitigate|lagodzic|v.; adaptation|adaptacja|n.; ecosystem|ekosystem|n.",
  },
  {
    unit: "C1 Bridge",
    title: "Technology impact",
    cefr: "C1",
    source: "NAWL 1.2",
    items: "automation|automatyzacja|n.; algorithm|algorytm|n.; innovation|innowacja|n.; surveillance|nadzor|n.; digital divide|wykluczenie cyfrowe|n.; implement|wdrazac|v.; disrupt|zaklocac|v.; efficiency|wydajnosc|n.; ethical|etyczny|adj.; platform|platforma|n.",
  },
  {
    unit: "C1 Bridge",
    title: "Psychology",
    cefr: "C1",
    source: "NAWL 1.2",
    items: "motivation|motywacja|n.; cognition|poznanie|n.; behaviour|zachowanie|n.; bias|stronniczosc|n.; perception|postrzeganie|n.; resilience|odpornosc psychiczna|n.; habit|nawyk|n.; reward|nagroda|n.; anxiety|lek|n.; attention|uwaga|n.",
  },
  {
    unit: "C1 Bridge",
    title: "Culture and identity",
    cefr: "C1",
    source: "NAWL 1.2",
    items: "identity|tozsamosc|n.; representation|reprezentacja|n.; heritage|dziedzictwo|n.; diversity|roznorodnosc|n.; stereotype|stereotyp|n.; narrative|narracja|n.; belonging|poczucie przynaleznosci|n.; tradition|tradycja|n.; value|wartosc|n.; perspective|perspektywa|n.",
  },
  {
    unit: "C1 Bridge",
    title: "Media bias",
    cefr: "C1",
    source: "NAWL 1.2",
    items: "bias|stronniczosc|n.; agenda|program albo ukryty cel|n.; coverage|relacjonowanie|n.; outlet|medium|n.; narrative|narracja|n.; credibility|wiarygodnosc|n.; verify|sprawdzac|v.; misleading|wprowadzajacy w blad|adj.; polarisation|polaryzacja|n.; source|zrodlo|n.",
  },
  {
    unit: "C1 Bridge",
    title: "Health systems",
    cefr: "C1",
    source: "NAWL 1.2",
    items: "healthcare|opieka zdrowotna|n.; access|dostep|n.; prevention|profilaktyka|n.; diagnosis|diagnoza|n.; treatment|leczenie|n.; patient|pacjent|n.; capacity|wydolnosc|n.; funding|finansowanie|n.; inequality|nierownosc|n.; outcome|wynik|n.",
  },
  {
    unit: "C1 Bridge",
    title: "Work trends",
    cefr: "C1",
    source: "NAWL 1.2",
    items: "remote work|praca zdalna|n.; flexibility|elastycznosc|n.; burnout|wypalenie|n.; productivity|produktywnosc|n.; autonomy|autonomia|n.; collaboration|wspolpraca|n.; leadership|przywodztwo|n.; retention|utrzymanie pracownikow|n.; recruitment|rekrutacja|n.; workload|obciazenie praca|n.",
  },
  {
    unit: "C1 Bridge",
    title: "Ethics",
    cefr: "C1",
    source: "NAWL 1.2",
    items: "ethical|etyczny|adj.; responsibility|odpowiedzialnosc|n.; consent|zgoda|n.; transparency|przejrzystosc|n.; accountability|odpowiedzialnosc rozliczeniowa|n.; fairness|sprawiedliwosc|n.; harm|szkoda|n.; privacy|prywatnosc|n.; dilemma|dylemat|n.; principle|zasada|n.",
  },
  {
    unit: "C1 Bridge",
    title: "Academic connectors",
    cefr: "C1",
    source: "NAWL 1.2",
    items: "furthermore|ponadto|adv.; consequently|w konsekwencji|adv.; nonetheless|niemniej jednak|adv.; likewise|podobnie|adv.; by contrast|dla kontrastu|phr.; in terms of|pod wzgledem|phr.; with regard to|w odniesieniu do|phr.; notably|w szczegolnosci|adv.; hence|stad|adv.; overall|ogolnie|adv.",
  },
  {
    unit: "Idioms",
    title: "Idioms: emotion",
    cefr: "B2",
    source: "In the Loop",
    items: "on edge|spiety|idiom; down in the dumps|przybity|idiom; over the moon|w siodmym niebie|idiom; lose your temper|stracic panowanie|idiom; keep calm|zachowac spokoj|idiom; mixed feelings|mieszane uczucia|idiom; a weight off my shoulders|kamien z serca|idiom; scared stiff|przerazony|idiom; get carried away|dac sie poniesc|idiom; take it badly|zle to przyjac|idiom",
  },
  {
    unit: "Idioms",
    title: "Idioms: work",
    cefr: "B2",
    source: "In the Loop",
    items: "learn the ropes|poznac zasady|idiom; call it a day|zakonczyc prace|idiom; get down to business|przejsc do rzeczy|idiom; in the long run|na dluzsza mete|idiom; pull your weight|robic swoje|idiom; cut corners|isc na skroty|idiom; ahead of schedule|przed terminem|idiom; behind schedule|po terminie|idiom; take the lead|przejac prowadzenie|idiom; meet a deadline|dotrzymac terminu|idiom",
  },
  {
    unit: "Idioms",
    title: "Idioms: success",
    cefr: "B2",
    source: "In the Loop",
    items: "pay off|oplacic sie|idiom; make it|dac rade albo odniesc sukces|idiom; go the extra mile|zrobic wiecej niz trzeba|idiom; get the hang of|zalapac jak cos dziala|idiom; a step forward|krok naprzod|idiom; turn the corner|wyjsc na prosta|idiom; raise the bar|podniesc poprzeczke|idiom; on the right track|na dobrej drodze|idiom; a breakthrough|przelom|n.; make progress|robic postepy|coll.",
  },
  {
    unit: "Idioms",
    title: "Idioms: problems",
    cefr: "B2",
    source: "In the Loop",
    items: "a setback|niepowodzenie|n.; hit a snag|napotkac problem|idiom; out of the blue|niespodziewanie|idiom; a tough call|trudna decyzja|idiom; the last straw|kropla ktora przelala czare|idiom; get out of hand|wymknac sie spod kontroli|idiom; face the music|poniesc konsekwencje|idiom; sort out|uporzadkowac|phr. v.; under pressure|pod presja|phr.; no easy task|nie latwe zadanie|phr.",
  },
  {
    unit: "Idioms",
    title: "Idioms: communication",
    cefr: "B2",
    source: "In the Loop",
    items: "get straight to the point|przejsc prosto do rzeczy|idiom; beat around the bush|owijac w bawelne|idiom; put it simply|mowiac prosto|phr.; make yourself clear|wyrazic sie jasno|phr.; be on the same page|rozumiec sie tak samo|idiom; keep someone posted|informowac kogos na biezaco|idiom; word of mouth|poczta pantoflowa|idiom; speak up|mowic glosniej|phr. v.; bring up a topic|poruszyc temat|phr.; clear up confusion|wyjasnic nieporozumienie|phr.",
  },
  {
    unit: "Natural phrases",
    title: "Daily phrases",
    cefr: "B1",
    source: "In the Loop",
    items: "Could you repeat that|czy mozesz to powtorzyc|phr.; How do you spell it|jak to przeliterowac|phr.; I am on my way|jestem w drodze|phr.; It depends|to zalezy|phr.; Never mind|niewazne|phr.; No worries|nie ma sprawy|phr.; That makes sense|to ma sens|phr.; I have no idea|nie mam pojecia|phr.; Let me check|pozwol ze sprawdze|phr.; Sounds good|brzmi dobrze|phr.",
  },
  {
    unit: "Natural phrases",
    title: "Agreement phrases",
    cefr: "B1",
    source: "In the Loop",
    items: "Exactly|dokladnie|adv.; I agree with you|zgadzam sie z toba|phr.; That is true|to prawda|phr.; You are right|masz racje|phr.; I see what you mean|rozumiem co masz na mysli|phr.; Fair point|sluszna uwaga|phr.; I partly agree|czesciowo sie zgadzam|phr.; Not really|nie bardzo|phr.; I am afraid not|obawiam sie ze nie|phr.; It is possible|to mozliwe|phr.",
  },
  {
    unit: "Natural phrases",
    title: "Uncertainty phrases",
    cefr: "B1",
    source: "In the Loop",
    items: "I am not sure|nie jestem pewien|phr.; Maybe|moze|adv.; Probably|prawdopodobnie|adv.; It might be|to moze byc|phr.; I suppose so|chyba tak|phr.; I doubt it|watpie|phr.; It is unlikely|to malo prawdopodobne|phr.; As far as I know|o ile wiem|phr.; I need to think|musze pomyslec|phr.; Let me guess|niech zgadne|phr.",
  },
  {
    unit: "Repair",
    title: "False friends PL/EN",
    cefr: "B2",
    source: "Repair",
    items: "actually|wlasciwie albo tak naprawde|adv.; eventually|w koncu|adv.; chef|szef kuchni|n.; receipt|paragon|n.; fabric|tkanina|n.; ordinary|zwyczajny|adj.; pension|emerytura|n.; preservative|konserwant|n.; lecture|wyklad|n.; sympathy|wspolczucie|n.",
  },
  {
    unit: "Repair",
    title: "Spelling traps",
    cefr: "B2",
    source: "Repair",
    items: "definitely|zdecydowanie|adv.; environment|srodowisko|n.; accommodation|zakwaterowanie|n.; necessary|konieczny|adj.; separate|oddzielny|adj.; receive|otrzymac|v.; achieve|osiagnac|v.; convenient|wygodny|adj.; opportunity|okazja|n.; successful|udany|adj.",
  },
  {
    unit: "Repair",
    title: "Silent letters and vowels",
    cefr: "B2",
    source: "Repair",
    items: "although|chociaz|conj.; through|przez|prep.; thought|mysl albo myslal|n./v.; island|wyspa|n.; debt|dlug|n.; doubt|watpliwosc|n.; honest|uczciwy|adj.; hour|godzina|n.; answer|odpowiedz|n.; foreign|zagraniczny|adj.",
  },
  {
    unit: "Repair",
    title: "Pronunciation minimal pairs",
    cefr: "B2",
    source: "Repair",
    items: "ship|statek|n.; sheep|owca|n.; live|zyc|v.; leave|opuszczac|v.; work|praca lub pracowac|n./v.; walk|isc pieszo|v.; heart|serce|n.; hurt|ranic albo bolec|v.; thin|cienki|adj.; tin|puszka|n.",
  },
];

const sourceUrlByName: Record<LessonSource, string> = {
  "NGSL 1.2": "https://www.newgeneralservicelist.com/new-general-service-list",
  "NAWL 1.2": "https://www.newgeneralservicelist.com/new-academic-word-list",
  "B2 First": "https://www.cambridgeenglish.org/Images/167791-b2-first-handbook.pdf",
  "C1 Advanced": "https://www.cambridgeenglish.org/Images/167804-c1-advanced-handbook.pdf",
  "In the Loop": "https://americanenglish.state.gov/resources/loop",
  Repair: "Original repair lessons based on common learner errors.",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeExample(word: string, title: string) {
  const cleanWord = word.replace(/\(.+?\)/g, "").trim();
  if (cleanWord.includes(" ")) {
    return `Try to use "${cleanWord}" in a short sentence about ${title.toLowerCase()}.`;
  }
  return `I want to use "${cleanWord}" correctly when I talk about ${title.toLowerCase()}.`;
}

function makeCollocations(word: string, title: string) {
  const cleanWord = word.toLowerCase();
  if (cleanWord.includes(" ")) {
    return [cleanWord, `use ${cleanWord}`, `${cleanWord} clearly`];
  }
  return [`${cleanWord} practice`, `clear ${cleanWord}`, `${title.toLowerCase()} ${cleanWord}`];
}

function makeWord(
  raw: string,
  lesson: LessonBlueprint,
  lessonId: string,
  index: number,
): WordEntry {
  const [word, translationPl, partOfSpeech] = raw.split("|").map((item) => item.trim());
  return {
    id: `${lessonId}-${index + 1}`,
    word,
    translationPl,
    partOfSpeech: partOfSpeech || "word",
    cefr: lesson.cefr,
    ipa: "",
    example: makeExample(word, lesson.title),
    collocations: makeCollocations(word, lesson.title),
    tags: [lesson.unit, lesson.title, lesson.source],
    source: lesson.source,
  };
}

export const seedLessons: Lesson[] = lessonBlueprints
  .map((lesson, originalIndex) => ({ lesson, originalIndex }))
  .sort(
    (a, b) =>
      cefrOrder[a.lesson.cefr] - cefrOrder[b.lesson.cefr] ||
      a.originalIndex - b.originalIndex,
  )
  .map(({ lesson }, index) => {
    const lessonNumber = String(index + 1).padStart(2, "0");
    const lessonId = `lesson-${lessonNumber}-${slugify(lesson.title)}`;
    return {
      id: lessonId,
      course: "English MVP Seed",
      unit: lesson.unit,
      title: `${lessonNumber}. ${lesson.title}`,
      cefr: lesson.cefr,
      source: lesson.source,
      words: lesson.items
        .split(";")
        .map((raw) => raw.trim())
        .filter(Boolean)
        .map((raw, wordIndex) => makeWord(raw, lesson, lessonId, wordIndex)),
    };
  });

export const sourceUrlForLesson = (source: LessonSource) => sourceUrlByName[source];

export const allSeedWords = seedLessons.flatMap((lesson) => lesson.words);
