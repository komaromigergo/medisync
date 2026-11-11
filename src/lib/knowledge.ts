// A MediSync szabálykészlete (DEMÓ).
// Kézzel összeállított, ismert, klinikailag jelentős kölcsönhatások a leggyakoribb hatóanyagcsoportokra.
// Nem teljes körű és nem klinikai használatra szánt: éles használat előtt orvosi és gyógyszerészi
// validáció szükséges. A szintek: 1 enyhe, 2 mérsékelt, 3 súlyos, 4 ellenjavallt.

import type { Severity } from "./types";

export const SEVERITY_LABEL: Record<Severity, string> = {
  1: "Enyhe",
  2: "Mérsékelt",
  3: "Súlyos",
  4: "Ellenjavallt",
};

export interface ClassDef {
  id: string;
  hu: string;
  tokens: string[]; // "^x" kezdőszó, "x$" végződés, egyébként tartalmazza
  dup?: Severity; // két ilyen hatóanyag együtt = terápiás duplikáció
}

const NSAID = [
  "ibuprofen", "dexibuprofen", "diclofenac", "naproxen", "ketoprofen", "dexketoprofen", "meloxicam",
  "celecoxib", "etoricoxib", "nimesulide", "indometacin", "piroxicam", "ketorolac", "lornoxicam",
  "nabumetone", "aceclofenac", "flurbiprofen", "tenoxicam", "parecoxib",
];
const STATIN = ["simvastatin", "atorvastatin", "rosuvastatin", "pravastatin", "fluvastatin", "lovastatin", "pitavastatin"];
const ACE = ["benazepril", "captopril", "cilazapril", "enalapril", "fosinopril", "imidapril", "lisinopril", "moexipril", "perindopril", "quinapril", "ramipril", "spirapril", "trandolapril", "zofenopril"];
const ARB = ["azilsartan", "candesartan", "eprosartan", "irbesartan", "losartan", "olmesartan", "telmisartan", "valsartan"];
const SSRI = ["sertraline", "fluoxetine", "paroxetine", "citalopram", "escitalopram", "fluvoxamine"];
const SNRI = ["venlafaxine", "duloxetine", "desvenlafaxine", "milnacipran"];
const OPIOID = ["tramadol", "tapentadol", "codeine", "dihydrocodeine", "morphine", "oxycodone", "hydromorphone", "fentanyl", "buprenorphine", "methadone", "pethidine"];
const BENZO = ["diazepam", "alprazolam", "lorazepam", "bromazepam", "clonazepam", "oxazepam", "midazolam", "nitrazepam", "clobazam", "temazepam", "zolpidem", "zopiclone", "zaleplon"];
const PPI = ["omeprazole", "esomeprazole", "pantoprazole", "lansoprazole", "rabeprazole"];
const STRONG_3A4 = ["clarithromycin", "erythromycin", "itraconazole", "ketoconazole", "posaconazole", "voriconazole", "ritonavir", "cobicistat", "telithromycin", "nelfinavir"];

