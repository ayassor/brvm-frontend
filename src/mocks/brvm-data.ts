import type { Company, StockPrice, Dividend, MarketStock, MarketSummary, Period } from '../types'

// ─── Seeded RNG for deterministic data ───────────────────────────────────────
function seededRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// ─── Real market data – Bulletin Officiel de la Cote N°41, 27 février 2026 ───
// Source: BRVM – données actions du vendredi 27 février 2026
export const REAL_DATA: Record<string, { variation: number; volume: number }> = {
  NTLC:  { variation:  0.04, volume:     278 },
  PALC:  { variation:  0.56, volume:    2337 },
  SPHC:  { variation: -1.06, volume:    1297 },
  SMBC:  { variation:  1.86, volume:    1213 },
  TTLC:  { variation:  2.00, volume:    5513 },
  TTLS:  { variation:  2.28, volume:    1152 },
  ECOC:  { variation:  0.09, volume:    7184 },
  SGBC:  { variation: -0.13, volume:    1352 },
  SIBC:  { variation:  0.36, volume:    8590 },
  ONTBF: { variation:  1.45, volume:    1864 },
  ORAC:  { variation: -0.86, volume:    2583 },
  SNTS:  { variation:  0.34, volume:   16082 },
  SCRC:  { variation:  3.13, volume:    5420 },
  SICC:  { variation:  2.87, volume:      18 },
  SLBC:  { variation:  7.50, volume:     279 },
  SOGC:  { variation:  0.52, volume:    3223 },
  STBC:  { variation:  0.12, volume:     880 },
  UNLC:  { variation:  0.00, volume:     178 },
  ABJC:  { variation: -1.72, volume:    1717 },
  BNBC:  { variation:  3.17, volume:    1998 },
  CFAC:  { variation:  0.00, volume:   21570 },
  LNBB:  { variation:  2.10, volume:     559 },
  NEIC:  { variation: -1.36, volume:    3009 },
  PRSC:  { variation: -0.98, volume:     708 },
  UNXC:  { variation: -0.84, volume:    8538 },
  SHEC:  { variation:  4.38, volume:   10893 },
  BICB:  { variation: -1.14, volume:    2703 },
  BICC:  { variation: -2.35, volume:    1289 },
  BOAB:  { variation: -0.79, volume:    2280 },
  BOABF: { variation: -0.10, volume:    1327 },
  BOAC:  { variation: -0.63, volume:   31361 },
  BOAM:  { variation: -0.11, volume:   12363 },
  BOAN:  { variation: -2.84, volume:   19456 },
  BOAS:  { variation:  0.00, volume:    2975 },
  CBIBF: { variation:  0.36, volume:    1357 },
  ETIT:  { variation:  0.00, volume: 2049372 },
  NSBC:  { variation: -0.68, volume:    1074 },
  ORGT:  { variation:  2.80, volume:    8046 },
  SAFC:  { variation:  1.52, volume:   10168 },
  CABC:  { variation:  0.53, volume:     825 },
  FTSC:  { variation:  4.13, volume:    4598 },
  SDSC:  { variation: -1.82, volume:    5951 },
  SEMC:  { variation: -2.52, volume:   16615 },
  SIVC:  { variation:  0.00, volume:   14177 },
  STAC:  { variation: -0.25, volume:    3977 },
  CIEC:  { variation:  3.06, volume:    3097 },
  SDCC:  { variation:  7.48, volume:    3313 },
}

