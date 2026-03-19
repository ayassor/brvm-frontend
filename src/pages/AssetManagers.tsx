import { useState, useMemo, useRef, useEffect } from 'react'
import { assetManagersApi, SGIData, SGOData } from '../api/assetManagers.api'
import { Search, Phone, X, Globe, MessageSquare, Send, Plus, CheckCircle, Info, Star, AlertCircle, ChevronDown } from 'lucide-react'

// ─── Flag image ───────────────────────────────────────────────────────────────
function FlagImg({ code, country }: { code: string; country: string }) {
  return (
    <img
      src={`https://flagcdn.com/w20/${code.toLowerCase()}.png`}
      width={20} height={15} alt={country}
      className="rounded-sm object-cover flex-shrink-0"
      style={{ width: '20px', height: '14px' }}
    />
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface SGIRow {
  name: string; phone: string; country: string; code: string
  minDeposit: string | null; openingFees: string | null; website: string | null
}

type FundCategory = 'A' | 'D' | 'OMLT' | 'OCT' | 'M' | 'O' | 'OATC' | 'OPCR'

interface FundRow {
  name: string
  cat: FundCategory
  vlCurrent: number | null
  perfWeek: string | null
}

interface SGORow {
  name: string
  country: string
  code: string
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  partnerSGI: string | null
  funds: FundRow[]
}

type ReviewType = 'info' | 'avis' | 'correction'
interface Review {
  id: string; sgiName: string; type: ReviewType
  dialCode: string; phone: string; text: string; date: string
}

// ─── UEMOA country dial codes ─────────────────────────────────────────────────
const UEMOA_COUNTRIES = [
  { code: 'CI', country: "Côte d'Ivoire", dial: '+225' },
  { code: 'SN', country: 'Sénégal',       dial: '+221' },
  { code: 'BF', country: 'Burkina Faso',  dial: '+226' },
  { code: 'ML', country: 'Mali',          dial: '+223' },
  { code: 'BJ', country: 'Bénin',         dial: '+229' },
  { code: 'TG', country: 'Togo',          dial: '+228' },
  { code: 'NE', country: 'Niger',         dial: '+227' },
  { code: 'GW', country: 'Guinée-Bissau', dial: '+245' },
]
const DIAL_TO_CODE: Record<string, string> = Object.fromEntries(
  UEMOA_COUNTRIES.map((c) => [c.dial, c.code])
)

// ─── Review type config ───────────────────────────────────────────────────────
const TYPE_CONFIG: Record<ReviewType, { label: string; color: string; icon: React.ReactNode }> = {
  info:       { label: 'Information', color: 'bg-blue-50 text-blue-600 border border-blue-200',   icon: <Info size={11} /> },
  avis:       { label: 'Avis',        color: 'bg-amber-50 text-amber-600 border border-amber-200', icon: <Star size={11} /> },
  correction: { label: 'Correction',  color: 'bg-rose-50 text-rose-600 border border-rose-200',   icon: <AlertCircle size={11} /> },
}

// ─── Mock initial reviews ─────────────────────────────────────────────────────
const INITIAL_REVIEWS: Review[] = [
  { id: 'r1', sgiName: 'CORIS BOURSE',       type: 'avis',       dialCode: '+226', phone: '70 12 34 56', text: 'Très bon service client, ouverture de compte rapide. Dépôt minimum très accessible pour débuter sur la BRVM.', date: '15 fév 2026' },
  { id: 'r2', sgiName: 'CORIS BOURSE',       type: 'info',       dialCode: '+226', phone: '25 33 45 67', text: 'Commission de 0,6 % par transaction. Plateforme web disponible et fonctionnelle, interface simple.', date: '28 jan 2026' },
  { id: 'r3', sgiName: 'SGI TOGO',           type: 'avis',       dialCode: '+228', phone: '90 12 34 56', text: "Ouverture de compte en environ 2 semaines. Personnel compétent et à l'écoute malgré quelques lenteurs administratives.", date: '1 fév 2026' },
  { id: 'r4', sgiName: 'AFRICABOURSE',       type: 'info',       dialCode: '+229', phone: '91 23 45 67', text: 'Gestion de compte possible en ligne via leur portail client. Application mobile en cours de développement selon leurs équipes.', date: '10 jan 2026' },
  { id: 'r5', sgiName: 'ATLANTIQUE FINANCE', type: 'avis',       dialCode: '+225', phone: '07 12 34 56', text: 'Excellente expertise sur les valeurs BRVM. Conseillers très réactifs par WhatsApp Business.', date: '20 fév 2026' },
]

// ─── SGI data ─────────────────────────────────────────────────────────────────
const SGI_LIST: SGIRow[] = [
  { name: 'ATTIJARI SECURITIES WEST AFRICA (ASWA)',         phone: '+225 27 20 21 98 26', country: "Côte d'Ivoire", code: 'CI', minDeposit: null,           openingFees: null,          website: null },
  { name: 'ATLANTIQUE FINANCE',                              phone: '+225 27 20 21 59 75', country: "Côte d'Ivoire", code: 'CI', minDeposit: null,           openingFees: null,          website: null },
  { name: 'BICI BOURSE',                                     phone: '+225 27 20 20 16 68', country: "Côte d'Ivoire", code: 'CI', minDeposit: null,           openingFees: null,          website: null },
  { name: 'BNI FINANCES',                                    phone: '+225 27 20 20 99 02', country: "Côte d'Ivoire", code: 'CI', minDeposit: null,           openingFees: null,          website: null },
  { name: 'BOA CAPITAL SECURITIES',                          phone: '+225 27 20 30 34 29', country: "Côte d'Ivoire", code: 'CI', minDeposit: null,           openingFees: null,          website: null },
  { name: 'BRIDGE SECURITIES',                               phone: '+225 27 20 30 77 17', country: "Côte d'Ivoire", code: 'CI', minDeposit: null,           openingFees: null,          website: null },
  { name: 'BSIC CAPITAL',                                    phone: '+225 27 20 31 71 11', country: "Côte d'Ivoire", code: 'CI', minDeposit: null,           openingFees: null,          website: null },
  { name: 'EDC INVESTMENT CORPORATION',                      phone: '+225 27 20 21 50 00', country: "Côte d'Ivoire", code: 'CI', minDeposit: null,           openingFees: null,          website: null },
  { name: 'GEK CAPITAL',                                     phone: '+225 27 24 35 00 44', country: "Côte d'Ivoire", code: 'CI', minDeposit: null,           openingFees: null,          website: null },
  { name: 'HUDSON & CIE',                                    phone: '+225 27 20 31 55 00', country: "Côte d'Ivoire", code: 'CI', minDeposit: null,           openingFees: null,          website: null },
  { name: 'KERALES FINANCE',                                 phone: '+225 07 98 90 27 27', country: "Côte d'Ivoire", code: 'CI', minDeposit: null,           openingFees: null,          website: null },
  { name: 'MAC - AFRICAN SGI',                               phone: '+225 27 20 22 72 13', country: "Côte d'Ivoire", code: 'CI', minDeposit: null,           openingFees: null,          website: null },
  { name: 'MATHA SECURITIES',                                phone: '+225 27 20 24 30 30', country: "Côte d'Ivoire", code: 'CI', minDeposit: null,           openingFees: null,          website: null },
  { name: 'NSIA FINANCE',                                    phone: '+225 27 20 29 06 53', country: "Côte d'Ivoire", code: 'CI', minDeposit: null,           openingFees: null,          website: null },
  { name: 'ORAGROUP SECURITIES',                             phone: '+225 27 20 25 55 55', country: "Côte d'Ivoire", code: 'CI', minDeposit: null,           openingFees: null,          website: null },
  { name: 'PHOENIX CAPITAL MANAGEMENT',                      phone: '+225 27 20 25 75 90', country: "Côte d'Ivoire", code: 'CI', minDeposit: null,           openingFees: null,          website: null },
  { name: 'SIRIUS CAPITAL',                                  phone: '+225 27 20 24 24 65', country: "Côte d'Ivoire", code: 'CI', minDeposit: null,           openingFees: null,          website: null },
  { name: 'SOCIÉTÉ GÉNÉRALE CAPITAL SECURITIES WEST AFRICA', phone: '+225 27 20 20 12 65', country: "Côte d'Ivoire", code: 'CI', minDeposit: '250 000 FCFA', openingFees: null,          website: null },
  { name: 'ABCO BOURSE',              phone: '+221 33 822 68 00', country: 'Sénégal', code: 'SN', minDeposit: null, openingFees: null, website: null },
  { name: 'CGF BOURSE',               phone: '+221 33 864 97 97', country: 'Sénégal', code: 'SN', minDeposit: null, openingFees: null, website: null },
  { name: 'EVERSET FINANCE',          phone: '+221 33 822 87 00', country: 'Sénégal', code: 'SN', minDeposit: null, openingFees: null, website: null },
  { name: 'FGI',                      phone: '+221 33 867 60 42', country: 'Sénégal', code: 'SN', minDeposit: null, openingFees: null, website: null },
  { name: 'IMPAXIS SECURITIES',       phone: '+221 33 869 31 40', country: 'Sénégal', code: 'SN', minDeposit: null, openingFees: null, website: null },
  { name: 'INVICTUS CAPITAL FINANCE', phone: '+221 33 864 58 58', country: 'Sénégal', code: 'SN', minDeposit: null, openingFees: null, website: null },
  { name: 'AFRICABOURSE',                                       phone: '+229 21 31 88 36', country: 'Bénin', code: 'BJ', minDeposit: '100 000 FCFA', openingFees: '11 000 FCFA', website: null },
  { name: "AFRICAINE DE GESTION ET D'INTERMÉDIATION (AGI)",     phone: '+229 21 31 97 33', country: 'Bénin', code: 'BJ', minDeposit: null,           openingFees: null,          website: null },
  { name: 'BIIC FINANCIAL SERVICES (BFS)',                      phone: '+229 21 32 48 75', country: 'Bénin', code: 'BJ', minDeposit: null,           openingFees: null,          website: null },
  { name: 'SGI BÉNIN',                                          phone: '+229 21 32 48 75', country: 'Bénin', code: 'BJ', minDeposit: null,           openingFees: null,          website: null },
  { name: 'UNITED CAPITAL FOR AFRICA',                          phone: '+229 61 18 18 00', country: 'Bénin', code: 'BJ', minDeposit: null,           openingFees: null,          website: null },
  { name: 'CORIS BOURSE',                                                            phone: '+226 50 33 04 91', country: 'Burkina Faso', code: 'BF', minDeposit: '50 000 FCFA',  openingFees: 'Gratuit',     website: null },
  { name: 'FINANCE INTERNATIONALE (IFI)',                                             phone: '+226 70 88 89 89', country: 'Burkina Faso', code: 'BF', minDeposit: null,            openingFees: null,          website: null },
  { name: "SOCIÉTÉ AFRICAINE D'INGÉNIERIE ET D'INTERMÉDIATION FINANCIÈRE (SA2IF)",   phone: '+226 25 36 15 13', country: 'Burkina Faso', code: 'BF', minDeposit: '60 000 FCFA',  openingFees: '14 000 FCFA', website: null },
  { name: "SOCIÉTÉ BURKINABÈ D'INTERMÉDIATION FINANCIÈRE (SBIF)",                    phone: '+226 50 31 23 23', country: 'Burkina Faso', code: 'BF', minDeposit: null,            openingFees: null,          website: null },
  { name: 'CIA-BOURSE SA',  phone: '+223 20 23 50 20', country: 'Mali', code: 'ML', minDeposit: null, openingFees: null, website: null },
  { name: 'GLOBAL CAPITAL', phone: '+223 44 90 59 74', country: 'Mali', code: 'ML', minDeposit: null, openingFees: null, website: null },
  { name: 'SGI MALI',       phone: '+223 20 29 29 72', country: 'Mali', code: 'ML', minDeposit: null, openingFees: null, website: null },
  { name: 'SGI NIGER',      phone: '+227 20 73 78 18', country: 'Niger', code: 'NE', minDeposit: null, openingFees: null, website: null },
  { name: 'SGI TOGO',       phone: '+228 22 22 30 86', country: 'Togo',  code: 'TG', minDeposit: '150 000 FCFA', openingFees: '10 000 FCFA', website: null },
]

const CAT_CONFIG: Record<FundCategory, { label: string; color: string }> = {
  A:    { label: 'Actions',      color: 'bg-blue-50 text-blue-700 border-blue-200' },
  D:    { label: 'Diversifié',   color: 'bg-violet-50 text-violet-700 border-violet-200' },
  OMLT: { label: 'Oblig. MLT',   color: 'bg-amber-50 text-amber-700 border-amber-200' },
  OCT:  { label: 'Oblig. CT',    color: 'bg-orange-50 text-orange-700 border-orange-200' },
  M:    { label: 'Monétaire',    color: 'bg-slate-100 text-slate-600 border-slate-200' },
  O:    { label: 'Obligations',  color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  OATC: { label: 'Oblig. TC',    color: 'bg-lime-50 text-lime-700 border-lime-200' },
  OPCR: { label: 'Capital-inv.', color: 'bg-rose-50 text-rose-700 border-rose-200' },
}

const SGO_LIST: SGORow[] = [
  {
    name: 'AFRICA ASSET MANAGEMENT', country: 'Burkina Faso', code: 'BF',
    address: '01 BP 5394 Ouagadougou 01', phone: '+226 50 33 04 90', email: null, website: null, partnerSGI: null,
    funds: [],
  },
  {
    name: 'AFRICABOURSE ASSET MANAGEMENT', country: 'Bénin', code: 'BJ',
    address: 'Av. Mgr Steinmetz 01 BP 6002 Cotonou', phone: null, email: null, website: 'africabourse.com', partnerSGI: 'Africabourse SGI',
    funds: [
      { name: 'FCP AAM EPARGNE CROISSANCE', cat: 'D',    vlCurrent: 12369.60, perfWeek: '+0.70%' },
      { name: 'FCP AAM OBLIGATIS',          cat: 'OATC', vlCurrent: 9384.72,  perfWeek: '+0.04%' },
      { name: 'FCP AAM EPARGNE ACTION',     cat: 'A',    vlCurrent: 11395.08, perfWeek: '+1.02%' },
      { name: 'FCP AAM SERENITIS',          cat: 'OATC', vlCurrent: 12780.64, perfWeek: '+0.12%' },
    ],
  },
  {
    name: 'AFRICAM SA', country: "Côte d'Ivoire", code: 'CI',
    address: 'Abidjan', phone: null, email: null, website: null, partnerSGI: 'SBIF SGI',
    funds: [
      { name: 'FCP EXPANSIO',    cat: 'D',    vlCurrent: null,    perfWeek: null },
      { name: 'FCP SECURITAS',   cat: 'OMLT', vlCurrent: null,    perfWeek: null },
      { name: 'FCP VALORIS',     cat: 'A',    vlCurrent: null,    perfWeek: null },
      { name: 'FCP CAPITAL PLUS',cat: 'D',    vlCurrent: 1599.25, perfWeek: '+0.10%' },
      { name: 'FCP CONFORT PLUS',cat: 'OMLT', vlCurrent: 1510.97, perfWeek: '-0.03%' },
    ],
  },
  {
    name: 'ATLANTIC ASSET MANAGEMENT (AAM)', country: "Côte d'Ivoire", code: 'CI',
    address: 'Abidjan', phone: null, email: null, website: null, partnerSGI: 'Atlantique Finance SGI',
    funds: [
      { name: 'FCP ATLANTIQUE CROISSANCE', cat: 'D',    vlCurrent: null, perfWeek: null },
      { name: 'FCP ATLANTIQUE LIQUIDITE',  cat: 'OCT',  vlCurrent: null, perfWeek: null },
      { name: 'FCP ATLANTIQUE ACTIONS',    cat: 'A',    vlCurrent: null, perfWeek: null },
      { name: 'FCP ATLANTIQUE SERENITE',   cat: 'OMLT', vlCurrent: null, perfWeek: null },
      { name: 'FCP ATLANTIQUE HORIZON',    cat: 'D',    vlCurrent: null, perfWeek: null },
      { name: 'FCP ATLANTIQUE SECURITE',   cat: 'OMLT', vlCurrent: null, perfWeek: null },
    ],
  },
  {
    name: 'ATTIJARI ASSET MANAGEMENT', country: 'Sénégal', code: 'SN',
    address: "Place de l'Indépendance BP 129 Dakar", phone: null, email: null, website: 'attijarigestion.com', partnerSGI: 'Attijari Securities West Africa',
    funds: [
      { name: 'ATTIJARI OBLIG',      cat: 'OMLT', vlCurrent: 14606.36, perfWeek: '+0.03%' },
      { name: 'ATTIJARI LIQUIDITE',  cat: 'OCT',  vlCurrent: 16057.19, perfWeek: '+0.08%' },
      { name: 'ATTIJARI HORIZON',    cat: 'OMLT', vlCurrent: 16941.82, perfWeek: '+0.08%' },
      { name: 'ATTIJARI ACTIONS',    cat: 'A',    vlCurrent: 26657.68, perfWeek: '-0.60%' },
      { name: 'ATTIJARI DIVERSIFIE', cat: 'D',    vlCurrent: 25039.72, perfWeek: '-0.17%' },
      { name: 'ATTIJARI INVEST',     cat: 'OMLT', vlCurrent: 16062.61, perfWeek: '+0.07%' },
      { name: 'ATTIJARI PATRIMOINE', cat: 'OMLT', vlCurrent: 15939.57, perfWeek: '+0.08%' },
      { name: 'CRBC-PROSPERITE',     cat: 'OMLT', vlCurrent: 12437.04, perfWeek: '-0.04%' },
      { name: 'WAFA ASSURANCE UEMOA',cat: 'OMLT', vlCurrent: 11499.70, perfWeek: '+0.09%' },
      { name: 'FCP CRAT PERFORMANCE',cat: 'D',    vlCurrent: 13802.36, perfWeek: '-0.22%' },
    ],
  },
  {
    name: 'BAOBAB ASSET MANAGEMENT (BAM)', country: 'Sénégal', code: 'SN',
    address: 'Dakar', phone: null, email: null, website: null, partnerSGI: 'FGI SGI',
    funds: [
      { name: 'FCP BAM TRESOR', cat: 'OCT', vlCurrent: 11684.63, perfWeek: '+0.04%' },
      { name: 'FCP BAM WURUS',  cat: 'A',   vlCurrent: 16954.39, perfWeek: '+4.00%' },
    ],
  },
  {
    name: 'BNI GESTION', country: "Côte d'Ivoire", code: 'CI',
    address: '01 BP 670 Abidjan 01', phone: '+225 20 31 07 78', email: 'info@bnigestion.net', website: 'bnigestion.net', partnerSGI: 'BNI Finance SGI',
    funds: [
      { name: 'FCP CAPITAL CROISSANCE',       cat: 'D',    vlCurrent: null,     perfWeek: null },
      { name: 'OBLIG SECURITE',               cat: 'OMLT', vlCurrent: null,     perfWeek: null },
      { name: 'FCP DYNAMIC SAVINGS',          cat: 'A',    vlCurrent: null,     perfWeek: null },
      { name: 'FCP INITIATIVES SOLIDARITE',   cat: 'D',    vlCurrent: 6318.00,  perfWeek: '+1.31%' },
      { name: 'FCPE SODEFOR',                 cat: 'D',    vlCurrent: 8506.00,  perfWeek: '-0.42%' },
      { name: 'FCP PAM Actions',              cat: 'A',    vlCurrent: 25316.60, perfWeek: '+1.41%' },
      { name: 'FCP PAM Diversifié Équilibré', cat: 'D',    vlCurrent: 21407.27, perfWeek: '+0.62%' },
      { name: 'FCP PAM Diversifié Obligations',cat:'D',    vlCurrent: 17939.25, perfWeek: '+0.90%' },
      { name: 'FCPE CNRA',                    cat: 'D',    vlCurrent: 4196.00,  perfWeek: '-0.12%' },
      { name: 'FCPE BNI RETRAITE',            cat: 'D',    vlCurrent: 5596.00,  perfWeek: '+3.19%' },
      { name: 'FCP KARIMA ETHIQUE',           cat: 'D',    vlCurrent: 2421.00,  perfWeek: '+0.62%' },
    ],
  },
  {
    name: 'BOA ASSET MANAGEMENT', country: "Côte d'Ivoire", code: 'CI',
    address: '01 BP 4132 Abidjan 01', phone: '+225 20 30 34 01', email: 'information@boaam.com', website: 'bank-of-africa.net', partnerSGI: 'BOA Capital Securities SGI',
    funds: [
      { name: 'FCP Emergence',           cat: 'D',    vlCurrent: null,         perfWeek: null },
      { name: 'FCP Treso Monea',         cat: 'OCT',  vlCurrent: null,         perfWeek: null },
      { name: 'FCP ACTIONS PHARMACIE',   cat: 'D',    vlCurrent: 1286.64,      perfWeek: '+0.28%' },
      { name: 'FCP SALAM CI',            cat: 'D',    vlCurrent: 1247.56,      perfWeek: '-0.02%' },
      { name: 'FCP AL BARAKA 2',         cat: 'D',    vlCurrent: 1347.63,      perfWeek: '+0.16%' },
      { name: 'FCP ASSUR SENEGAL',       cat: 'D',    vlCurrent: 1692341.18,   perfWeek: '+0.86%' },
      { name: 'FCP AVANTAGE AKWABA',     cat: 'D',    vlCurrent: null,         perfWeek: null },
      { name: 'FCP PLACEMENT CROISSANCE',cat: 'A',    vlCurrent: 2036.58,      perfWeek: '+1.11%' },
      { name: 'FCP POSTEFINANCES HORIZON',cat:'D',    vlCurrent: 2713.46,      perfWeek: '+0.71%' },
      { name: 'FCP PLACEMENT QUIETUDE',  cat: 'O',    vlCurrent: 1785.89,      perfWeek: '+0.34%' },
      { name: 'FCP LIQUIDITE-OPTIMUM',   cat: 'D',    vlCurrent: 14179.22,     perfWeek: '+0.25%' },
      { name: 'FCP BNDE VALEURS',        cat: 'D',    vlCurrent: 1506.82,      perfWeek: '+0.55%' },
      { name: 'FCP Global Investors',    cat: 'D',    vlCurrent: 52924.28,     perfWeek: '+3.46%' },
      { name: 'FCP Boa Obligations',     cat: 'OMLT', vlCurrent: 13511.95,     perfWeek: '+0.12%' },
      { name: 'FCP Boa Sécurité',        cat: 'OMLT', vlCurrent: 120368.08,    perfWeek: '+0.32%' },
      { name: 'FCP Boa Actions',         cat: 'A',    vlCurrent: 24015.44,     perfWeek: '+3.25%' },
      { name: 'FCP Boa Rendement',       cat: 'OMLT', vlCurrent: 39684878.02,  perfWeek: '+0.15%' },
    ],
  },
  {
    name: 'BRIDGE ASSET MANAGEMENT', country: "Côte d'Ivoire", code: 'CI',
    address: '33 Av. Gén. De Gaulle, 01 BP 13108 Abidjan', phone: '+225 20 25 97 97', email: null, website: null, partnerSGI: 'Bridge Securities SGI',
    funds: [
      { name: 'FCP BRIDGE EQUILIBRE',             cat: 'D',    vlCurrent: 43701153.33, perfWeek: '+1.28%' },
      { name: 'FCP BRIDGE DIVERSIFIE CROISSANCE',  cat: 'D',    vlCurrent: 9025.56,     perfWeek: '+1.33%' },
      { name: 'FCP BRIDGE OBLIGATIONS',            cat: 'OMLT', vlCurrent: 6861.84,     perfWeek: '+0.07%' },
    ],
  },
  {
    name: 'BRM ASSET MANAGEMENT', country: 'Sénégal', code: 'SN',
    address: 'Imm. La Rotonde, Rue A.A Ndoye, Dakar', phone: '+221 33 823 63 83', email: 'msakho@brmbank.com', website: 'brmbank.com', partnerSGI: null,
    funds: [],
  },
  {
    name: 'CGF GESTION', country: 'Sénégal', code: 'SN',
    address: '12 Rue Dr Thèze, BP 11516 Dakar', phone: null, email: 'cgfbrvm@orange.sn', website: 'cgfgestion.com', partnerSGI: 'CGF Bourse SGI',
    funds: [
      { name: 'FCPCR SONATEL',               cat: 'D',    vlCurrent: 11315.75,      perfWeek: '+2.26%' },
      { name: 'FCPE FORCE PAD',              cat: 'D',    vlCurrent: 2508.02,       perfWeek: '+1.36%' },
      { name: 'FCPE SINI GNESIGUI',          cat: 'D',    vlCurrent: 2169.93,       perfWeek: '+2.32%' },
      { name: 'FCP EXPAT',                   cat: 'D',    vlCurrent: 1366.30,       perfWeek: '+2.34%' },
      { name: 'FCP CAPITAL RETRAITE',        cat: 'D',    vlCurrent: 1319.57,       perfWeek: '+1.20%' },
      { name: 'FCP RENTE PERPETUELLE',       cat: 'D',    vlCurrent: 1308.97,       perfWeek: '+1.70%' },
      { name: 'FCP WALO',                    cat: 'D',    vlCurrent: 1374.22,       perfWeek: '+1.81%' },
      { name: 'FCP DJOLOF',                  cat: 'O',    vlCurrent: 1383.48,       perfWeek: '+0.48%' },
      { name: 'FCP IMPACT DIASPORA',         cat: 'D',    vlCurrent: 1217.16,       perfWeek: '+0.11%' },
      { name: 'FCP IFC-BOAD',               cat: 'O',    vlCurrent: 151560.14,     perfWeek: '+0.20%' },
      { name: 'FCPE DP WORLD DAKAR',         cat: 'D',    vlCurrent: 1673.57,       perfWeek: '+1.56%' },
      { name: 'FCPR SEN FONDS OPCR',         cat: 'OPCR', vlCurrent: 11605.21,      perfWeek: '-0.05%' },
      { name: 'FCP TRANSVIE',                cat: 'D',    vlCurrent: 1226.67,       perfWeek: '+0.91%' },
      { name: 'SICAV Abdou DIOUF',           cat: 'D',    vlCurrent: 17589150.52,   perfWeek: '+0.32%' },
      { name: 'FCP BOAD CAPITAL RETRAITE',   cat: 'OMLT', vlCurrent: 14657.84,      perfWeek: '+0.01%' },
      { name: 'FCP SOAGA EPARGNE OBLIGATIONS',cat:'OMLT', vlCurrent: 6605.90,       perfWeek: '+0.00%' },
      { name: 'FCP SOAGA EPARGNE ACTIONS',   cat: 'A',    vlCurrent: 13190.72,      perfWeek: '+0.85%' },
      { name: 'FCP SOAGA EPARGNE SERENITE',  cat: 'OMLT', vlCurrent: 17226.87,      perfWeek: '+0.00%' },
      { name: 'FCP SOAGA EPARGNE QUIETUDE',  cat: 'OMLT', vlCurrent: 6401.28,       perfWeek: '+0.01%' },
      { name: 'FCP SOAGA EPARGNE DYNAMIQUE', cat: 'A',    vlCurrent: 8448.41,       perfWeek: '+0.85%' },
      { name: 'FCP SOAGA TRESORERIE',        cat: 'M',    vlCurrent: 10482.74,      perfWeek: '+0.01%' },
      { name: 'FCP SOAGA EPARGNE ACTIVE',    cat: 'D',    vlCurrent: 15624.78,      perfWeek: '+0.65%' },
    ],
  },
  {
    name: 'CORIS ASSET MANAGEMENT', country: 'Burkina Faso', code: 'BF',
    address: '01 BP 6585 Ouagadougou 01', phone: '+226 50 33 14 83', email: null, website: null, partnerSGI: 'Coris Bourse SGI',
    funds: [
      { name: 'FCP CORIS ACTIONS',     cat: 'A',   vlCurrent: 11989.47, perfWeek: '+0.90%' },
      { name: 'FCP ASSURANCES',        cat: 'OCT', vlCurrent: 5994.70,  perfWeek: '+0.02%' },
      { name: 'FCP CORIS PERFORMANCE', cat: 'D',   vlCurrent: 11166.18, perfWeek: '+0.77%' },
    ],
  },
  {
    name: 'ECOBANK ASSET MANAGEMENT (EDC/EAM)', country: "Côte d'Ivoire", code: 'CI',
    address: '01 BP 4107 Abidjan 01', phone: '+225 20 21 10 41', email: 'eam@ecobank.com', website: 'ecobank.com', partnerSGI: 'EDC Investment Corporation SGI',
    funds: [
      { name: 'FCP ECOBANK UEMOA DIVERSIFIE',  cat: 'D',    vlCurrent: 10618.00,  perfWeek: '+0.85%' },
      { name: 'FCP ECOBANK UEMOA OBLIGATAIRE', cat: 'OMLT', vlCurrent: 20780.00,  perfWeek: null },
      { name: 'FCP ECOBANK UEMOA RENDEMENT',   cat: 'OMLT', vlCurrent: 2056500.00,perfWeek: '+0.48%' },
      { name: 'FCP ECOBANK ACTIONS UEMOA',     cat: 'A',    vlCurrent: 6294.00,   perfWeek: '+1.40%' },
    ],
  },
  {
    name: 'ENKO CAPITAL WEST AFRICA', country: "Côte d'Ivoire", code: 'CI',
    address: 'Abidjan', phone: null, email: null, website: 'enkocapital.com', partnerSGI: 'EDC Investment Corporation SGI',
    funds: [
      { name: 'FCP GOORGOORLU',           cat: 'OCT',  vlCurrent: null,    perfWeek: null },
      { name: 'FCP SAPHIR DYNAMIQUE',     cat: 'D',    vlCurrent: 7743.25, perfWeek: '+0.28%' },
      { name: 'FCP SAPHIR QUIETUDE',      cat: 'OMLT', vlCurrent: 6697.53, perfWeek: '-0.01%' },
      { name: 'FCP ENKO CAPITAL GARANTI', cat: 'D',    vlCurrent: null,    perfWeek: null },
      { name: 'FCP PATRIMOINE',           cat: 'OMLT', vlCurrent: null,    perfWeek: null },
      { name: 'FCP ENKO CAPITAL OBLIGATIONS',cat:'OMLT',vlCurrent: null,   perfWeek: null },
      { name: 'FCP ENKO CAPITAL LIQUIDITE',cat: 'OMLT',vlCurrent: null,   perfWeek: null },
    ],
  },
  {
    name: 'IMPAXIS ASSET MANAGEMENT', country: 'Sénégal', code: 'SN',
    address: 'Dakar', phone: null, email: null, website: null, partnerSGI: 'Impaxis Securities SGI',
    funds: [
      { name: 'FCP SDE', cat: 'D', vlCurrent: 2706.00, perfWeek: '+0.12%' },
    ],
  },
  {
    name: 'NSIA ASSET MANAGEMENT', country: "Côte d'Ivoire", code: 'CI',
    address: 'Abidjan', phone: '+225 20 33 90 93', email: null, website: null, partnerSGI: 'NSIA Finance SGI',
    funds: [
      { name: 'NSIA FONDS DIVERSIFIE',        cat: 'D',    vlCurrent: null,       perfWeek: null },
      { name: 'AURORE OPPORTUNITES',           cat: 'A',    vlCurrent: null,       perfWeek: null },
      { name: 'AURORE SECURITE',              cat: 'OMLT', vlCurrent: null,       perfWeek: null },
      { name: 'NSIA ASSURANCES OPTIMUM',      cat: 'D',    vlCurrent: null,       perfWeek: null },
      { name: 'AURORE MONETARIS',             cat: 'M',    vlCurrent: null,       perfWeek: null },
      { name: 'TAWFIR HALAL',                 cat: 'D',    vlCurrent: null,       perfWeek: null },
      { name: 'AURORE SECURITE II',           cat: 'OMLT', vlCurrent: null,       perfWeek: null },
      { name: 'AURORE OBLIGATIONS SOUVERAINES',cat:'OMLT', vlCurrent: null,       perfWeek: null },
      { name: 'OBLIGATIONS PREMIUM',          cat: 'OMLT', vlCurrent: null,       perfWeek: null },
      { name: 'EVOLUTIS',                     cat: 'D',    vlCurrent: 6912.06,    perfWeek: '+3.30%' },
      { name: 'FCP BAM TRESOR',               cat: 'OCT',  vlCurrent: 11684.63,   perfWeek: '+0.04%' },
      { name: 'FCP BAM WURUS',                cat: 'A',    vlCurrent: 16954.39,   perfWeek: '+4.00%' },
    ],
  },
  {
    name: 'OPTI ASSET MANAGEMENT', country: 'Togo', code: 'TG',
    address: 'Imm. UTB Grand Marché, 3è Ét., Lomé', phone: '+228 22 10 53 00', email: 'gassigbi@yahoo.fr', website: null, partnerSGI: 'OAM SGI Togo',
    funds: [
      { name: 'FCP-1 OPTI PLACEMENT', cat: 'A',    vlCurrent: null, perfWeek: null },
      { name: 'FCP-2 OPTI REVENU',    cat: 'OMLT', vlCurrent: null, perfWeek: null },
      { name: 'FCP-3 OPTI CAPITAL',   cat: 'D',    vlCurrent: null, perfWeek: null },
    ],
  },
  {
    name: 'PHOENIXAFRICA ASSET MANAGEMENT', country: "Côte d'Ivoire", code: 'CI',
    address: '10è Ét. Tour BIAO, Abidjan Plateau', phone: '+225 20 37 28 04', email: null, website: 'phoenixafricaholding.com', partnerSGI: 'Phoenix Capital Management SGI',
    funds: [
      { name: 'FCP GLOBAL INVESTORS', cat: 'D', vlCurrent: 52924.28, perfWeek: '+3.46%' },
    ],
  },
  {
    name: 'SAPHIR ASSET MANAGEMENT', country: 'Bénin', code: 'BJ',
    address: 'Cotonou', phone: null, email: null, website: null, partnerSGI: 'SGI Bénin / AGI',
    funds: [
      { name: 'FCP SAPHIR DYNAMIQUE', cat: 'D',    vlCurrent: 7743.25, perfWeek: '+0.28%' },
      { name: 'FCP SAPHIR QUIETUDE',  cat: 'OMLT', vlCurrent: 6697.53, perfWeek: '-0.01%' },
    ],
  },
  {
    name: 'SGA2E', country: "Côte d'Ivoire", code: 'CI',
    address: 'Bd de Marseille, Imm. DEMO, Abidjan', phone: '+225 21 23 30 06', email: null, website: null, partnerSGI: null,
    funds: [],
  },
  {
    name: 'SGO MALI FINANCE (SMF)', country: 'Mali', code: 'ML',
    address: 'BP E 2477 Bamako', phone: '+223 20 29 29 75', email: null, website: null, partnerSGI: 'SGI Mali',
    funds: [
      { name: 'FCP NYESIGUI',    cat: 'D',    vlCurrent: null,      perfWeek: null },
      { name: 'FCPE ORANGE MALI',cat: 'D',    vlCurrent: 38904.09,  perfWeek: '+1.13%' },
      { name: 'FCP TOUNKARANKE', cat: 'OMLT', vlCurrent: 132002.88, perfWeek: '+0.91%' },
    ],
  },
  {
    name: 'SOAGA', country: 'Bénin', code: 'BJ',
    address: 'Av. Jean Paul II, 08 BP 960 Cotonou', phone: '+229 21 31 88 15', email: 'info@soaga.org', website: 'soaga.org', partnerSGI: 'BOA Capital Securities / AGI',
    funds: [
      { name: 'NSIA FONDS DIVERSIFIE', cat: 'D', vlCurrent: null, perfWeek: null },
    ],
  },
  {
    name: 'SOGESPAR', country: "Côte d'Ivoire", code: 'CI',
    address: '01 BP 1355 Abidjan 01', phone: '+225 20 20 14 89', email: 'niamien.kouadio@socgen.com', website: null, partnerSGI: 'Sogebourse SGI (filiale SG)',
    funds: [
      { name: 'FCP SOGEAVENIR',   cat: 'D',    vlCurrent: null, perfWeek: null },
      { name: 'FCP SOGEDEFI',     cat: 'D',    vlCurrent: null, perfWeek: null },
      { name: 'FCP SOGEDYNAMIQUE',cat: 'A',    vlCurrent: null, perfWeek: null },
      { name: 'FCP SOGELIQUID',   cat: 'M',    vlCurrent: null, perfWeek: null },
      { name: 'FCP SOGEPRIVILEGE',cat: 'D',    vlCurrent: null, perfWeek: null },
      { name: 'FCP SOGESECURITE', cat: 'OMLT', vlCurrent: null, perfWeek: null },
      { name: 'FCP SOGEVALOR',    cat: 'A',    vlCurrent: null, perfWeek: null },
    ],
  },
  {
    name: 'UCAMWAL (United Capital AM)', country: "Côte d'Ivoire", code: 'CI',
    address: 'Abidjan', phone: null, email: null, website: null, partnerSGI: 'UBA CI SGI',
    funds: [
      { name: 'United Capital Sapphire', cat: 'D',    vlCurrent: 5487.00,    perfWeek: '+0.46%' },
      { name: 'United Capital Diamond',  cat: 'OMLT', vlCurrent: 110066.42,  perfWeek: '+0.00%' },
    ],
  },
  {
    name: 'WAFI CAPITAL S.A.', country: 'Bénin', code: 'BJ',
    address: 'Cotonou', phone: null, email: null, website: null, partnerSGI: 'AGI Bénin SGI',
    funds: [
      { name: 'SICAV WAFI CAPITAL', cat: 'D', vlCurrent: null, perfWeek: null },
    ],
  },
]

const SGO_COUNTRIES = Array.from(
  new Map(SGO_LIST.map((s) => [s.code, { code: s.code, country: s.country }])).values()
)

const COUNTRIES = Array.from(
  new Map(SGI_LIST.map((s) => [s.code, { code: s.code, country: s.country }])).values()
)

// ─── ConditionBadge ───────────────────────────────────────────────────────────
function ConditionBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-xs text-brvm-muted/50 italic">Inconnu</span>
  if (value.toLowerCase() === 'gratuit') {
    return <span className="bg-brvm-green/10 text-brvm-green px-1.5 py-0.5 rounded-md text-xs font-semibold">Gratuit</span>
  }
  return <span className="text-xs font-medium text-brvm-text">{value}</span>
}

// ─── PhoneInput shared component ──────────────────────────────────────────────
function PhoneInput({
  dialCode, phone, onDialChange, onPhoneChange,
}: {
  dialCode: string; phone: string
  onDialChange: (v: string) => void; onPhoneChange: (v: string) => void
}) {
  const selectedCountry = UEMOA_COUNTRIES.find((c) => c.dial === dialCode) ?? UEMOA_COUNTRIES[0]
  return (
    <div className="flex items-stretch border border-brvm-border rounded-lg overflow-hidden focus-within:border-brvm-green focus-within:ring-2 focus-within:ring-brvm-green/10 bg-white">
      <div className="relative flex-shrink-0">
        <select
          value={dialCode}
          onChange={(e) => onDialChange(e.target.value)}
          className="appearance-none h-full pl-2 pr-6 bg-slate-50 border-r border-brvm-border text-xs text-brvm-text focus:outline-none cursor-pointer"
        >
          {UEMOA_COUNTRIES.map((c) => (
            <option key={c.code} value={c.dial}>{c.dial} {c.country}</option>
          ))}
        </select>
        {/* Flag overlay */}
        <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <FlagImg code={selectedCountry.code} country={selectedCountry.country} />
          <span className="text-xs text-brvm-subtext font-mono">{dialCode}</span>
        </div>
        {/* Extra space for flag overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ width: '72px' }} />
      </div>
      <input
        type="tel"
        placeholder="XX XX XX XX"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        className="flex-1 px-3 py-2 text-sm text-brvm-text placeholder:text-brvm-muted focus:outline-none bg-white min-w-0"
      />
    </div>
  )
}

// ─── ReviewsModal ─────────────────────────────────────────────────────────────
function ReviewsModal({
  sgiName, reviews, onClose, onAdd,
}: {
  sgiName: string; reviews: Review[]
  onClose: () => void; onAdd: (r: Omit<Review, 'id' | 'date'>) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [type, setType]         = useState<ReviewType>('avis')
  const [dialCode, setDialCode] = useState('+225')
  const [phone, setPhone]       = useState('')
  const [text, setText]         = useState('')
  const [done, setDone]         = useState(false)

  const sgiReviews = reviews.filter((r) => r.sgiName === sgiName)

  const handleSubmit = () => {
    if (!text.trim() || !phone.trim()) return
    onAdd({ sgiName, type, dialCode, phone: phone.trim(), text: text.trim() })
    setPhone(''); setText(''); setShowForm(false); setDone(true)
    setTimeout(() => setDone(false), 3000)
  }

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brvm-border flex-shrink-0">
          <div>
            <h2 className="font-semibold text-brvm-text text-base leading-tight">{sgiName}</h2>
            <p className="text-xs text-brvm-muted mt-0.5">
              {sgiReviews.length} contribution{sgiReviews.length !== 1 ? 's' : ''} · communauté Afrivest
            </p>
          </div>
          <button onClick={onClose} className="text-brvm-muted hover:text-brvm-text transition-colors p-1.5 rounded-lg hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {done && (
          <div className="mx-5 mt-4 flex items-center gap-2 bg-brvm-green/10 text-brvm-green text-sm rounded-lg px-4 py-2.5 flex-shrink-0">
            <CheckCircle size={15} /> Merci pour votre contribution !
          </div>
        )}

        {/* Reviews */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          {sgiReviews.length === 0 && !showForm && (
            <div className="text-center py-10 text-brvm-muted">
              <MessageSquare size={28} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Aucune contribution pour cette SGI.</p>
              <p className="text-xs mt-1 opacity-70">Soyez le premier à partager une information !</p>
            </div>
          )}
          {sgiReviews.map((r) => (
            <div key={r.id} className="bg-slate-50 rounded-xl p-4 border border-brvm-border">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_CONFIG[r.type].color}`}>
                    {TYPE_CONFIG[r.type].icon} {TYPE_CONFIG[r.type].label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <FlagImg code={DIAL_TO_CODE[r.dialCode] ?? 'ci'} country="" />
                    <span className="text-xs font-mono text-brvm-subtext">{r.dialCode} {r.phone}</span>
                  </div>
                </div>
                <span className="text-xs text-brvm-muted flex-shrink-0">{r.date}</span>
              </div>
              <p className="text-sm text-brvm-text leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        {showForm ? (
          <div className="border-t border-brvm-border px-5 py-4 flex-shrink-0 space-y-3 bg-slate-50/50">
            <div className="flex gap-1.5">
              {(Object.keys(TYPE_CONFIG) as ReviewType[]).map((t) => (
                <button key={t} onClick={() => setType(t)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    type === t ? TYPE_CONFIG[t].color : 'bg-white border-brvm-border text-brvm-muted hover:text-brvm-subtext'
                  }`}>
                  {TYPE_CONFIG[t].icon} {TYPE_CONFIG[t].label}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs font-medium text-brvm-subtext mb-1.5 block">Numéro de téléphone *</label>
              <PhoneInput dialCode={dialCode} phone={phone} onDialChange={setDialCode} onPhoneChange={setPhone} />
            </div>
            <textarea rows={3} placeholder="Votre information, avis ou correction…"
              value={text} onChange={(e) => setText(e.target.value)}
              className="w-full border border-brvm-border rounded-lg px-3 py-2 text-sm text-brvm-text placeholder:text-brvm-muted focus:outline-none focus:border-brvm-green focus:ring-2 focus:ring-brvm-green/10 bg-white resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => { setShowForm(false); setText(''); setPhone('') }}
                className="flex-1 py-2 rounded-lg border border-brvm-border text-brvm-muted hover:text-brvm-text text-sm transition-colors">
                Annuler
              </button>
              <button onClick={handleSubmit} disabled={!text.trim() || !phone.trim()}
                className="flex-1 py-2 rounded-lg bg-brvm-green text-white text-sm font-medium disabled:opacity-40 hover:bg-brvm-green/90 transition-colors flex items-center justify-center gap-1.5">
                <Send size={13} /> Envoyer
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-brvm-border px-5 py-3 flex-shrink-0">
            <button onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-brvm-border text-brvm-muted hover:border-brvm-green hover:text-brvm-green transition-colors text-sm font-medium">
              <Plus size={14} /> Ajouter une contribution
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── FABWidget — floating bottom-right ───────────────────────────────────────
function FABWidget({ onAdd }: { onAdd: (r: Omit<Review, 'id' | 'date'>) => void }) {
  const [isOpen, setIsOpen]         = useState(false)
  const [selectedSGI, setSelectedSGI] = useState('')
  const [type, setType]             = useState<ReviewType>('info')
  const [dialCode, setDialCode]     = useState('+225')
  const [phone, setPhone]           = useState('')
  const [text, setText]             = useState('')
  const [done, setDone]             = useState(false)
  const panelRef                    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    if (isOpen) document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [isOpen])

  const handleSubmit = () => {
    if (!text.trim() || !selectedSGI || !phone.trim()) return
    onAdd({ sgiName: selectedSGI, type, dialCode, phone: phone.trim(), text: text.trim() })
    setText(''); setPhone(''); setSelectedSGI(''); setDone(true)
    setTimeout(() => { setDone(false); setIsOpen(false) }, 2500)
  }

  return (
    <div ref={panelRef} className="fixed bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end gap-3">
      {/* Panel */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-brvm-border w-[320px] sm:w-[360px] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-brvm-green to-emerald-500">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <MessageSquare size={14} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-none">Contribuer</p>
                <p className="text-white/70 text-xs mt-0.5">Partagez une info sur une SGI</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
              <X size={15} />
            </button>
          </div>

          {done ? (
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
              <CheckCircle size={44} className="text-brvm-green mb-3" />
              <p className="font-semibold text-brvm-text">Merci pour votre contribution !</p>
              <p className="text-xs text-brvm-muted mt-1">Votre avis aide la communauté Afrivest.</p>
            </div>
          ) : (
            <div className="p-4 space-y-3.5">
              {/* SGI selector */}
              <div>
                <label className="text-xs font-semibold text-brvm-subtext mb-1.5 block uppercase tracking-wide">SGI concernée *</label>
                <select value={selectedSGI} onChange={(e) => setSelectedSGI(e.target.value)}
                  className="w-full border border-brvm-border rounded-lg px-3 py-2 text-sm text-brvm-text bg-white focus:outline-none focus:border-brvm-green focus:ring-2 focus:ring-brvm-green/10">
                  <option value="">— Choisir une SGI —</option>
                  {SGI_LIST.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="text-xs font-semibold text-brvm-subtext mb-1.5 block uppercase tracking-wide">Type</label>
                <div className="flex gap-1.5">
                  {(Object.keys(TYPE_CONFIG) as ReviewType[]).map((t) => (
                    <button key={t} onClick={() => setType(t)}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        type === t ? TYPE_CONFIG[t].color : 'bg-white border-brvm-border text-brvm-muted hover:text-brvm-subtext'
                      }`}>
                      {TYPE_CONFIG[t].icon}
                      <span className="hidden sm:inline">{TYPE_CONFIG[t].label}</span>
                      <span className="sm:hidden">{t === 'info' ? 'Info' : t === 'avis' ? 'Avis' : 'Corr.'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-semibold text-brvm-subtext mb-1.5 block uppercase tracking-wide">Numéro de téléphone *</label>
                <PhoneInput dialCode={dialCode} phone={phone} onDialChange={setDialCode} onPhoneChange={setPhone} />
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-semibold text-brvm-subtext mb-1.5 block uppercase tracking-wide">Message *</label>
                <textarea rows={3} placeholder="Informations utiles, avis, expérience client…"
                  value={text} onChange={(e) => setText(e.target.value)}
                  className="w-full border border-brvm-border rounded-lg px-3 py-2 text-sm text-brvm-text placeholder:text-brvm-muted focus:outline-none focus:border-brvm-green focus:ring-2 focus:ring-brvm-green/10 resize-none bg-white"
                />
              </div>

              <button onClick={handleSubmit} disabled={!text.trim() || !selectedSGI || !phone.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brvm-green text-white text-sm font-semibold disabled:opacity-40 hover:bg-brvm-green/90 transition-colors shadow-sm">
                <Send size={13} /> Envoyer ma contribution
              </button>
            </div>
          )}
        </div>
      )}

      {/* FAB button */}
      <button onClick={() => setIsOpen((v) => !v)}
        className={`flex items-center gap-2.5 pl-4 pr-5 py-3 rounded-2xl shadow-xl text-sm font-semibold transition-all duration-200 ${
          isOpen
            ? 'bg-slate-700 text-white shadow-lg'
            : 'bg-brvm-green text-white hover:bg-brvm-green/90 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0'
        }`}>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isOpen ? 'bg-white/15' : 'bg-white/20'}`}>
          {isOpen ? <X size={14} /> : <MessageSquare size={14} />}
        </div>
        <span>{isOpen ? 'Fermer' : 'Contribuer'}</span>
      </button>
    </div>
  )
}

// ─── SGOCard ──────────────────────────────────────────────────────────────────
function SGOCard({ sgo }: { sgo: SGORow }) {
  const [expanded, setExpanded] = useState(false)

  const catBreakdown = sgo.funds.reduce((acc, f) => {
    acc[f.cat] = (acc[f.cat] ?? 0) + 1
    return acc
  }, {} as Partial<Record<FundCategory, number>>)

  const formatVL = (v: number) => {
    if (v >= 1_000_000) return (v / 1_000_000).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' M'
    return v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div className="bg-white border border-brvm-border rounded-xl overflow-hidden shadow-sm flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <div className="flex-shrink-0 mt-0.5">
              <FlagImg code={sgo.code} country={sgo.country} />
            </div>
            <h3 className="font-semibold text-brvm-text text-sm leading-tight">{sgo.name}</h3>
          </div>
          {sgo.website && (
            <a
              href={`https://${sgo.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-brvm-green hover:underline"
            >
              <Globe size={11} /> Site
            </a>
          )}
        </div>

        {/* Country + address */}
        <p className="text-xs text-brvm-muted mt-1.5 leading-relaxed">
          {sgo.country}{sgo.address ? ` · ${sgo.address}` : ''}
        </p>

        {/* Contact */}
        {(sgo.phone || sgo.email) && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {sgo.phone && (
              <span className="text-xs text-brvm-subtext flex items-center gap-1">
                <Phone size={10} className="text-brvm-muted" /> {sgo.phone}
              </span>
            )}
            {sgo.email && (
              <a href={`mailto:${sgo.email}`} className="text-xs text-brvm-green hover:underline truncate">
                {sgo.email}
              </a>
            )}
          </div>
        )}

        {/* Partner SGI */}
        {sgo.partnerSGI && (
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-brvm-muted">SGI dépositaire :</span>
            <span className="text-xs bg-slate-100 text-brvm-subtext px-2 py-0.5 rounded-full font-medium">{sgo.partnerSGI}</span>
          </div>
        )}

        {/* Fund category badges */}
        <div className="mt-3 flex flex-wrap gap-1.5 items-center">
          {sgo.funds.length === 0 ? (
            <span className="text-xs text-brvm-muted italic">Aucun fonds publié au bulletin BOC</span>
          ) : (
            <>
              <span className="text-xs text-brvm-muted font-medium">{sgo.funds.length} fonds :</span>
              {Object.entries(catBreakdown).map(([cat, count]) => (
                <span
                  key={cat}
                  className={`text-xs px-1.5 py-0.5 rounded border font-medium ${CAT_CONFIG[cat as FundCategory]?.color ?? ''}`}
                >
                  {count} {CAT_CONFIG[cat as FundCategory]?.label ?? cat}
                </span>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Expand button */}
      {sgo.funds.length > 0 && (
        <>
          <div className="border-t border-brvm-border">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-2 text-xs text-brvm-muted hover:text-brvm-green hover:bg-slate-50 transition-colors"
            >
              <span>{expanded ? 'Masquer les fonds' : `Voir les ${sgo.funds.length} fonds`}</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {expanded && (
            <div className="border-t border-brvm-border overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-brvm-border">
                    <th className="text-left px-4 py-2 text-brvm-muted text-xs font-semibold">Fonds</th>
                    <th className="text-left px-2 py-2 text-brvm-muted text-xs font-semibold">Cat.</th>
                    <th className="text-right px-4 py-2 text-brvm-muted text-xs font-semibold">VL actuelle</th>
                    <th className="text-right px-4 py-2 text-brvm-muted text-xs font-semibold hidden sm:table-cell">Perf. sem.</th>
                  </tr>
                </thead>
                <tbody>
                  {sgo.funds.map((f, i) => (
                    <tr key={i} className="border-b border-brvm-border last:border-0 hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-2 text-xs font-medium text-brvm-text">{f.name}</td>
                      <td className="px-2 py-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${CAT_CONFIG[f.cat]?.color ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          {f.cat}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-xs font-mono text-brvm-subtext">
                        {f.vlCurrent != null
                          ? formatVL(f.vlCurrent)
                          : <span className="text-brvm-muted italic">ND</span>}
                      </td>
                      <td className="px-4 py-2 text-right text-xs font-medium hidden sm:table-cell">
                        {f.perfWeek
                          ? <span className={f.perfWeek.startsWith('-') ? 'text-red-500' : 'text-brvm-green'}>{f.perfWeek}</span>
                          : <span className="text-brvm-muted">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AssetManagers() {
  const [activeTab, setActiveTab]         = useState<'SGI' | 'SGO'>('SGI')
  const [search, setSearch]               = useState('')
  const [countryFilter, setCountryFilter] = useState<string>('all')
  const [sgoCountryFilter, setSgoCountryFilter] = useState<string>('all')
  const [reviews, setReviews]             = useState<Review[]>(INITIAL_REVIEWS)
  const [reviewModal, setReviewModal]     = useState<string | null>(null)
  const [sgiList, setSgiList] = useState<typeof SGI_LIST>(SGI_LIST)
  const [sgoList, setSgoList] = useState<typeof SGO_LIST>(SGO_LIST)
  const [apiLoaded, setApiLoaded] = useState(false)

  useEffect(() => {
    Promise.all([assetManagersApi.getSGIs(), assetManagersApi.getSGOs()])
      .then(([sgis, sgos]) => {
        if (sgis.length > 0) {
          setSgiList(sgis.map(s => ({
            name: s.name, phone: s.phone ?? '', country: s.country, code: s.country_code,
            minDeposit: s.min_deposit, openingFees: s.opening_fees, website: s.website,
          })))
        }
        if (sgos.length > 0) {
          setSgoList(sgos.map(s => ({
            name: s.name, country: s.country, code: s.country_code,
            address: s.address, phone: s.phone, email: s.email,
            website: s.website, partnerSGI: s.partner_sgi,
            funds: s.funds.map(f => ({ name: f.name, cat: f.cat as any, vlCurrent: f.vlCurrent, perfWeek: f.perfWeek })),
          })))
        }
        setApiLoaded(true)
      })
      .catch(() => {
        // Fallback silencieux sur les données hardcoded
        setApiLoaded(true)
      })
  }, [])

  const addReview = (r: Omit<Review, 'id' | 'date'>) => {
    const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    setReviews((prev) => [...prev, { ...r, id: Date.now().toString(), date }])
  }

  const filteredSGI = useMemo(() => {
    const q = search.toLowerCase()
    return sgiList.filter((s) =>
      (countryFilter === 'all' || s.code === countryFilter) &&
      (!q || s.name.toLowerCase().includes(q) || s.country.toLowerCase().includes(q))
    )
  }, [search, countryFilter, sgiList])

  const filteredSGO = useMemo(() => {
    const q = search.toLowerCase()
    return sgoList.filter((s) =>
      (sgoCountryFilter === 'all' || s.code === sgoCountryFilter) &&
      (!q || s.name.toLowerCase().includes(q) || s.country.toLowerCase().includes(q))
    )
  }, [search, sgoCountryFilter, sgoList])

  const clearFilters = () => { setSearch(''); setCountryFilter('all'); setSgoCountryFilter('all') }
  const hasFilters = search !== '' || countryFilter !== 'all'

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brvm-text">Intervenants de marché</h1>
          <p className="text-brvm-subtext text-sm mt-1">SGI et SGO agréées par l'AMF-UEMOA · marché financier régional UEMOA</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-brvm-muted bg-slate-50 border border-brvm-border rounded-lg px-3 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-brvm-green" />
          {sgiList.length} SGI · {sgoList.length} SGO · 7 pays
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1 w-fit">
        {(['SGI', 'SGO'] as const).map((tab) => (
          <button key={tab} onClick={() => { setActiveTab(tab); clearFilters() }}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === tab ? 'bg-white text-brvm-text shadow-sm' : 'text-brvm-muted hover:text-brvm-subtext'
            }`}>
            {tab === 'SGI' ? `SGI — Courtiers · ${sgiList.length}` : `SGO — Gestionnaires · ${sgoList.length}`}
          </button>
        ))}
      </div>

      {/* ── SGI TAB ─────────────────────────────────────────────────────────── */}
      {activeTab === 'SGI' && (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="relative sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brvm-muted" />
              <input type="text" placeholder="Rechercher une SGI…" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-brvm-border rounded-lg pl-9 pr-4 py-2.5 text-brvm-text placeholder:text-brvm-muted text-sm focus:outline-none focus:border-brvm-green focus:ring-2 focus:ring-brvm-green/10 transition" />
            </div>
            <div className="flex flex-wrap gap-1.5 items-center">
              <button onClick={() => setCountryFilter('all')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                  countryFilter === 'all' ? 'bg-brvm-text text-white border-brvm-text' : 'bg-white text-brvm-subtext border-brvm-border hover:border-brvm-text/30 hover:text-brvm-text'
                }`}>Tous</button>
              {COUNTRIES.map((c) => {
                const count = sgiList.filter((s) => s.code === c.code).length
                return (
                  <button key={c.code} onClick={() => setCountryFilter(countryFilter === c.code ? 'all' : c.code)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                      countryFilter === c.code ? 'bg-brvm-green text-white border-brvm-green' : 'bg-white text-brvm-subtext border-brvm-border hover:border-brvm-green/40 hover:text-brvm-text'
                    }`}>
                    <FlagImg code={c.code} country={c.country} />
                    <span>{c.country.split(' ')[0]}</span>
                    <span className={`font-mono ${countryFilter === c.code ? 'text-white/80' : 'text-brvm-muted'}`}>{count}</span>
                  </button>
                )
              })}
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-brvm-muted hover:text-brvm-text transition-colors">
                <X size={13} /> Réinitialiser
              </button>
            )}
          </div>

          <p className="text-brvm-muted text-xs">
            {filteredSGI.length} société{filteredSGI.length !== 1 ? 's' : ''}
            {hasFilters && ` · filtré${filteredSGI.length !== 1 ? 's' : ''}`}
          </p>

          {filteredSGI.length === 0 ? (
            <div className="text-center py-16 text-brvm-muted">
              <Search size={28} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucune SGI trouvée</p>
              <button onClick={clearFilters} className="mt-2 text-xs text-brvm-green hover:underline">Réinitialiser</button>
            </div>
          ) : (
            <div className="bg-white border border-brvm-border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-brvm-border">
                    <th className="text-left px-5 py-3 text-brvm-muted text-xs font-semibold uppercase tracking-wider">Société</th>
                    <th className="text-left px-5 py-3 text-brvm-muted text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">Pays</th>
                    <th className="text-left px-4 py-3 text-brvm-muted text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">Dépôt min.</th>
                    <th className="text-left px-4 py-3 text-brvm-muted text-xs font-semibold uppercase tracking-wider hidden lg:table-cell">Frais d'ouv.</th>
                    <th className="text-left px-4 py-3 text-brvm-muted text-xs font-semibold uppercase tracking-wider hidden md:table-cell">Téléphone</th>
                    <th className="px-4 py-3 text-brvm-muted text-xs font-semibold uppercase tracking-wider text-right">{/* actions */}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSGI.map((firm, i) => {
                    const reviewCount = reviews.filter((r) => r.sgiName === firm.name).length
                    return (
                      <tr key={`${firm.code}-${i}`} className="border-b border-brvm-border last:border-0 hover:bg-slate-50/70 transition-colors group">
                        {/* Nom */}
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-brvm-text text-sm leading-snug">{firm.name}</p>
                          <p className="sm:hidden text-brvm-muted text-xs mt-0.5 flex items-center gap-1.5">
                            <FlagImg code={firm.code} country={firm.country} /> {firm.country}
                          </p>
                          {/* Amounts on mobile */}
                          {(firm.minDeposit || firm.openingFees) && (
                            <div className="lg:hidden flex flex-wrap gap-2 mt-1.5">
                              {firm.minDeposit && (
                                <span className="inline-flex items-center gap-1 text-xs text-brvm-muted">
                                  Min. <ConditionBadge value={firm.minDeposit} />
                                </span>
                              )}
                              {firm.openingFees && (
                                <span className="inline-flex items-center gap-1 text-xs text-brvm-muted">
                                  Ouv. <ConditionBadge value={firm.openingFees} />
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Pays */}
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <FlagImg code={firm.code} country={firm.country} />
                            <span className="text-brvm-subtext text-sm">{firm.country}</span>
                          </div>
                        </td>

                        {/* Dépôt */}
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <ConditionBadge value={firm.minDeposit} />
                        </td>

                        {/* Frais */}
                        <td className="px-4 py-3.5 hidden lg:table-cell">
                          <ConditionBadge value={firm.openingFees} />
                        </td>

                        {/* Téléphone */}
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <span className="font-mono text-brvm-subtext text-xs">{firm.phone}</span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            {/* Reviews button */}
                            <button
                              onClick={() => setReviewModal(firm.name)}
                              title="Voir les avis"
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                reviewCount > 0
                                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                  : 'bg-slate-100 border-slate-200 text-brvm-muted hover:bg-brvm-green/10 hover:border-brvm-green/30 hover:text-brvm-green'
                              }`}>
                              <MessageSquare size={13} />
                              <span>{reviewCount}</span>
                            </button>

                            {/* Site */}
                            {firm.website ? (
                              <a href={firm.website} target="_blank" rel="noopener noreferrer" title="Site web"
                                className="text-brvm-muted hover:text-brvm-green transition-colors" onClick={(e) => e.stopPropagation()}>
                                <Globe size={14} />
                              </a>
                            ) : (
                              <span title="Site non renseigné" className="text-brvm-muted/25 cursor-default"><Globe size={14} /></span>
                            )}

                            {/* Appeler — mobile only */}
                            <a href={`tel:${firm.phone.replace(/\s/g, '')}`}
                              className="md:hidden inline-flex items-center gap-1.5 bg-brvm-green/10 text-brvm-green hover:bg-brvm-green hover:text-white transition-colors rounded-lg px-2.5 py-1.5 text-xs font-medium"
                              onClick={(e) => e.stopPropagation()}>
                              <Phone size={12} /> Appeler
                            </a>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-brvm-muted text-xs pb-20">
            Source : AMF-UEMOA ·{' '}
            <a href="https://www.amf-uemoa.org" target="_blank" rel="noopener noreferrer" className="text-brvm-green hover:underline">amf-uemoa.org</a>
          </p>
        </>
      )}

      {/* ── SGO TAB ─────────────────────────────────────────────────────────── */}
      {activeTab === 'SGO' && (
        <>
          {/* Search + country filter */}
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="relative sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brvm-muted" />
              <input type="text" placeholder="Rechercher une SGO…" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-brvm-border rounded-lg pl-9 pr-4 py-2.5 text-brvm-text placeholder:text-brvm-muted text-sm focus:outline-none focus:border-brvm-green focus:ring-2 focus:ring-brvm-green/10 transition" />
            </div>
            <div className="flex flex-wrap gap-1.5 items-center">
              <button onClick={() => setSgoCountryFilter('all')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors border ${sgoCountryFilter === 'all' ? 'bg-brvm-text text-white border-brvm-text' : 'bg-white text-brvm-subtext border-brvm-border hover:border-brvm-text/30 hover:text-brvm-text'}`}>
                Tous
              </button>
              {SGO_COUNTRIES.map((c) => {
                const count = sgoList.filter((s) => s.code === c.code).length
                return (
                  <button key={c.code} onClick={() => setSgoCountryFilter(sgoCountryFilter === c.code ? 'all' : c.code)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors border ${sgoCountryFilter === c.code ? 'bg-brvm-green text-white border-brvm-green' : 'bg-white text-brvm-subtext border-brvm-border hover:border-brvm-green/40 hover:text-brvm-text'}`}>
                    <FlagImg code={c.code} country={c.country} />
                    <span>{c.country.split(' ')[0]}</span>
                    <span className={`font-mono ${sgoCountryFilter === c.code ? 'text-white/80' : 'text-brvm-muted'}`}>{count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <p className="text-brvm-muted text-xs">
            {filteredSGO.length} société{filteredSGO.length !== 1 ? 's' : ''} de gestion
            {' · '}{sgoList.reduce((sum, s) => sum + s.funds.length, 0)} fonds OPCVM recensés
          </p>

          {filteredSGO.length === 0 ? (
            <div className="text-center py-16 text-brvm-muted">
              <Search size={28} className="mx-auto mb-3 opacity-30" /><p className="text-sm">Aucune SGO trouvée</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredSGO.map((sgo) => <SGOCard key={sgo.name} sgo={sgo} />)}
            </div>
          )}

          <p className="text-brvm-muted text-xs pb-20">
            Sources : AMF-UEMOA · UMOA-Titres · Bulletin BOC N°41 du 27/02/2026 ·{' '}
            <a href="https://www.amf-uemoa.org" target="_blank" rel="noopener noreferrer" className="text-brvm-green hover:underline">amf-uemoa.org</a>
          </p>
        </>
      )}

      {/* Reviews modal */}
      {reviewModal && (
        <ReviewsModal sgiName={reviewModal} reviews={reviews} onClose={() => setReviewModal(null)} onAdd={addReview} />
      )}

      {/* FAB */}
      <FABWidget onAdd={addReview} />
    </div>
  )
}