export const CLASSES: ClassDef[] = [
  { id: "nsaid", hu: "NSAID (gyulladáscsökkentő, fájdalomcsillapító)", tokens: NSAID, dup: 3 },
  { id: "asa", hu: "acetilszalicilsav", tokens: ["acetylsalicylic acid"] },
  { id: "paracetamol", hu: "paracetamol", tokens: ["paracetamol"] },
  { id: "metamizole", hu: "metamizol", tokens: ["metamizole"] },
  { id: "vka", hu: "K-vitamin-antagonista (warfarin)", tokens: ["warfarin", "acenocoumarol", "phenprocoumon"] },
  { id: "doac", hu: "közvetlen hatású véralvadásgátló", tokens: ["rivaroxaban", "apixaban", "edoxaban", "dabigatran"] },
  { id: "anticoag", hu: "véralvadásgátló", tokens: ["warfarin", "acenocoumarol", "phenprocoumon", "rivaroxaban", "apixaban", "edoxaban", "dabigatran"], dup: 3 },
  { id: "antiplatelet", hu: "thrombocytaaggregáció-gátló", tokens: ["clopidogrel", "ticagrelor", "prasugrel", "ticlopidine"], dup: 2 },
  { id: "clopidogrel", hu: "klopidogrel", tokens: ["clopidogrel"] },
  { id: "statin", hu: "sztatin (koleszterinszint-csökkentő)", tokens: STATIN, dup: 3 },
  { id: "simvastatin", hu: "szimvasztatin", tokens: ["simvastatin"] },
  { id: "atorvastatin", hu: "atorvasztatin", tokens: ["atorvastatin"] },
  { id: "macrolide", hu: "makrolid antibiotikum", tokens: ["clarithromycin", "erythromycin", "azithromycin", "roxithromycin", "josamycin", "spiramycin", "telithromycin"] },
  { id: "macrolide_strong", hu: "klaritromicin/eritromicin típusú makrolid", tokens: ["clarithromycin", "erythromycin", "roxithromycin", "telithromycin"] },
  { id: "azithromycin", hu: "azitromicin", tokens: ["azithromycin"] },
  { id: "cyp3a4_strong", hu: "erős CYP3A4-gátló", tokens: STRONG_3A4 },
  { id: "azole", hu: "azol típusú gombaellenes", tokens: ["fluconazole", "ketoconazole", "itraconazole", "posaconazole", "voriconazole"] },
  { id: "penicillin", hu: "penicillin-csoport", tokens: ["penicillin", "amoxicillin", "ampicillin", "piperacillin", "flucloxacillin", "cloxacillin", "oxacillin", "ticarcillin"] },
  { id: "cephalosporin", hu: "cefalosporin", tokens: ["^cef", "^ceph"] },
  { id: "carbapenem", hu: "karbapenem", tokens: ["penem"] },
  { id: "fluoroquinolone", hu: "fluorokinolon", tokens: ["floxacin"] },
  { id: "tetracycline", hu: "tetraciklin", tokens: ["doxycycline", "tetracycline", "minocycline", "lymecycline"] },
  { id: "sulfonamide_abx", hu: "szulfonamid antibiotikum", tokens: ["sulfamethoxazole", "sulfadiazine", "sulfasalazine", "sulfadoxine"] },
  { id: "tmp", hu: "trimetoprim", tokens: ["trimethoprim"] },
  { id: "metronidazole", hu: "metronidazol", tokens: ["metronidazole"] },
  { id: "ace_i", hu: "ACE-gátló", tokens: ACE, dup: 3 },
  { id: "arb", hu: "ARB (szartán)", tokens: ARB, dup: 3 },
  { id: "aliskiren", hu: "aliszkiren", tokens: ["aliskiren"] },
  { id: "sacubitril", hu: "szakubitril", tokens: ["sacubitril"] },
  { id: "k_sparing", hu: "káliummegtakarító vízhajtó", tokens: ["spironolactone", "eplerenone", "amiloride", "triamterene", "finerenone"] },
  { id: "k_supp", hu: "káliumpótló", tokens: ["potassium chloride"] },
  { id: "thiazide", hu: "tiazid típusú vízhajtó", tokens: ["hydrochlorothiazide", "chlorthalidone", "indapamide", "chlorothiazide", "xipamide", "bendroflumethiazide"], dup: 2 },
  { id: "loop", hu: "kacsdiuretikum", tokens: ["furosemide", "torasemide", "bumetanide"] },
  { id: "beta", hu: "béta-blokkoló", tokens: ["olol$", "carvedilol"], dup: 2 },
  { id: "nd_ccb", hu: "verapamil/diltiazem", tokens: ["verapamil", "diltiazem"] },
  { id: "verapamil", hu: "verapamil", tokens: ["verapamil"] },
  { id: "dhp_ccb", hu: "dihidropiridin kalciumcsatorna-blokkoló", tokens: ["amlodipine", "nifedipine", "felodipine", "lercanidipine", "nitrendipine", "isradipine", "nimodipine", "lacidipine"] },
  { id: "digoxin", hu: "digoxin", tokens: ["digoxin"] },
  { id: "amiodarone", hu: "amiodaron", tokens: ["amiodarone"] },
  { id: "ssri", hu: "SSRI antidepresszáns", tokens: SSRI, dup: 3 },
  { id: "ssri_snri", hu: "SSRI/SNRI antidepresszáns", tokens: [...SSRI, ...SNRI] },
  { id: "maoi", hu: "MAO-gátló", tokens: ["moclobemide", "selegiline", "rasagiline", "safinamide", "phenelzine", "tranylcypromine"] },
  { id: "linezolid", hu: "linezolid", tokens: ["linezolid"] },
  { id: "serotonergic_opioid", hu: "tramadol/tapentadol/petidin", tokens: ["tramadol", "tapentadol", "pethidine"] },
  { id: "opioid", hu: "opioid fájdalomcsillapító", tokens: OPIOID, dup: 2 },
  { id: "benzo", hu: "benzodiazepin vagy Z-gyógyszer", tokens: BENZO, dup: 2 },
  { id: "gabapentinoid", hu: "gabapentinoid", tokens: ["gabapentin", "pregabalin"] },
  { id: "triptan", hu: "triptán (migrénszer)", tokens: ["triptan"], dup: 2 },
  { id: "pde5", hu: "PDE5-gátló", tokens: ["sildenafil", "tadalafil", "vardenafil", "avanafil"] },
  { id: "nitrate", hu: "nitrát", tokens: ["isosorbide", "nitroglycerin", "glyceryl trinitrate", "molsidomine"] },
  { id: "alpha_blocker", hu: "alfa-blokkoló", tokens: ["doxazosin", "terazosin", "alfuzosin", "tamsulosin", "prazosin"] },
  { id: "ppi", hu: "protonpumpa-gátló", tokens: PPI, dup: 2 },
  { id: "omeprazole_like", hu: "omeprazol/ezomeprazol", tokens: ["omeprazole", "esomeprazole"] },
  { id: "sulfonylurea", hu: "szulfonilurea", tokens: ["gliclazide", "glimepiride", "glibenclamide", "glipizide"], dup: 3 },
  { id: "methotrexate", hu: "metotrexát", tokens: ["methotrexate"] },
  { id: "allopurinol", hu: "allopurinol", tokens: ["allopurinol"] },
  { id: "thiopurine", hu: "azatioprin/merkaptopurin", tokens: ["azathioprine", "mercaptopurine"] },
  { id: "lithium", hu: "lítium", tokens: ["lithium"] },
  { id: "colchicine", hu: "kolchicin", tokens: ["colchicine"] },
  { id: "corticosteroid", hu: "szisztémás kortikoszteroid", tokens: ["prednisolone", "prednisone", "methylprednisolone", "dexamethasone", "hydrocortisone", "betamethasone", "triamcinolone"] },
  { id: "levothyroxine", hu: "levotiroxin", tokens: ["levothyroxine", "liothyronine"] },
  { id: "cations", hu: "kalcium-, vas-, magnézium-, cink- vagy alumínium-tartalmú készítmény", tokens: ["calcium", "ferrous", "iron", "magnesium", "zinc", "aluminium", "aluminum"] },
  { id: "gemfibrozil", hu: "gemfibrozil", tokens: ["gemfibrozil"] },
  { id: "fenofibrate", hu: "fenofibrát", tokens: ["fenofibrate"] },
  { id: "ciclosporin", hu: "ciklosporin", tokens: ["ciclosporin", "cyclosporin"] },
  { id: "tizanidine", hu: "tizanidin", tokens: ["tizanidine"] },
  { id: "fluvoxamine", hu: "fluvoxamin", tokens: ["fluvoxamine"] },
  { id: "qt", hu: "QT-megnyújtó gyógyszer", tokens: ["amiodarone", "sotalol", "dronedarone", "haloperidol", "citalopram", "escitalopram", "clarithromycin", "erythromycin", "azithromycin", "levofloxacin", "moxifloxacin", "ondansetron", "domperidone", "methadone", "hydroxyzine"] },
  { id: "qt_strong", hu: "erősen QT-megnyújtó gyógyszer", tokens: ["amiodarone", "sotalol", "dronedarone", "haloperidol", "methadone"] },
];