// ─── Companies (47 valeurs – source BRVM N°41, 27 fév. 2026) ─────────────────
export const MOCK_COMPANIES: Company[] = [
  // ── Compartiment Prestige ──────────────────────────────────────────────────
  {
    id: 1, ticker: 'NTLC', name: "Nestlé Côte d'Ivoire",
    sector: 'Consommation de Base', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 387_000_000_000, is_active: true,
    description: "Filiale du groupe suisse Nestlé, leader mondial de l'alimentation. Produit et commercialise une large gamme de produits alimentaires et de boissons en Afrique de l'Ouest. Cotée au compartiment Prestige de la BRVM.",
  },
  {
    id: 2, ticker: 'PALC', name: 'Palm CI',
    sector: 'Consommation de Base', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 290_000_000_000, is_active: true,
    description: "Premier producteur d'huile de palme en Côte d'Ivoire. Filiale du groupe SIFCA, exploite de vastes plantations de palmiers à huile et joue un rôle clé dans la chaîne agroalimentaire ivoirienne.",
  },
  {
    id: 3, ticker: 'SPHC', name: 'SAPH CI',
    sector: 'Consommation de Base', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 140_000_000_000, is_active: true,
    description: "Société Africaine de Plantations d'Hévéas. Spécialisée dans la production de caoutchouc naturel, elle exploite plusieurs milliers d'hectares de plantations d'hévéas en Côte d'Ivoire.",
  },
  {
    id: 4, ticker: 'SMBC', name: 'SMB CI',
    sector: 'Energie', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 160_000_000_000, is_active: true,
    description: "Société du secteur de l'énergie cotée au compartiment Prestige de la BRVM. Intervient dans l'exploitation de ressources énergétiques en Côte d'Ivoire.",
  },
  {
    id: 5, ticker: 'TTLC', name: 'TotalEnergies Marketing CI',
    sector: 'Energie', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 85_000_000_000, is_active: true,
    description: "Filiale du groupe TotalEnergies. Opère un réseau de stations-service et commercialise carburants, gaz et lubrifiants sur l'ensemble du territoire ivoirien.",
  },
  {
    id: 6, ticker: 'TTLS', name: 'TotalEnergies Marketing SN',
    sector: 'Energie', country: 'Sénégal',
    logo_url: null, market_cap: 50_000_000_000, is_active: true,
    description: "Filiale sénégalaise du groupe TotalEnergies. Distribution de carburants et lubrifiants au Sénégal via un réseau dense de stations-service.",
  },
  {
    id: 7, ticker: 'ECOC', name: "Ecobank Côte d'Ivoire",
    sector: 'Services Financiers', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 510_000_000_000, is_active: true,
    description: "Filiale ivoirienne du groupe bancaire panafricain Ecobank. Offre des services bancaires complets aux particuliers, entreprises et institutions en Côte d'Ivoire.",
  },
  {
    id: 8, ticker: 'SGBC', name: "Société Générale Côte d'Ivoire",
    sector: 'Services Financiers', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 405_000_000_000, is_active: true,
    description: "L'une des plus grandes banques commerciales ivoiriennes. Filiale du groupe Société Générale France, propose des services bancaires complets aux particuliers et aux entreprises.",
  },
  {
    id: 9, ticker: 'SIBC', name: 'Société Ivoirienne de Banque',
    sector: 'Services Financiers', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 80_000_000_000, is_active: true,
    description: "La SIB appartient au groupe Attijariwafa Bank du Maroc. Elle propose une gamme complète de services bancaires aux particuliers, professionnels et entreprises ivoiriennes.",
  },
  {
    id: 10, ticker: 'ONTBF', name: 'ONATEL BF',
    sector: 'Télécommunications', country: 'Burkina Faso',
    logo_url: null, market_cap: 175_000_000_000, is_active: true,
    description: "Office National des Télécommunications du Burkina Faso. Opérateur historique burkinabè, partenaire de Maroc Telecom. Offre des services de téléphonie fixe, mobile (Telmob) et internet.",
  },
  {
    id: 11, ticker: 'ORAC', name: "Orange Côte d'Ivoire",
    sector: 'Télécommunications', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 2_099_000_000_000, is_active: true,
    description: "Premier opérateur de téléphonie mobile en Côte d'Ivoire. Filiale du groupe Orange, fournit des services mobiles, internet et financiers à des millions d'abonnés ivoiriens.",
  },
  {
    id: 12, ticker: 'SNTS', name: 'Sonatel',
    sector: 'Télécommunications', country: 'Sénégal',
    logo_url: null, market_cap: 2_340_000_000_000, is_active: true,
    description: "Opérateur historique de télécommunications au Sénégal et en Afrique de l'Ouest. Filiale du groupe Orange, valeur phare de la BRVM et plus forte capitalisation du marché régional.",
  },

  // ── Compartiment Principal ─────────────────────────────────────────────────
  {
    id: 13, ticker: 'SCRC', name: 'Sucrivoire',
    sector: 'Consommation de Base', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 42_000_000_000, is_active: true,
    description: "Société spécialisée dans la production et la commercialisation de sucre en Côte d'Ivoire. Exploite des plantations de canne à sucre et des unités industrielles de transformation.",
  },
  {
    id: 14, ticker: 'SICC', name: 'SICOR CI',
    sector: 'Consommation de Base', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 22_000_000_000, is_active: true,
    description: "Société Ivoirienne de Coco-Rap, acteur de la filière agroalimentaire en Côte d'Ivoire. Opère dans la transformation et la commercialisation de produits agricoles.",
  },
  {
    id: 15, ticker: 'SLBC', name: 'Solibra CI',
    sector: 'Consommation de Base', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 188_000_000_000, is_active: true,
    description: "Société de Limonaderies et de Brasseries d'Afrique. Principal brasseur de bières et de boissons non alcoolisées en Côte d'Ivoire, filiale du groupe CASTEL.",
  },
  {
    id: 16, ticker: 'SOGC', name: 'SOGB CI',
    sector: 'Consommation de Base', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 56_000_000_000, is_active: true,
    description: "Société des Caoutchoucs de Grand-Béréby. Spécialisée dans la production de caoutchouc naturel et d'huile de palme dans le sud-ouest de la Côte d'Ivoire.",
  },
  {
    id: 17, ticker: 'STBC', name: 'SITAB CI',
    sector: 'Consommation de Base', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 68_000_000_000, is_active: true,
    description: "Société Ivoirienne des Tabacs. Producteur et distributeur de produits du tabac en Côte d'Ivoire, opère depuis plusieurs décennies sur le marché ivoirien.",
  },
  {
    id: 18, ticker: 'UNLC', name: 'Unilever CI',
    sector: 'Consommation de Base', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 74_000_000_000, is_active: true,
    description: "Filiale ivoirienne du groupe multinational Unilever. Commercialise des produits d'hygiène, de beauté et alimentaires à travers un réseau de distribution panafricain.",
  },
  {
    id: 19, ticker: 'ABJC', name: 'Servair Abidjan CI',
    sector: 'Consommation Discrétionnaire', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 56_000_000_000, is_active: true,
    description: "Prestataire de services de restauration aérienne et de services au sol à l'aéroport international Felix Houphouët-Boigny d'Abidjan.",
  },
  {
    id: 20, ticker: 'BNBC', name: 'Bernabé CI',
    sector: 'Consommation Discrétionnaire', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 22_000_000_000, is_active: true,
    description: "Distributeur de matériaux de construction, de produits industriels et d'équipements en Côte d'Ivoire. Opère un réseau de points de vente à travers le pays.",
  },
  {
    id: 21, ticker: 'CFAC', name: 'CFAO Motors CI',
    sector: 'Consommation Discrétionnaire', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 32_000_000_000, is_active: true,
    description: "Distributeur automobile en Côte d'Ivoire, filiale du groupe CFAO. Commercialise plusieurs marques de véhicules neufs et offre des prestations après-vente.",
  },
  {
    id: 22, ticker: 'LNBB', name: 'Loterie Nationale du Bénin',
    sector: 'Consommation Discrétionnaire', country: 'Bénin',
    logo_url: null, market_cap: 58_000_000_000, is_active: true,
    description: "Opérateur national des jeux de loterie au Bénin. Gère les paris sportifs et jeux de hasard autorisés sur l'ensemble du territoire béninois.",
  },
  {
    id: 23, ticker: 'NEIC', name: 'NEI-CEDA CI',
    sector: 'Consommation Discrétionnaire', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 17_000_000_000, is_active: true,
    description: "Nouvelles Editions Ivoiriennes – Centre d'Edition et de Diffusion Africaine. Editeur et distributeur de livres scolaires et parascolaires en Afrique subsaharienne.",
  },
  {
    id: 24, ticker: 'PRSC', name: 'Tractafric Motors CI',
    sector: 'Consommation Discrétionnaire', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 41_000_000_000, is_active: true,
    description: "Distributeur de véhicules industriels et d'engins de travaux publics en Côte d'Ivoire. Commercialise des marques premium et offre des services de maintenance.",
  },
  {
    id: 25, ticker: 'UNXC', name: 'Uniwax CI',
    sector: 'Consommation Discrétionnaire', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 47_000_000_000, is_active: true,
    description: "Fabricant ivoirien de tissus wax et imprimés africains. Les produits Uniwax sont distribués dans toute la sous-région ouest-africaine et exportés à l'international.",
  },
  {
    id: 26, ticker: 'SHEC', name: 'Vivo Energy CI',
    sector: 'Energie', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 35_000_000_000, is_active: true,
    description: "Distributeur de carburants et lubrifiants sous la marque Shell en Côte d'Ivoire. Opère un réseau de stations-service à travers le territoire ivoirien.",
  },
  {
    id: 27, ticker: 'BICB', name: 'BIIC Bénin',
    sector: 'Services Financiers', country: 'Bénin',
    logo_url: null, market_cap: 78_000_000_000, is_active: true,
    description: "Banque Internationale pour l'Industrie et le Commerce du Bénin. Filiale affiliée au groupe BNP Paribas, offre une gamme complète de services bancaires au Bénin.",
  },
  {
    id: 28, ticker: 'BICC', name: 'BICI CI',
    sector: 'Services Financiers', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 95_000_000_000, is_active: true,
    description: "Banque Internationale pour le Commerce et l'Industrie de la Côte d'Ivoire. Affiliée au groupe BNP Paribas, accompagne entreprises et particuliers ivoiriens.",
  },
  {
    id: 29, ticker: 'BOAB', name: 'Bank of Africa Bénin',
    sector: 'Services Financiers', country: 'Bénin',
    logo_url: null, market_cap: 97_000_000_000, is_active: true,
    description: "Filiale béninoise du groupe Bank of Africa (BOA), présent dans 18 pays africains. Offre des services bancaires aux particuliers, PME et grandes entreprises.",
  },
  {
    id: 30, ticker: 'BOABF', name: 'Bank of Africa Burkina Faso',
    sector: 'Services Financiers', country: 'Burkina Faso',
    logo_url: null, market_cap: 72_000_000_000, is_active: true,
    description: "Filiale burkinabè du groupe Bank of Africa. Présente dans les principales villes du Burkina Faso avec une gamme complète de services financiers.",
  },
  {
    id: 31, ticker: 'BOAC', name: "Bank of Africa Côte d'Ivoire",
    sector: 'Services Financiers', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 100_000_000_000, is_active: true,
    description: "Filiale ivoirienne du groupe Bank of Africa présent dans 18 pays africains. Propose une gamme diversifiée de produits et services financiers aux ménages et entreprises.",
  },
  {
    id: 32, ticker: 'BOAM', name: 'Bank of Africa Mali',
    sector: 'Services Financiers', country: 'Mali',
    logo_url: null, market_cap: 90_000_000_000, is_active: true,
    description: "Filiale malienne du groupe Bank of Africa. L'une des banques les plus actives au Mali, proposant des services bancaires aux particuliers et aux entreprises.",
  },
  {
    id: 33, ticker: 'BOAN', name: 'Bank of Africa Niger',
    sector: 'Services Financiers', country: 'Niger',
    logo_url: null, market_cap: 58_000_000_000, is_active: true,
    description: "Filiale nigérienne du groupe Bank of Africa. Offre des produits et services bancaires adaptés au contexte économique du Niger.",
  },
  {
    id: 34, ticker: 'BOAS', name: 'Bank of Africa Sénégal',
    sector: 'Services Financiers', country: 'Sénégal',
    logo_url: null, market_cap: 66_000_000_000, is_active: true,
    description: "Filiale sénégalaise du groupe Bank of Africa. Présente à Dakar et dans les principales villes du Sénégal avec une offre bancaire complète.",
  },
  {
    id: 35, ticker: 'CBIBF', name: 'Coris Bank International',
    sector: 'Services Financiers', country: 'Burkina Faso',
    logo_url: null, market_cap: 130_000_000_000, is_active: true,
    description: "Banque burkinabè en forte croissance, présente dans plusieurs pays de l'UEMOA. Fondée à Ouagadougou, elle se distingue par son dynamisme commercial et sa forte progression.",
  },
  {
    id: 36, ticker: 'ETIT', name: 'Ecobank Transnational',
    sector: 'Services Financiers', country: 'Togo',
    logo_url: null, market_cap: 252_000_000_000, is_active: true,
    description: "Holding du groupe bancaire panafricain Ecobank, présent dans 33 pays africains. Basé à Lomé, ETI est coté à la BRVM, à la Ghana Stock Exchange et à la Nigerian Stock Exchange.",
  },
  {
    id: 37, ticker: 'NSBC', name: "NSIA Banque Côte d'Ivoire",
    sector: 'Services Financiers', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 120_000_000_000, is_active: true,
    description: "Filiale bancaire du groupe NSIA, conglomérat financier panafricain actif dans la banque et l'assurance dans 12 pays d'Afrique subsaharienne.",
  },
  {
    id: 38, ticker: 'ORGT', name: 'Oragroup Togo',
    sector: 'Services Financiers', country: 'Togo',
    logo_url: null, market_cap: 66_000_000_000, is_active: true,
    description: "Holding bancaire panafricain basé à Lomé au Togo. Le groupe Oragroup opère des banques dans une dizaine de pays d'Afrique subsaharienne.",
  },
  {
    id: 39, ticker: 'SAFC', name: 'SAFCA CI',
    sector: 'Services Financiers', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 24_000_000_000, is_active: true,
    description: "Société Africaine de Crédit Automobile. Spécialisée dans le financement automobile et les crédits aux particuliers et aux entreprises en Côte d'Ivoire.",
  },
  {
    id: 40, ticker: 'CABC', name: 'SICABLE CI',
    sector: 'Industriels', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 31_000_000_000, is_active: true,
    description: "Société Ivoirienne de Câbles. Seul fabricant de câbles électriques et téléphoniques en Côte d'Ivoire, fournissant les secteurs de l'énergie, des télécoms et du bâtiment.",
  },
  {
    id: 41, ticker: 'FTSC', name: 'FILTISAC CI',
    sector: 'Industriels', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 47_000_000_000, is_active: true,
    description: "Fabricant de sacs en polypropylène et emballages industriels. Fournit principalement les industries cacaoyère, caféière et les minoteries ivoiriennes.",
  },
  {
    id: 42, ticker: 'SDSC', name: 'Africa Global Logistics CI',
    sector: 'Industriels', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 43_000_000_000, is_active: true,
    description: "Prestataire de services logistiques et de manutention portuaire en Côte d'Ivoire. Filiale du groupe Africa Global Logistics (ex-Bolloré Africa Logistics).",
  },
  {
    id: 43, ticker: 'SEMC', name: 'Eviosys Packaging SIEM CI',
    sector: 'Industriels', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 47_000_000_000, is_active: true,
    description: "Fabricant d'emballages métalliques pour l'industrie agroalimentaire. Anciennement SIEM CI, la société est désormais filiale du groupe Eviosys Packaging.",
  },
  {
    id: 44, ticker: 'SIVC', name: 'ERIUM CI',
    sector: 'Industriels', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 27_000_000_000, is_active: true,
    description: "Anciennement Air Liquide Côte d'Ivoire. Spécialisée dans la production et la distribution de gaz industriels et médicaux pour les industries, hôpitaux et le secteur minier.",
  },
  {
    id: 45, ticker: 'STAC', name: 'SETAO CI',
    sector: 'Industriels', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 20_000_000_000, is_active: true,
    description: "Société d'Exploitation des Travaux et Aménagements de l'Ouest. Spécialisée dans le génie civil, la construction d'infrastructures et les travaux publics en Côte d'Ivoire.",
  },
  {
    id: 46, ticker: 'CIEC', name: 'CIE CI',
    sector: 'Services Publics', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 127_000_000_000, is_active: true,
    description: "Compagnie Ivoirienne d'Electricité. Concessionnaire de la production, du transport et de la distribution de l'électricité en Côte d'Ivoire depuis 1990.",
  },
  {
    id: 47, ticker: 'SDCC', name: 'SODE CI',
    sector: 'Services Publics', country: "Côte d'Ivoire",
    logo_url: null, market_cap: 77_000_000_000, is_active: true,
    description: "Société de Distribution d'Eau de la Côte d'Ivoire. Concessionnaire de la production et de la distribution d'eau potable dans les zones urbaines et semi-urbaines.",
  },
]

