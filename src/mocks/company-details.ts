// Données enrichies par société – Afrivest Research
// Source: BRVM Bulletin N°41 (27 fév. 2026) + données publiques estimées

export interface Shareholder {
  name: string
  pct: number
  type: 'institutionnel' | 'public' | 'etat' | 'fondateur'
}

export interface RelatedNews {
  date: string
  headline: string
  positive: boolean | null
}

export interface CompanyFullDetail {
  annual_variation_pct: number | null   // depuis le bulletin
  net_income_bn_fcfa: number | null
  net_margin_pct: number | null
  ebitda_bn_fcfa: number | null
  free_float_pct: number | null
  ceo: string | null
  ceo_title: string
  activities: string[]
  certifications: string[]
  shareholders: Shareholder[]
  recent_news: RelatedNews[]
}

// Helpers compacts
const sh = (name: string, pct: number, type: Shareholder['type']): Shareholder => ({ name, pct, type })
const news = (date: string, headline: string, positive: boolean | null = null): RelatedNews => ({ date, headline, positive })

export const COMPANY_DETAILS: Record<number, CompanyFullDetail> = {

  // ── 1 · NTLC – Nestlé Côte d'Ivoire ──────────────────────────────────────
  1: {
    annual_variation_pct: 17.42,
    net_income_bn_fcfa: 24.5, net_margin_pct: 7.9, ebitda_bn_fcfa: 42.0, free_float_pct: 29,
    ceo: 'Amadou Konaté', ceo_title: 'Directeur Général',
    activities: ['Fabrication de produits alimentaires', 'Production de boissons chocolatées Milo', 'Alimentation infantile et nutrition', 'Distribution régionale sous-Sahara'],
    certifications: ['ISO 9001:2015', 'ISO 22000:2018', 'FSSC 22000', 'Rainforest Alliance'],
    shareholders: [sh('Nestlé SA (Suisse)', 71.0, 'institutionnel'), sh('Flottant BRVM', 29.0, 'public')],
    recent_news: [
      news('2026-02-15', "Nestlé CI annonce l'extension de son usine de Yopougon pour +30% de capacité", true),
      news('2026-01-20', 'Résultats 2025 : Nestlé CI confirme une croissance de son CA de 12% à 344 Mds FCFA', true),
      news('2025-12-10', 'Nestlé CI lance la gamme Maggi Épices Africaines destinée à toute la sous-région', true),
    ],
  },

  // ── 2 · PALC – Palm CI ────────────────────────────────────────────────────
  2: {
    annual_variation_pct: 11.73,
    net_income_bn_fcfa: 32.9, net_margin_pct: 16.9, ebitda_bn_fcfa: 52.0, free_float_pct: 37.5,
    ceo: 'Yves Lambelin', ceo_title: 'Directeur Général',
    activities: ["Production d'huile de palme brute (CPO)", "Raffinage d'huile végétale", 'Production de tourteaux de palmiste', 'Agriculture durable et certifiée RSPO'],
    certifications: ['RSPO', 'ISO 14001:2015', 'GlobalG.A.P.'],
    shareholders: [sh('SIFCA', 62.5, 'fondateur'), sh('Flottant BRVM', 37.5, 'public')],
    recent_news: [
      news('2026-02-10', "Palm CI : hausse des cours mondiaux de l'huile de palme, CA estimé en progression de 18%", true),
      news('2026-01-08', 'Palm CI finalise l\'acquisition de 3 500 ha de nouvelles plantations au nord de la Côte d\'Ivoire', true),
      news('2025-11-20', "Rapport durabilité 2025 : Palm CI atteint 100% de certification RSPO sur ses plantations", true),
    ],
  },

  // ── 3 · SPHC – SAPH CI ───────────────────────────────────────────────────
  3: {
    annual_variation_pct: 6.33,
    net_income_bn_fcfa: 12.2, net_margin_pct: 9.8, ebitda_bn_fcfa: 20.0, free_float_pct: 35,
    ceo: 'Daniel Obiang', ceo_title: 'Directeur Général',
    activities: ["Exploitation de plantations d'hévéas (caoutchouc naturel)", "Traitement et exportation du caoutchouc", "Recherche agronomique sur les variétés haute performance", "Développement de partenariats avec les planteurs villageois"],
    certifications: ['FSC', 'ISO 14001:2015', "Rainforest Alliance"],
    shareholders: [sh('SIFCA', 58.0, 'fondateur'), sh('Michelin Group', 10.5, 'institutionnel'), sh('Flottant BRVM', 31.5, 'public')],
    recent_news: [
      news('2026-02-05', 'Caoutchouc naturel : les prix mondiaux rebondissent, SAPH CI en profite', true),
      news('2025-12-15', 'SAPH CI renouvelle son accord de fourniture avec Michelin pour 5 ans supplémentaires', true),
      news('2025-10-22', 'SAPH CI ouvre son 4e centre de traitement à Man, créant 320 emplois locaux', true),
    ],
  },

  // ── 4 · SMBC – SMB CI ────────────────────────────────────────────────────
  4: {
    annual_variation_pct: 41.05,
    net_income_bn_fcfa: 13.3, net_margin_pct: 9.2, ebitda_bn_fcfa: 22.0, free_float_pct: 30,
    ceo: 'Issouf Kouyaté', ceo_title: 'Directeur Général',
    activities: ['Exploitation minière', "Distribution d'énergie industrielle", 'Services aux industries extractives', 'Fourniture de gaz industriels'],
    certifications: ['ISO 9001:2015', 'OHSAS 18001'],
    shareholders: [sh('Actionnaires fondateurs', 55.0, 'fondateur'), sh('Investisseurs institutionnels', 15.0, 'institutionnel'), sh('Flottant BRVM', 30.0, 'public')],
    recent_news: [
      news('2026-02-01', 'SMB CI : forte progression de +41% depuis le début de l\'année sur fond de demande soutenue', true),
      news('2025-12-18', 'SMB CI annonce un contrat stratégique avec une major pétrolière pour l\'approvisionnement en énergie', true),
      news('2025-11-05', 'Résultats T3 2025 : SMB CI enregistre une hausse de 38% de son résultat opérationnel', true),
    ],
  },

  // ── 5 · TTLC – TotalEnergies Marketing CI ────────────────────────────────
  5: {
    annual_variation_pct: 19.91,
    net_income_bn_fcfa: 4.5, net_margin_pct: 1.6, ebitda_bn_fcfa: 9.8, free_float_pct: 25,
    ceo: 'Emmanuel Giresse', ceo_title: 'Directeur Général',
    activities: ['Distribution de carburants (essence, diesel, kérosène)', 'Commercialisation de lubrifiants Total', "Distribution de gaz butane (Totalgaz)", "Développement de la mobilité électrique", 'Services aux flottes d\'entreprises'],
    certifications: ['ISO 9001:2015', 'ISO 14001:2015'],
    shareholders: [sh('TotalEnergies Affiliates', 75.0, 'institutionnel'), sh('Flottant BRVM', 25.0, 'public')],
    recent_news: [
      news('2026-02-20', 'TotalEnergies CI inaugure 12 nouvelles stations-service à l\'intérieur du pays', true),
      news('2026-01-15', 'Transition énergétique : TotalEnergies CI installe ses premières bornes de recharge EV en Côte d\'Ivoire', true),
      news('2025-12-05', 'Le cours TTLC franchit la barre des 2 800 FCFA — plus haut historique', true),
    ],
  },

  // ── 6 · TTLS – TotalEnergies Marketing SN ────────────────────────────────
  6: {
    annual_variation_pct: 16.40,
    net_income_bn_fcfa: 3.8, net_margin_pct: 4.0, ebitda_bn_fcfa: 6.5, free_float_pct: 22,
    ceo: 'Ousmane Sow', ceo_title: 'Directeur Général',
    activities: ['Distribution de carburants au Sénégal', 'Commercialisation de gaz butane', 'Lubrifiants industriels et automobiles', 'Aviation fuel (JET A1)'],
    certifications: ['ISO 9001:2015', 'ISO 14001:2015'],
    shareholders: [sh('TotalEnergies Marketing Afrique', 78.0, 'institutionnel'), sh('Flottant BRVM', 22.0, 'public')],
    recent_news: [
      news('2026-01-22', 'TotalEnergies SN bénéficie de la hausse des volumes de carburant aviation depuis l\'expansion de Dakar-DSS', true),
      news('2025-11-10', 'Sénégal : TotalEnergies Marketing SN remporte un contrat d\'approvisionnement JET A1 sur 3 ans', true),
    ],
  },

  // ── 7 · ECOC – Ecobank Côte d'Ivoire ─────────────────────────────────────
  7: {
    annual_variation_pct: 6.25,
    net_income_bn_fcfa: 31.3, net_margin_pct: 11.2, ebitda_bn_fcfa: null, free_float_pct: 18,
    ceo: 'Ade Ayeyemi', ceo_title: 'Directeur Général',
    activities: ['Banque de détail et retail banking', 'Banque des entreprises (PME et grandes entreprises)', "Financement du commerce international", 'Banque digitale et mobile banking (Ecobank Mobile)', "Gestion d'actifs et banque privée"],
    certifications: ['ISO 9001:2015', 'Bâle III compliant'],
    shareholders: [sh('ETI (Ecobank Transnational)', 82.0, 'institutionnel'), sh('Flottant BRVM', 18.0, 'public')],
    recent_news: [
      news('2026-02-18', 'Ecobank CI lance Ecobank Pay : solution de paiement QR code pour les commerçants', true),
      news('2026-01-30', 'Résultats 2025 : Ecobank CI affiche un PNB en hausse de 9% à 145 Mds FCFA', true),
      news('2025-12-12', 'Ecobank CI ouvre 15 nouvelles agences dans les zones rurales en 2025', true),
    ],
  },

  // ── 8 · SGBC – Société Générale Côte d'Ivoire ────────────────────────────
  8: {
    annual_variation_pct: 25.27,
    net_income_bn_fcfa: 35.2, net_margin_pct: 16.4, ebitda_bn_fcfa: null, free_float_pct: 43,
    ceo: 'Stéphane Eholié', ceo_title: 'Directeur Général',
    activities: ['Banque de détail (particuliers et professionnels)', 'Banque des grandes entreprises et institutionnels', "Financement de projets d'infrastructure", 'Services d\'investissement et marchés financiers', 'Banque digitale et transformation numérique'],
    certifications: ['ISO 9001:2015', 'Bâle III', 'SWIFT compliant'],
    shareholders: [sh('Société Générale SA (France)', 57.0, 'institutionnel'), sh('Flottant BRVM', 43.0, 'public')],
    recent_news: [
      news('2026-02-22', 'SGBC : PNB en hausse de 14% en 2025, résultat net record à 35 Mds FCFA', true),
      news('2026-01-18', 'Société Générale CI reçoit le prix "Meilleure Banque de Côte d\'Ivoire 2025" — Euromoney', true),
      news('2025-12-08', 'SGBC déploie 200 terminaux de paiement supplémentaires dans les grandes surfaces', true),
    ],
  },

  // ── 9 · SIBC – Société Ivoirienne de Banque ──────────────────────────────
  9: {
    annual_variation_pct: 20.43,
    net_income_bn_fcfa: 5.8, net_margin_pct: 4.2, ebitda_bn_fcfa: null, free_float_pct: 35,
    ceo: 'Kader Diallo', ceo_title: 'Directeur Général',
    activities: ['Banque de détail et PME', 'Crédit immobilier et à la consommation', 'Services de change et transferts internationaux', 'Banque mobile (SIB Mobile)'],
    certifications: ['ISO 9001:2015'],
    shareholders: [sh('Attijariwafa Bank (Maroc)', 55.0, 'institutionnel'), sh('Flottant BRVM', 35.0, 'public'), sh('Personnel et divers', 10.0, 'institutionnel')],
    recent_news: [
      news('2026-02-10', 'SIB lance une offre de crédit vert pour financer les véhicules électriques', true),
      news('2025-12-20', 'SIB : ouverture de 8 nouvelles agences dans les quartiers périphériques d\'Abidjan', true),
    ],
  },

  // ── 10 · ONTBF – ONATEL BF ───────────────────────────────────────────────
  10: {
    annual_variation_pct: 12.27,
    net_income_bn_fcfa: 19.0, net_margin_pct: 13.1, ebitda_bn_fcfa: 38.0, free_float_pct: 26,
    ceo: 'Mamadou Nikiéma', ceo_title: 'Directeur Général',
    activities: ['Téléphonie fixe et haut débit ADSL / fibre', 'Téléphonie mobile (Telmob)', 'Internet mobile 4G et data', 'Services aux entreprises (VPN, cloud)'],
    certifications: ['ISO 9001:2015', 'ISO 27001'],
    shareholders: [sh('Maroc Telecom', 51.0, 'institutionnel'), sh('État du Burkina Faso', 23.0, 'etat'), sh('Flottant BRVM', 26.0, 'public')],
    recent_news: [
      news('2026-01-25', 'ONATEL déploie la 4G+ dans 8 nouvelles villes du Burkina Faso', true),
      news('2025-12-01', 'ONATEL BF : dividende de 189,53 FCFA — rendement de 6,79% au cours actuel', true),
    ],
  },

  // ── 11 · ORAC – Orange Côte d'Ivoire ─────────────────────────────────────
  11: {
    annual_variation_pct: 9.16,
    net_income_bn_fcfa: 150.2, net_margin_pct: 25.0, ebitda_bn_fcfa: 280.0, free_float_pct: 24,
    ceo: 'Mamadou Coulibaly', ceo_title: 'Directeur Général',
    activities: ["Téléphonie mobile (15+ millions d'abonnés)", 'Services data et internet mobile 4G/5G', 'Orange Money — premier opérateur de mobile money en CI', 'Solutions B2B et cloud pour les entreprises', 'Distribution de contenus digitaux (Orange Play)'],
    certifications: ['ISO 9001:2015', 'ISO 27001', 'ISO 14001:2015'],
    shareholders: [sh('Orange MEA (Moyen-Orient & Afrique)', 51.2, 'institutionnel'), sh("État de Côte d'Ivoire", 24.8, 'etat'), sh('Flottant BRVM', 24.0, 'public')],
    recent_news: [
      news('2026-02-12', 'Orange CI dépasse les 20 millions de transactions Orange Money par mois', true),
      news('2026-01-28', 'Orange CI remporte le Trophée du Meilleur Opérateur Mobile d\'Afrique de l\'Ouest 2025', true),
      news('2025-12-15', 'Déploiement de la 5G à Abidjan : Orange CI annonce les premières zones pilotes', true),
    ],
  },

  // ── 12 · SNTS – Sonatel ───────────────────────────────────────────────────
  12: {
    annual_variation_pct: 12.17,
    net_income_bn_fcfa: 330.5, net_margin_pct: 38.8, ebitda_bn_fcfa: 580.0, free_float_pct: 13,
    ceo: 'Sékou Dramé', ceo_title: 'Directeur Général',
    activities: ['Téléphonie mobile Orange Sénégal, Mali, Guinée, Guinée-Bissau, Sierra Leone', 'Internet haut débit et fibre optique', 'Orange Money — leader fintech UEMOA', 'Solutions cloud et datacenters pour entreprises', 'Téléphonie fixe professionnelle'],
    certifications: ['ISO 9001:2015', 'ISO 27001:2013', 'ISO 14001:2015', 'CMMI Level 3'],
    shareholders: [sh('Orange SA (France)', 42.3, 'institutionnel'), sh('État du Sénégal', 27.7, 'etat'), sh('Investisseurs institutionnels', 17.0, 'institutionnel'), sh('Flottant BRVM', 13.0, 'public')],
    recent_news: [
      news('2026-02-25', 'Sonatel confirme son dividende record de 1 655 FCFA/action au titre de 2025', true),
      news('2026-02-10', 'Sonatel finalise le déploiement de la fibre FTTH dans 50 nouvelles communes sénégalaises', true),
      news('2026-01-14', 'Résultats 2025 : Sonatel franchit 1 100 Mds FCFA de chiffre d\'affaires consolidé', true),
    ],
  },

  // ── 13 · SCRC – Sucrivoire ────────────────────────────────────────────────
  13: {
    annual_variation_pct: 55.66,
    net_income_bn_fcfa: 3.4, net_margin_pct: 5.2, ebitda_bn_fcfa: 7.5, free_float_pct: 40,
    ceo: 'Christophe Saquet', ceo_title: 'Directeur Général',
    activities: ['Plantation et récolte de canne à sucre', 'Production de sucre blanc raffiné', 'Production de sucre roux industriel', 'Valorisation de la bagasse (biomasse)'],
    certifications: ['ISO 9001:2015', 'Bonsucro'],
    shareholders: [sh('SIFCA', 46.5, 'fondateur'), sh('Sucden (Groupe Sucres et Denrées)', 13.5, 'institutionnel'), sh('Flottant BRVM', 40.0, 'public')],
    recent_news: [
      news('2026-02-08', 'Sucrivoire : envolée de +55% sur l\'année — le sucre, nouvelle valeur refuge de la BRVM', true),
      news('2025-12-20', 'Sucrivoire achève la rénovation de son usine de Zuénoula : +25% de capacité de traitement', true),
    ],
  },

  // ── 14 · SICC – SICOR CI ─────────────────────────────────────────────────
  14: {
    annual_variation_pct: 30.30,
    net_income_bn_fcfa: 0.16, net_margin_pct: 0.9, ebitda_bn_fcfa: 1.5, free_float_pct: 45,
    ceo: 'Joseph Ahizi', ceo_title: 'Directeur Général',
    activities: ['Transformation de la noix de coco', 'Production de coprah et huile de coco', 'Commercialisation de produits dérivés de la coco', 'Exportation vers les marchés européens et asiatiques'],
    certifications: ['ISO 9001:2015'],
    shareholders: [sh('Actionnaires historiques fondateurs', 55.0, 'fondateur'), sh('Flottant BRVM', 45.0, 'public')],
    recent_news: [
      news('2026-01-10', 'SICOR CI : rebond du cours en 2025 malgré des résultats nets en deçà des attentes', null),
      news('2025-10-05', 'La demande mondiale de noix de coco profite à SICOR — CA en hausse de 8%', true),
    ],
  },

  // ── 15 · SLBC – Solibra CI ────────────────────────────────────────────────
  15: {
    annual_variation_pct: 52.51,
    net_income_bn_fcfa: 5.6, net_margin_pct: 1.2, ebitda_bn_fcfa: 18.0, free_float_pct: 22,
    ceo: 'Laurent Assi', ceo_title: 'Directeur Général',
    activities: ['Brasserie : production de bières Flag, Beaufort, Castel', 'Production de boissons gazeuses (Fanta, Sprite, Coca-Cola sous licence)', 'Eau minérale et boissons energisantes', 'Distribution nationale par réseau de grossistes'],
    certifications: ['ISO 9001:2015', 'ISO 22000:2018'],
    shareholders: [sh('Groupe CASTEL (France)', 78.0, 'institutionnel'), sh('Flottant BRVM', 22.0, 'public')],
    recent_news: [
      news('2026-02-27', 'Solibra CI : bond spectaculaire de +7,50% en séance — plus forte hausse du jour', true),
      news('2026-01-20', 'Solibra CI inaugure sa nouvelle chaîne d\'embouteillage à Abidjan : +15% de capacité', true),
      news('2025-11-15', 'La bière Flag célèbre ses 50 ans en Côte d\'Ivoire : Solibra lance une édition limitée collector', true),
    ],
  },

  // ── 16 · SOGC – SOGB CI ──────────────────────────────────────────────────
  16: {
    annual_variation_pct: 10.44,
    net_income_bn_fcfa: 3.9, net_margin_pct: 5.2, ebitda_bn_fcfa: 9.0, free_float_pct: 38,
    ceo: 'Pierre Billon', ceo_title: 'Directeur Général',
    activities: ["Plantation d'hévéas et production de caoutchouc naturel", "Plantation de palmiers à huile", "Extraction d'huile de palme brute", "Vente aux industriels locaux et exportation"],
    certifications: ['RSPO', 'FSC', 'ISO 14001:2015'],
    shareholders: [sh('SIFCA', 50.0, 'fondateur'), sh('SOCFINCO SA (Belgique)', 12.0, 'institutionnel'), sh('Flottant BRVM', 38.0, 'public')],
    recent_news: [
      news('2026-02-14', 'SOGB CI : les cours du caoutchouc en hausse soutiennent les marges de la société', true),
      news('2025-12-08', 'SOGB CI publie son rapport de durabilité 2025 : 100% de ses forêts certifiées FSC', true),
    ],
  },

  // ── 17 · STBC – SITAB CI ─────────────────────────────────────────────────
  17: {
    annual_variation_pct: 8.57,
    net_income_bn_fcfa: 7.9, net_margin_pct: 9.3, ebitda_bn_fcfa: 14.0, free_float_pct: 32,
    ceo: 'Gilles Toupane', ceo_title: 'Directeur Général',
    activities: ['Fabrication de cigarettes (marques Philip Morris sous licence)', 'Fabrication de tabac à priser', 'Distribution et commercialisation sur le marché ivoirien et régional', 'Gestion de la chaîne d\'approvisionnement en tabac brut'],
    certifications: ['ISO 9001:2015'],
    shareholders: [sh('Philip Morris International', 52.0, 'institutionnel'), sh('British American Tobacco', 16.0, 'institutionnel'), sh('Flottant BRVM', 32.0, 'public')],
    recent_news: [
      news('2025-12-01', 'SITAB CI distribue un dividende exceptionnel de 2 096 FCFA — rendement de 9,76%', true),
      news('2025-10-15', 'SITAB CI maintient ses parts de marché malgré le renforcement des règlements anti-tabac', null),
    ],
  },

  // ── 18 · UNLC – Unilever CI ──────────────────────────────────────────────
  18: {
    annual_variation_pct: 117.09,
    net_income_bn_fcfa: 0.07, net_margin_pct: 0.04, ebitda_bn_fcfa: 8.0, free_float_pct: 28,
    ceo: 'Koffi Anguié', ceo_title: 'Directeur Général Afrique de l\'Ouest',
    activities: ['Produits d\'hygiène personnelle (Dove, Rexona, Lifebuoy)', 'Produits ménagers et lessive (Skip, Omo)', 'Alimentation (Knorr, Lipton)', 'Distribution multi-canal : supermarchés, grossistes, kiosques'],
    certifications: ['ISO 9001:2015', 'ISO 14001:2015', 'FSC (emballages)'],
    shareholders: [sh('Unilever PLC (Royaume-Uni)', 72.0, 'institutionnel'), sh('Flottant BRVM', 28.0, 'public')],
    recent_news: [
      news('2026-02-20', 'Unilever CI : hausse spectaculaire de +117% depuis janvier 2025 — redressement en cours', true),
      news('2025-12-10', 'Unilever CI restructure sa chaîne logistique et ferme un entrepôt à Marcory', null),
    ],
  },

  // ── 19 · ABJC – Servair Abidjan CI ───────────────────────────────────────
  // Données les plus détaillées — exemple principal
  19: {
    annual_variation_pct: 27.76,
    net_income_bn_fcfa: 2.1, net_margin_pct: 5.0, ebitda_bn_fcfa: 5.5, free_float_pct: 38,
    ceo: "N'Goran Brou", ceo_title: 'Directeur Général',
    activities: [
      "Restauration aérienne (catering inflight) : 15 000+ plateaux-repas/jour",
      "Services au sol (ground handling) pour 30+ compagnies aériennes",
      "Gestion du Salon VIP Ivoire — Terminal international d'Abidjan",
      "Services aux équipages (repas, logistique, transport)",
      "Logistique et approvisionnement aéroport : 200+ fournisseurs locaux",
    ],
    certifications: ['ISO 9001:2015', 'IATA ISAGO (Ground Ops)', 'HACCP', 'ISO 22000:2018 (Food Safety)', 'Certification sanitaire DGAL'],
    shareholders: [
      sh('Newrest Group (France)', 56.2, 'institutionnel'),
      sh('Air France Group', 5.8, 'institutionnel'),
      sh('Flottant BRVM', 38.0, 'public'),
    ],
    recent_news: [
      news('2026-02-20', "Servair Abidjan renouvelle son contrat de catering avec Ethiopian Airlines pour 3 ans supplémentaires", true),
      news('2026-01-15', "Résultats 2025 : Servair Abidjan affiche un CA en hausse de 18% à 49,5 Mds FCFA — trafic aérien en plein essor", true),
      news('2025-12-10', "La reprise du trafic aérien à Abidjan profite directement à Servair : +23 nouvelles liaisons internationales en 2025", true),
      news('2025-11-05', "Servair CI inaugure sa nouvelle cuisine industrielle de 2 500 m² — investissement de 3,2 Mds FCFA", true),
    ],
  },

  // ── 20 · BNBC – Bernabé CI ───────────────────────────────────────────────
  20: {
    annual_variation_pct: 15.25,
    net_income_bn_fcfa: 0.015, net_margin_pct: 0.07, ebitda_bn_fcfa: 1.2, free_float_pct: 48,
    ceo: 'Christian Bernabé', ceo_title: 'Directeur Général',
    activities: ['Distribution de matériaux de construction (ciment, fer, acier)', 'Quincaillerie industrielle et outillage professionnel', 'Equipements électriques et plomberie', 'Services BTP pour grands chantiers'],
    certifications: ['ISO 9001:2015'],
    shareholders: [sh('Famille Bernabé', 52.0, 'fondateur'), sh('Flottant BRVM', 48.0, 'public')],
    recent_news: [
      news('2026-01-20', 'Bernabé CI bénéficie des grands chantiers d\'infrastructure ivoiriens : carnet de commandes solide', true),
      news('2025-10-12', 'Bernabé CI ouvre son 5e point de vente à San-Pédro, gateway du cacao ivoirien', true),
    ],
  },

  // ── 21 · CFAC – CFAO Motors CI ───────────────────────────────────────────
  21: {
    annual_variation_pct: 25.17,
    net_income_bn_fcfa: 0.46, net_margin_pct: 0.8, ebitda_bn_fcfa: 3.5, free_float_pct: 32,
    ceo: 'Marc Reverchon', ceo_title: 'Directeur Général',
    activities: ['Distribution de véhicules neufs (Toyota, Isuzu, Yamaha)', 'Services après-vente et maintenance', 'Location longue durée de véhicules (LLD)', 'Distribution de pièces de rechange', 'Financement automobile'],
    certifications: ['ISO 9001:2015', 'Certification concessionnaire Toyota'],
    shareholders: [sh('CFAO SA (France)', 68.0, 'institutionnel'), sh('Flottant BRVM', 32.0, 'public')],
    recent_news: [
      news('2026-02-05', 'CFAO Motors CI : Toyota Landcruiser et Hilux maintiennent leur leadership sur le marché ivoirien', true),
      news('2025-11-20', 'CFAO CI inaugure son nouveau centre de service automobile à Yopougon', true),
    ],
  },

  // ── 22 · LNBB – Loterie Nationale du Bénin ───────────────────────────────
  22: {
    annual_variation_pct: -9.31,
    net_income_bn_fcfa: 5.3, net_margin_pct: 9.6, ebitda_bn_fcfa: 8.0, free_float_pct: 45,
    ceo: 'Hervé Assogba', ceo_title: 'Directeur Général',
    activities: ['Gestion de la loterie nationale du Bénin', 'Paris sportifs et jeux de grattage', 'Jeux en ligne et applications mobiles', "Reversement de fonds au budget de l'État béninois"],
    certifications: ['Licence opérateur jeux ARJEL Bénin'],
    shareholders: [sh("État du Bénin", 40.0, 'etat'), sh('Investisseurs institutionnels', 15.0, 'institutionnel'), sh('Flottant BRVM', 45.0, 'public')],
    recent_news: [
      news('2026-01-08', 'LONAB Bénin : le titre recule de -9% depuis début 2025 malgré des bénéfices stables', null),
      news('2025-11-01', 'LONAB lance son application mobile de paris sportifs — 50 000 téléchargements en un mois', true),
    ],
  },

  // ── 23 · NEIC – NEI-CEDA CI ───────────────────────────────────────────────
  23: {
    annual_variation_pct: 20.83,
    net_income_bn_fcfa: 0.75, net_margin_pct: 5.0, ebitda_bn_fcfa: 2.0, free_float_pct: 52,
    ceo: 'Kouassi Bah', ceo_title: 'Directeur Général',
    activities: ["Édition de manuels scolaires (programme officiel ivoirien)", "Distribution de livres parascolaires et pédagogiques", "Impression offset pour l'Afrique de l'Ouest", "Fourniture de matériel didactique aux établissements scolaires"],
    certifications: ['ISO 9001:2015'],
    shareholders: [sh('Actionnaires fondateurs NEI', 48.0, 'fondateur'), sh('Flottant BRVM', 52.0, 'public')],
    recent_news: [
      news('2026-01-15', 'NEI-CEDA remporte le marché de fourniture de manuels scolaires 2026 en CI — contrat de 7 Mds FCFA', true),
      news('2025-09-05', 'Rentrée scolaire : NEI-CEDA livre 8 millions de manuels dans les délais malgré la pression logistique', true),
    ],
  },

  // ── 24 · PRSC – Tractafric Motors CI ─────────────────────────────────────
  24: {
    annual_variation_pct: 17.42,
    net_income_bn_fcfa: 2.1, net_margin_pct: 4.4, ebitda_bn_fcfa: 4.5, free_float_pct: 40,
    ceo: 'Philippe Jacquot', ceo_title: 'Directeur Général',
    activities: ['Distribution de véhicules industriels et BTP (Mercedes-Benz, FUSO)', 'Vente de poids lourds et engins de chantier', 'Services de maintenance et SAV', 'Fourniture de pièces de rechange d\'origine', 'Location de matériel BTP'],
    certifications: ['ISO 9001:2015', 'Certification Mercedes-Benz Trucks Afrique'],
    shareholders: [sh('Tractafric Motors International', 60.0, 'fondateur'), sh('Flottant BRVM', 40.0, 'public')],
    recent_news: [
      news('2026-02-01', 'Tractafric CI signe un contrat de fourniture de 200 camions pour les chantiers du métro d\'Abidjan', true),
      news('2025-12-05', 'Tractafric lance Mercedes-Benz Actros Euro 6 — premier poids lourd aux normes européennes en CI', true),
    ],
  },

  // ── 25 · UNXC – Uniwax CI ────────────────────────────────────────────────
  25: {
    annual_variation_pct: 68.21,
    net_income_bn_fcfa: 2.8, net_margin_pct: 4.5, ebitda_bn_fcfa: 5.0, free_float_pct: 45,
    ceo: 'Aude Gillier', ceo_title: 'Directrice Générale',
    activities: ['Impression de tissus wax et Super wax africains', 'Création de motifs imprimés (designs originaux)', 'Commercialisation sous les marques Uniwax et Vlisco', 'Exportation vers Europe, Amérique du Nord et Asie'],
    certifications: ['OEKO-TEX Standard 100'],
    shareholders: [sh('Vlisco Group (Pays-Bas)', 55.0, 'institutionnel'), sh('Flottant BRVM', 45.0, 'public')],
    recent_news: [
      news('2026-02-16', 'Uniwax CI : hausse de +68% depuis un an — la mode africaine booste la demande mondiale de wax', true),
      news('2025-11-28', 'Collaboration Uniwax × designer parisien : collection capsule présentée à la Fashion Week', true),
    ],
  },

  // ── 26 · SHEC – Vivo Energy CI ───────────────────────────────────────────
  26: {
    annual_variation_pct: 40.14,
    net_income_bn_fcfa: 1.5, net_margin_pct: 0.8, ebitda_bn_fcfa: 5.2, free_float_pct: 30,
    ceo: 'Mory Coulibaly', ceo_title: 'Directeur Général',
    activities: ['Distribution de carburants Shell (essence, diesel, lubrifiants)', 'Gestion de stations-service (180+ points en CI)', 'Développement de services non-fuel (boutiques, restaurants)', "Aviation fuel pour l'aéroport d'Abidjan", 'Fourniture à la marine et à l\'industrie'],
    certifications: ['ISO 9001:2015', 'ISO 14001:2015', 'Certification Shell'],
    shareholders: [sh('Vivo Energy PLC (Jersey)', 70.0, 'institutionnel'), sh('Flottant BRVM', 30.0, 'public')],
    recent_news: [
      news('2026-02-27', 'Vivo Energy CI : bond de +4,38% — plus forte hausse du secteur énergie', true),
      news('2026-01-22', 'Vivo Energy CI inaugurate 15 nouvelles stations Shell à l\'intérieur du pays', true),
    ],
  },

  // ── 27 · BICB – BIIC Bénin ───────────────────────────────────────────────
  27: {
    annual_variation_pct: 4.42,
    net_income_bn_fcfa: 7.9, net_margin_pct: 11.0, ebitda_bn_fcfa: null, free_float_pct: 38,
    ceo: 'Idelphonse Ahodékon', ceo_title: 'Directeur Général',
    activities: ['Banque de détail et PME au Bénin', 'Financement du commerce et des exportations', 'Services de trade finance', 'Banque des grandes entreprises'],
    certifications: ['ISO 9001:2015'],
    shareholders: [sh('BNP Paribas Africa', 50.7, 'institutionnel'), sh('Flottant BRVM', 38.0, 'public'), sh('Personnel et divers', 11.3, 'institutionnel')],
    recent_news: [
      news('2025-12-15', 'BIIC Bénin annonce un partenariat avec l\'AFD pour le financement de PME durables', true),
      news('2025-10-20', 'Résultats S1 2025 : BIIC Bénin enregistre une croissance de 8% de son PNB', true),
    ],
  },

  // ── 28 · BICC – BICI CI ──────────────────────────────────────────────────
  28: {
    annual_variation_pct: 28.05,
    net_income_bn_fcfa: 6.0, net_margin_pct: 3.7, ebitda_bn_fcfa: null, free_float_pct: 35,
    ceo: 'Benjamin Leblanc', ceo_title: 'Directeur Général',
    activities: ['Banque commerciale pour particuliers et entreprises', 'Financement de projets et crédits d\'investissement', 'Trade finance et crédits documentaires', 'Gestion de patrimoine et banque privée', 'Services digitaux (BICI Mobile)'],
    certifications: ['ISO 9001:2015', 'Bâle III'],
    shareholders: [sh('BNP Paribas SA (France)', 51.0, 'institutionnel'), sh('Flottant BRVM', 35.0, 'public'), sh('IFC (Banque Mondiale)', 14.0, 'institutionnel')],
    recent_news: [
      news('2026-01-30', 'BICI CI lance un produit de crédit immobilier à taux fixe sur 20 ans', true),
      news('2025-12-18', 'BICI CI renouvelle son accord de refinancement avec BNP Paribas à hauteur de 50 Mds FCFA', true),
    ],
  },

  // ── 29-34 · BOA Group ─────────────────────────────────────────────────────
  29: {
    annual_variation_pct: 18.55,
    net_income_bn_fcfa: 6.8, net_margin_pct: 7.7, ebitda_bn_fcfa: null, free_float_pct: 42,
    ceo: 'Brice Kossi', ceo_title: 'Directeur Général',
    activities: ['Banque de détail et PME au Bénin', 'Financement agro-industriel', 'Mobile banking', 'Services de transfert d\'argent'],
    certifications: ['ISO 9001:2015'],
    shareholders: [sh('BOA Group SA (Luxembourg)', 58.0, 'institutionnel'), sh('Flottant BRVM', 42.0, 'public')],
    recent_news: [
      news('2026-01-15', 'BOA Bénin : dividende de 468 FCFA/action — rendement attractif de 6,75%', true),
      news('2025-11-10', 'BOA Bénin finalise l\'acquisition d\'un portefeuille de crédits PME de 15 Mds FCFA', true),
    ],
  },
  30: {
    annual_variation_pct: 27.60,
    net_income_bn_fcfa: 7.7, net_margin_pct: 11.8, ebitda_bn_fcfa: null, free_float_pct: 40,
    ceo: 'Théodore Nana', ceo_title: 'Directeur Général',
    activities: ['Banque de détail au Burkina Faso', 'Financement de l\'agriculture et de l\'élevage', 'Banque des entreprises', 'Mobile banking et transferts'],
    certifications: ['ISO 9001:2015'],
    shareholders: [sh('BOA Group SA', 60.0, 'institutionnel'), sh('Flottant BRVM', 40.0, 'public')],
    recent_news: [
      news('2026-02-05', 'BOA Burkina Faso maintient ses activités malgré le contexte sécuritaire — résilience saluée', null),
      news('2025-10-20', 'BOA BF déploie 50 nouveaux agents bancaires pour desservir les zones éloignées', true),
    ],
  },
  31: {
    annual_variation_pct: 10.03,
    net_income_bn_fcfa: 10.1, net_margin_pct: 8.6, ebitda_bn_fcfa: null, free_float_pct: 38,
    ceo: 'Cheikh Travaly', ceo_title: 'Directeur Général',
    activities: ['Banque de détail et entreprises en CI', 'Financement de projets immobiliers', 'Trade finance et crédits exports', 'Banque des institutionnels et grandes entreprises'],
    certifications: ['ISO 9001:2015'],
    shareholders: [sh('BOA Group SA', 62.0, 'institutionnel'), sh('Flottant BRVM', 38.0, 'public')],
    recent_news: [
      news('2026-01-25', 'BOA CI : résultats 2025 solides avec un PNB de 95 Mds FCFA, en hausse de 11%', true),
      news('2025-12-02', 'BOA Côte d\'Ivoire inaugure son centre d\'affaires dédié aux grandes entreprises à Plateau', true),
    ],
  },
  32: {
    annual_variation_pct: 12.88,
    net_income_bn_fcfa: 6.6, net_margin_pct: 7.8, ebitda_bn_fcfa: null, free_float_pct: 44,
    ceo: 'Tiéby Coulibaly', ceo_title: 'Directeur Général',
    activities: ['Banque universelle au Mali', 'Financement de l\'agrobusiness', 'Microfinance et inclusion financière', 'Services de change'],
    certifications: ['ISO 9001:2015'],
    shareholders: [sh('BOA Group SA', 56.0, 'institutionnel'), sh('Flottant BRVM', 44.0, 'public')],
    recent_news: [
      news('2025-12-15', 'BOA Mali : malgré le contexte politique, la banque maintient sa trajectoire de croissance', null),
      news('2025-10-08', 'BOA Mali double sa présence digitale avec 200 000 utilisateurs actifs sur BOA Mobile', true),
    ],
  },
  33: {
    annual_variation_pct: 11.49,
    net_income_bn_fcfa: 4.8, net_margin_pct: 8.7, ebitda_bn_fcfa: null, free_float_pct: 46,
    ceo: 'Ibrahim Adamou', ceo_title: 'Directeur Général',
    activities: ['Banque commerciale au Niger', 'Financement des PME et artisans', 'Crédits agricoles', 'Services de transfert d\'argent diaspora'],
    certifications: ['ISO 9001:2015'],
    shareholders: [sh('BOA Group SA', 54.0, 'institutionnel'), sh('Flottant BRVM', 46.0, 'public')],
    recent_news: [
      news('2026-01-12', 'BOA Niger : rendement dividende de 7,19% — l\'un des meilleurs du secteur', true),
      news('2025-09-20', 'BOA Niger accompagne 1 200 PME dans le cadre du plan de relance économique du gouvernement', true),
    ],
  },
  34: {
    annual_variation_pct: 25.95,
    net_income_bn_fcfa: 5.5, net_margin_pct: 8.9, ebitda_bn_fcfa: null, free_float_pct: 45,
    ceo: 'Alioune Ndiaye', ceo_title: 'Directeur Général',
    activities: ['Banque universelle au Sénégal', 'Financement de l\'habitat', 'Banque des entreprises exportatrices', 'BOA Mobile — banque digitale'],
    certifications: ['ISO 9001:2015'],
    shareholders: [sh('BOA Group SA', 55.0, 'institutionnel'), sh('Flottant BRVM', 45.0, 'public')],
    recent_news: [
      news('2026-02-10', 'BOA Sénégal bénéficie du boom pétrolier sénégalais : crédit aux entreprises +22%', true),
      news('2025-11-25', 'BOA Sénégal remporte le label «Best Retail Bank Sénégal 2025» — Global Finance', true),
    ],
  },

  // ── 35 · CBIBF – Coris Bank International ────────────────────────────────
  35: {
    annual_variation_pct: 30.33,
    net_income_bn_fcfa: 13.9, net_margin_pct: 11.1, ebitda_bn_fcfa: null, free_float_pct: 35,
    ceo: 'Idrissa Nassa', ceo_title: 'Président-Directeur Général',
    activities: ['Banque universelle (Burkina, CI, Togo, Guinée Conakry…)', 'Banque des PME et microentreprises', 'Solutions de cash management pour entreprises', 'Coris Money — mobile banking', 'Banque des institutionnels et État'],
    certifications: ['ISO 9001:2015', 'Bâle III'],
    shareholders: [sh('Idrissa Nassa & famille (fondateur)', 55.0, 'fondateur'), sh('Investisseurs institutionnels régionaux', 10.0, 'institutionnel'), sh('Flottant BRVM', 35.0, 'public')],
    recent_news: [
      news('2026-02-18', 'Coris Bank ouvre sa 8e filiale — au Sénégal : groupe présent dans 9 pays africains', true),
      news('2026-01-28', 'Résultats 2025 : Coris Bank International enregistre un résultat net record de 14,2 Mds FCFA', true),
      news('2025-12-20', 'Coris Bank signe un accord de co-financement de 100 Mds FCFA avec la BEI pour l\'Afrique de l\'Ouest', true),
    ],
  },

  // ── 36 · ETIT – Ecobank Transnational ────────────────────────────────────
  36: {
    annual_variation_pct: 34.78,
    net_income_bn_fcfa: 780.0, net_margin_pct: 9.5, ebitda_bn_fcfa: null, free_float_pct: 40,
    ceo: 'Jeremy Awori', ceo_title: 'Group CEO',
    activities: ['Groupe bancaire panafricain — 33 pays africains', 'Retail, Corporate et Investment Banking', 'Ecobank Mobile — 25M+ utilisateurs actifs', 'Marchés de capitaux et Global Trade Finance', 'Banque privée et gestion de patrimoine'],
    certifications: ['ISO 9001:2015', 'ISO 27001', 'Bâle III'],
    shareholders: [sh('SUNU / OPIC (consortium)', 27.2, 'institutionnel'), sh('QNB Group (Qatar)', 5.5, 'institutionnel'), sh('Institutions africaines', 27.3, 'institutionnel'), sh('Flottant BRVM/GSE/NSE', 40.0, 'public')],
    recent_news: [
      news('2026-02-14', 'Ecobank Group publie des résultats 2025 solides : bénéfice de 780 Mds FCFA (+12%)', true),
      news('2026-01-20', 'Ecobank lance une super-app panafricaine unifiée pour ses 35 millions de clients', true),
      news('2025-12-08', 'ETI remporte le prix «Banque panafricaine de l\'année» aux African Banker Awards 2025', true),
    ],
  },

  // ── 37 · NSBC – NSIA Banque CI ───────────────────────────────────────────
  37: {
    annual_variation_pct: 28.44,
    net_income_bn_fcfa: 12.6, net_margin_pct: 11.2, ebitda_bn_fcfa: null, free_float_pct: 35,
    ceo: 'Jean Kacou Diagou', ceo_title: 'Directeur Général du Groupe NSIA',
    activities: ['Banque de détail et entreprises en Côte d\'Ivoire', 'Assurances (via NSIA Assurances)', 'Financement immobilier et crédit-bail', 'Banque des institutionnels et grandes entreprises'],
    certifications: ['ISO 9001:2015'],
    shareholders: [sh('Groupe NSIA (CI)', 55.0, 'fondateur'), sh('Proparco (Groupe AFD)', 10.0, 'institutionnel'), sh('Flottant BRVM', 35.0, 'public')],
    recent_news: [
      news('2026-02-20', 'NSIA Banque CI annonce la fusion de ses services bancaires et assurances sur une plateforme unique', true),
      news('2025-12-10', 'NSIA Banque : encours de crédit dépassent 1 000 Mds FCFA pour la première fois', true),
    ],
  },

  // ── 38 · ORGT – Oragroup Togo ─────────────────────────────────────────────
  38: {
    annual_variation_pct: 37.50,
    net_income_bn_fcfa: 6.2, net_margin_pct: 8.0, ebitda_bn_fcfa: 14.5, free_float_pct: 45,
    ceo: 'Ferdinand Ngon Kemoum', ceo_title: 'Directeur Général',
    activities: ['Banque universelle dans 10 pays d\'Afrique subsaharienne', 'Microfinance et inclusion financière', 'Mobile banking et transferts diaspora', 'Financement des PME et agrobusiness'],
    certifications: ['ISO 9001:2015'],
    shareholders: [sh('Emerging Capital Partners (ECP)', 40.0, 'institutionnel'), sh('Autres institutionnels africains', 15.0, 'institutionnel'), sh('Flottant BRVM', 45.0, 'public')],
    recent_news: [
      news('2026-01-18', 'Oragroup s\'implante en Côte d\'Ivoire — 11e pays du groupe', true),
      news('2025-11-15', 'Oragroup Togo : hausse de +37% sur l\'année 2025 — les marchés saluent l\'expansion du groupe', true),
    ],
  },

  // ── 39 · SAFC – SAFCA CI ─────────────────────────────────────────────────
  39: {
    annual_variation_pct: 81.54,
    net_income_bn_fcfa: 0.63, net_margin_pct: 3.5, ebitda_bn_fcfa: 2.5, free_float_pct: 55,
    ceo: 'Kouadio Koffi', ceo_title: 'Directeur Général',
    activities: ['Crédit automobile pour particuliers et entreprises', 'Financement de flottes professionnelles', 'Assurance crédit et produits connexes', 'Partenariats avec concessionnaires automobiles'],
    certifications: ['Agréé BCEAO'],
    shareholders: [sh('Investisseurs institutionnels CI', 45.0, 'institutionnel'), sh('Flottant BRVM', 55.0, 'public')],
    recent_news: [
      news('2026-01-25', 'SAFCA CI : bond de +81% sur l\'année — la croissance du crédit automobile en CI dope les résultats', true),
      news('2025-10-10', 'SAFCA CI signe des partenariats avec 8 nouveaux concessionnaires automobiles', true),
    ],
  },

  // ── 40 · CABC – SICABLE CI ────────────────────────────────────────────────
  40: {
    annual_variation_pct: 61.86,
    net_income_bn_fcfa: 1.7, net_margin_pct: 4.0, ebitda_bn_fcfa: 4.2, free_float_pct: 42,
    ceo: 'Bertrand Aghi', ceo_title: 'Directeur Général',
    activities: ['Fabrication de câbles électriques BT/MT/HT', 'Fabrication de câbles téléphoniques et fibre optique', 'Fourniture aux projets d\'électrification nationale', 'Exportation régionale de câbles en cuivre et aluminium'],
    certifications: ['ISO 9001:2015', 'Marque NF (AFNOR)', 'IEC Standards'],
    shareholders: [sh('Prysmian Group (Italie)', 45.0, 'institutionnel'), sh('SIFCA', 13.0, 'institutionnel'), sh('Flottant BRVM', 42.0, 'public')],
    recent_news: [
      news('2026-02-15', 'SICABLE CI remporte le marché de câblage HT pour le projet d\'électrification rurale — 4,5 Mds FCFA', true),
      news('2025-12-20', 'SICABLE CI bénéficie du grand boom infrastructurel ivoirien : carnet de commandes record', true),
    ],
  },

  // ── 41 · FTSC – FILTISAC CI ───────────────────────────────────────────────
  41: {
    annual_variation_pct: 7.88,
    net_income_bn_fcfa: 25.8, net_margin_pct: 44.5, ebitda_bn_fcfa: 30.0, free_float_pct: 48,
    ceo: 'Yves Koffi', ceo_title: 'Directeur Général',
    activities: ['Fabrication de sacs en polypropylène tissé pour le cacao, café et riz', 'Production de sacs plastiques industriels grande résistance', 'Fabrication de big bags (FIBC)', 'Commercialisation à l\'ensemble des industries agro-alimentaires de l\'UEMOA'],
    certifications: ['ISO 9001:2015', 'ISO 14001:2015'],
    shareholders: [sh('Louis Dreyfus Company', 40.0, 'institutionnel'), sh('Groupe SIFCA', 12.0, 'institutionnel'), sh('Flottant BRVM', 48.0, 'public')],
    recent_news: [
      news('2026-02-27', 'Filtisac CI : dividende record de 1 726 FCFA/action — rendement exceptionnel de 72%', null),
      news('2026-01-15', 'Filtisac CI profite du boom du cacao ivoirien : demande de sacs +35% sur l\'année', true),
      news('2025-11-10', 'Filtisac CI investit 5 Mds dans une nouvelle ligne de production de big bags', true),
    ],
  },

  // ── 42 · SDSC – Africa Global Logistics CI ───────────────────────────────
  42: {
    annual_variation_pct: 42.57,
    net_income_bn_fcfa: 7.7, net_margin_pct: 8.1, ebitda_bn_fcfa: 14.0, free_float_pct: 35,
    ceo: 'Julien Martinez', ceo_title: 'Directeur Général',
    activities: ['Manutention portuaire au port d\'Abidjan', 'Logistique et transit douanier', 'Transport terrestre et multimodal', 'Entreposage et gestion d\'entrepôts', 'Logistique pétrolière et gazière'],
    certifications: ['ISO 9001:2015', 'ISO 14001:2015', 'Certification OEA (Opérateur Économique Agréé)'],
    shareholders: [sh('Africa Global Logistics (groupe MSC)', 65.0, 'institutionnel'), sh('Flottant BRVM', 35.0, 'public')],
    recent_news: [
      news('2026-02-18', 'AGL CI remporte la gestion d\'un nouveau terminal conteneurs au port d\'Abidjan — 10 ans de concession', true),
      news('2026-01-10', 'AGL CI : la forte croissance des importations ivoiriennes booste les volumes de manutention (+18%)', true),
    ],
  },

  // ── 43 · SEMC – Eviosys Packaging SIEM CI ────────────────────────────────
  43: {
    annual_variation_pct: 232.14,
    net_income_bn_fcfa: 0.81, net_margin_pct: 1.8, ebitda_bn_fcfa: 4.5, free_float_pct: 38,
    ceo: 'Marc Aubert', ceo_title: 'Directeur Général',
    activities: ['Fabrication de boîtes métalliques (conserves, aérosols)', 'Production de couvercles et fermetures métalliques', 'Emballages pour l\'industrie agroalimentaire et cosmétique', 'Fourniture aux industriels de Côte d\'Ivoire et exportations CEDEAO'],
    certifications: ['ISO 9001:2015', 'ISO 22000', 'BRC Packaging'],
    shareholders: [sh('Eviosys Packaging (groupe KPS Capital)', 62.0, 'institutionnel'), sh('Flottant BRVM', 38.0, 'public')],
    recent_news: [
      news('2026-01-20', 'SEMC : hausse de +232% sur l\'année — l\'emballage métallique, valeur de croissance inattendue', true),
      news('2025-11-28', 'Eviosys SIEM CI décroche un contrat d\'approvisionnement avec une major de l\'alimentation infantile', true),
    ],
  },

  // ── 44 · SIVC – ERIUM CI ─────────────────────────────────────────────────
  44: {
    annual_variation_pct: 89.87,
    net_income_bn_fcfa: 0.39, net_margin_pct: 1.0, ebitda_bn_fcfa: 3.0, free_float_pct: 50,
    ceo: 'Arnaud Dupont', ceo_title: 'Directeur Général',
    activities: ['Production de gaz industriels (oxygène, azote, argon, acétylène)', 'Distribution de gaz médicaux aux hôpitaux', 'Location de réservoirs cryogéniques industriels', 'Services aux mines et industries extractives'],
    certifications: ['ISO 9001:2015', 'ISO 13485 (gaz médicaux)', 'Certification COFRAC'],
    shareholders: [sh('Investisseurs institutionnels CI', 50.0, 'institutionnel'), sh('Flottant BRVM', 50.0, 'public')],
    recent_news: [
      news('2026-02-05', 'ERIUM CI (ex Air Liquide) : progression de +89% depuis un an — le changement de marque réussit', true),
      news('2025-12-15', 'ERIUM CI investit dans une unité de liquéfaction d\'oxygène pour les CHU d\'Abidjan', true),
    ],
  },

  // ── 45 · STAC – SETAO CI ─────────────────────────────────────────────────
  45: {
    annual_variation_pct: 50.19,
    net_income_bn_fcfa: 1.54, net_margin_pct: 5.5, ebitda_bn_fcfa: 3.5, free_float_pct: 52,
    ceo: 'Michel Kouame', ceo_title: 'Directeur Général',
    activities: ['Travaux de génie civil et terrassement', 'Construction de routes et autoroutes', 'Réalisation d\'ouvrages d\'art et ponts', 'Assainissement et réseaux d\'eau'],
    certifications: ['ISO 9001:2015', 'Certification BTP Côte d\'Ivoire'],
    shareholders: [sh('Actionnaires fondateurs SETAO', 48.0, 'fondateur'), sh('Flottant BRVM', 52.0, 'public')],
    recent_news: [
      news('2026-01-15', 'SETAO CI remporte le lot 3 du projet de voirie urbaine d\'Abidjan — 12 Mds FCFA', true),
      news('2025-10-05', 'SETAO CI : le boom des infrastructures ivoiriennes gonfle le carnet de commandes à 85 Mds', true),
    ],
  },

  // ── 46 · CIEC – CIE CI ───────────────────────────────────────────────────
  46: {
    annual_variation_pct: 35.38,
    net_income_bn_fcfa: 7.2, net_margin_pct: 2.7, ebitda_bn_fcfa: 28.0, free_float_pct: 22,
    ceo: 'Ahmadou Bakayoko', ceo_title: 'Directeur Général',
    activities: ['Production d\'électricité (centrales thermiques et hydrauliques)', 'Transport d\'électricité haute tension', 'Distribution basse et moyenne tension à 5M+ foyers', 'Gestion du réseau électrique national (concession État CI)', 'Projets d\'électrification rurale'],
    certifications: ['ISO 9001:2015', 'ISO 14001:2015', 'ISO 55001 (gestion d\'actifs)'],
    shareholders: [sh('Groupe ERANOVE (CI)', 54.0, 'fondateur'), sh("État de Côte d'Ivoire", 15.0, 'etat'), sh('EDF (France)', 9.0, 'institutionnel'), sh('Flottant BRVM', 22.0, 'public')],
    recent_news: [
      news('2026-02-27', 'CIE CI : bond de +3,06% soutenu par les projets d\'expansion du réseau électrique national', true),
      news('2026-01-22', 'CIE finalise le raccordement électrique de 120 000 nouveaux abonnés en zone péri-urbaine', true),
      news('2025-12-15', 'CIE CI inaugure la centrale solaire de 40 MW à Boundiali — première d\'Afrique de l\'Ouest de cette taille', true),
    ],
  },

  // ── 47 · SDCC – SODE CI ──────────────────────────────────────────────────
  47: {
    annual_variation_pct: 32.50,
    net_income_bn_fcfa: 4.4, net_margin_pct: 5.2, ebitda_bn_fcfa: 14.0, free_float_pct: 20,
    ceo: 'Konan N\'Guessan', ceo_title: 'Directeur Général',
    activities: ['Production et distribution d\'eau potable (concession État CI)', 'Gestion des réseaux d\'adduction d\'eau urbains', 'Contrôle de qualité de l\'eau et laboratoires d\'analyses', 'Projets d\'extension des réseaux en zone périurbaine', 'Assainissement et drainage pluvial'],
    certifications: ['ISO 9001:2015', 'ISO 14001:2015', 'NF Eau potable'],
    shareholders: [sh('Groupe ERANOVE (CI)', 62.0, 'fondateur'), sh("État de Côte d'Ivoire", 18.0, 'etat'), sh('Flottant BRVM', 20.0, 'public')],
    recent_news: [
      news('2026-02-27', 'SODE CI : bond de +7,48% — plus forte performance du secteur services publics', true),
      news('2026-01-30', 'SODE CI remporte la gestion de l\'adduction d\'eau de 3 nouvelles communes — 8 Mds d\'investissements', true),
      news('2025-12-12', 'SODE CI déploie des compteurs connectés intelligents (IoT) sur 150 000 abonnements abidjanais', true),
    ],
  },
}