const CLASS_BY_ID = new Map(CLASSES.map((c) => [c.id, c]));
export const classHu = (id: string) => CLASS_BY_ID.get(id)?.hu ?? id;

function tokenMatch(sub: string, tok: string): boolean {
  if (tok.startsWith("^")) return sub.startsWith(tok.slice(1));
  if (tok.endsWith("$")) return sub.endsWith(tok.slice(0, -1));
  return sub.includes(tok);
}

const subClassMemo = new Map<string, string[]>();
export function classesOfSubstance(sub: string): string[] {
  let r = subClassMemo.get(sub);
  if (!r) {
    r = CLASSES.filter((c) => c.tokens.some((t) => tokenMatch(sub, t))).map((c) => c.id);
    subClassMemo.set(sub, r);
  }
  return r;
}

export function classesOfSubstances(subs: string[]): Set<string> {
  const out = new Set<string>();
  for (const s of subs) for (const c of classesOfSubstance(s)) out.add(c);
  return out;
}

// ---------------------------------------------------------------- kölcsönhatási szabályok
export interface Rule {
  a: string;
  b: string;
  sev: Severity;
  title: string;
  effect: string;
  advice: string;
}

const R = (a: string, b: string, sev: Severity, title: string, effect: string, advice: string): Rule => ({ a, b, sev, title, effect, advice });

