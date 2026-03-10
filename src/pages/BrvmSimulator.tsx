import { useState, useEffect } from 'react'
import {
  Plus, Minus, Star, Search, Bell, HelpCircle, Monitor, BookOpen,
  Briefcase, Clock, FileText, ChevronDown, X, Save, RotateCcw,
  FileBarChart, User, Check, AlertTriangle, ShieldCheck, Lock,
  Eye, EyeOff, TrendingUp, BarChart3, LogOut, Menu as MenuIcon,
} from 'lucide-react'

/* ─── Types ─── */
interface Stock {
  mne: string; nom: string; ref: number | null; dern: number | null
  var: number | null; qteE: number | null; heure: string; qteA: number | null
  achat: number | null; vente: number | null; qteV: number | null
  qto: number | null; cto: number | null; ouv: number | null; statut: string
  clot: number | null; qteT: number; volume: number; cmp: number | null
  haut: number | null; bas: number | null
}
interface TickerItem { mne: string; time: string; qty: number; price: number; var: number }
interface CarnetEntry { num: number; qteA: number; achat: number; vente: number | null; qteV: number | null }
interface PortfolioRaw { mne: string; label: string; stock: number; reserve: number; cmp: number; veille: number }
interface PortfolioBuilt extends PortfolioRaw {
  cours: number; varPct: number; coutCumule: number; valorisation: number
  plusValue: number; plusValuePct: number
}