// ─── Cours de clôture réels – 27 fév. 2026 ───────────────────────────────────
export const BASE_PRICES: Record<number, number> = {
   1: 12505,  2:  9050,  3:  8400,  4: 13400,  5:  2800,
   6:  2910,  7: 17000,  8: 37450,  9:  6925, 10:  2790,
  11: 15555, 12: 29300, 13:  1650, 14:  4300, 15: 44075,
  16:  8725, 17: 21475, 18: 74300, 19:  3705, 20:  1625,
  21:  1790, 22:  3895, 23:  1450, 24:  4550, 25:  2355,
  26:  2025, 27:  5195, 28: 24900, 29:  6935, 30:  4785,
  31:  7900, 32:  4515, 33:  2910, 34:  6600, 35: 14050,
  36:    31, 37: 14700, 38:  3300, 39:  6000, 40:  3820,
  41:  2395, 42:  2160, 43:  2325, 44:  3000, 45:  1990,
  46:  3195, 47:  7685,
}

// ─── Price history generation ─────────────────────────────────────────────────
const REFERENCE_DATE = new Date('2026-02-27')

function generateFullHistory(companyId: number): StockPrice[] {
  const basePrice = BASE_PRICES[companyId] ?? 1000
  const rand = seededRand(companyId * 9973 + 42)
  const prices: StockPrice[] = []
  const totalCalendarDays = 365 * 5 + 30
  let price = basePrice * (0.75 + rand() * 0.1)
  let idCounter = companyId * 10000

  for (let i = totalCalendarDays; i >= 0; i--) {
    const date = new Date(REFERENCE_DATE)
    date.setDate(date.getDate() - i)
    const dow = date.getDay()
    if (dow === 0 || dow === 6) continue

    const distRatio = price / basePrice
    const drift = (1 - distRatio) * 0.003
    const change = (rand() - 0.48 + drift) * 0.014 * price
    price = Math.max(price + change, basePrice * 0.3)

    const closePrice = Math.round(price)
    const open = Math.max(1, Math.round(price + (rand() - 0.5) * price * 0.006))
    const high = Math.round(Math.max(open, closePrice) * (1 + rand() * 0.008))
    const low = Math.round(Math.min(open, closePrice) * (1 - rand() * 0.008))

    prices.push({
      id: idCounter++,
      company_id: companyId,
      date: date.toISOString().split('T')[0],
      open,
      close: closePrice,
      high,
      low,
      volume: Math.round(rand() * 25000 + 300),
    })
  }
  return prices
}