export const RULES: Rule[] = [
  // --- vérzékenység
  R("vka", "nsaid", 3, "Fokozott vérzésveszély", "Az NSAID gyomor-bélrendszeri vérzést okozhat, és a warfarinnal együtt a vérzés kockázata többszörösére nő.", "Kerülje az együttes alkalmazást. Fájdalom- vagy lázcsillapításra paracetamol az első választás; ha mégis szükséges, szoros INR- és vérzésfigyelés mellett, gyomorvédővel."),
  R("doac", "nsaid", 3, "Fokozott vérzésveszély", "Az NSAID és a közvetlen hatású véralvadásgátló együtt jelentősen növeli a (gyomor-bél) vérzés kockázatát.", "Kerülje az együttes alkalmazást; fájdalomcsillapításra paracetamol javasolt."),
  R("vka", "asa", 3, "Fokozott vérzésveszély", "Az acetilszalicilsav gátolja a thrombocyták működését és irritálja a gyomrot, warfarinnal együtt súlyos vérzést okozhat.", "Csak egyértelmű indikáció esetén (pl. mechanikus billentyű), gyomorvédővel és szoros ellenőrzés mellett."),
  R("doac", "asa", 3, "Fokozott vérzésveszély", "Az acetilszalicilsav a véralvadásgátló hatását kiegészítve növeli a vérzés kockázatát.", "Csak ha külön indikáció van rá, gyomorvédővel és szoros ellenőrzés mellett."),
  R("anticoag", "antiplatelet", 3, "Fokozott vérzésveszély", "A véralvadásgátló és a thrombocytaaggregáció-gátló együtt növeli a vérzés kockázatát.", "Kardiológiai javaslat alapján, indokolt esetben alkalmazható; gyomorvédő és rendszeres ellenőrzés szükséges."),
  R("vka", "macrolide_strong", 3, "Az INR megemelkedhet", "A klaritromicin/eritromicin gátolja a warfarin lebontását, ezért az INR meredeken emelkedhet, vérzésveszéllyel.", "Kerülje, vagy 3–5 napon belül ellenőrizze az INR-t és szükség esetén csökkentse a warfarin adagját."),
  R("vka", "azithromycin", 2, "Az INR megemelkedhet", "Az azitromicin ritkábban, de emelheti az INR-t.", "Az INR-t a kezelés alatt és után érdemes ellenőrizni."),
  R("vka", "azole", 3, "Az INR megemelkedhet", "Az azol típusú gombaellenes szerek gátolják a warfarin lebontását, ezért vérzésveszély nő.", "Kerülje, vagy szoros INR-ellenőrzés mellett csökkentse a warfarin adagját."),
  R("vka", "fluoroquinolone", 2, "Az INR megemelkedhet", "A fluorokinolonok növelhetik a warfarin hatását.", "A kezelés alatt ellenőrizze az INR-t."),
  R("vka", "sulfonamide_abx", 3, "Az INR megemelkedhet", "A szulfametoxazol (ko-trimoxazol) jelentősen fokozza a warfarin hatását.", "Kerülje; ha szükséges, szoros INR-ellenőrzés mellett alkalmazható."),
  R("vka", "metronidazole", 3, "Az INR megemelkedhet", "A metronidazol gátolja a warfarin lebontását, vérzésveszéllyel.", "Kerülje, vagy szoros INR-ellenőrzés mellett csökkentse a warfarin adagját."),
  R("vka", "amiodarone", 3, "Az INR megemelkedhet", "Az amiodaron megnöveli a warfarin hatását, a hatás hetekig is fennmaradhat.", "A warfarin adagját csökkenteni kell, az INR-t gyakran ellenőrizni."),
  R("vka", "ssri_snri", 2, "Nagyobb vérzési hajlam", "Az SSRI/SNRI antidepresszánsok a thrombocytákra hatva növelik a vérzés kockázatát.", "Figyeljen a vérzés jeleire, szükség esetén ellenőrizze az INR-t."),
  R("vka", "paracetamol", 1, "Az INR kissé emelkedhet", "Rendszeres, nagy adagú paracetamol enyhén megnövelheti az INR-t.", "Alkalmi szedés biztonságos; tartós szedésnél ellenőrizze az INR-t."),
  R("vka", "allopurinol", 2, "A warfarin hatása erősödhet", "Az allopurinol fokozhatja a warfarin hatását.", "Kezdéskor és adagváltáskor ellenőrizze az INR-t."),
  R("vka", "statin", 1, "Az INR kismértékben változhat", "Egyes sztatinok (pl. rosuvasztatin, szimvasztatin) enyhén módosíthatják az INR-t.", "Kezdéskor vagy adagváltáskor ellenőrizze az INR-t."),
  R("doac", "cyp3a4_strong", 3, "A véralvadásgátló szintje megnőhet", "Az erős CYP3A4/P-gp-gátlók (pl. azol gombaellenesek, ritonavir) jelentősen megemelik a rivaroxaban, apixaban szintjét.", "Az együttes alkalmazás nem javasolt, alternatív gyógyszer választandó."),
  R("clopidogrel", "omeprazole_like", 3, "A klopidogrel hatása gyengülhet", "Az omeprazol és az ezomeprazol csökkenti a klopidogrel aktív metabolitjának képződését.", "Kerülje; ha gyomorvédő kell, pantoprazol javasolt."),
  R("nsaid", "asa", 2, "A szív-védő hatás gyengülhet, vérzésveszély nő", "Az NSAID gátolhatja az alacsony dózisú aszpirin thrombocytagátló hatását és növeli a gyomorvérzés kockázatát.", "Kerülje a rendszeres együttes szedést, vagy tartson időbeli távolságot."),
  R("nsaid", "ssri_snri", 2, "Fokozott gyomor-bélvérzés veszélye", "Az NSAID és az SSRI/SNRI együtt emeli a gyomor-bélrendszeri vérzés esélyét.", "Gyomorvédő adása megfontolandó."),
  R("nsaid", "corticosteroid", 2, "Fokozott gyomor-bélvérzés veszélye", "A kortikoszteroid és az NSAID együtt növeli a gyomorfekély és vérzés kockázatát.", "Gyomorvédővel együtt, rövid ideig alkalmazható."),
  R("nsaid", "ace_i", 2, "Vesekárosodás és gyengülő vérnyomáscsökkentő hatás", "Az NSAID a veseműködést ronthatja és csökkenti az ACE-gátló hatását.", "Rövid ideig, megfelelő folyadékbevitel mellett; ellenőrizze a vesefunkciót."),
  R("nsaid", "arb", 2, "Vesekárosodás és gyengülő vérnyomáscsökkentő hatás", "Az NSAID a veseműködést ronthatja és csökkenti az ARB hatását.", "Rövid ideig, megfelelő folyadékbevitel mellett; ellenőrizze a vesefunkciót."),
  R("nsaid", "lithium", 3, "A lítium szintje megnőhet", "Az NSAID csökkenti a lítium kiürülését, ezért mérgezés alakulhat ki.", "Kerülje; ha elkerülhetetlen, ellenőrizze a lítium szintjét."),
  R("nsaid", "methotrexate", 3, "A metotrexát mérgező hatása nőhet", "Az NSAID csökkenti a metotrexát kiürülését, ezért vérképzőszervi és veseártalom léphet fel.", "Magas dózisnál kerülje; alacsony dózisnál szoros laborkövetés."),
  R("nsaid", "fluoroquinolone", 2, "Görcskészség fokozódhat", "A fluorokinolon és az NSAID együtt növelheti a központi idegrendszeri izgalom, görcs kockázatát.", "Fokozott óvatosság, főleg idős és epilepsziára hajlamos betegeknél."),
  R("clopidogrel", "nsaid", 2, "Fokozott vérzésveszély", "A klopidogrel és az NSAID együtt növeli a vérzés esélyét.", "Gyomorvédővel, rövid ideig alkalmazható."),
  // --- sztatinok
  R("simvastatin", "cyp3a4_strong", 4, "Izomkárosodás (rabdomiolízis) veszélye", "Az erős CYP3A4-gátlók (pl. klaritromicin, azolok, ritonavir) a szimvasztatin szintjét sokszorosára emelik; a kombináció ellenjavallt.", "Ne írja fel együtt. A szimvasztatint a kezelés idejére fel kell függeszteni, vagy más antibiotikumot kell választani."),
  R("simvastatin", "gemfibrozil", 4, "Izomkárosodás (rabdomiolízis) veszélye", "A gemfibrozil a szimvasztatin mellett súlyos izomkárosodást okozhat; ellenjavallt.", "Válasszon más lipidcsökkentő kombinációt."),
  R("simvastatin", "ciclosporin", 4, "Izomkárosodás (rabdomiolízis) veszélye", "A ciklosporin megnöveli a szimvasztatin szintjét; ellenjavallt.", "Más sztatin és szakorvosi egyeztetés szükséges."),
  R("simvastatin", "amiodarone", 2, "Izomkárosodás kockázata nő", "Az amiodaron növeli a szimvasztatin szintjét.", "A szimvasztatin adagja legfeljebb 20 mg/nap lehet."),
  R("simvastatin", "dhp_ccb", 2, "Izomkárosodás kockázata nő", "Az amlodipin megnöveli a szimvasztatin szintjét.", "A szimvasztatin adagja legfeljebb 20 mg/nap lehet."),
  R("simvastatin", "nd_ccb", 2, "Izomkárosodás kockázata nő", "A verapamil és diltiazem megnöveli a szimvasztatin szintjét.", "A szimvasztatin adagját korlátozni kell."),
  R("atorvastatin", "cyp3a4_strong", 3, "Izomkárosodás kockázata nő", "Az erős CYP3A4-gátlók jelentősen megnövelik az atorvasztatin szintjét.", "Az atorvasztatin adagját csökkenteni, vagy a kezelés idejére felfüggeszteni kell."),
  R("statin", "gemfibrozil", 3, "Izomkárosodás (rabdomiolízis) veszélye", "A gemfibrozil és a sztatinok együtt növelik az izomkárosodás kockázatát.", "Inkább fenofibrát vagy más lipidcsökkentő választandó."),
  R("statin", "fenofibrate", 2, "Izomkárosodás kockázata nő", "A fibrátok és a sztatinok együtt kissé növelik az izomkárosodás kockázatát.", "Izomfájdalom esetén ellenőrizze a CK-szintet."),
  // --- vérnyomás, ACE, ARB
  R("ace_i", "arb", 3, "Kettős RAAS-gátlás", "Az ACE-gátló és az ARB együtt jelentősen növeli a vesekárosodás, a magas káliumszint és az alacsony vérnyomás kockázatát.", "Általában nem javasolt kombináció."),
  R("ace_i", "aliskiren", 3, "Kettős RAAS-gátlás", "Az aliszkiren és az ACE-gátló kombinációja növeli a veseártalom és a hyperkalaemia kockázatát.", "Cukorbetegeknél és vesebetegeknél kerülendő."),
  R("arb", "aliskiren", 3, "Kettős RAAS-gátlás", "Az aliszkiren és az ARB kombinációja növeli a veseártalom és a hyperkalaemia kockázatát.", "Cukorbetegeknél és vesebetegeknél kerülendő."),
  R("sacubitril", "ace_i", 4, "Angioödéma veszélye", "A szakubitril/valzartán és az ACE-gátló együtt súlyos angioödémát okozhat; ellenjavallt.", "Az ACE-gátló leállítása után legalább 36 óra elteltével kezdhető."),
  R("ace_i", "k_sparing", 2, "Magas káliumszint (hyperkalaemia)", "A káliummegtakarító vízhajtó az ACE-gátlóval együtt megemelheti a vér káliumszintjét.", "Szoros kálium- és vesefunkció-ellenőrzés szükséges."),
  R("arb", "k_sparing", 2, "Magas káliumszint (hyperkalaemia)", "A káliummegtakarító vízhajtó az ARB-vel együtt megemelheti a vér káliumszintjét.", "Szoros kálium- és vesefunkció-ellenőrzés szükséges."),
  R("ace_i", "k_supp", 2, "Magas káliumszint (hyperkalaemia)", "A káliumpótló az ACE-gátlóval együtt megemelheti a káliumszintet.", "Ellenőrizze a káliumszintet."),
  R("arb", "k_supp", 2, "Magas káliumszint (hyperkalaemia)", "A káliumpótló az ARB-vel együtt megemelheti a káliumszintet.", "Ellenőrizze a káliumszintet."),
  R("ace_i", "tmp", 3, "Magas káliumszint (hyperkalaemia)", "A trimetoprim (ko-trimoxazol) ACE-gátlóval együtt súlyos hyperkalaemiát okozhat.", "Kerülje, vagy szoros káliumellenőrzés mellett alkalmazza."),
  R("arb", "tmp", 3, "Magas káliumszint (hyperkalaemia)", "A trimetoprim (ko-trimoxazol) ARB-vel együtt súlyos hyperkalaemiát okozhat.", "Kerülje, vagy szoros káliumellenőrzés mellett alkalmazza."),
  R("lithium", "ace_i", 3, "A lítium szintje megnőhet", "Az ACE-gátló csökkenti a lítium kiürülését.", "A lítium szintjét ellenőrizni kell."),
  R("lithium", "arb", 3, "A lítium szintje megnőhet", "Az ARB csökkenti a lítium kiürülését.", "A lítium szintjét ellenőrizni kell."),
  R("lithium", "thiazide", 3, "A lítium szintje megnőhet", "A tiazid típusú vízhajtók csökkentik a lítium kiürülését.", "A lítium szintjét ellenőrizni kell, a dózist csökkenteni lehet."),
  // --- központi idegrendszer
  R("maoi", "ssri_snri", 4, "Szerotoninszindróma veszélye", "Az MAO-gátló és az SSRI/SNRI együtt életveszélyes szerotoninszindrómát okozhat; ellenjavallt.", "Váltáskor megfelelő kimosási időt kell tartani."),
  R("maoi", "serotonergic_opioid", 4, "Szerotoninszindróma veszélye", "A tramadol és az MAO-gátló együtt életveszélyes szerotoninszindrómát okozhat; ellenjavallt.", "Válasszon más fájdalomcsillapítót (pl. paracetamol)."),
  R("ssri_snri", "serotonergic_opioid", 3, "Szerotoninszindróma és görcs veszélye", "A tramadol SSRI/SNRI-vel együtt szerotoninszindrómát és görcsöt okozhat.", "Kerülje, vagy a legkisebb adaggal, szoros megfigyelés mellett alkalmazza."),
  R("linezolid", "ssri_snri", 3, "Szerotoninszindróma veszélye", "A linezolid gyenge MAO-gátló, SSRI/SNRI-vel együtt szerotoninszindrómát okozhat.", "Csak szoros megfigyelés mellett, rövid ideig."),
  R("triptan", "ssri_snri", 2, "Szerotoninszindróma ritka veszélye", "A triptánok SSRI/SNRI-vel együtt ritkán szerotoninszindrómát okozhatnak.", "A tünetekre (izgatottság, remegés, láz) figyelni kell."),
  R("fluvoxamine", "tizanidine", 4, "Kifejezett vérnyomásesés és álmosság", "A fluvoxamin gátolja a tizanidin lebontását; a kombináció ellenjavallt.", "Válasszon más izomlazító szert."),
  R("opioid", "benzo", 3, "Légzésdepresszió és nagyfokú szedáció", "Az opioid és a benzodiazepin együtt lassíthatja a légzést, kómát okozhat.", "Kerülje; ha elkerülhetetlen, a legkisebb adagot és a legrövidebb időtartamot alkalmazza."),
  R("opioid", "gabapentinoid", 2, "Légzésdepresszió és szedáció", "Az opioid és a gabapentin/pregabalin együtt fokozza az álmosságot és a légzésdepressziót.", "Kezdje alacsony adaggal, figyelje a légzést."),
  // --- szív és érrendszer
  R("pde5", "nitrate", 4, "Életveszélyes vérnyomásesés", "A PDE5-gátlók (pl. szildenafil) nitrátokkal együtt kifejezett vérnyomásesést okoznak; ellenjavallt.", "Soha ne adja együtt; a nitrát után 24–48 órán belül sem."),
  R("pde5", "alpha_blocker", 2, "Vérnyomásesés", "A PDE5-gátló és az alfa-blokkoló együtt ortosztatikus hipotóniát okozhat.", "Kis adaggal kezdjen, óvatosan emelje."),
  R("beta", "nd_ccb", 3, "Lassú szívverés és szívblokk veszélye", "A béta-blokkoló és a verapamil/diltiazem együtt súlyos bradycardiát és AV-blokkot okozhat.", "Kerülje, vagy szoros EKG-ellenőrzés mellett alkalmazza."),
  R("amiodarone", "beta", 2, "Lassú szívverés", "Az amiodaron és a béta-blokkoló együtt fokozza a bradycardia kockázatát.", "Szívritmus-ellenőrzés szükséges."),
  R("amiodarone", "nd_ccb", 2, "Lassú szívverés", "Az amiodaron és a verapamil/diltiazem együtt fokozza a bradycardia kockázatát.", "Szívritmus-ellenőrzés szükséges."),
  R("digoxin", "amiodarone", 3, "A digoxin szintje megnőhet", "Az amiodaron kb. a duplájára emeli a digoxin szintjét.", "A digoxin adagját csökkenteni, a szintet ellenőrizni kell."),
  R("digoxin", "verapamil", 3, "A digoxin szintje megnőhet", "A verapamil jelentősen emeli a digoxin szintjét.", "A digoxin adagját csökkenteni, a szintet ellenőrizni kell."),
  R("digoxin", "macrolide_strong", 3, "A digoxin szintje megnőhet", "A klaritromicin és eritromicin megnöveli a digoxin szintjét.", "A digoxin szintjét ellenőrizni kell, vagy válasszon más antibiotikumot."),
  R("digoxin", "k_sparing", 2, "A digoxin hatása változhat", "A káliumszint változása befolyásolja a digoxin hatását.", "Ellenőrizze a káliumszintet."),
  R("digoxin", "thiazide", 2, "Alacsony káliumszint növeli a digoxin-toxicitás veszélyét", "A tiazid típusú vízhajtók káliumvesztést okozhatnak.", "Ellenőrizze a káliumszintet."),
  R("digoxin", "loop", 2, "Alacsony káliumszint növeli a digoxin-toxicitás veszélyét", "A kacsdiuretikumok káliumvesztést okozhatnak.", "Ellenőrizze a káliumszintet."),
  R("qt_strong", "qt", 3, "Életveszélyes szívritmuszavar (QT-megnyúlás)", "Két QT-megnyújtó gyógyszer együtt torsade de pointes típusú ritmuszavart okozhat.", "Kerülje az együttes alkalmazást, vagy EKG-kontroll mellett és káliumszint-rendezés után alkalmazza."),
  R("qt", "qt", 2, "QT-megnyúlás kockázata nő", "Két QT-megnyújtó gyógyszer együtt növelheti a szívritmuszavar kockázatát.", "Kerülje a további kockázati tényezőket (alacsony kálium, magnézium)."),
  // --- egyéb
  R("fluoroquinolone", "tizanidine", 4, "Kifejezett vérnyomásesés és álmosság", "A fluorokinolonok (pl. ciprofloxacin) gátolják a tizanidin lebontását; a kombináció ellenjavallt.", "Válasszon más antibiotikumot vagy izomlazítót."),
  R("fluoroquinolone", "corticosteroid", 2, "Íngyulladás és ínszakadás veszélye", "A fluorokinolon és a kortikoszteroid együtt növeli az ínszakadás kockázatát, főleg időseknél.", "Ínfájdalom esetén azonnal hagyja abba."),
  R("fluoroquinolone", "cations", 2, "Gyengébb felszívódás", "A kalcium-, vas-, magnézium-, cink- és alumíniumtartalmú készítmények megkötik a fluorokinolont a bélben.", "Tartson legalább 2 óra távolságot az antibiotikum előtt és 6 órát utána."),
  R("tetracycline", "cations", 2, "Gyengébb felszívódás", "A kalcium-, vas-, magnézium-, cink- és alumíniumtartalmú készítmények megkötik a tetraciklint a bélben.", "Tartson legalább 2–3 óra különbséget."),
  R("levothyroxine", "cations", 1, "Gyengébb felszívódás", "A kalcium és a vas csökkenti a levotiroxin felszívódását.", "Tartson legalább 4 óra különbséget."),
  R("levothyroxine", "ppi", 1, "Gyengébb felszívódás", "A savcsökkentő gyógyszerek mérsékelhetik a levotiroxin felszívódását.", "Szükség esetén ellenőrizze a TSH-t."),
  R("allopurinol", "thiopurine", 3, "A vérképzés károsodhat", "Az allopurinol gátolja az azatioprin és a merkaptopurin lebontását, ezért súlyos csontvelő-károsodás léphet fel.", "A thiopurin adagját a töredékére kell csökkenteni, a vérképet ellenőrizni."),
  R("methotrexate", "sulfonamide_abx", 3, "A vérképzés károsodhat", "A ko-trimoxazol és a metotrexát együtt súlyos csontvelő-károsodást okozhat.", "Kerülje az együttes alkalmazást."),
  R("methotrexate", "tmp", 3, "A vérképzés károsodhat", "A trimetoprim és a metotrexát együtt súlyos csontvelő-károsodást okozhat.", "Kerülje az együttes alkalmazást."),
  R("sulfonylurea", "azole", 3, "Súlyos hipoglikémia veszélye", "Az azol típusú gombaellenes szerek megemelik a szulfonilurea szintjét.", "Gyakoribb vércukormérés szükséges, vagy más gyógyszer választandó."),
  R("sulfonylurea", "sulfonamide_abx", 3, "Súlyos hipoglikémia veszélye", "A szulfametoxazol (ko-trimoxazol) fokozza a szulfonilurea hatását.", "Gyakoribb vércukormérés szükséges, vagy más antibiotikum választandó."),
  R("sulfonylurea", "beta", 1, "A hipoglikémia tünetei elmosódhatnak", "A béta-blokkoló eltakarhatja a vércukor-esés jeleit (szívdobogás, remegés).", "Tájékoztassa a beteget, ellenőrizze a vércukrot."),
  R("colchicine", "macrolide_strong", 3, "Kolchicin-toxicitás veszélye", "A klaritromicin és eritromicin megemeli a kolchicin szintjét, ami súlyos mérgezéshez vezethet.", "Válasszon más antibiotikumot, vagy csökkentse a kolchicin adagját."),
  R("colchicine", "azole", 3, "Kolchicin-toxicitás veszélye", "Az erős CYP3A4-gátló azolok megemelik a kolchicin szintjét.", "Kerülje, vagy csökkentse a kolchicin adagját."),
];