/* ─── Data ─── */
const STOCKS: Stock[] = [
  { mne:'ONTBF', nom:'ONATEL BURKINA FASO', ref:2700, dern:2700, var:1.89, qteE:5, heure:'14:29:26', qteA:302, achat:2700, vente:2710, qteV:664, qto:5, cto:2700, ouv:2525, statut:'Non Dispo.', clot:2700, qteT:10528, volume:27852290, cmp:2645, haut:2700, bas:2525 },
  { mne:'BOABF', nom:'BANK OF AFRICA BURKINA', ref:4720, dern:4650, var:-1.9, qteE:19, heure:'14:29:26', qteA:1, achat:4650, vente:4715, qteV:50, qto:45, cto:4650, ouv:4645, statut:'Non Dispo.', clot:4650, qteT:6408, volume:30143240, cmp:4704, haut:4800, bas:4645 },
  { mne:'CBIBF', nom:'CORIS BANK INTERNATIONAL', ref:12010, dern:12075, var:0.54, qteE:7, heure:'14:37:24', qteA:1, achat:12050, vente:12200, qteV:30, qto:26, cto:12075, ouv:12300, statut:'Non Dispo.', clot:12075, qteT:517, volume:6247745, cmp:12080, haut:12300, bas:12010 },
  { mne:'BOAB', nom:'BANK OF AFRICA BENIN', ref:6975, dern:6965, var:-0.14, qteE:4, heure:'14:29:26', qteA:6, achat:6890, vente:6970, qteV:500, qto:34, cto:6965, ouv:6980, statut:'Non Dispo.', clot:6965, qteT:6470, volume:44999910, cmp:6955, haut:7000, bas:6895 },
  { mne:'LNBB', nom:'LOTERIE NATIONALE DU BF', ref:3900, dern:3940, var:1.03, qteE:149, heure:'14:29:26', qteA:300, achat:3855, vente:3940, qteV:671, qto:158, cto:3940, ouv:3900, statut:'Non Dispo.', clot:3940, qteT:729, volume:2849235, cmp:3908, haut:3940, bas:3855 },
  { mne:'BICB', nom:"BANQUE INTERNATIONALE BF", ref:4950, dern:4940, var:-0.2, qteE:50, heure:'14:29:26', qteA:39, achat:4940, vente:4990, qteV:249, qto:300, cto:4940, ouv:4930, statut:'Non Dispo.', clot:4940, qteT:868, volume:4291740, cmp:4944, haut:4995, bas:4930 },
  { mne:'BICC', nom:"BICI COTE D'IVOIRE", ref:19450, dern:19295, var:-0.8, qteE:453, heure:'13:56:00', qteA:47, achat:19300, vente:19450, qteV:6, qto:103, cto:19450, ouv:19450, statut:'Non Dispo.', clot:19295, qteT:1596, volume:30899245, cmp:19360, haut:19450, bas:19255 },
  { mne:'SAFC', nom:"SAFCA COTE D'IVOIRE", ref:3845, dern:3850, var:0.13, qteE:35, heure:'13:53:01', qteA:10, achat:3845, vente:3850, qteV:551, qto:130, cto:3850, ouv:3850, statut:'Non Dispo.', clot:3850, qteT:2051, volume:7820960, cmp:3813, haut:3885, bas:3795 },
  { mne:'SGBC', nom:"SOCIETE GENERALE CI", ref:30500, dern:30500, var:0.0, qteE:1, heure:'14:29:26', qteA:55, achat:30480, vente:30500, qteV:624, qto:6, cto:30500, ouv:30505, statut:'Non Dispo.', clot:30500, qteT:1677, volume:51302830, cmp:30590, haut:30990, bas:30200 },
  { mne:'BNBC', nom:"BERNABE COTE D'IVOIRE", ref:1530, dern:1535, var:3.02, qteE:10, heure:'14:29:26', qteA:1, achat:1505, vente:1535, qteV:262, qto:38, cto:1535, ouv:1490, statut:'Non Dispo.', clot:1535, qteT:659, volume:996310, cmp:1511, haut:1540, bas:1490 },
  { mne:'PRSC', nom:"TRACTAFRIC MOTORS CI", ref:4505, dern:4495, var:-0.11, qteE:1, heure:'14:29:26', qteA:110, achat:4410, vente:4495, qteV:2, qto:1, cto:4495, ouv:4645, statut:'Non Dispo.', clot:4495, qteT:1899, volume:8716730, cmp:4590, haut:4645, bas:4495 },
  { mne:'STBC', nom:"SITAB COTE D'IVOIRE", ref:20345, dern:20000, var:1.11, qteE:2, heure:'13:52:17', qteA:5, achat:20005, vente:20320, qteV:18, qto:317, cto:20345, ouv:19900, statut:'Non Dispo.', clot:20000, qteT:2439, volume:48805270, cmp:20010, haut:20345, bas:19800 },
  { mne:'SLBC', nom:"SOLIBRA COTE D'IVOIRE", ref:28800, dern:28855, var:3.05, qteE:11, heure:'14:29:26', qteA:139, achat:28855, vente:29290, qteV:3, qto:11, cto:28855, ouv:28800, statut:'Non Dispo.', clot:28855, qteT:312, volume:9039680, cmp:28970, haut:29290, bas:28800 },
  { mne:'SICC', nom:"SICOR COTE D'IVOIRE", ref:4030, dern:4000, var:-0.74, qteE:3, heure:'13:15:06', qteA:10, achat:3600, vente:4000, qteV:514, qto:1, cto:4030, ouv:4030, statut:'Non Dispo.', clot:4000, qteT:8, volume:32070, cmp:4008, haut:4030, bas:4000 },
  { mne:'FTSC', nom:"FILTISAC COTE D'IVOIRE", ref:2290, dern:2300, var:6.73, qteE:200, heure:'14:29:26', qteA:9, achat:2290, vente:2300, qteV:605, qto:317, cto:2300, ouv:2155, statut:'Non Dispo.', clot:2300, qteT:11273, volume:25967880, cmp:2303, haut:2315, bas:2155 },
  { mne:'CABC', nom:"SICABLE COTE D'IVOIRE", ref:3670, dern:3675, var:6.83, qteE:3, heure:'14:29:26', qteA:704, achat:3670, vente:3675, qteV:162, qto:8, cto:3675, ouv:3500, statut:'Non Dispo.', clot:3675, qteT:960, volume:3400060, cmp:3541, haut:3675, bas:3480 },
  { mne:'SOGC', nom:"SOGB COTE D'IVOIRE", ref:7940, dern:7940, var:-4.34, qteE:250, heure:'14:52:33', qteA:92, achat:7910, vente:7940, qteV:10770, qto:2617, cto:7940, ouv:8350, statut:'Non Dispo.', clot:7940, qteT:5133, volume:41089820, cmp:8005, haut:8350, bas:7940 },
  { mne:'SMBC', nom:"SMB COTE D'IVOIRE", ref:11100, dern:11000, var:-0.9, qteE:20, heure:'14:29:26', qteA:3, achat:11000, vente:11010, qteV:15, qto:42, cto:11000, ouv:11100, statut:'Non Dispo.', clot:11000, qteT:601, volume:6616640, cmp:11000, haut:11100, bas:10970 },
  { mne:'SPHC', nom:"SAPH COTE D'IVOIRE", ref:7500, dern:7500, var:0.0, qteE:15, heure:'14:29:26', qteA:2, achat:7490, vente:7500, qteV:8, qto:55, cto:7500, ouv:7500, statut:'Non Dispo.', clot:7500, qteT:2477, volume:18573545, cmp:7498, haut:7500, bas:7460 },
  { mne:'SDCC', nom:"SODE COTE D'IVOIRE", ref:5950, dern:5950, var:-6.89, qteE:1, heure:'14:34:43', qteA:3000, achat:5940, vente:5950, qteV:24, qto:26, cto:5950, ouv:6400, statut:'Non Dispo.', clot:5950, qteT:8368, volume:51033925, cmp:6099, haut:6400, bas:5950 },
  { mne:'CIEC', nom:"CIE COTE D'IVOIRE", ref:2720, dern:2690, var:1.51, qteE:10, heure:'14:34:51', qteA:40, achat:2680, vente:2690, qteV:1190, qto:87, cto:2690, ouv:2710, statut:'Non Dispo.', clot:2690, qteT:15471, volume:41129015, cmp:2658, haut:2720, bas:2650 },
  { mne:'CFAC', nom:"CFAO MOTORS CI", ref:1590, dern:1590, var:6.0, qteE:19, heure:'14:35:07', qteA:2, achat:1545, vente:1590, qteV:1, qto:1258, cto:1590, ouv:1500, statut:'Non Dispo.', clot:1590, qteT:2601, volume:4046675, cmp:1565, haut:1590, bas:1500 },
  { mne:'SHEC', nom:"VIVO ENERGY CI", ref:1740, dern:1740, var:2.35, qteE:16, heure:'14:29:26', qteA:114, achat:1740, vente:1745, qteV:109, qto:64, cto:1740, ouv:1700, statut:'Non Dispo.', clot:1740, qteT:7020, volume:11959320, cmp:1703, haut:1740, bas:1690 },
  { mne:'SDSC', nom:"BOLLORE TRANSPORT & LOG.", ref:1675, dern:1700, var:3.66, qteE:2, heure:'14:29:26', qteA:7, achat:1695, vente:1700, qteV:954, qto:351, cto:1700, ouv:1640, statut:'Non Dispo.', clot:1700, qteT:9739, volume:16209915, cmp:1664, haut:1700, bas:1630 },
  { mne:'SVOC', nom:"MOVIS COTE D'IVOIRE", ref:null, dern:null, var:null, qteE:null, heure:'', qteA:null, achat:null, vente:null, qteV:null, qto:null, cto:null, ouv:null, statut:'Hors Negoc.', clot:null, qteT:0, volume:0, cmp:null, haut:null, bas:null },
  { mne:'UNLC', nom:"UNILEVER CI", ref:58265, dern:58265, var:7.5, qteE:1, heure:'12:32:28', qteA:5, achat:58265, vente:null, qteV:null, qto:2, cto:58265, ouv:58265, statut:'Non Dispo.', clot:58265, qteT:25, volume:1456495, cmp:58250, haut:58265, bas:58200 },
  { mne:'NTLC', nom:"NESTLE CI", ref:11450, dern:11450, var:0.0, qteE:15, heure:'14:29:26', qteA:75, achat:11450, vente:11460, qteV:49, qto:30, cto:11450, ouv:11450, statut:'Non Dispo.', clot:11450, qteT:194, volume:2222545, cmp:11450, haut:11495, bas:11450 },
  { mne:'UNXC', nom:"UNIWAX CI", ref:1875, dern:1900, var:7.34, qteE:99, heure:'14:29:26', qteA:2930, achat:null, vente:1905, qteV:20, qto:4599, cto:1900, ouv:1790, statut:'Non Dispo.', clot:1900, qteT:18041, volume:33803815, cmp:1873, haut:1900, bas:1770 },
  { mne:'SEMC', nom:"CROWN SIEM CI", ref:2175, dern:2205, var:7.3, qteE:2, heure:'14:50:55', qteA:10, achat:2175, vente:2205, qteV:110, qto:905, cto:2205, ouv:2200, statut:'Non Dispo.', clot:2205, qteT:13601, volume:29972700, cmp:2203, haut:2205, bas:2160 },
  { mne:'STAC', nom:"SETAO CI", ref:1480, dern:1480, var:7.25, qteE:21, heure:'14:29:26', qteA:76, achat:1450, vente:1480, qteV:13, qto:173, cto:1480, ouv:1380, statut:'Non Dispo.', clot:1480, qteT:1320, volume:1906120, cmp:1444, haut:1480, bas:1380 },
  { mne:'SIVC', nom:"AIR LIQUIDE CI", ref:2300, dern:2310, var:7.44, qteE:42, heure:'14:29:26', qteA:288, achat:null, vente:2315, qteV:1, qto:8, cto:2300, ouv:2150, statut:'Non Dispo.', clot:2310, qteT:16767, volume:37506545, cmp:2236, haut:2310, bas:2150 },
  { mne:'PALC', nom:"PALM CI", ref:8320, dern:8450, var:1.56, qteE:180, heure:'14:29:26', qteA:1317, achat:8450, vente:8495, qteV:500, qto:183, cto:8450, ouv:8320, statut:'Non Dispo.', clot:8450, qteT:5429, volume:45419185, cmp:8366, haut:8450, bas:8300 },
  { mne:'ABJC', nom:"SERVAIR ABIDJAN CI", ref:3095, dern:3100, var:0.16, qteE:300, heure:'14:29:26', qteA:1, achat:3095, vente:3100, qteV:131, qto:405, cto:3100, ouv:3150, statut:'Non Dispo.', clot:3100, qteT:2440, volume:7565050, cmp:3100, haut:3150, bas:3095 },
  { mne:'NEIC', nom:"NEI-CEDA CI", ref:1235, dern:1235, var:-7.49, qteE:114, heure:'14:34:05', qteA:2386, achat:1235, vente:1330, qteV:241, qto:1000, cto:1235, ouv:1335, statut:'Non Dispo.', clot:1235, qteT:5908, volume:7746475, cmp:1311, haut:1350, bas:1235 },
  { mne:'TTLC', nom:"TOTAL CI", ref:2395, dern:2400, var:0.21, qteE:200, heure:'14:29:26', qteA:16, achat:2390, vente:2400, qteV:4489, qto:26, cto:2400, ouv:2395, statut:'Non Dispo.', clot:2400, qteT:1507, volume:3612785, cmp:2397, haut:2430, bas:2390 },
  { mne:'BOAC', nom:"BANK OF AFRICA CI", ref:7200, dern:7250, var:0.69, qteE:10, heure:'14:29:26', qteA:25, achat:7215, vente:7300, qteV:130, qto:35, cto:7250, ouv:7340, statut:'Non Dispo.', clot:7250, qteT:9464, volume:69011725, cmp:7292, haut:7340, bas:7200 },
  { mne:'SIBC', nom:"SOCIETE IVOIRIENNE DE BANQUE", ref:6400, dern:6475, var:1.17, qteE:2, heure:'14:29:26', qteA:15, achat:6445, vente:6475, qteV:195, qto:27, cto:6475, ouv:6490, statut:'Non Dispo.', clot:6475, qteT:8784, volume:56708480, cmp:6455, haut:6490, bas:6410 },
  { mne:'SCRC', nom:"SUCRIVOIRE CI", ref:1235, dern:1235, var:0.82, qteE:859, heure:'14:35:09', qteA:141, achat:1235, vente:1265, qteV:350, qto:1460, cto:1235, ouv:1225, statut:'Non Dispo.', clot:1235, qteT:6461, volume:8043345, cmp:1244, haut:1295, bas:1225 },
  { mne:'NSBC', nom:"NSIA BANQUE CI", ref:12850, dern:12860, var:0.08, qteE:1, heure:'14:29:26', qteA:33, achat:12855, vente:12860, qteV:1, qto:28, cto:12860, ouv:12900, statut:'Non Dispo.', clot:12860, qteT:284, volume:3655285, cmp:12870, haut:12900, bas:12850 },
  { mne:'ECOC', nom:"ECOBANK CI", ref:17795, dern:17500, var:-1.69, qteE:11, heure:'14:29:26', qteA:639, achat:17500, vente:17795, qteV:500, qto:531, cto:17500, ouv:17795, statut:'Non Dispo.', clot:17500, qteT:4050, volume:71748995, cmp:17710, haut:17900, bas:17210 },
  { mne:'ORAC', nom:"ORANGE CI", ref:14800, dern:14995, var:1.32, qteE:1, heure:'14:29:26', qteA:10, achat:14990, vente:15000, qteV:47, qto:5, cto:14995, ouv:14800, statut:'Non Dispo.', clot:14995, qteT:820, volume:12160685, cmp:14830, haut:15000, bas:14800 },
  { mne:'BOAM', nom:"BANK OF AFRICA MALI", ref:4250, dern:4250, var:0.0, qteE:20, heure:'14:29:26', qteA:3, achat:4245, vente:4250, qteV:39, qto:95, cto:4250, ouv:4250, statut:'Non Dispo.', clot:4250, qteT:5939, volume:25139130, cmp:4232, haut:4355, bas:4200 },
  { mne:'BOAN', nom:"BANK OF AFRICA NIGER", ref:2605, dern:2605, var:0.0, qteE:5, heure:'14:29:26', qteA:5, achat:2605, vente:2640, qteV:347, qto:141, cto:2605, ouv:2605, statut:'Non Dispo.', clot:2605, qteT:5483, volume:14296555, cmp:2607, haut:2640, bas:2605 },
  { mne:'SNTS', nom:"SONATEL SENEGAL", ref:26950, dern:27000, var:0.19, qteE:50, heure:'14:29:26', qteA:2234, achat:27000, vente:27100, qteV:13, qto:105, cto:27000, ouv:26950, statut:'Non Dispo.', clot:27000, qteT:2023, volume:54530455, cmp:26950, haut:27000, bas:26800 },
  { mne:'BOAS', nom:"BANK OF AFRICA SENEGAL", ref:6000, dern:6000, var:2.92, qteE:50, heure:'14:34:26', qteA:1075, achat:6000, vente:6050, qteV:50, qto:2875, cto:6000, ouv:5830, statut:'Non Dispo.', clot:6000, qteT:5735, volume:33926750, cmp:5915, haut:6000, bas:5790 },
  { mne:'TTLS', nom:"TOTAL SENEGAL", ref:2700, dern:2740, var:1.48, qteE:3, heure:'14:29:26', qteA:97, achat:2740, vente:2750, qteV:280, qto:4, cto:2740, ouv:2700, statut:'Non Dispo.', clot:2740, qteT:1100, volume:2986315, cmp:2714, haut:2750, bas:2700 },
  { mne:'ETIT', nom:"Ecobank Transnational Inc.", ref:24, dern:24, var:0.0, qteE:50, heure:'14:29:26', qteA:259, achat:23, vente:24, qteV:1494779, qto:13249, cto:24, ouv:24, statut:'Non Dispo.', clot:24, qteT:735876, volume:17801934, cmp:24, haut:25, bas:24 },
  { mne:'ORGT', nom:"ORAGROUP TOGO", ref:2615, dern:2615, var:-2.61, qteE:96, heure:'14:33:29', qteA:34, achat:2615, vente:2680, qteV:136, qto:300, cto:2615, ouv:2685, statut:'Non Dispo.', clot:2615, qteT:10795, volume:28458235, cmp:2636, haut:2685, bas:2610 },
]