const _cache: Record<number, StockPrice[]> = {}
function getFullHistory(companyId: number): StockPrice[] {
  if (!_cache[companyId]) _cache[companyId] = generateFullHistory(companyId)
  return _cache[companyId]
}

const PERIOD_TRADING_DAYS: Record<Period, number> = {
  '1d': 2, '1w': 5, '1m': 22, '3m': 65, '6m': 130, '1y': 252,
  '3y': 756, '5y': 1260, '10y': 2520, 'max': 99999,
}

// ─── Mock API (même interface que la vraie API pour faciliter la migration) ───
export const mockCompaniesApi = {
  list: (): Promise<Company[]> =>
    Promise.resolve([...MOCK_COMPANIES]),

  getById: (id: number): Promise<Company> => {
    const company = MOCK_COMPANIES.find(c => c.id === id)
    if (!company) return Promise.reject(new Error('Entreprise introuvable'))
    return Promise.resolve(company)
  },

  getPrices: (id: number, period: Period = '1m'): Promise<StockPrice[]> => {
    const history = getFullHistory(id)
    const count = PERIOD_TRADING_DAYS[period]
    return Promise.resolve(history.slice(-count))
  },

  getDividends: (id: number): Promise<Dividend[]> =>
    Promise.resolve(MOCK_DIVIDENDS[id] ?? []),
}