// ---------------------------------------------------------------- allergén-katalógus
export interface AllergenDef {
  key: string;
  hu: string;
  classId: string;
  cross?: { classId: string; sev: Severity; note: string }[];
}

export const ALLERGENS: Record<string, AllergenDef> = {
  penicillin: {
    key: "penicillin",
    hu: "Penicillin-allergia",
    classId: "penicillin",
    cross: [
      { classId: "cephalosporin", sev: 2, note: "Keresztallergia ritka (kb. 1–2%), de lehetséges; tüneteket figyelni kell." },
      { classId: "carbapenem", sev: 2, note: "Keresztallergia ritka, de lehetséges." },
    ],
  },
  cephalosporin: { key: "cephalosporin", hu: "Cefalosporin-allergia", classId: "cephalosporin", cross: [{ classId: "penicillin", sev: 2, note: "Keresztallergia lehetséges." }] },
  sulfonamide: { key: "sulfonamide", hu: "Szulfonamid-allergia", classId: "sulfonamide_abx" },
  nsaid: {
    key: "nsaid",
    hu: "NSAID/aszpirin-allergia",
    classId: "nsaid",
    cross: [
      { classId: "asa", sev: 4, note: "Az acetilszalicilsav NSAID, a keresztallergia szinte biztos." },
      { classId: "metamizole", sev: 2, note: "NSAID-érzékenyeknél keresztreakció lehetséges." },
      { classId: "paracetamol", sev: 1, note: "Nagy adagnál ritkán keresztreakció előfordulhat." },
    ],
  },
  macrolide: { key: "macrolide", hu: "Makrolid-allergia", classId: "macrolide" },
  fluoroquinolone: { key: "fluoroquinolone", hu: "Fluorokinolon-allergia", classId: "fluoroquinolone" },
};

