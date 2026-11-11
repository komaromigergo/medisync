// ATC-csoportok magyarul, közérthetően ("mire való" / hatáscsoport).

const L2: Record<string, string> = {
  A01: "szájüregi készítmény", A02: "gyomorsav okozta panaszok kezelése", A03: "gyomor-bélgörcs és puffadás elleni szer", A04: "hányáscsillapító",
  A05: "epe- és májkészítmény", A06: "székrekedés elleni szer", A07: "hasmenés és bélgyulladás elleni szer", A08: "fogyókúrás szer",
  A09: "emésztést segítő készítmény", A10: "cukorbetegség (diabétesz) gyógyszere", A11: "vitamin", A12: "ásványi anyag", A13: "tonikum",
  A14: "anabolikus szer", A15: "étvágyfokozó", A16: "egyéb emésztőrendszeri és anyagcsere-készítmény",
  B01: "véralvadásgátló / vérrögképződést gátló", B02: "vérzéscsillapító", B03: "vérszegénység elleni készítmény", B05: "vérpótló, infúziós oldat", B06: "egyéb vérkészítmény",
  C01: "szívgyógyszer", C02: "vérnyomáscsökkentő", C03: "vízhajtó", C04: "perifériás értágító", C05: "érvédő, visszérkészítmény", C07: "béta-blokkoló (szív- és vérnyomásgyógyszer)",
  C08: "kalciumcsatorna-blokkoló (vérnyomás-, szívgyógyszer)", C09: "vérnyomáscsökkentő (RAAS-gátló)", C10: "koleszterinszint-csökkentő",
  D01: "gombaellenes bőrkészítmény", D02: "bőrpuhító, bőrvédő", D03: "sebkezelő", D04: "viszketéscsillapító", D05: "pikkelysömör elleni", D06: "bőrfertőzések elleni",
  D07: "szteroidos bőrkészítmény", D08: "fertőtlenítő", D10: "pattanás elleni", D11: "egyéb bőrgyógyászati készítmény",
  G01: "nőgyógyászati fertőzések elleni", G02: "egyéb nőgyógyászati készítmény", G03: "hormonális készítmény (pl. fogamzásgátló)", G04: "húgyúti készítmény (pl. prosztata)",
  H01: "agyalapi mirigy hormonjai", H02: "kortikoszteroid", H03: "pajzsmirigybetegségek gyógyszere", H04: "hasnyálmirigyhormon", H05: "kalcium-anyagcsere szabályozója",
  J01: "antibiotikum", J02: "gombaellenes (szisztémás)", J04: "tuberkulózis elleni", J05: "vírusellenes", J06: "immunszérum", J07: "védőoltás",
  L01: "daganatellenes", L02: "daganatellenes hormon", L03: "immunstimuláns", L04: "immunszuppresszáns",
  M01: "gyulladáscsökkentő és reumaellenes", M02: "külsőleges fájdalomcsillapító", M03: "izomlazító", M04: "köszvény elleni", M05: "csontritkulás elleni", M09: "egyéb mozgásszervi",
  N01: "érzéstelenítő", N02: "fájdalom- és lázcsillapító", N03: "epilepszia elleni", N04: "Parkinson-kór elleni", N05: "nyugtató, altató, pszichózis elleni",
  N06: "antidepresszáns, pszichostimuláns, demencia elleni", N07: "egyéb idegrendszeri (pl. dohányzásleszoktatás)",
  P01: "maláriaellenes, élősködők elleni", P02: "féregűző", P03: "külső élősködők elleni",
  R01: "orrkészítmény", R02: "torokfertőtlenítő", R03: "asztma és COPD elleni", R05: "köhögés- és megfázás elleni", R06: "antihisztamin (allergia ellen)", R07: "egyéb légzőszervi készítmény",
  S01: "szemészeti készítmény", S02: "fülészeti készítmény", S03: "szem- és fülészeti készítmény",
  V01: "allergén", V03: "egyéb terápiás szer", V04: "diagnosztikum", V06: "tápszer", V07: "egyéb nem terápiás szer", V08: "kontrasztanyag", V09: "diagnosztikai radiogyógyszer", V10: "terápiás radiogyógyszer",
};

// pontosabb (3–4 karakteres) felülírások
const L3: [string, string][] = [
  ["C10AA", "koleszterinszint-csökkentő (sztatin)"], ["C09A", "vérnyomáscsökkentő (ACE-gátló)"], ["C09B", "vérnyomáscsökkentő (ACE-gátló kombináció)"],
  ["C09C", "vérnyomáscsökkentő (ARB)"], ["C09D", "vérnyomáscsökkentő (ARB kombináció)"], ["B01AA", "véralvadásgátló (K-vitamin-antagonista)"],
  ["B01AF", "véralvadásgátló (Xa-gátló)"], ["B01AE", "véralvadásgátló (trombingátló)"], ["B01AC", "vérlemezke-gátló"], ["M01A", "gyulladáscsökkentő és fájdalomcsillapító (NSAID)"],
  ["N02BE", "lázcsillapító és fájdalomcsillapító (paracetamol)"], ["N02BB", "fájdalom- és lázcsillapító (metamizol)"], ["N02BA", "fájdalom- és lázcsillapító (szalicilát)"],
  ["N02A", "erős fájdalomcsillapító (opioid)"], ["J01CR", "antibiotikum (penicillin + béta-laktamáz-gátló)"], ["J01C", "antibiotikum (penicillin)"], ["J01D", "antibiotikum (cefalosporin)"],
  ["J01F", "antibiotikum (makrolid)"], ["J01M", "antibiotikum (fluorokinolon)"], ["J01A", "antibiotikum (tetraciklin)"], ["A02BC", "savcsökkentő (protonpumpa-gátló)"],
  ["C07A", "béta-blokkoló"], ["C08C", "vérnyomáscsökkentő (kalciumcsatorna-blokkoló)"], ["N06AB", "antidepresszáns (SSRI)"], ["N06AX", "antidepresszáns"],
  ["A10BA", "cukorbetegség (metformin)"], ["A10BB", "cukorbetegség (szulfonilurea)"], ["H03AA", "pajzsmirigyhormon-pótló"], ["C03A", "vízhajtó (tiazid)"], ["C03C", "vízhajtó (kacsdiuretikum)"],
  ["C03D", "vízhajtó (káliummegtakarító)"], ["N05B", "szorongásoldó"], ["N05C", "altató, nyugtató"], ["G04BE", "merevedési zavar elleni"], ["R03", "asztma és COPD elleni"],
];

export function atcLabelOne(code: string): string {
  const c = code.toUpperCase();
  for (const [p, t] of L3) if (c.startsWith(p)) return t;
  return L2[c.slice(0, 3)] ?? "";
}

export function atcLabel(codes: string[]): string {
  for (const c of codes) {
    const l = atcLabelOne(c);
    if (l) return l;
  }
  return "";
}

export function atcLabelSentence(codes: string[]): string {
  const l = atcLabel(codes);
  return l ? l.charAt(0).toUpperCase() + l.slice(1) : "";
}