export const mockMarketApi = {
  movers: (type: 'gainers' | 'losers', limit = 5): Promise<MarketStock[]> =>
    mockMarketApi.overview().then(({ stocks }) =>
      [...stocks]
        .sort((a, b) => type === 'gainers' ? b.variation - a.variation : a.variation - b.variation)
        .slice(0, limit)
    ),

  mostActive: (limit = 5): Promise<MarketStock[]> =>
    mockMarketApi.overview().then(({ stocks }) =>
      [...stocks].sort((a, b) => b.volume - a.volume).slice(0, limit)
    ),

  overview: (): Promise<{ stocks: MarketStock[]; summary: MarketSummary }> => {
    const stocks: MarketStock[] = MOCK_COMPANIES.map(company => {
      const rd = REAL_DATA[company.ticker]
      return {
        id: company.id,
        name: company.name,
        ticker: company.ticker,
        sector: company.sector,
        country: company.country,
        current_price: BASE_PRICES[company.id] ?? 0,
        variation: rd?.variation ?? 0,
        volume: rd?.volume ?? 0,
      }
    })
    const summary: MarketSummary = {
      total_companies: 47,
      advances: 24,
      declines: 18,
      unchanged: 5,
    }
    return Promise.resolve({ stocks, summary })
  },
}