// ---------------------------------------------------------------- alternatívák
// Ha az új gyógyszer ebbe a csoportba tartozik és súlyos/ellenjavallt figyelmeztetést kap,
// innen keresünk helyettesítő hatóanyagot (a teljes betegprofil újraellenőrzése után).
export const ALT_BY_CLASS: Record<string, string[]> = {
  nsaid: ["paracetamol", "metamizole"],
  asa: ["paracetamol"],
  macrolide_strong: ["azithromycin", "doxycycline", "cefuroxime"],
  macrolide: ["azithromycin", "doxycycline", "cefuroxime"],
  azole: ["terbinafine"],
  fluoroquinolone: ["cefuroxime", "doxycycline", "azithromycin"],
  tetracycline: ["azithromycin", "cefuroxime"],
  penicillin: ["azithromycin", "doxycycline", "cefuroxime", "clarithromycin"],
  cephalosporin: ["azithromycin", "doxycycline"],
  sulfonamide_abx: ["doxycycline", "nitrofurantoin"],
  simvastatin: ["rosuvastatin", "pravastatin"],
  atorvastatin: ["rosuvastatin", "pravastatin"],
  serotonergic_opioid: ["paracetamol", "metamizole"],
  omeprazole_like: ["pantoprazole"],
};

// ---------------------------------------------------------------- magyar hatóanyag-nevek (keresés és megjelenítés)
export const HU: Record<string, string> = {
  "acetylsalicylic acid": "acetilszalicilsav", metamizole: "metamizol", paracetamol: "paracetamol", ibuprofen: "ibuprofen",
  dexibuprofen: "dexibuprofen", diclofenac: "diklofenák", naproxen: "naproxén", ketoprofen: "ketoprofén", meloxicam: "meloxikám",
  celecoxib: "celekoxib", etoricoxib: "etorikoxib", nimesulide: "nimezulid", amoxicillin: "amoxicillin", "clavulanic acid": "klavulánsav",
  azithromycin: "azitromicin", clarithromycin: "klaritromicin", erythromycin: "eritromicin", doxycycline: "doxiciklin",
  ciprofloxacin: "ciprofloxacin", levofloxacin: "levofloxacin", moxifloxacin: "moxifloxacin", cefuroxime: "cefuroxim",
  ceftriaxone: "ceftriaxon", cefalexin: "cefalexin", simvastatin: "szimvasztatin", atorvastatin: "atorvasztatin",
  rosuvastatin: "rosuvasztatin", pravastatin: "pravasztatin", warfarin: "warfarin", rivaroxaban: "rivaroxaban", apixaban: "apixaban",
  clopidogrel: "klopidogrel", amlodipine: "amlodipin", bisoprolol: "biszoprolol", metoprolol: "metoprolol", ramipril: "ramipril",
  perindopril: "perindopril", enalapril: "enalapril", lisinopril: "lizinopril", valsartan: "valzartán", telmisartan: "telmizartán",
  losartan: "lozartán", irbesartan: "irbezartán", hydrochlorothiazide: "hidroklorotiazid", indapamide: "indapamid",
  spironolactone: "spironolakton", furosemide: "furoszemid", digoxin: "digoxin", amiodarone: "amiodaron", metformin: "metformin",
  gliclazide: "gliklazid", glimepiride: "glimepirid", omeprazole: "omeprazol", esomeprazole: "ezomeprazol", pantoprazole: "pantoprazol",
  sertraline: "szertralin", escitalopram: "escitalopram", citalopram: "citalopram", fluoxetine: "fluoxetin", venlafaxine: "venlafaxin",
  tramadol: "tramadol", codeine: "kodein", morphine: "morfin", diazepam: "diazepam", alprazolam: "alprazolam", zolpidem: "zolpidem",
  sildenafil: "szildenafil", tadalafil: "tadalafil", levothyroxine: "levotiroxin", allopurinol: "allopurinol", methotrexate: "metotrexát",
  prednisolone: "prednizolon", dexamethasone: "dexametazon", tamsulosin: "tamszulozin", salbutamol: "szalbutamol", cetirizine: "cetirizin",
  loratadine: "loratadin", sumatriptan: "szumatriptán", "isosorbide mononitrate": "izoszorbid-mononitrát", "glyceryl trinitrate": "nitroglicerin",
  terbinafine: "terbinafin", nitrofurantoin: "nitrofurantoin", pregabalin: "pregabalin", gabapentin: "gabapentin", lithium: "lítium",
  colchicine: "kolchicin", gemfibrozil: "gemfibrozil", fenofibrate: "fenofibrát", trimethoprim: "trimetoprim", sulfamethoxazole: "szulfametoxazol",
  metronidazole: "metronidazol", torasemide: "torazemid", nebivolol: "nebivolol", carvedilol: "karvedilol",
  atenolol: "atenolol", verapamil: "verapamil", diltiazem: "diltiazem", ketoconazole: "ketokonazol", fluconazole: "flukonazol",
  itraconazole: "itrakonazol", ritonavir: "ritonavir", oxycodone: "oxikodon", tapentadol: "tapentadol", fentanyl: "fentanil",
  budesonide: "budezonid", ondansetron: "ondanszetron", domperidone: "domperidon", haloperidol: "haloperidol", quetiapine: "kvetiapin",
  olanzapine: "olanzapin", risperidone: "riszperidon", aripiprazole: "aripiprazol", lamotrigine: "lamotrigin", levetiracetam: "levetiracetám",
  carbamazepine: "karbamazepin", "valproic acid": "valproinsav", insulin: "inzulin", sitagliptin: "szitagliptin", empagliflozin: "empagliflozin",
  dapagliflozin: "dapagliflozin", ezetimibe: "ezetimib", ticagrelor: "tikagrelor", dabigatran: "dabigatrán",
  ibandronic: "ibandronsav", alendronic: "alendronsav", montelukast: "montelukaszt", desloratadine: "dezloratadin", ambroxol: "ambroxol",
};