const TICKER_ITEMS: TickerItem[] = [
  { mne:'SOGC', time:'14:35:16', qty:100, price:7940, var:-4.34 },
  { mne:'SOGC', time:'14:35:16', qty:12,  price:7940, var:-4.34 },
  { mne:'SOGC', time:'14:35:16', qty:30,  price:7940, var:-4.34 },
  { mne:'CBIBF',time:'14:37:24', qty:7,   price:12075,var:0.54  },
  { mne:'SOGC', time:'14:49:29', qty:200, price:7940, var:-4.34 },
  { mne:'SOGC', time:'14:49:30', qty:100, price:7940, var:-4.34 },
  { mne:'SEMC', time:'14:50:55', qty:2,   price:2205, var:7.3   },
  { mne:'SOGC', time:'14:52:33', qty:250, price:7940, var:-4.34 },
]

const CARNET_ORDRE: CarnetEntry[] = [
  { num:1,  qteA:1,   achat:4650, vente:4715, qteV:50   },
  { num:2,  qteA:190, achat:4720, vente:4800, qteV:10   },
  { num:3,  qteA:61,  achat:4645, vente:4720, qteV:30   },
  { num:4,  qteA:1,   achat:4700, vente:5000, qteV:12   },
  { num:5,  qteA:15,  achat:4645, vente:4720, qteV:14   },
  { num:6,  qteA:1,   achat:4615, vente:5100, qteV:23   },
  { num:7,  qteA:2,   achat:4620, vente:4730, qteV:600  },
  { num:8,  qteA:10,  achat:4390, vente:null, qteV:null },
  { num:9,  qteA:22,  achat:4615, vente:4800, qteV:100  },
  { num:10, qteA:2,   achat:4350, vente:null, qteV:null },
]

const PORTFOLIO_RAW: PortfolioRaw[] = [
  { mne:'STBC', label:"STBC - SITAB CI",            stock:60,    reserve:0, cmp:18200, veille:19780 },
  { mne:'ETIT', label:"ETIT - ECOBANK TRANSNATIONAL",stock:18000, reserve:0, cmp:18.5,  veille:24    },
  { mne:'BOAC', label:"BOAC - BANK OF AFRICA CI",    stock:180,   reserve:0, cmp:5850,  veille:7200  },
  { mne:'BOAM', label:"BOAM - BANK OF AFRICA MALI",  stock:550,   reserve:0, cmp:3600,  veille:4250  },
  { mne:'SCRC', label:"SCRC - SUCRIVOIRE CI",        stock:2800,  reserve:0, cmp:920,   veille:1225  },
]

const SOLDE_ESPECES = 245000

function buildPortfolio(): PortfolioBuilt[] {
  return PORTFOLIO_RAW.map((p) => {
    const ms = STOCKS.find((s) => s.mne === p.mne)
    const cours = ms?.dern != null ? ms.dern : p.veille
    const varPct = p.veille ? ((cours - p.veille) / p.veille) * 100 : 0
    const coutCumule = Math.round(p.stock * p.cmp)
    const valorisation = p.stock * cours
    const plusValue = valorisation - coutCumule
    const plusValuePct = coutCumule ? (plusValue / coutCumule) * 100 : 0
    return { ...p, cours, varPct, coutCumule, valorisation, plusValue, plusValuePct }
  })
}

function fmt(n: number | null | undefined): string {
  if (n == null) return ''
  return Number(n).toLocaleString('fr-FR')
}
function fmtDec(n: number | null | undefined, d = 3): string {
  if (n == null) return ''
  return Number(n).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d })
}