// ─── Dividendes (source: Bulletin Officiel N°41 + historique estimé) ─────────
export const MOCK_DIVIDENDS: Record<number, Dividend[]> = {
   1: [ // NTLC – Nestlé CI
    { id: 10101, company_id:  1, amount: 721.60, payment_date: '2025-08-18', ex_date: '2025-08-13' },
    { id: 10102, company_id:  1, amount: 680.00, payment_date: '2024-07-15', ex_date: '2024-07-10' },
    { id: 10103, company_id:  1, amount: 640.00, payment_date: '2023-07-18', ex_date: '2023-07-13' },
  ],
   2: [ // PALC – Palm CI
    { id: 10201, company_id:  2, amount: 451.45, payment_date: '2025-09-10', ex_date: '2025-09-05' },
    { id: 10202, company_id:  2, amount: 400.00, payment_date: '2024-09-12', ex_date: '2024-09-07' },
    { id: 10203, company_id:  2, amount: 350.00, payment_date: '2023-09-14', ex_date: '2023-09-09' },
  ],
   3: [ // SPHC – SAPH CI
    { id: 10301, company_id:  3, amount: 323.84, payment_date: '2025-07-17', ex_date: '2025-07-12' },
    { id: 10302, company_id:  3, amount: 300.00, payment_date: '2024-07-19', ex_date: '2024-07-14' },
    { id: 10303, company_id:  3, amount: 280.00, payment_date: '2023-07-21', ex_date: '2023-07-16' },
  ],
   4: [ // SMBC – SMB CI
    { id: 10401, company_id:  4, amount: 616.00, payment_date: '2025-09-15', ex_date: '2025-09-10' },
    { id: 10402, company_id:  4, amount: 560.00, payment_date: '2024-09-17', ex_date: '2024-09-12' },
  ],
   5: [ // TTLC – TotalEnergies CI
    { id: 10501, company_id:  5, amount: 195.67, payment_date: '2025-09-03', ex_date: '2025-08-29' },
    { id: 10502, company_id:  5, amount: 175.00, payment_date: '2024-09-05', ex_date: '2024-08-31' },
    { id: 10503, company_id:  5, amount: 155.00, payment_date: '2023-09-07', ex_date: '2023-09-02' },
  ],
   6: [ // TTLS – TotalEnergies SN
    { id: 10601, company_id:  6, amount: 222.40, payment_date: '2025-07-11', ex_date: '2025-07-06' },
    { id: 10602, company_id:  6, amount: 200.00, payment_date: '2024-07-13', ex_date: '2024-07-08' },
  ],
   7: [ // ECOC – Ecobank CI
    { id: 10701, company_id:  7, amount: 707.52, payment_date: '2025-05-30', ex_date: '2025-05-25' },
    { id: 10702, company_id:  7, amount: 650.00, payment_date: '2024-06-01', ex_date: '2024-05-27' },
    { id: 10703, company_id:  7, amount: 600.00, payment_date: '2023-06-03', ex_date: '2023-05-29' },
  ],
   8: [ // SGBC – Société Générale CI
    { id: 10801, company_id:  8, amount: 1645.78, payment_date: '2025-08-05', ex_date: '2025-07-31' },
    { id: 10802, company_id:  8, amount: 1500.00, payment_date: '2024-08-07', ex_date: '2024-08-02' },
    { id: 10803, company_id:  8, amount: 1380.00, payment_date: '2023-08-09', ex_date: '2023-08-04' },
  ],
   9: [ // SIBC – SIB
    { id: 10901, company_id:  9, amount: 330.00, payment_date: '2025-07-31', ex_date: '2025-07-26' },
    { id: 10902, company_id:  9, amount: 300.00, payment_date: '2024-08-02', ex_date: '2024-07-28' },
    { id: 10903, company_id:  9, amount: 275.00, payment_date: '2023-08-04', ex_date: '2023-07-30' },
  ],
  10: [ // ONTBF – ONATEL BF
    { id: 11001, company_id: 10, amount: 189.53, payment_date: '2025-07-21', ex_date: '2025-07-16' },
    { id: 11002, company_id: 10, amount: 175.00, payment_date: '2024-07-23', ex_date: '2024-07-18' },
    { id: 11003, company_id: 10, amount: 160.00, payment_date: '2023-07-25', ex_date: '2023-07-20' },
  ],
  11: [ // ORAC – Orange CI
    { id: 11101, company_id: 11, amount: 660.00, payment_date: '2025-06-04', ex_date: '2025-05-30' },
    { id: 11102, company_id: 11, amount: 610.00, payment_date: '2024-06-06', ex_date: '2024-06-01' },
    { id: 11103, company_id: 11, amount: 570.00, payment_date: '2023-06-08', ex_date: '2023-06-03' },
  ],
  12: [ // SNTS – Sonatel
    { id: 11201, company_id: 12, amount: 1655.00, payment_date: '2025-05-22', ex_date: '2025-05-17' },
    { id: 11202, company_id: 12, amount: 1520.00, payment_date: '2024-05-24', ex_date: '2024-05-19' },
    { id: 11203, company_id: 12, amount: 1400.00, payment_date: '2023-05-26', ex_date: '2023-05-21' },
  ],
  13: [ // SCRC – Sucrivoire
    { id: 11301, company_id: 13, amount:  40.50, payment_date: '2021-08-20', ex_date: '2021-08-15' },
  ],
  14: [ // SICC – SICOR CI
    { id: 11401, company_id: 14, amount: 1919.00, payment_date: '2000-09-25', ex_date: '2000-09-20' },
  ],
  15: [ // SLBC – Solibra CI
    { id: 11501, company_id: 15, amount: 1073.60, payment_date: '2025-07-29', ex_date: '2025-07-24' },
    { id: 11502, company_id: 15, amount:  950.00, payment_date: '2024-07-31', ex_date: '2024-07-26' },
    { id: 11503, company_id: 15, amount:  880.00, payment_date: '2023-08-02', ex_date: '2023-07-28' },
  ],
  16: [ // SOGC – SOGB CI
    { id: 11601, company_id: 16, amount: 528.00, payment_date: '2025-07-15', ex_date: '2025-07-10' },
    { id: 11602, company_id: 16, amount: 490.00, payment_date: '2024-07-17', ex_date: '2024-07-12' },
    { id: 11603, company_id: 16, amount: 450.00, payment_date: '2023-07-19', ex_date: '2023-07-14' },
  ],
  17: [ // STBC – SITAB CI
    { id: 11701, company_id: 17, amount: 2096.00, payment_date: '2025-08-29', ex_date: '2025-08-24' },
    { id: 11702, company_id: 17, amount: 1900.00, payment_date: '2024-08-31', ex_date: '2024-08-26' },
  ],
  18: [ // UNLC – Unilever CI
    { id: 11801, company_id: 18, amount: 1233.00, payment_date: '2012-07-09', ex_date: '2012-07-04' },
  ],
  19: [ // ABJC – Servair Abidjan
    { id: 11901, company_id: 19, amount: 206.20, payment_date: '2024-09-30', ex_date: '2024-09-25' },
    { id: 11902, company_id: 19, amount: 190.00, payment_date: '2023-10-02', ex_date: '2023-09-27' },
  ],
  20: [ // BNBC – Bernabé CI
    { id: 12001, company_id: 20, amount: 150.00, payment_date: '2023-07-24', ex_date: '2023-07-19' },
  ],
  21: [ // CFAC – CFAO Motors CI
    { id: 12101, company_id: 21, amount:   7.04, payment_date: '2025-08-19', ex_date: '2025-08-14' },
    { id: 12102, company_id: 21, amount:   6.50, payment_date: '2024-08-21', ex_date: '2024-08-16' },
  ],
  22: [ // LNBB – Loterie Nationale Bénin
    { id: 12201, company_id: 22, amount: 275.50, payment_date: '2025-07-31', ex_date: '2025-07-26' },
    { id: 12202, company_id: 22, amount: 260.00, payment_date: '2024-08-02', ex_date: '2024-07-28' },
  ],
  23: [ // NEIC – NEI-CEDA CI
    { id: 12301, company_id: 23, amount:  81.78, payment_date: '2024-06-25', ex_date: '2024-06-20' },
    { id: 12302, company_id: 23, amount:  75.00, payment_date: '2023-06-27', ex_date: '2023-06-22' },
  ],
  24: [ // PRSC – Tractafric Motors
    { id: 12401, company_id: 24, amount: 182.16, payment_date: '2025-09-30', ex_date: '2025-09-25' },
    { id: 12402, company_id: 24, amount: 165.00, payment_date: '2024-10-02', ex_date: '2024-09-27' },
  ],
  25: [ // UNXC – Uniwax CI
    { id: 12501, company_id: 25, amount:  60.75, payment_date: '2022-07-29', ex_date: '2022-07-24' },
  ],
  26: [ // SHEC – Vivo Energy CI
    { id: 12601, company_id: 26, amount:  75.29, payment_date: '2025-10-22', ex_date: '2025-10-17' },
    { id: 12602, company_id: 26, amount:  65.00, payment_date: '2024-10-24', ex_date: '2024-10-19' },
  ],
  27: [ // BICB – BIIC Bénin
    { id: 12701, company_id: 27, amount: 254.60, payment_date: '2025-09-15', ex_date: '2025-09-10' },
    { id: 12702, company_id: 27, amount: 230.00, payment_date: '2024-09-17', ex_date: '2024-09-12' },
  ],
  28: [ // BICC – BICI CI
    { id: 12801, company_id: 28, amount: 830.72, payment_date: '2025-05-23', ex_date: '2025-05-18' },
    { id: 12802, company_id: 28, amount: 760.00, payment_date: '2024-05-25', ex_date: '2024-05-20' },
    { id: 12803, company_id: 28, amount: 700.00, payment_date: '2023-05-27', ex_date: '2023-05-22' },
  ],
  29: [ // BOAB – BOA Bénin
    { id: 12901, company_id: 29, amount: 468.00, payment_date: '2025-06-03', ex_date: '2025-05-29' },
    { id: 12902, company_id: 29, amount: 430.00, payment_date: '2024-06-05', ex_date: '2024-05-31' },
  ],
  30: [ // BOABF – BOA Burkina Faso
    { id: 13001, company_id: 30, amount: 428.00, payment_date: '2025-04-22', ex_date: '2025-04-17' },
    { id: 13002, company_id: 30, amount: 390.00, payment_date: '2024-04-24', ex_date: '2024-04-19' },
  ],
  31: [ // BOAC – BOA CI
    { id: 13101, company_id: 31, amount: 469.00, payment_date: '2025-05-20', ex_date: '2025-05-15' },
    { id: 13102, company_id: 31, amount: 430.00, payment_date: '2024-05-22', ex_date: '2024-05-17' },
    { id: 13103, company_id: 31, amount: 395.00, payment_date: '2023-05-24', ex_date: '2023-05-19' },
  ],
  32: [ // BOAM – BOA Mali
    { id: 13201, company_id: 32, amount: 237.15, payment_date: '2025-06-03', ex_date: '2025-05-29' },
    { id: 13202, company_id: 32, amount: 220.00, payment_date: '2024-06-05', ex_date: '2024-05-31' },
  ],
  33: [ // BOAN – BOA Niger
    { id: 13301, company_id: 33, amount: 209.25, payment_date: '2025-06-03', ex_date: '2025-05-29' },
    { id: 13302, company_id: 33, amount: 190.00, payment_date: '2024-06-05', ex_date: '2024-05-31' },
  ],
  34: [ // BOAS – BOA Sénégal
    { id: 13401, company_id: 34, amount: 350.00, payment_date: '2025-06-02', ex_date: '2025-05-28' },
    { id: 13402, company_id: 34, amount: 320.00, payment_date: '2024-06-04', ex_date: '2024-05-30' },
  ],
  35: [ // CBIBF – Coris Bank International
    { id: 13501, company_id: 35, amount: 555.00, payment_date: '2025-07-07', ex_date: '2025-07-02' },
    { id: 13502, company_id: 35, amount: 500.00, payment_date: '2024-07-09', ex_date: '2024-07-04' },
  ],
  36: [ // ETIT – Ecobank Transnational
    { id: 13601, company_id: 36, amount:   0.60, payment_date: '2023-06-08', ex_date: '2023-06-03' },
    { id: 13602, company_id: 36, amount:   0.55, payment_date: '2022-06-10', ex_date: '2022-06-05' },
  ],
  37: [ // NSBC – NSIA Banque CI
    { id: 13701, company_id: 37, amount: 668.15, payment_date: '2025-07-09', ex_date: '2025-07-04' },
    { id: 13702, company_id: 37, amount: 610.00, payment_date: '2024-07-11', ex_date: '2024-07-06' },
  ],
  38: [ // ORGT – Oragroup Togo
    { id: 13801, company_id: 38, amount:  59.52, payment_date: '2020-07-17', ex_date: '2020-07-12' },
  ],
  39: [ // SAFC – SAFCA CI
    { id: 13901, company_id: 39, amount:  23.04, payment_date: '2011-07-29', ex_date: '2011-07-24' },
  ],
  40: [ // CABC – SICABLE CI
    { id: 14001, company_id: 40, amount: 112.72, payment_date: '2025-06-02', ex_date: '2025-05-28' },
    { id: 14002, company_id: 40, amount:  95.00, payment_date: '2024-06-04', ex_date: '2024-05-30' },
  ],
  41: [ // FTSC – FILTISAC CI
    { id: 14101, company_id: 41, amount: 1726.56, payment_date: '2025-09-30', ex_date: '2025-09-25' },
    { id: 14102, company_id: 41, amount: 1500.00, payment_date: '2024-10-02', ex_date: '2024-09-27' },
  ],
  42: [ // SDSC – Africa Global Logistics CI
    { id: 14201, company_id: 42, amount:  92.00, payment_date: '2025-08-29', ex_date: '2025-08-24' },
    { id: 14202, company_id: 42, amount:  85.00, payment_date: '2024-08-31', ex_date: '2024-08-26' },
  ],
  43: [ // SEMC – Eviosys Packaging SIEM CI
    { id: 14301, company_id: 43, amount:  14.00, payment_date: '2021-12-28', ex_date: '2021-12-23' },
  ],
  44: [ // SIVC – ERIUM CI
    { id: 14401, company_id: 44, amount:  63.00, payment_date: '2017-09-29', ex_date: '2017-09-24' },
  ],
  45: [ // STAC – SETAO CI
    { id: 14501, company_id: 45, amount:  66.15, payment_date: '2022-07-18', ex_date: '2022-07-13' },
  ],
  46: [ // CIEC – CIE CI
    { id: 14601, company_id: 46, amount: 158.40, payment_date: '2025-07-31', ex_date: '2025-07-26' },
    { id: 14602, company_id: 46, amount: 145.00, payment_date: '2024-08-02', ex_date: '2024-07-28' },
    { id: 14603, company_id: 46, amount: 130.00, payment_date: '2023-08-04', ex_date: '2023-07-30' },
  ],
  47: [ // SDCC – SODE CI
    { id: 14701, company_id: 47, amount: 352.00, payment_date: '2025-09-30', ex_date: '2025-09-25' },
    { id: 14702, company_id: 47, amount: 320.00, payment_date: '2024-10-02', ex_date: '2024-09-27' },
  ],
}