// Alternatívajavaslatnál előnyben részesített (jellemző felnőtt) erősségek
export const PREF_STRENGTH: Record<string, string[]> = {
  paracetamol: ["500 mg"], metamizole: ["500 mg"], azithromycin: ["500 mg"], doxycycline: ["100 mg"], cefuroxime: ["500 mg", "250 mg"],
  clarithromycin: ["500 mg", "250 mg"], rosuvastatin: ["10 mg", "20 mg"], pravastatin: ["20 mg", "40 mg"], pantoprazole: ["40 mg", "20 mg"],
  terbinafine: ["250 mg"], nitrofurantoin: ["50 mg", "100 mg"],
};

export const huName = (sub: string) => HU[sub] ?? sub;

// Helyi (bőrre, szembe, orrba stb.) alkalmazású formák: a rendszerhatású kölcsönhatás-szabályok nem érvényesek.
export const TOPICAL_RE = /gél|krém|kenőcs|szemcsepp|szemgél|szemkenőcs|orrcsepp|orrspray|orrkenőcs|külsőleges|bőrre|tapasz|spray|fülcsepp|fültől|emulzió|samp|lotion|hüvely|szájnyálkahártyán|bőrön|szájüregi|szájvíz|torokspray/i;

export const isTopical = (form?: string) => (form ? TOPICAL_RE.test(form) : false);

export function routeGroup(form?: string): "orális" | "parenterális" | "helyi" | "egyéb" {
  if (!form) return "egyéb";
  const f = form.toLowerCase();
  if (isTopical(f)) return "helyi";
  if (/injekció|infúzió|infúzi/.test(f)) return "parenterális";
  if (/tabletta|kapszula|belsőleges|szirup|granulátum|cseppek|por belső|pezsgő|szuszpenzió|rágó|szopogató|nyelvalatti|drazsé/.test(f)) return "orális";
  return "egyéb";
}