/* ─── ModalShell ─── */
function ModalShell({ children, onClose, variant = 'default' }: {
  children: React.ReactNode; onClose?: () => void; variant?: 'default' | 'confirm' | 'success'
}) {
  const maxW = variant === 'default' ? 'max-w-[960px]' : variant === 'confirm' ? 'max-w-[560px]' : 'max-w-[460px]'
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
      <div className={`w-full ${maxW} bg-white sm:rounded-lg h-[92vh] sm:h-auto overflow-hidden shadow-xl border border-gray-400`}>
        <div className="h-full max-h-[92vh] sm:max-h-[85vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

/* ─── LoginScreen ─── */
function LoginScreen({ onLogin }: { onLogin: (name: string) => void }) {
  const [nom, setNom] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => onLogin(nom.trim() || 'Visiteur'), 500)
  }

  return (
    <div className="flex-1 bg-gradient-to-br from-[#001a33] via-[#003366] to-[#004080] flex flex-col items-center justify-center p-4 relative overflow-auto">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-[#AA742A]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 border border-white/20">
            <div className="text-center">
              <TrendingUp size={32} className="text-[#AA742A] mx-auto" />
              <BarChart3 size={16} className="text-white/60 mx-auto -mt-1" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">BRVM Simulator</h1>
          <p className="text-blue-200/80 text-sm mt-1">Simulateur de Compte Titre</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-[#003366]">Connexion</h2>
            <p className="text-gray-500 text-xs mt-1">Accédez à votre espace de simulation boursière</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nom complet</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={nom} onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Koura Ayassor Serge"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30 focus:border-[#003366] transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="Saisir votre mot de passe"
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30 focus:border-[#003366] transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded-lg">
              Mode test — accès sans identifiants requis
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[#003366] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#002244] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Connexion en cours...</>
                : <><Lock size={14} />Se connecter</>}
            </button>
          </form>
        </div>

        <div className="mt-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#AA742A] rounded-lg flex items-center justify-center flex-shrink-0">
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">À propos de cet outil</h3>
              <p className="text-blue-200/80 text-xs mt-1 leading-relaxed">
                Ce simulateur de compte titre BRVM a été créé par <strong className="text-[#AA742A]">Serge Koura</strong> pour permettre aux apprenants de simuler un portefeuille réel en conditions de marché.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── TickerBar ─── */
function TickerBar() {
  const [offset, setOffset] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setOffset((o) => o - 1), 30)
    return () => clearInterval(id)
  }, [])
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS]
  const loopWidth = TICKER_ITEMS.length * 220
  return (
    <div className="bg-[#f0f0f0] border-b border-gray-300 overflow-hidden h-8 relative flex-shrink-0">
      <div className="flex items-center gap-6 absolute whitespace-nowrap h-full"
        style={{ transform: `translateX(${offset % loopWidth}px)` }}>
        {items.map((t, i) => (
          <span key={i} className="text-xs flex items-center gap-1 px-2">
            <span className="font-bold text-[#003366]">{t.mne}</span>
            <span className="text-gray-500">- {t.time}</span>
            <span className="text-gray-700">{t.qty}</span>
            <span className="text-gray-700">({fmt(t.price)}</span>
            <span className={t.var < 0 ? 'text-red-600 font-bold' : 'text-green-700 font-bold'}>
              {t.var < 0 ? `▼${t.var}%` : `▲${t.var}%`}
            </span>
            <span className="text-gray-700">)</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ─── OrderModal ─── */
function OrderModal({ stock, onClose, mode = 'achat', portfolioItem = null }: {
  stock: Stock; onClose: () => void; mode?: 'achat' | 'vente'; portfolioItem?: PortfolioBuilt | null
}) {
  const [typeOrdre, setTypeOrdre] = useState('COURS LIMITE')
  const [validite, setValidite] = useState('JOUR')
  const [quantite, setQuantite] = useState('')
  const [prix, setPrix] = useState<number>(stock?.dern ?? 0)
  const [dateExpiration, setDateExpiration] = useState('')
  const [modalite, setModalite] = useState('SANS CONDITIONS')
  const [qteMin, setQteMin] = useState('')
  const [qteDevoilee, setQteDevoilee] = useState('')
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isVente = mode === 'vente'
  const isAuMarche = typeOrdre === 'AU MARCHE'
  const prixEffectif = isAuMarche ? (stock?.dern ?? 0) : prix
  const montantEstime = Number(quantite) * Number(prixEffectif)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const info = {
    veille: stock.ref, dern: stock.dern, ouv: stock.ouv, haut: stock.haut, bas: stock.bas,
    seuilH: stock.ref ? Math.round(stock.ref * 1.075) : 0,
    seuilB: stock.ref ? Math.round(stock.ref * 0.925) : 0,
    cto: stock.cto, qteT: stock.qteT, capEch: stock.volume,
  }

  function handleEnregistrer() {
    const errs: Record<string, string> = {}
    const q = Number(quantite)
    if (!q || q <= 0) errs.quantite = 'Quantité requise'
    if (!isAuMarche && (!prixEffectif || Number(prixEffectif) <= 0)) errs.prix = 'Prix requis'
    if (validite === 'A_DATE' && !dateExpiration) errs.dateExpiration = 'Date requise'
    if (isVente && portfolioItem && q > portfolioItem.stock) errs.quantite = `Max ${portfolioItem.stock} titres`
    setErrors(errs)
    if (Object.keys(errs).length === 0) setStep('confirm')
  }

  if (step === 'success') return (
    <ModalShell onClose={onClose} variant="success">
      <div className="bg-white">
        <div className={`${isVente ? 'bg-red-700' : 'bg-green-700'} text-white px-4 py-3 flex items-center gap-2`}>
          <ShieldCheck size={20} /><span className="font-bold">Ordre enregistré avec succès</span>
        </div>
        <div className="p-4 sm:p-5 text-sm space-y-3">
          <div className="flex items-center gap-2 text-green-700">
            <Check size={18} className="flex-shrink-0" />
            <span>Votre ordre de <strong>{isVente ? 'vente' : 'achat'}</strong> a été transmis.</span>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs space-y-1.5">
            <div className="flex justify-between"><span className="text-gray-600">Ref.:</span><span className="font-bold">ORD-{Date.now().toString().slice(-8)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Titre:</span><span className="font-bold">{stock.mne}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Sens:</span><span className={`font-bold ${isVente ? 'text-red-600' : 'text-green-700'}`}>{isVente ? 'VENTE' : 'ACHAT'}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Quantité:</span><span className="font-bold">{quantite}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Statut:</span><span className="font-bold text-orange-600">En attente</span></div>
          </div>
          <button onClick={onClose} className="w-full bg-[#3c5a99] text-white py-2 text-sm font-semibold hover:bg-[#2d4a80] rounded">Fermer</button>
        </div>
      </div>
    </ModalShell>
  )

  if (step === 'confirm') return (
    <ModalShell onClose={onClose} variant="confirm">
      <div className="bg-white">
        <div className={`${isVente ? 'bg-red-700' : 'bg-[#3c5a99]'} text-white px-4 py-3 flex items-center gap-2`}>
          <AlertTriangle size={18} /><span className="font-bold">Confirmation de l&apos;ordre</span>
        </div>
        <div className="p-4 sm:p-5 text-sm">
          <p className="mb-4 text-gray-700">Vérifiez les détails de votre ordre :</p>
          <div className="bg-gray-50 border border-gray-200 rounded p-4 text-xs space-y-2 mb-4">
            <div className="grid grid-cols-2 gap-2">
              {[['Sens', isVente ? 'VENTE' : 'ACHAT'], ['Titre', stock.mne], ["Type d'ordre", typeOrdre], ['Quantité', quantite], ['Prix unitaire', `${fmt(prixEffectif)} FCFA`], ['Validité', validite]].map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="font-semibold text-gray-600">{k}:</span><span className="font-bold">{v}</span></div>
              ))}
            </div>
            <div className="border-t border-gray-300 pt-2 flex justify-between text-sm">
              <span className="font-bold text-gray-700">Montant estimé:</span>
              <span className="font-bold text-[#003366] text-base">{fmt(Math.round(montantEstime))} FCFA</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={() => setStep('form')} className="flex-1 border border-gray-400 text-gray-700 py-2 text-sm font-semibold hover:bg-gray-100 rounded flex items-center justify-center gap-1">
              <RotateCcw size={13} /> Modifier
            </button>
            <button onClick={() => setStep('success')} className={`flex-1 ${isVente ? 'bg-red-700 hover:bg-red-800' : 'bg-green-700 hover:bg-green-800'} text-white py-2 text-sm font-semibold rounded flex items-center justify-center gap-1`}>
              <Check size={13} /> Confirmer
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  )

  return (
    <ModalShell onClose={onClose} variant="default">
      <div className="bg-[#e8e8e8]">
        <div className={`${isVente ? 'bg-red-700' : 'bg-[#3c5a99]'} text-white px-4 py-2 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            {isVente ? <Minus size={16} /> : <Plus size={16} />}
            <span className="font-bold text-sm">{isVente ? 'NOUVELLE VENTE' : 'NOUVEAU ACHAT'}</span>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 rounded p-0.5"><X size={16} /></button>
        </div>
        <div className="bg-[#f0f0f0] border-b border-gray-400 px-4 py-1.5 flex items-center gap-4 text-xs flex-wrap">
          <button onClick={handleEnregistrer} className="flex items-center gap-1 text-[#003366] hover:underline font-semibold"><Save size={13} /> Enregistrer</button>
          <button onClick={onClose} className="flex items-center gap-1 text-[#003366] hover:underline"><RotateCcw size={13} /> Ignorer</button>
          <button className="flex items-center gap-1 text-[#003366] hover:underline"><FileBarChart size={13} /> Résumé</button>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 p-3 sm:p-4">
          <div className="flex-1 space-y-4 min-w-0">
            <fieldset className="border border-[#6699cc] p-3">
              <legend className="text-[#003366] font-bold text-xs px-1 flex items-center gap-1"><FileText size={12} /> Spécifications</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <label className="sm:w-24 sm:text-right font-semibold text-gray-700">Compte:</label>
                  <div className="sm:flex-1 bg-white border border-gray-400 px-2 py-1 rounded-sm flex items-center gap-1">
                    <span className="text-green-700">●</span> 001074901 - KOURA...
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <label className="sm:w-28 sm:text-right font-semibold text-gray-700">Titre:</label>
                  <div className="sm:flex-1 bg-white border border-gray-400 px-2 py-1 rounded-sm flex items-center gap-1 min-w-0">
                    <span className="text-green-700">●</span>
                    <span className="truncate">{stock.mne} - {stock.nom}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <label className="sm:w-24 sm:text-right font-semibold text-gray-700">Sens:</label>
                  <span className={`font-bold ${isVente ? 'text-red-600' : 'text-green-700'}`}>{isVente ? 'VENTE' : 'ACHAT'}</span>
                </div>
              </div>
            </fieldset>

            <fieldset className="border border-[#6699cc] p-3">
              <legend className="text-[#003366] font-bold text-xs px-1 flex items-center gap-1"><FileText size={12} /> Paramètres de l&apos;ordre</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <label className="sm:w-24 sm:text-right font-semibold text-gray-700">Type ordre:</label>
                  <select value={typeOrdre} onChange={(e) => { setTypeOrdre(e.target.value); if (e.target.value === 'AU MARCHE') setPrix(stock.dern ?? 0) }} className="w-full sm:flex-1 bg-white border border-gray-400 px-2 py-1">
                    <option>COURS LIMITE</option><option>AU MARCHE</option><option>AU MIEUX</option>
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <label className="sm:w-28 sm:text-right font-semibold text-gray-700">Validité:</label>
                  <select value={validite} onChange={(e) => { setValidite(e.target.value); if (e.target.value !== 'A_DATE') setDateExpiration('') }} className="w-full sm:flex-1 bg-white border border-gray-400 px-2 py-1">
                    <option value="JOUR">JOUR</option><option value="A_DATE">A DATE DÉTERMINÉE</option><option value="A_REVOCATION">A RÉVOCATION</option>
                  </select>
                </div>
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <label className="sm:w-24 sm:text-right font-semibold text-gray-700">Quantité:</label>
                    <input type="number" min="1" value={quantite} onChange={(e) => setQuantite(e.target.value)}
                      className={`w-full sm:flex-1 bg-white border px-2 py-1 ${errors.quantite ? 'border-red-500' : 'border-gray-400'}`} />
                  </div>
                  {errors.quantite && <p className="text-red-600 text-[10px] mt-0.5">{errors.quantite}</p>}
                </div>
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <label className="sm:w-24 sm:text-right font-semibold text-gray-700">Prix:</label>
                    {isAuMarche
                      ? <div className="w-full sm:flex-1 bg-gray-200 border border-gray-400 px-2 py-1 text-gray-600 font-bold">{fmt(stock.dern)} <span className="text-[10px] font-normal">(cours du marché)</span></div>
                      : <input type="number" min="0" step="5" value={prix} onChange={(e) => setPrix(Number(e.target.value))} className={`w-full sm:flex-1 bg-white border px-2 py-1 ${errors.prix ? 'border-red-500' : 'border-gray-400'}`} />}
                  </div>
                  {errors.prix && <p className="text-red-600 text-[10px] mt-0.5">{errors.prix}</p>}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <label className="sm:w-28 sm:text-right font-semibold text-gray-700">Modalités:</label>
                  <select value={modalite} onChange={(e) => setModalite(e.target.value)} className="w-full sm:flex-1 bg-white border border-gray-400 px-2 py-1">
                    <option>SANS CONDITIONS</option><option>TOUT OU RIEN</option><option>EXÉCUTÉ OU ANNULÉ</option>
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <label className="sm:w-24 sm:text-right font-semibold text-gray-700">Qte min:</label>
                  <input type="number" value={qteMin} onChange={(e) => setQteMin(e.target.value)} className="w-full sm:flex-1 bg-white border border-gray-400 px-2 py-1" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <label className="sm:w-24 sm:text-right font-semibold text-gray-700">Qte dévoilée:</label>
                  <input type="number" value={qteDevoilee} onChange={(e) => setQteDevoilee(e.target.value)} className="w-full sm:flex-1 bg-white border border-gray-400 px-2 py-1" />
                </div>
                {validite === 'A_DATE' && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <label className="sm:w-28 sm:text-right font-semibold text-gray-700">Date expiration:</label>
                    <input type="date" value={dateExpiration} onChange={(e) => setDateExpiration(e.target.value)} className={`w-full sm:flex-1 bg-white border px-2 py-1 ${errors.dateExpiration ? 'border-red-500' : 'border-gray-400'}`} />
                  </div>
                )}
              </div>
              {Number(quantite) > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-300 flex justify-between text-xs">
                  <span className="font-semibold text-gray-700">Montant estimé:</span>
                  <span className="font-bold text-[#003366]">{fmt(Math.round(montantEstime))} FCFA</span>
                </div>
              )}
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <fieldset className="border border-[#6699cc] p-3">
                <legend className="text-[#003366] font-bold text-xs px-1">Position liquidités</legend>
                <div className="text-xs space-y-1">
                  {[['Solde Espèces', fmt(SOLDE_ESPECES)], ['Disponible', fmt(SOLDE_ESPECES) + '*'], ['Op.Non.Den', '0'], ['Liq Réservées', '0']].map(([k, v]) => (
                    <div key={k} className="flex justify-between"><span className="font-semibold">{k}:</span><span>{v}</span></div>
                  ))}
                </div>
              </fieldset>
              <fieldset className="border border-[#6699cc] p-3">
                <legend className="text-[#003366] font-bold text-xs px-1">Position titres</legend>
                <div className="text-xs space-y-1">
                  {[['Stock', portfolioItem ? portfolioItem.stock : 0], ['Dispo.', portfolioItem ? portfolioItem.stock : 0], ['Réserve', portfolioItem ? portfolioItem.reserve : 0], ['CMP', portfolioItem ? fmtDec(portfolioItem.cmp) : 0]].map(([k, v]) => (
                    <div key={String(k)} className="flex justify-between"><span className="font-semibold">{k}:</span><span>{String(v)}</span></div>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>

          <div className="w-full lg:w-[320px] space-y-3">
            <div className="border border-gray-400 bg-white p-3">
              <h3 className="font-bold text-sm text-[#003366] border-b border-gray-300 pb-1 mb-2 truncate">{stock.mne} - {stock.nom}</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {[['Veille', fmt(info.veille)], ['Dern.', fmt(info.dern)], ['Var%', stock.var != null ? stock.var.toFixed(2) + '%' : ''], ['Ouv.', fmt(info.ouv)], ['+Haut', fmt(info.haut)], ['+Bas', fmt(info.bas)], ['SeuilH', fmt(info.seuilH)], ['SeuilB', fmt(info.seuilB)], ['CTO', fmt(info.cto)], ['QteT', fmt(info.qteT)]].map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span className="font-semibold">{k}:</span><span>{v}</span></div>
                ))}
              </div>
            </div>
            <div className="border border-gray-400 bg-white overflow-auto">
              <table className="w-full text-xs min-w-[280px]">
                <thead>
                  <tr className="bg-[#d0d8e8] text-[#003366]">
                    {['#', 'QteA', 'Achat', 'Vente', 'QteV'].map((h) => (
                      <th key={h} className="px-1 py-0.5 text-center border-r border-gray-300 last:border-r-0">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CARNET_ORDRE.map((c) => (
                    <tr key={c.num} className="border-t border-gray-200 hover:bg-blue-50">
                      <td className="px-1 py-0.5 text-center border-r border-gray-200">{c.num}</td>
                      <td className="px-1 py-0.5 text-right border-r border-gray-200 text-blue-800">{c.qteA}</td>
                      <td className="px-1 py-0.5 text-right border-r border-gray-200 text-blue-800">{fmt(c.achat)}</td>
                      <td className="px-1 py-0.5 text-right border-r border-gray-200 text-orange-700">{c.vente ? fmt(c.vente) : ''}</td>
                      <td className="px-1 py-0.5 text-right text-orange-700">{c.qteV ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={handleEnregistrer} className={`${isVente ? 'bg-red-700 hover:bg-red-800' : 'bg-[#3c5a99] hover:bg-[#2d4a80]'} text-white text-xs px-4 py-1.5 font-semibold w-full`}>
              ENREGISTRER L&apos;ORDRE
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  )
}

/* ─── PortefeuilleView ─── */
function PortefeuilleView({ onSellStock, userName = '' }: { onSellStock: (p: PortfolioBuilt) => void; userName?: string }) {
  const [showRapport, setShowRapport] = useState(false)
  const portfolio = buildPortfolio()
  const totalCout = portfolio.reduce((s, p) => s + p.coutCumule, 0)
  const totalValo = portfolio.reduce((s, p) => s + p.valorisation, 0)
  const totalPV = portfolio.reduce((s, p) => s + p.plusValue, 0)
  const totalPVPct = totalCout ? (totalPV / totalCout) * 100 : 0
  const capitalActuel = totalValo + SOLDE_ESPECES

  return (
    <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
      <div className="flex-1 flex flex-col lg:border-r border-gray-300 min-h-0">
        <div className="bg-[#3c5a99] text-white px-2 sm:px-4 py-1.5 text-xs font-bold flex items-center gap-2 flex-shrink-0">
          <Briefcase size={13} /> Portefeuille titres — {new Date().toLocaleDateString('fr-FR')}
        </div>
        <div className="bg-[#f0f0f0] border-b border-gray-300 px-2 sm:px-3 py-1.5 flex items-center gap-2 text-xs flex-wrap flex-shrink-0">
          <div className="relative">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Recherche..." className="pl-7 pr-2 py-1 text-xs border border-gray-400 rounded w-40 sm:w-48" />
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold">Compte:</span>
            <div className="bg-white border border-gray-400 px-2 py-0.5 rounded-sm flex items-center gap-1">
              <span className="text-green-700">●</span> 001074901 - {userName || 'VISITEUR'}
            </div>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden flex-1 overflow-auto min-h-0 p-2 space-y-2">
          {portfolio.map((p) => (
            <div key={p.mne} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-[#003366] truncate">{p.label}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Stock: <strong>{p.stock}</strong> · CMP: <strong>{fmtDec(p.cmp)}</strong></div>
                </div>
                <button onClick={() => onSellStock(p)} className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded">Vendre</button>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
                {[['Cours', `${fmtDec(p.cours)} FCFA`, 'text-green-800'], ['Valorisation', fmt(Math.round(p.valorisation)), 'text-gray-800'], ['Var%', `${p.varPct.toFixed(2)}%`, p.varPct < 0 ? 'text-red-600' : 'text-green-700'], ['+/- Value', fmt(Math.round(p.plusValue)), p.plusValue < 0 ? 'text-red-600' : 'text-green-700']].map(([label, val, cls]) => (
                  <div key={String(label)} className="bg-gray-50 border border-gray-200 rounded p-2">
                    <div className="text-gray-500">{label}</div>
                    <div className={`font-bold ${cls}`}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:flex flex-col flex-1 min-h-0">
          <div className="text-[10px] text-gray-500 px-2 py-1 border-b border-gray-100 flex-shrink-0">
            Faites glisser horizontalement pour voir toutes les colonnes.
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs border-collapse min-w-[1100px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#d0d8e8] text-[#003366]">
                  {['Titre', 'Stock', 'Réserve', 'CMP', 'Coût cumulé', 'Veille', 'Cours', 'Var%', 'Valorisation', '+/- Value', '+/- Value (%)'].map((h) => (
                    <th key={h} className="px-2 py-1.5 text-right first:text-left border-r border-gray-300 last:border-r-0 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portfolio.map((p, i) => (
                  <tr key={p.mne} className={`border-b border-gray-200 hover:bg-blue-50 ${i % 2 === 0 ? 'bg-white' : 'bg-[#f8f8f8]'}`}>
                    <td className="px-2 py-1.5 border-r border-gray-200">
                      <div className="flex items-center gap-1">
                        <button className="w-4 h-4 bg-green-600 text-white rounded-sm flex items-center justify-center text-[10px] font-bold hover:bg-green-700">+</button>
                        <button onClick={() => onSellStock(p)} className="w-4 h-4 bg-red-600 text-white rounded-sm flex items-center justify-center text-[10px] font-bold hover:bg-red-700">-</button>
                        <span className="text-blue-700 font-semibold ml-1">{p.label}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200">{p.stock}</td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200">{p.reserve}</td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200">{fmtDec(p.cmp)}</td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200">{fmt(p.coutCumule)}</td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200">{fmtDec(p.veille)}</td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200 font-bold text-green-800">{fmtDec(p.cours)}</td>
                    <td className={`px-2 py-1.5 text-right border-r border-gray-200 font-bold ${p.varPct < 0 ? 'text-red-600' : p.varPct > 0 ? 'text-green-700' : 'text-gray-700'}`}>{p.varPct.toFixed(2)}%</td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-200">{fmt(Math.round(p.valorisation))}</td>
                    <td className={`px-2 py-1.5 text-right border-r border-gray-200 font-bold ${p.plusValue < 0 ? 'text-red-600' : 'text-green-700'}`}>{fmt(Math.round(p.plusValue))}</td>
                    <td className={`px-2 py-1.5 text-right font-bold ${p.plusValuePct < 0 ? 'text-red-600' : 'text-green-700'}`}>{p.plusValuePct.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary panel */}
      <div className="w-full lg:w-[320px] flex-shrink-0 overflow-auto min-h-0 border-t lg:border-t-0 border-gray-200">
        <div className="bg-[#3c5a99] text-white px-3 py-1.5 text-xs font-bold flex-shrink-0">
          Positions au {new Date().toLocaleDateString('fr-FR')}
        </div>
        <div className="p-3 space-y-4 text-xs">
          <div className="space-y-1.5 pl-2">
            {[['Solde Espèces', fmt(SOLDE_ESPECES)], ['Capital actuel', fmt(Math.round(capitalActuel))]].map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="font-semibold text-gray-700">{k}:</span><span className="font-bold">{v}</span></div>
            ))}
          </div>
          <div className="border-t border-gray-300 pt-3">
            <div className="bg-[#3c5a99] text-white px-2 py-1 text-xs font-bold mb-2">Pondération portefeuille</div>
            <div className="space-y-1.5 pl-2">
              {[['Valorisation totale', fmt(Math.round(totalValo))], ['Coût total', fmt(totalCout)]].map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="font-semibold text-gray-700">{k}:</span><span className="font-bold">{v}</span></div>
              ))}
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">+/- Value globale:</span>
                <span className={`font-bold ${totalPV < 0 ? 'text-red-600' : 'text-green-700'}`}>{fmt(Math.round(totalPV))}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">+/- Value (%):</span>
                <span className={`font-bold ${totalPVPct < 0 ? 'text-red-600' : 'text-green-700'}`}>{totalPVPct.toFixed(2)}%</span>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {portfolio.map((p) => {
                const pct = totalValo ? (p.valorisation / totalValo) * 100 : 0
                return (
                  <div key={p.mne} className="flex items-center gap-2">
                    <span className="w-12 text-[10px] font-semibold text-gray-600 truncate">{p.mne}</span>
                    <div className="flex-1 bg-gray-200 h-3 rounded-sm overflow-hidden">
                      <div className="bg-[#3c5a99] h-full rounded-sm" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] w-10 text-right">{pct.toFixed(1)}%</span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="border-t border-gray-300 pt-3">
            <button onClick={() => setShowRapport(true)} className="w-full flex items-center justify-center gap-2 bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold py-2.5 px-4 rounded transition-colors">
              <FileBarChart size={14} /> Rapport d&apos;investissement
            </button>
          </div>
        </div>
      </div>

      {showRapport && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowRapport(false) }}>
          <div className="bg-white rounded-lg shadow-xl border border-gray-300 w-full max-w-[600px] max-h-[85vh] overflow-y-auto">
            <div className="bg-[#003366] text-white px-4 py-3 flex items-center justify-between rounded-t-lg">
              <div className="flex items-center gap-2"><FileBarChart size={16} /><span className="font-bold text-sm">Rapport d&apos;investissement</span></div>
              <button onClick={() => setShowRapport(false)} className="hover:bg-white/20 rounded p-1"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-4 text-xs">
              <div className="text-center text-gray-500 text-[11px]">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div className="bg-gradient-to-r from-[#003366] to-[#3c5a99] text-white rounded-lg p-4">
                <h3 className="font-bold text-sm mb-3">Synthèse globale</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[['Montant investi', fmt(totalCout) + ' FCFA'], ['Valorisation', fmt(Math.round(totalValo)) + ' FCFA'], ['Plus-value', (totalPV >= 0 ? '+' : '') + fmt(Math.round(totalPV)) + ' FCFA'], ['Rendement', (totalPVPct >= 0 ? '+' : '') + totalPVPct.toFixed(2) + '%']].map(([k, v]) => (
                    <div key={k} className="bg-white/10 rounded p-2.5">
                      <div className="text-white/70 text-[10px]">{k}</div>
                      <div className="font-bold text-sm">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-[#003366] text-sm mb-2">Détail par titre</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-[11px]">
                    <thead><tr className="bg-[#d0d8e8] text-[#003366]">
                      {['Titre', 'Coût', 'Valorisation', '+/- Value', '%'].map((h) => <th key={h} className="text-right first:text-left px-2 py-1.5 font-bold">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {portfolio.map((p, i) => (
                        <tr key={p.mne} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-2 py-1.5 font-semibold text-[#003366]">{p.mne}</td>
                          <td className="px-2 py-1.5 text-right">{fmt(p.coutCumule)}</td>
                          <td className="px-2 py-1.5 text-right">{fmt(Math.round(p.valorisation))}</td>
                          <td className={`px-2 py-1.5 text-right font-bold ${p.plusValue >= 0 ? 'text-green-700' : 'text-red-600'}`}>{p.plusValue >= 0 ? '+' : ''}{fmt(Math.round(p.plusValue))}</td>
                          <td className={`px-2 py-1.5 text-right font-bold ${p.plusValuePct >= 0 ? 'text-green-700' : 'text-red-600'}`}>{p.plusValuePct.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr className="bg-[#003366] text-white font-bold">
                      <td className="px-2 py-2">TOTAL</td>
                      <td className="px-2 py-2 text-right">{fmt(totalCout)}</td>
                      <td className="px-2 py-2 text-right">{fmt(Math.round(totalValo))}</td>
                      <td className={`px-2 py-2 text-right ${totalPV >= 0 ? 'text-green-300' : 'text-red-300'}`}>{totalPV >= 0 ? '+' : ''}{fmt(Math.round(totalPV))}</td>
                      <td className={`px-2 py-2 text-right ${totalPVPct >= 0 ? 'text-green-300' : 'text-red-300'}`}>{totalPVPct.toFixed(1)}%</td>
                    </tr></tfoot>
                  </table>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-[#003366] text-sm mb-2">Performance par titre</h4>
                <div className="space-y-2">
                  {portfolio.map((p) => (
                    <div key={p.mne} className="flex items-center gap-2">
                      <span className="w-12 text-[10px] font-bold text-[#003366]">{p.mne}</span>
                      <div className="flex-1 bg-gray-200 h-5 rounded overflow-hidden relative">
                        <div className={`h-full rounded ${p.plusValuePct >= 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.abs(p.plusValuePct), 100)}%` }} />
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-gray-800">
                          {p.plusValuePct >= 0 ? '+' : ''}{fmt(Math.round(p.plusValue))} FCFA
                        </span>
                      </div>
                      <span className={`w-14 text-right text-[10px] font-bold ${p.plusValuePct >= 0 ? 'text-green-700' : 'text-red-600'}`}>{p.plusValuePct >= 0 ? '+' : ''}{p.plusValuePct.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 px-4 py-3 flex justify-end">
              <button onClick={() => setShowRapport(false)} className="bg-[#003366] hover:bg-[#002244] text-white text-xs font-bold py-2 px-6 rounded">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── MarcheView ─── */
function MarcheView({ onOrderStock }: { onOrderStock: (s: Stock) => void }) {
  const [activeTab, setActiveTab] = useState('marche')
  const [searchTerm, setSearchTerm] = useState('')
  const [favoris, setFavoris] = useState<string[]>([])

  const portfolioTickers = PORTFOLIO_RAW.map((p) => p.mne)
  const filtered = STOCKS.filter((s) =>
    s.mne.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nom.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const sorted = [...filtered].sort((a, b) => {
    const aP = portfolioTickers.includes(a.mne), bP = portfolioTickers.includes(b.mne)
    return aP === bP ? 0 : aP ? -1 : 1
  })
  const display = activeTab === 'favoris' ? sorted.filter((s) => favoris.includes(s.mne)) : sorted
  const toggleFavori = (mne: string) => setFavoris((prev) => prev.includes(mne) ? prev.filter((f) => f !== mne) : [...prev, mne])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="bg-white border-b border-gray-300 px-2 sm:px-4 py-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs flex-shrink-0">
        <div className="flex items-center gap-1"><span className="font-semibold">Séance:</span><span className="text-green-700 font-bold">06/02/2026 17:17:20 — Fermée</span></div>
        <div className="flex items-center gap-1"><span className="font-semibold">Volume:</span><span className="font-bold">1 068 696 855.5</span></div>
        <div className="flex items-center gap-1"><span className="font-semibold">BRVM-30:</span><span className="font-bold">175.68</span><span className="text-red-600 font-bold">▼ 0.58%</span></div>
      </div>
      <div className="bg-[#f5f5f5] border-b border-gray-300 px-2 sm:px-4 py-1 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center">
          {['marche', 'favoris'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-2 sm:px-4 py-1 text-xs font-semibold border border-gray-400 rounded-t ${tab !== 'marche' ? '-ml-px' : ''} ${activeTab === tab ? 'bg-white text-[#003366] border-b-white' : 'bg-[#e0e0e0] text-gray-600'}`}>
              {tab === 'marche' ? <><Monitor size={12} className="inline mr-1" />Marché</> : <><Star size={12} className="inline mr-1 text-yellow-500" />Favoris</>}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white px-2 sm:px-4 py-1 border-b border-gray-200 flex items-center gap-2 flex-shrink-0">
        <div className="relative flex-1 sm:flex-none">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Recherche..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-7 pr-3 py-1.5 text-xs border border-gray-400 rounded w-full sm:w-48 focus:outline-none focus:border-blue-500" />
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs border-collapse min-w-[1600px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#d0d8e8] text-[#003366]">
              {['', '', 'Mne', 'Nom', 'Réf.', 'Dern.', 'Var%', 'QteE', 'Heure', 'QteA', 'Achat', 'Vente', 'QteV', 'QTO', 'CTO', 'Ouv.', 'Statut', 'Clot.', 'QteT', 'Volume', 'CMP', '+Haut', '+Bas'].map((h, i) => (
                <th key={i} className={`px-1 sm:px-2 py-1.5 border-r border-gray-300 last:border-r-0 font-bold ${i >= 3 ? 'text-right' : 'text-left'} ${h === 'Achat' ? 'bg-[#c8e0c8]' : h === 'Vente' ? 'bg-[#f0d0c0]' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {display.map((s, i) => {
              const isHors = s.statut === 'Hors Negoc.'
              const varCls = s.var == null ? 'text-gray-400' : (s.var ?? 0) < 0 ? 'text-red-600' : (s.var ?? 0) > 0 ? 'text-green-700' : 'text-gray-800'
              return (
                <tr key={s.mne} className={`border-b border-gray-200 hover:bg-blue-50 ${i % 2 === 0 ? 'bg-white' : 'bg-[#f8f8f8]'}`}>
                  <td className="px-1 py-1 border-r border-gray-200 text-center">
                    <div className="flex items-center gap-0.5 justify-center">
                      <button onClick={() => !isHors && onOrderStock(s)} className={`w-4 h-4 ${isHors ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white rounded-sm flex items-center justify-center text-[10px] font-bold`}>+</button>
                      <button className={`w-4 h-4 ${isHors ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'} text-white rounded-sm flex items-center justify-center text-[10px] font-bold`}>-</button>
                    </div>
                  </td>
                  <td className="px-0.5 py-1 border-r border-gray-200 text-center">
                    <button onClick={() => toggleFavori(s.mne)}>
                      <Star size={12} className={favoris.includes(s.mne) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                    </button>
                  </td>
                  <td className="px-2 py-1 border-r border-gray-200 font-bold text-[#003366]">{s.mne}</td>
                  <td className="px-2 py-1 border-r border-gray-200 font-bold text-gray-800 truncate max-w-[200px]">{s.nom}</td>
                  <td className="px-2 py-1 border-r border-gray-200 text-right">{fmt(s.ref)}</td>
                  <td className={`px-2 py-1 border-r border-gray-200 text-right font-bold ${varCls}`}>
                    {s.dern != null ? `${fmt(s.dern)} ${(s.var ?? 0) < 0 ? '▼' : (s.var ?? 0) > 0 ? '▲' : '='}` : ''}
                  </td>
                  <td className={`px-2 py-1 border-r border-gray-200 text-right font-bold ${varCls}`}>
                    {s.var != null ? `${s.var > 0 ? '+' : ''}${s.var.toFixed(2)}%` : ''}
                  </td>
                  <td className="px-2 py-1 border-r border-gray-200 text-right">{fmt(s.qteE)}</td>
                  <td className="px-2 py-1 border-r border-gray-200 text-center text-gray-600">{s.heure}</td>
                  <td className="px-2 py-1 border-r border-gray-200 text-right">{fmt(s.qteA)}</td>
                  <td className="px-2 py-1 border-r border-gray-200 text-right bg-[#e8f5e8] font-semibold">{fmt(s.achat)}</td>
                  <td className="px-2 py-1 border-r border-gray-200 text-right bg-[#fde8e0] font-semibold">{fmt(s.vente)}</td>
                  <td className="px-2 py-1 border-r border-gray-200 text-right">{fmt(s.qteV)}</td>
                  <td className="px-2 py-1 border-r border-gray-200 text-right">{fmt(s.qto)}</td>
                  <td className="px-2 py-1 border-r border-gray-200 text-right">{fmt(s.cto)}</td>
                  <td className="px-2 py-1 border-r border-gray-200 text-right">{fmt(s.ouv)}</td>
                  <td className="px-2 py-1 border-r border-gray-200 text-center">
                    <span className={isHors ? 'text-orange-600 font-semibold' : 'text-green-700 font-semibold'}>{s.statut}</span>
                  </td>
                  <td className="px-2 py-1 border-r border-gray-200 text-right">{fmt(s.clot)}</td>
                  <td className="px-2 py-1 border-r border-gray-200 text-right font-bold text-blue-800">{fmt(s.qteT)}</td>
                  <td className="px-2 py-1 border-r border-gray-200 text-right">{fmt(s.volume)}</td>
                  <td className="px-2 py-1 border-r border-gray-200 text-right">{fmt(s.cmp)}</td>
                  <td className="px-2 py-1 border-r border-gray-200 text-right">{fmt(s.haut)}</td>
                  <td className="px-2 py-1 text-right">{fmt(s.bas)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ─── Main Page ─── */
export default function BrvmSimulator() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [currentView, setCurrentView] = useState<'marche' | 'portefeuille'>('marche')
  const [orderStock, setOrderStock] = useState<Stock | null>(null)
  const [orderMode, setOrderMode] = useState<'achat' | 'vente'>('achat')
  const [orderPortfolioItem, setOrderPortfolioItem] = useState<PortfolioBuilt | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  function handleBuyStock(stock: Stock) {
    setOrderMode('achat'); setOrderPortfolioItem(null); setOrderStock(stock)
  }
  function handleSellFromPortfolio(portfolioRow: PortfolioBuilt) {
    const ms = STOCKS.find((s) => s.mne === portfolioRow.mne)
    if (!ms) return
    setOrderMode('vente'); setOrderPortfolioItem(portfolioRow); setOrderStock(ms)
  }

  useEffect(() => {
    document.body.style.overflow = orderStock ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [orderStock])

  if (!isLoggedIn) return <LoginScreen onLogin={(name) => { setUserName(name.toUpperCase()); setIsLoggedIn(true) }} />

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white text-[13px] select-none" style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      {/* Internal nav */}
      <div className="bg-gradient-to-b from-[#dce6f0] to-[#c0d0e0] border-b border-gray-400 px-2 sm:px-3 py-1.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1 min-w-0">
          <div className="bg-[#003366] text-white text-[10px] font-bold px-2 py-1 rounded flex flex-col items-center leading-tight mr-1 sm:mr-2 flex-shrink-0">
            <span>Coris</span><span className="text-[8px] text-yellow-300">Bourse</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-[#003366] p-1"><MenuIcon size={18} /></button>
          <nav className="hidden lg:flex items-center gap-0 text-xs">
            <NavItem active={currentView === 'marche'} onClick={() => setCurrentView('marche')} icon={<Monitor size={13} />} label="Marché en ligne" />
            <span className="text-gray-400 mx-0.5">|</span>
            <NavItem icon={<BookOpen size={13} />} label="Carnet d'ordres" />
            <span className="text-gray-400 mx-0.5">|</span>
            <NavItem active={currentView === 'portefeuille'} onClick={() => setCurrentView('portefeuille')} icon={<Briefcase size={13} />} label="Portefeuille" />
            <span className="text-gray-400 mx-0.5">|</span>
            <NavItem icon={<Clock size={13} />} label="Historique ordres" />
            <span className="text-gray-400 mx-0.5">|</span>
            <NavItem icon={<FileText size={13} />} label="Relevé opérations" />
          </nav>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 text-xs flex-shrink-0">
          <button className="text-gray-600 hover:text-gray-800 hidden sm:block"><Bell size={14} /></button>
          <button className="text-gray-600 hover:text-gray-800 hidden sm:block"><HelpCircle size={14} /></button>
          <div className="flex items-center gap-1 text-[#003366] font-semibold">
            <User size={14} /><span className="hidden sm:inline max-w-[160px] truncate">{userName}</span>
          </div>
          <button onClick={() => setIsLoggedIn(false)} className="text-red-600 hover:text-red-800 p-1" title="Déconnexion"><LogOut size={14} /></button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-300 shadow-md z-30 flex-shrink-0">
          {[{ view: 'marche' as const, icon: <Monitor size={14} />, label: 'Marché en ligne' }, { view: 'portefeuille' as const, icon: <Briefcase size={14} />, label: 'Portefeuille' }].map((item) => (
            <button key={item.view} onClick={() => { setCurrentView(item.view); setMobileMenuOpen(false) }}
              className={`w-full flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 text-xs ${currentView === item.view ? 'bg-blue-50 text-[#003366] font-bold' : 'text-gray-700'}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-[#e8e8e8] px-2 sm:px-3 py-0.5 flex items-center gap-1 flex-shrink-0 overflow-x-auto">
        {([['marche', 'Marché en ligne', <Monitor key="m" size={12} />], ['portefeuille', 'Portefeuille', <Briefcase key="p" size={12} />]] as [string, string, React.ReactNode][]).map(([v, label, icon]) => (
          <button key={v} onClick={() => setCurrentView(v as 'marche' | 'portefeuille')}
            className={`inline-flex items-center text-xs px-2 sm:px-3 py-1 rounded-t gap-1 whitespace-nowrap ${currentView === v ? 'bg-[#3c5a99] text-white' : 'bg-[#c0c0c0] text-gray-700 hover:bg-[#b0b0b0]'}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      <TickerBar />

      <div className="flex-1 flex flex-col overflow-hidden pb-6">
        {currentView === 'marche'
          ? <MarcheView onOrderStock={handleBuyStock} />
          : <PortefeuilleView onSellStock={handleSellFromPortfolio} userName={userName} />}
      </div>

      {/* Fixed footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#e8e8e8] border-t border-gray-400 px-2 sm:px-4 py-1 flex items-center justify-between text-[10px] text-gray-600 z-40">
        <span className="hidden sm:inline">© 2021 Intelligencia Financial Softwares</span>
        <span className="sm:hidden">© Serge Koura</span>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="flex items-center gap-1"><Clock size={11} /> {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="text-green-700 font-bold">DÉMARRÉE</span>
        </div>
      </div>

      {orderStock && <OrderModal stock={orderStock} onClose={() => { setOrderStock(null); setOrderPortfolioItem(null) }} mode={orderMode} portfolioItem={orderPortfolioItem} />}
    </div>
  )
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1 px-2 py-0.5 text-xs whitespace-nowrap ${active ? 'text-[#003366] font-bold' : 'text-gray-600 hover:text-[#003366]'}`}>
      {icon} {label}
    </button>
  )
}