// ─── Données financières complémentaires ─────────────────────────────────────
export interface CompanyExtras {
  pe_ratio: number | null
  dividend_yield: number | null
  revenue_bn_fcfa: number | null
  employees: number | null
  founded: number | null
  website: string | null
}

export const MOCK_EXTRAS: Record<number, CompanyExtras> = {
   1: { pe_ratio:   15.21, dividend_yield:  5.77, revenue_bn_fcfa: 310,  employees:  1200, founded: 1959, website: 'www.nestle.ci' },
   2: { pe_ratio:    8.82, dividend_yield:  4.99, revenue_bn_fcfa: 195,  employees:  4200, founded: 1975, website: 'www.palmci.ci' },
   3: { pe_ratio:   11.43, dividend_yield:  3.86, revenue_bn_fcfa: 124,  employees:  3800, founded: 1956, website: 'www.saph.ci' },
   4: { pe_ratio:   12.01, dividend_yield:  4.60, revenue_bn_fcfa: 145,  employees:  1500, founded: 2000, website: null },
   5: { pe_ratio:   18.81, dividend_yield:  6.99, revenue_bn_fcfa: 285,  employees:   950, founded: 1961, website: 'www.totalenergies.ci' },
   6: { pe_ratio:   13.28, dividend_yield:  7.64, revenue_bn_fcfa:  95,  employees:   600, founded: 1989, website: null },
   7: { pe_ratio:   16.28, dividend_yield:  4.16, revenue_bn_fcfa: 280,  employees:  3500, founded: 1998, website: 'www.ecobank.com/ci' },
   8: { pe_ratio:   11.51, dividend_yield:  4.39, revenue_bn_fcfa: 215,  employees:  2800, founded: 1985, website: 'www.societegenerale.ci' },
   9: { pe_ratio:   13.79, dividend_yield:  4.77, revenue_bn_fcfa: 138,  employees:  1600, founded: 1962, website: 'www.sib.ci' },
  10: { pe_ratio:    9.21, dividend_yield:  6.79, revenue_bn_fcfa: 145,  employees:  2200, founded: 1998, website: 'www.onatel.bf' },
  11: { pe_ratio:   13.97, dividend_yield:  4.24, revenue_bn_fcfa: 600,  employees:  1500, founded: 2002, website: 'www.orange.ci' },
  12: { pe_ratio:    7.08, dividend_yield:  5.65, revenue_bn_fcfa: 852,  employees:  9400, founded: 1985, website: 'www.sonatel.sn' },
  13: { pe_ratio:   12.48, dividend_yield:  2.45, revenue_bn_fcfa:  65,  employees:  2500, founded: 1996, website: null },
  14: { pe_ratio:  134.06, dividend_yield:  null, revenue_bn_fcfa:  18,  employees:   350, founded: 1975, website: null },
  15: { pe_ratio:   33.79, dividend_yield:  2.44, revenue_bn_fcfa: 480,  employees:  2100, founded: 1955, website: null },
  16: { pe_ratio:   14.38, dividend_yield:  6.05, revenue_bn_fcfa:  75,  employees:  1400, founded: 1978, website: 'www.sogb.ci' },
  17: { pe_ratio:    8.62, dividend_yield:  9.76, revenue_bn_fcfa:  85,  employees:   800, founded: 1946, website: null },
  18: { pe_ratio: 1065.58, dividend_yield:  null, revenue_bn_fcfa: 180,  employees:  1100, founded: 1956, website: 'www.unilever.com' },
  19: { pe_ratio:   26.69, dividend_yield:  5.57, revenue_bn_fcfa:  42,  employees:  1800, founded: 1959, website: null },
  20: { pe_ratio: 1471.81, dividend_yield:  9.23, revenue_bn_fcfa:  22,  employees:   450, founded: 1963, website: null },
  21: { pe_ratio:   69.17, dividend_yield:  0.39, revenue_bn_fcfa:  58,  employees:   620, founded: 1945, website: 'www.cfao.com' },
  22: { pe_ratio:   10.86, dividend_yield:  7.07, revenue_bn_fcfa:  55,  employees:   380, founded: 1966, website: null },
  23: { pe_ratio:    null, dividend_yield:  5.64, revenue_bn_fcfa:  15,  employees:   290, founded: 1970, website: null },
  24: { pe_ratio:   19.85, dividend_yield:  4.00, revenue_bn_fcfa:  48,  employees:   520, founded: 1955, website: null },
  25: { pe_ratio:    null, dividend_yield:  2.58, revenue_bn_fcfa:  62,  employees:   750, founded: 1974, website: null },
  26: { pe_ratio:   23.83, dividend_yield:  3.72, revenue_bn_fcfa: 185,  employees:   540, founded: 1936, website: 'www.vivoenergy.com' },
  27: { pe_ratio:    9.89, dividend_yield:  4.90, revenue_bn_fcfa:  72,  employees:   680, founded: 1990, website: null },
  28: { pe_ratio:   15.82, dividend_yield:  3.34, revenue_bn_fcfa: 162,  employees:  1800, founded: 1962, website: 'www.biciici.net' },
  29: { pe_ratio:   14.32, dividend_yield:  6.75, revenue_bn_fcfa:  88,  employees:   820, founded: 1989, website: 'www.bankofafrica.com' },
  30: { pe_ratio:    9.39, dividend_yield:  8.94, revenue_bn_fcfa:  65,  employees:   720, founded: 1998, website: 'www.bankofafrica.com' },
  31: { pe_ratio:    9.86, dividend_yield:  5.94, revenue_bn_fcfa: 118,  employees:  1100, founded: 1996, website: 'www.bankofafrica.com' },
  32: { pe_ratio:   13.58, dividend_yield:  5.25, revenue_bn_fcfa:  85,  employees:   780, founded: 1982, website: 'www.bankofafrica.com' },
  33: { pe_ratio:   12.10, dividend_yield:  7.19, revenue_bn_fcfa:  55,  employees:   560, founded: 1994, website: 'www.bankofafrica.com' },
  34: { pe_ratio:   11.89, dividend_yield:  5.30, revenue_bn_fcfa:  62,  employees:   640, founded: 2001, website: 'www.bankofafrica.com' },
  35: { pe_ratio:    9.38, dividend_yield:  3.95, revenue_bn_fcfa: 125,  employees:  1200, founded: 2008, website: 'www.corisbank.com' },
  36: { pe_ratio:    1.87, dividend_yield:  1.95, revenue_bn_fcfa: 1420, employees: 15000, founded: 1985, website: 'www.ecobank.com' },
  37: { pe_ratio:    9.54, dividend_yield:  4.55, revenue_bn_fcfa: 112,  employees:   980, founded: 1995, website: 'www.nsiabanque.com' },
  38: { pe_ratio:    null, dividend_yield:  1.80, revenue_bn_fcfa:  78,  employees:   850, founded: 2001, website: 'www.orabank.net' },
  39: { pe_ratio:    null, dividend_yield:  null, revenue_bn_fcfa:  18,  employees:   180, founded: 1987, website: null },
  40: { pe_ratio:   18.46, dividend_yield:  2.95, revenue_bn_fcfa:  42,  employees:   420, founded: 1974, website: null },
  41: { pe_ratio:    1.82, dividend_yield: 72.09, revenue_bn_fcfa:  58,  employees:   680, founded: 1972, website: null },
  42: { pe_ratio:    5.58, dividend_yield:  4.26, revenue_bn_fcfa:  95,  employees:  1200, founded: 1920, website: 'www.aglogistics.com' },
  43: { pe_ratio:   57.87, dividend_yield:  0.60, revenue_bn_fcfa:  45,  employees:   550, founded: 1950, website: null },
  44: { pe_ratio:   69.51, dividend_yield:  null, revenue_bn_fcfa:  38,  employees:   280, founded: 1954, website: 'www.erium.ci' },
  45: { pe_ratio:    null, dividend_yield:  3.32, revenue_bn_fcfa:  28,  employees:   320, founded: 1952, website: null },
  46: { pe_ratio:   17.71, dividend_yield:  4.96, revenue_bn_fcfa: 265,  employees:  3500, founded: 1990, website: 'www.cie.ci' },
  47: { pe_ratio:   17.47, dividend_yield:  4.58, revenue_bn_fcfa:  85,  employees:  1100, founded: 1960, website: null },
}
