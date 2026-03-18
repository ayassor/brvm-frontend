export interface NewsItem {
  id: number
  title: string
  summary: string
  body: string        // full article, paragraphs separated by \n\n
  category: string
  source: string
  author?: string
  date: string
  isPositive?: boolean | null
  tags: string[]
  readingTime: number // minutes
}

export const MOCK_NEWS: NewsItem[] = [
  {
    id: 1,
    title: 'Solibra CI : hausse de 7,5% en séance, plus forte progression du jour',
    summary: "L'action Solibra CI (SLBC) a clôturé en hausse de 7,5% à 44 075 FCFA, portée par des volumes inhabituellement élevés.",
    body: `L'action Solibra CI (SLBC) a clôturé en hausse de 7,5% à 44 075 FCFA lors de la séance du 27 février 2026, s'imposant comme la meilleure performance de la journée sur l'ensemble des 47 valeurs cotées à la Bourse Régionale des Valeurs Mobilières (BRVM). Les volumes échangés ont atteint 2 341 titres, nettement au-dessus de la moyenne des 30 dernières séances.

Selon plusieurs analystes interrogés par notre rédaction, cette progression reflète un regain d'intérêt marqué des investisseurs institutionnels pour le secteur de la consommation de base. La période de publication des résultats annuels approchant, les anticipations sur les dividendes de Solibra suscitent une attention particulière de la communauté financière.

"Solibra reste l'un des titres les plus défensifs de la cote. Son positionnement sur les boissons non alcoolisées et alcoolisées lui confère une résilience face aux cycles économiques," explique un gestionnaire de portefeuille d'une SGI de la place. "Les niveaux actuels offrent encore un point d'entrée intéressant avant la publication des résultats."

La Société de Limonaderies et Brasseries d'Afrique Côte d'Ivoire, filiale du groupe CASTEL, distribue régulièrement des dividendes élevés. En 2025, le dividende par action s'était établi à 3 100 FCFA, soit un rendement de 7,7% au cours du moment. Les investisseurs espèrent une progression similaire pour l'exercice 2025.

Du côté technique, le titre a cassé à la hausse un niveau de résistance important à 41 500 FCFA qui avait freiné plusieurs tentatives de progression ces dernières semaines. Les analystes chartistes voient désormais un objectif court terme à 46 000 FCFA, avec un support désormais placé à 42 000 FCFA.

Il convient toutefois de noter que la liquidité du titre reste limitée, avec des séances parfois sans transaction. Les investisseurs doivent intégrer ce risque de liquidité dans leur analyse avant toute prise de position significative.`,
    category: 'Marché',
    source: 'BRVM Infos',
    author: 'Rédaction Afrivest',
    date: '2026-02-27T16:30:00Z',
    isPositive: true,
    tags: ['SLBC', 'Consommation', 'Hausses'],
    readingTime: 3,
  },
  {
    id: 2,
    title: 'La BRVM franchit les 16 100 milliards de FCFA de capitalisation',
    summary: "La Bourse Régionale des Valeurs Mobilières affiche une capitalisation boursière de 16 105 milliards de FCFA, en progression de 20,81% sur un an.",
    body: `La Bourse Régionale des Valeurs Mobilières (BRVM) a franchi un cap symbolique le 27 février 2026 en affichant une capitalisation boursière globale de 16 105 milliards de FCFA à la clôture de séance. Ce chiffre représente une progression remarquable de 20,81% sur douze mois glissants, témoignant de la dynamique haussière que connaît la place financière de l'Afrique de l'Ouest depuis le début de l'année.

Le BRVM Composite, l'indice de référence regroupant l'ensemble des valeurs cotées, s'est établi à 417,71 points, en hausse de 0,33% sur la séance. Le BRVM 10, qui suit les dix valeurs les plus liquides, a quant à lui progressé de 0,18% à 225,43 points.

Cette performance s'inscrit dans un contexte macroéconomique globalement favorable pour la zone UEMOA. La croissance économique régionale est attendue à 6,2% en 2026 selon les projections du FMI, soutenue par les investissements publics massifs dans les infrastructures, la vigueur du secteur agricole et le développement rapide des services numériques.

"La BRVM bénéficie d'un alignement favorable de plusieurs facteurs : stabilité monétaire grâce au franc CFA, amélioration de la gouvernance des entreprises cotées et intérêt croissant des investisseurs étrangers pour les marchés frontières africains," analyse un économiste de la BCEAO.

La séance du 27 février a enregistré 24 hausses, 18 baisses et 5 valeurs stables parmi les 47 titres cotés. Le volume total échangé s'est établi à 2,3 millions de titres pour une valeur de 1,78 milliard de FCFA.

Sur le marché obligataire, la capitalisation atteint 9 470 milliards de FCFA, avec 14 obligations cotées. Les émetteurs souverains (Côte d'Ivoire, Sénégal, Burkina Faso, Mali) représentent la majorité des encours, avec des maturités allant de 2 à 10 ans et des taux de coupon entre 5,5% et 6,5%.

Les analystes restent constructifs sur les perspectives de la BRVM pour le reste de l'année 2026. Le flux de résultats annuels attendus en mars-avril et les annonces de dividendes qui suivront devraient alimenter l'activité sur le marché du capitaux.`,
    category: 'Indice',
    source: 'BRVM Officiel',
    author: 'Service Communication BRVM',
    date: '2026-02-27T17:00:00Z',
    isPositive: true,
    tags: ['Indices', 'BRVM Composite', 'Capitalisation'],
    readingTime: 4,
  },
  {
    id: 3,
    title: "SODE CI : bond de 7,48%, les investisseurs saluent les perspectives du secteur eau",
    summary: "La Société de Distribution d'Eau de Côte d'Ivoire (SDCC) a progressé de 7,48% à 7 685 FCFA dans un contexte de valorisation croissante des sociétés de services publics.",
    body: `La Société de Distribution d'Eau de Côte d'Ivoire (SDCC), cotée sous le code SDCC à la BRVM, a réalisé l'une des meilleures performances de la séance du 27 février 2026 avec un bond de 7,48% à 7 685 FCFA. Les volumes échangés — 1 876 titres — témoignent d'un intérêt soutenu des opérateurs de marché pour cette valeur du secteur des services publics.

Cette performance s'inscrit dans un contexte de valorisation croissante des sociétés de services essentiels, portées par les projets d'infrastructure du gouvernement ivoirien dans le cadre du Plan National de Développement (PND) 2021-2025. La Côte d'Ivoire s'est engagée à atteindre un taux d'accès à l'eau potable de 100% en milieu urbain d'ici 2030, ce qui représente un carnet de commandes potentiel considérable pour la SODE.

"La SODE bénéficie d'une concession d'État lui assurant des revenus récurrents et prévisibles. C'est exactement le type de profil que recherchent les investisseurs dans un environnement où la visibilité est prime," explique un analyste d'une société de gestion agréée par le CREPMF.

Sur le plan financier, la société a publié des résultats semestriels encourageants mi-2025, avec une hausse du chiffre d'affaires de 11% tirée par la densification du réseau dans les zones périurbaines d'Abidjan et les villes secondaires. Le résultat net est ressorti en progression de 15%, offrant de bonnes perspectives pour le dividende 2025.

La dynamique haussière est également soutenue par une rotation sectorielle observée ces dernières semaines sur la BRVM : des secteurs cycliques comme la banque vers des valeurs plus défensives comme les services publics et la consommation de base. Cette tendance est souvent observée en amont de publications de résultats annuels.

Techniquement, le titre a percé une résistance importante à 7 200 FCFA. Le prochain niveau de résistance est identifié à 8 000 FCFA. En cas de consolidation, le support principal est à 7 200 FCFA.`,
    category: 'Marché',
    source: 'Afrique Finance',
    author: 'Konan Yao',
    date: '2026-02-27T16:45:00Z',
    isPositive: true,
    tags: ['SDCC', 'Services Publics', 'Infrastructure'],
    readingTime: 3,
  },
  {
    id: 4,
    title: "Ecobank Transnational : résultats annuels 2025 en hausse de 12%",
    summary: "ETI a publié ses résultats annuels pour l'exercice 2025. Le bénéfice net consolidé ressort à 1,2 milliard de dollars, en progression de 12%.",
    body: `Ecobank Transnational Incorporated (ETI), la holding panafricaine cotée simultanément à la BRVM, à la Ghana Stock Exchange et à la Nigerian Stock Exchange, a publié le 26 février 2026 ses résultats annuels pour l'exercice clos le 31 décembre 2025. Le groupe affiche une performance robuste qui confirme la solidité de son modèle de banque panafricaine.

Le bénéfice net consolidé s'établit à 1,2 milliard de dollars américains, en progression de 12% par rapport aux 1,07 milliards de dollars enregistrés en 2024. Le produit net bancaire (PNB) ressort à 2,4 milliards de dollars (+9%), soutenu par la progression des revenus de commissions et la hausse des volumes de crédit dans la majorité des pays d'opération.

Le groupe, qui opère dans 33 pays africains avec plus de 700 agences et près de 14 000 collaborateurs, a réussi à maintenir une gestion rigoureuse de ses risques dans un contexte marqué par des défis macroéconomiques dans certains marchés comme le Nigeria et l'Égypte. Le ratio de créances douteuses s'est amélioré à 6,8% contre 7,4% en 2024.

"Ces résultats reflètent l'exécution disciplinée de notre stratégie Élite, centrée sur la croissance rentable, la maîtrise des risques et la transformation digitale," a déclaré Jeremy Awori, Directeur Général du groupe Ecobank.

La direction a proposé un dividende par action de 0,02 dollar, stable par rapport à l'exercice précédent. La décision tient compte de la nécessité de consolider les ratios de capital dans un contexte réglementaire de plus en plus exigeant à l'échelle du continent.

L'action ETIT à la BRVM a réagi positivement à ces publications, progressant de 3,2% dans les échanges de la matinée du 27 février avant de consolider légèrement pour clôturer en hausse de 1,8% à 20 FCFA. Les analystes avaient en général anticipé ces résultats, expliquant la réaction modérée du titre malgré des chiffres supérieurs aux attentes du consensus.

Pour 2026, le groupe cible une croissance du PNB de 10 à 12% et un retour sur fonds propres (ROE) supérieur à 20%, contre 18,7% en 2025.`,
    category: 'Résultats',
    source: 'Ecobank IR',
    author: 'Relations Investisseurs ETI',
    date: '2026-02-26T09:00:00Z',
    isPositive: true,
    tags: ['ETIT', 'Résultats', 'Banque'],
    readingTime: 4,
  },
  {
    id: 5,
    title: "Bank of Africa Niger recule de 2,84%, plus forte baisse de la séance",
    summary: "L'action BOAN a cédé 2,84% à 2 910 FCFA dans des volumes significatifs. Les analystes évoquent une prise de bénéfices sans remise en cause des fondamentaux.",
    body: `L'action Bank of Africa Niger (BOAN) a enregistré la plus forte baisse de la séance du 27 février 2026 sur la BRVM, reculant de 2,84% à 2 910 FCFA dans des volumes significatifs de 19 456 titres échangés — un chiffre nettement supérieur à la moyenne quotidienne du titre.

Cette correction intervient après une série de hausses consécutives qui avait propulsé le titre à un plus haut récent de 3 100 FCFA début février, soit une appréciation de près de 18% en six semaines. Les analystes de marché s'accordent à qualifier ce repli de prise de bénéfices technique, sans remise en cause des fondamentaux solides de l'établissement bancaire.

"BOAN affiche une rentabilité qui figure parmi les meilleures du secteur bancaire régional. Le recul d'aujourd'hui est une correction saine après une progression rapide qui avait peut-être anticipé un peu vite les résultats attendus pour 2025," explique un trader d'une SGI d'Abidjan.

Bank of Africa Niger, filiale du groupe Bank of Africa (BOA), opère dans un environnement nigérien marqué depuis 2023 par des bouleversements politiques suite au coup d'État militaire et par des sanctions internationales de la CEDEAO, depuis levées. Malgré ce contexte difficile, la banque a démontré une résilience remarquable, portée par sa position dominante dans le financement des flux commerciaux et agricoles locaux.

Pour l'exercice 2025, les résultats ne sont pas encore publiés mais les informations préliminaires disponibles auprès des commissaires aux comptes laissent anticiper un résultat net en progression d'environ 8%, grâce notamment à la progression des crédits à l'économie de 14% et à la maîtrise du coût du risque.

Du point de vue de la valorisation, BOAN se négocie à un PER estimé de 7,2x sur la base du résultat 2025 attendu, soit une décote de 20% par rapport à la moyenne des bancaires de la région. Cette décote justifiée en partie par le risque pays reste selon plusieurs analystes une opportunité pour les investisseurs à moyen terme.

Le prochain catalyseur identifié sera la publication des résultats annuels attendue courant mars 2026 et l'annonce du dividende par action.`,
    category: 'Marché',
    source: 'BRVM Infos',
    author: 'Rédaction Afrivest',
    date: '2026-02-27T16:30:00Z',
    isPositive: false,
    tags: ['BOAN', 'Services Financiers', 'Baisses'],
    readingTime: 4,
  },
  {
    id: 6,
    title: "Sonatel : dividende de 1 655 FCFA par action confirmé pour 2025",
    summary: "Sonatel a confirmé le versement d'un dividende net de 1 655 FCFA par action au titre de l'exercice 2025, en hausse de 9%. Date de détachement fixée au 17 mai 2026.",
    body: `Le conseil d'administration de Sonatel (SNTS à la BRVM), le premier opérateur de télécommunications du Sénégal, a annoncé le 25 février 2026 la distribution d'un dividende net de 1 655 FCFA par action au titre de l'exercice 2025, après approbation de l'assemblée générale ordinaire prévue le 28 avril 2026.

Ce dividende représente une progression de 9% par rapport aux 1 519 FCFA versés en 2024, confirmant la politique de distribution généreuse que le groupe maintient depuis de nombreuses années. Sur la base du dernier cours coté de 29 290 FCFA, le rendement sur dividende s'établit à 5,65%, parmi les plus élevés de la cote BRVM pour une grande valeur.

Le calendrier de distribution est le suivant : la date de détachement du coupon est fixée au 17 mai 2026, ce qui signifie que les actionnaires inscrits au registre à la clôture du 16 mai 2026 seront éligibles au dividende. Le paiement effectif est prévu le 27 mai 2026.

Sonatel, filiale à 42% d'Orange SA, a publié des résultats 2025 solides avec un chiffre d'affaires consolidé de 854 milliards de FCFA (+7,8%) et un résultat net part du groupe de 183 milliards de FCFA (+11%). Ces performances ont été tirées par la progression du segment Data Mobile (+23%) et la croissance des services d'Orange Money qui compte désormais plus de 8 millions de clients actifs au Sénégal, Mali, Guinée-Bissau et Sierra Leone.

"Sonatel reste notre recommandation phare sur la BRVM. Le titre combine un rendement élevé, une croissance visible et une liquidité correcte. C'est une valeur de fonds de portefeuille," indique une note de recherche d'une société d'investissement régionale.

L'action a réagi positivement à l'annonce, progressant de 1,2% le jour de la publication. Sur douze mois, SNTS affiche une performance de +18,4%, surperformant le BRVM Composite (+15,1% sur la même période).`,
    category: 'Dividendes',
    source: 'Sonatel IR',
    author: 'Relations Investisseurs Sonatel',
    date: '2026-02-25T14:00:00Z',
    isPositive: true,
    tags: ['SNTS', 'Dividende', 'Télécoms'],
    readingTime: 4,
  },
  {
    id: 7,
    title: "La BCEAO maintient son taux directeur à 3,5% — impact sur le marché obligataire",
    summary: "La BCEAO a décidé de maintenir son taux directeur à 3,5%, influençant les rendements sur le marché obligataire UEMOA avec des taux longs qui se stabilisent autour de 6,2%.",
    body: `Le Comité de Politique Monétaire (CPM) de la Banque Centrale des États de l'Afrique de l'Ouest (BCEAO) a décidé lors de sa réunion du 24 février 2026 de maintenir inchangé le taux directeur à 3,50%, le taux du guichet de prêt marginal à 5,50% et le taux de rémunération des dépôts à 2,50%. Cette décision, conforme aux attentes du marché, vise à soutenir la reprise économique dans la zone tout en préservant la stabilité des prix.

Le taux d'inflation dans l'UEMOA s'est établi à 3,1% en janvier 2026, en décélération par rapport aux 3,8% enregistrés en décembre 2025, grâce notamment à la détente des prix alimentaires et énergétiques. La BCEAO confirme son objectif de ramener l'inflation sous la barre des 3% à l'horizon 2027.

Sur le marché obligataire UEMOA, cette décision se traduit par une stabilisation des rendements sur les maturités longues. Les obligations d'État 10 ans se négocient autour de 6,2% de taux de rendement actuariel, tandis que les 5 ans sont à 5,85%. Ces niveaux, stables depuis plusieurs semaines, offrent des points d'entrée attractifs pour les investisseurs institutionnels régionaux.

"Dans un contexte où les banques centrales des économies développées commencent à assouplir leur politique monétaire, les obligations en zone UEMOA offrent des rendements réels positifs attractifs. Nous observons un intérêt croissant des investisseurs internationaux pour ces émissions," note un spécialiste en valeurs du Trésor d'une grande banque de la place.

À la BRVM, le marché des obligations cotées comprend 14 titres pour une capitalisation de 9 470 milliards de FCFA. Les principaux émetteurs sont la Côte d'Ivoire (3 lignes), le Sénégal (2 lignes) et plusieurs émetteurs corporates comme Ecobank et la BOAD.

Le maintien du taux directeur à ce niveau soutient également la valorisation des actions bancaires cotées à la BRVM, dans la mesure où il préserve les marges d'intermédiation des établissements de crédit. Les valeurs comme SGCI, SGBF ou BICC devraient bénéficier de cet environnement de taux stable.`,
    category: 'Macro',
    source: 'BCEAO',
    author: 'Service Communication BCEAO',
    date: '2026-02-24T11:00:00Z',
    isPositive: true,
    tags: ['BCEAO', 'Obligations', 'Taux'],
    readingTime: 4,
  },
  {
    id: 8,
    title: "Filtisac CI : rendement record de 72% — comprendre un ratio hors norme",
    summary: "Le titre FTSC affiche un rendement sur dividende de 72% selon les données officielles. Une situation exceptionnelle qui nécessite une analyse approfondie.",
    body: `Le titre Filtisac CI (FTSC) fait régulièrement parler de lui en affichant un rendement sur dividende de 72% dans les données publiées par la BRVM. Un chiffre qui interpelle et mérite une explication détaillée pour éviter toute méprise.

Filtisac CI est une société spécialisée dans la fabrication de sacs et emballages en polypropylène, principale filiale ivoirienne du groupe Société Internationale de Plantations d'Hévéas (SIPH). La société a versé un dividende exceptionnel de 1 726,56 FCFA par action en 2025, correspondant à un résultat net exceptionnel lié à la cession d'actifs non stratégiques et à une remontée de réserves accumulées sur plusieurs exercices.

Le calcul du rendement de 72% est obtenu en rapportant ce dividende exceptionnel au cours actuel du titre, qui s'établit à environ 2 390 FCFA. Ce cours particulièrement bas résulte d'une faible liquidité du titre et d'une structure d'actionnariat très concentrée, le groupe SIPH détenant plus de 90% du capital.

"C'est un piège classique pour les investisseurs débutants. Un dividende élevé rapporté à un cours bas donne un rendement mathématiquement impressionnant, mais ce dividende ne sera pas reconduit à ce niveau l'année prochaine," prévient un analyste financier spécialisé sur la BRVM. "Le dividende 'normal' de Filtisac est historiquement de l'ordre de 100 à 150 FCFA."

Pour les exercices précédents hors éléments exceptionnels, le rendement de FTSC se situait entre 5% et 7%, un niveau tout à fait raisonnable dans le contexte régional. L'exercice 2025 constitue donc une anomalie qui ne reflète pas la politique de distribution ordinaire de la société.

Les investisseurs qui souhaitent analyser le titre doivent également tenir compte de la très faible liquidité : les transactions sont rares, parfois avec plusieurs séances sans échange. La formation des cours peut donc donner lieu à des distorsions importantes.

En conclusion, ce cas illustre la nécessité d'aller au-delà des ratios bruts et de comprendre leur construction avant de prendre toute décision d'investissement.`,
    category: 'Analyse',
    source: 'Afrivest Research',
    author: 'Équipe Recherche Afrivest',
    date: '2026-02-26T10:30:00Z',
    isPositive: null,
    tags: ['FTSC', 'Dividende', 'Analyse'],
    readingTime: 4,
  },
  {
    id: 9,
    title: "Orange Côte d'Ivoire : lancement d'une nouvelle offre de Mobile Money",
    summary: "Orange CI annonce l'expansion de ses services financiers mobiles avec le lancement d'une offre de crédit instantané via Orange Money pour ses 15 millions d'abonnés.",
    body: `Orange Côte d'Ivoire (ORAC à la BRVM), premier opérateur mobile de Côte d'Ivoire avec plus de 15 millions d'abonnés, a annoncé le 23 février 2026 le lancement d'une offre de crédit instantané entièrement digitale via sa plateforme Orange Money. Ce nouveau produit baptisé "Orange Crédit" permet aux utilisateurs d'accéder à des micro-prêts de 5 000 à 500 000 FCFA directement depuis leur téléphone mobile, sans déplacement en agence ni justificatif de revenus.

Le système de scoring repose sur l'analyse des comportements de paiement et de recharge des utilisateurs sur les 24 derniers mois, permettant une évaluation quasi-instantanée du profil de risque. Les premiers tests réalisés en phase pilote auprès de 200 000 utilisateurs sélectionnés ont affiché un taux de remboursement supérieur à 94%, dépassant les benchmarks du secteur.

"Ce lancement marque une étape majeure dans notre transformation en opérateur de services financiers. Orange Money n'est plus seulement un porte-monnaie électronique, c'est désormais une plateforme financière complète accessible à tous les Ivoiriens, y compris ceux qui n'ont pas accès au système bancaire traditionnel," a déclaré Alioune Ndiaye, PDG d'Orange Afrique & Moyen-Orient lors d'une conférence de presse à Abidjan.

Sur le plan boursier, cette annonce s'est traduite par une progression de 2,1% du titre ORAC le jour de l'annonce. Les analystes voient dans le développement de la fintech mobile un relai de croissance significatif pour le groupe : les services financiers représentent aujourd'hui 23% des revenus du groupe en Afrique et la trajectoire est clairement haussière.

Pour la Côte d'Ivoire, ce lancement s'inscrit dans une dynamique plus large d'inclusion financière : selon les dernières données de la BCEAO, le taux de bancarisation au sens large (incluant le mobile money) dépasse désormais 60% dans le pays, contre 41% en 2019.

La BRVM, dans son rapport de veille sectorielle, identifie le secteur des télécommunications et de la fintech comme l'un des moteurs de croissance les plus dynamiques de la cote pour les prochaines années, tiré par Orange CI (ORAC), Sonatel (SNTS) et Ecobank (ETIT) dont les activités de banque mobile sont en forte expansion.`,
    category: 'Corporate',
    source: 'Orange CI',
    author: 'Service Presse Orange CI',
    date: '2026-02-23T08:30:00Z',
    isPositive: true,
    tags: ['ORAC', 'Fintech', 'Mobile Money'],
    readingTime: 4,
  },
  {
    id: 10,
    title: "Rapport BRVM : 24 hausses, 18 baisses et 5 valeurs stables à la clôture du 27 février",
    summary: "La séance du 27 février 2026 s'est clôturée avec une majorité de valeurs en progression. Volume total : 2,3 millions de titres pour 1,78 milliard de FCFA.",
    body: `La Bourse Régionale des Valeurs Mobilières a clôturé la séance du jeudi 27 février 2026 sur une note globalement positive. Sur les 47 valeurs cotées au compartiment actions, 24 ont progressé, 18 ont reculé et 5 sont restées inchangées par rapport à la veille. Le volume total échangé s'est établi à 2 316 847 titres pour une valeur de 1,784 milliard de FCFA.

Les plus fortes hausses du jour ont été réalisées par Solibra CI (SLBC, +7,50%), SODE CI (SDCC, +7,48%) et Négoce International Côte d'Ivoire (NEIC, +4,13%). Du côté des baisses, Bank of Africa Niger (BOAN, -2,84%), Total Côte d'Ivoire (TTLC, -2,42%) et Palmci (PALC, -1,96%) ont été les plus affectées.

En termes de liquidité, Bank of Africa Niger s'impose comme la valeur la plus active de la séance avec 19 456 titres échangés, suivie par SGCI Banque (SGCI, 15 230 titres) et Ecobank CI (ECOC, 12 847 titres).

Les indices phares ont terminé la séance en territoire positif : le BRVM Composite gagne 0,33% à 417,71 points, le BRVM 10 avance de 0,18% à 225,43 points. La capitalisation boursière globale progresse de 52 milliards de FCFA à 16 105 milliards de FCFA pour les actions et 9 470 milliards pour les obligations.

Sur le marché obligataire, l'activité a été limitée avec 3 lignes échangées pour un total de 847 titres et une valeur de 84 millions de FCFA. Les obligations souveraines ivoiriennes restent les plus traitées.

Pour la séance de demain (28 février), les analystes anticipent une consolidation après la progression des dernières séances, avec une attention particulière aux résultats d'entreprises attendus dans les prochaines semaines. Le seuil des 418 points sur le BRVM Composite constitue une résistance à surveiller.

La prochaine séance de cotation aura lieu lundi 3 mars 2026 en raison du week-end et du jour férié du 1er mars. Les ordres peuvent être passés jusqu'au dimanche 2 mars 23h59 via les plateformes agréées.`,
    category: 'Marché',
    source: 'BRVM Officiel',
    author: 'Service Cotation BRVM',
    date: '2026-02-27T17:30:00Z',
    isPositive: true,
    tags: ['Résumé marché', 'Volumes', 'Séance'],
    readingTime: 3,
  },
  {
    id: 11,
    title: "Coris Bank International : objectif de cours relevé à 15 500 FCFA",
    summary: "Plusieurs maisons de courtage ont relevé leur objectif de cours sur CBIBF à 15 500 FCFA, soit un potentiel de hausse de 10%. PER de 9,38x inférieur à la moyenne sectorielle.",
    body: `Plusieurs sociétés de gestion et d'intermédiation (SGI) agréées par le CREPMF ont publié ce mois-ci des notes de recherche avec un objectif de cours relevé sur Coris Bank International (CBIBF), la banque burkinabè cotée à la BRVM. Le consensus des objectifs de valorisation se situe désormais autour de 15 500 FCFA, soit un potentiel de hausse de 10% par rapport au dernier cours coté de 14 095 FCFA.

Coris Bank International, fondée en 2008, s'est imposée comme l'un des établissements bancaires les plus dynamiques de l'espace UEMOA. Avec un total bilan de plus de 2 500 milliards de FCFA et un réseau de 90 agences principalement au Burkina Faso mais avec des implantations au Mali, en Côte d'Ivoire et au Sénégal, la banque affiche une croissance soutenue depuis sa création.

Pour l'exercice 2025, Coris Bank International a publié un résultat net de 39,2 milliards de FCFA, en progression de 14% sur un an. Le produit net bancaire ressort à 128 milliards de FCFA (+11%). Ces performances permettent d'afficher un retour sur fonds propres (ROE) de 22,4%, parmi les meilleurs du secteur bancaire régional.

"Coris Bank se distingue par une efficacité opérationnelle remarquable et une politique de risque conservatrice. Le ratio de créances douteuses de 4,2% est inférieur à la moyenne UEMOA de 6,8%. C'est une gestion de qualité," souligne une note de recherche d'une SGI ivoirienne.

En termes de valorisation, CBIBF se négocie à un PER de 9,38x sur la base du résultat 2025, contre une moyenne sectorielle régionale de 12x. Cette décote, qui s'expliquait historiquement par le risque pays lié à la situation sécuritaire au Burkina Faso, tend à se réduire à mesure que la banque diversifie ses revenus hors du marché burkinabè.

Le dividende proposé pour 2025 est de 600 FCFA par action (+9% vs 2024), soit un rendement de 4,3% au cours actuel. La date de mise en paiement est attendue pour juin 2026.

Les principaux risques à surveiller restent la situation sécuritaire régionale, le risque de contrepartie sur les financements aux PME et l'évolution de l'environnement réglementaire bancaire dans l'UEMOA.`,
    category: 'Analyse',
    source: 'Afrivest Research',
    author: 'Équipe Recherche Afrivest',
    date: '2026-02-22T09:15:00Z',
    isPositive: true,
    tags: ['CBIBF', 'Analyse', 'Banque'],
    readingTime: 4,
  },
  {
    id: 12,
    title: "UEMOA : la croissance économique attendue à 6,2% en 2026",
    summary: "Selon les projections du FMI, la zone UEMOA devrait enregistrer une croissance du PIB de 6,2% en 2026, soutenue par les investissements publics et le secteur des services.",
    body: `Les dernières projections économiques publiées par le Fonds Monétaire International (FMI) dans le cadre de son rapport régional sur l'Afrique Subsaharienne anticipent une croissance du PIB de la zone UEMOA de 6,2% en 2026, après 5,8% en 2025. Cette accélération attendue place la région parmi les zones de croissance les plus dynamiques du continent africain.

Plusieurs moteurs soutiennent cette trajectoire positive. D'abord, les investissements publics dans les infrastructures restent à un niveau historiquement élevé : routes, ports, énergie et télécommunications bénéficient de financements importants de la part des États membres, de la BOAD et des partenaires bilatéraux comme la Chine et la France. La Côte d'Ivoire seule prévoit des investissements publics de 4 200 milliards de FCFA en 2026.

Ensuite, la vigueur du secteur agricole constitue un pilier majeur. Les campagnes cacaoyère et cotonière 2025-2026 s'annoncent excellentes, avec des prix mondiaux qui restent bien orientés. La Côte d'Ivoire et le Ghana, ensemble premiers producteurs mondiaux de cacao, bénéficient d'un effet prix favorable.

Le secteur des services, porté par l'essor du numérique, de la fintech et du commerce électronique, contribue de plus en plus à la croissance. Les télécommunications, avec la montée en puissance des réseaux 4G et les déploiements 5G en cours au Sénégal et en Côte d'Ivoire, représentent un moteur structurel.

"Un environnement macroéconomique aussi favorable est un vent de dos puissant pour les entreprises cotées à la BRVM. La croissance économique se traduit généralement par des progressions des chiffres d'affaires et des résultats, ce qui soutient les valorisations boursières," commente un économiste de marché.

Les risques identifiés par le FMI incluent la persistance de l'insécurité dans le Sahel (Mali, Burkina Faso, Niger), les tensions inflationnistes liées aux prix de l'énergie et des denrées alimentaires importées, ainsi que le durcissement potentiel des conditions financières mondiales si la Fed et la BCE tardaient à baisser leurs taux.

Dans ce contexte, la BRVM devrait continuer de bénéficier d'afflux de capitaux de la part d'investisseurs régionaux et étrangers à la recherche d'actifs en croissance et sous-valorisés par rapport aux marchés émergents plus classiques.`,
    category: 'Macro',
    source: 'FMI / BCEAO',
    author: 'Desk Macro Afrivest',
    date: '2026-02-20T14:00:00Z',
    isPositive: true,
    tags: ['UEMOA', 'Macro', 'Croissance'],
    readingTime: 4,
  },
]

export const CATEGORIES = ['Tous', 'Marché', 'Résultats', 'Dividendes', 'Analyse', 'Corporate', 'Macro', 'Indice']

export function getNewsById(id: number): NewsItem | undefined {
  return MOCK_NEWS.find(n => n.id === id)
}

export function getRelatedNews(item: NewsItem, count = 3): NewsItem[] {
  return MOCK_NEWS
    .filter(n => n.id !== item.id && (
      n.category === item.category ||
      n.tags.some(t => item.tags.includes(t))
    ))
    .slice(0, count)
}
