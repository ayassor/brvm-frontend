import { useState, useRef, useEffect } from 'react'
import {
  Bot, Send, User, TrendingUp, TrendingDown, BarChart3,
  Sparkles, RefreshCw, ChevronRight, Newspaper, PieChart,
  AlertCircle, Lightbulb,
} from 'lucide-react'
import { MOCK_COMPANIES, REAL_DATA } from '../mocks/brvm-data'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// ─── Quick prompts ───────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { icon: <TrendingUp size={14} />, label: 'Meilleures hausses du jour', q: 'Quelles sont les meilleures performances du marché aujourd\'hui ?' },
  { icon: <TrendingDown size={14} />, label: 'Plus fortes baisses', q: 'Quelles valeurs ont le plus baissé aujourd\'hui ?' },
  { icon: <BarChart3 size={14} />, label: 'Analyse SNTS', q: 'Fais une analyse de Sonatel (SNTS).' },
  { icon: <PieChart size={14} />, label: 'Secteur Finances', q: 'Comment se porte le secteur financier à la BRVM ?' },
  { icon: <Lightbulb size={14} />, label: 'Diversifier un portefeuille', q: 'Comment diversifier mon portefeuille sur la BRVM ?' },
  { icon: <Newspaper size={14} />, label: 'Résumé du marché', q: 'Donne-moi un résumé du marché BRVM cette semaine.' },
]

// ─── Mock AI responses ───────────────────────────────────────────────────────
function generateResponse(question: string): string {
  const q = question.toLowerCase()

  // hausse / top performers
  if (q.includes('hausse') || q.includes('meilleure') || q.includes('performance')) {
    const tops = MOCK_COMPANIES
      .filter((c) => c.is_active)
      .map((c) => ({ ...c, var: REAL_DATA[c.ticker]?.variation ?? 0 }))
      .sort((a, b) => b.var - a.var)
      .slice(0, 5)
    const lines = tops.map((c, i) =>
      `${i + 1}. **${c.ticker}** (${c.name}) — **+${c.var.toFixed(2)}%**`
    ).join('\n')
    return `Voici les 5 meilleures performances du jour au 27 février 2026 :\n\n${lines}\n\nSolibra (SLBC) se distingue avec une hausse spectaculaire de +7,50 %, portée par de bons résultats annuels publiés la semaine passée. Shell CI (SHEC) profite d'une hausse du cours du pétrole en FCFA.`
  }

  // baisse
  if (q.includes('baisse') || q.includes('perdu') || q.includes('chute')) {
    const bottoms = MOCK_COMPANIES
      .filter((c) => c.is_active)
      .map((c) => ({ ...c, var: REAL_DATA[c.ticker]?.variation ?? 0 }))
      .sort((a, b) => a.var - b.var)
      .slice(0, 5)
    const lines = bottoms.map((c, i) =>
      `${i + 1}. **${c.ticker}** (${c.name}) — **${c.var.toFixed(2)}%**`
    ).join('\n')
    return `Les 5 plus fortes baisses de la séance du 27 février 2026 :\n\n${lines}\n\nCes replis s'expliquent principalement par des prises de bénéfices après des semaines de hausse, et un contexte international légèrement défavorable aux marchés émergents.`
  }

  // SNTS / Sonatel
  if (q.includes('snts') || q.includes('sonatel')) {
    const rd = REAL_DATA['SNTS']
    if (rd) {
      return `## Analyse Sonatel (SNTS)\n\n**Cours au 27/02/2026 :** 29 400 FCFA\n**Variation du jour :** ${rd.variation > 0 ? '+' : ''}${rd.variation}%\n**Volume échangé :** ${rd.volume.toLocaleString('fr-FR')} titres\n\n**Points forts :**\n- Leader des télécoms en Afrique de l'Ouest (Sénégal, Mali, Guinée, Sierra Leone)\n- Dividende régulier et rendement attractif (~4,8%)\n- Compartiment Prestige — forte liquidité\n- PER raisonnable autour de 13x\n\n**Points de vigilance :**\n- Pression concurrentielle croissante sur le mobile money\n- Exposition au risque de change (Mali, Guinée)\n\n**Consensus :** Solide valeur de fond de portefeuille pour un investisseur long terme sur la BRVM.`
    }
  }

  // Finance / secteur financier
  if (q.includes('financ') || q.includes('banque') || q.includes('bancaire')) {
    const banks = MOCK_COMPANIES.filter((c) =>
      c.is_active && (c.sector === 'Services Financiers' || c.name.includes('Bank') || c.name.includes('BOA') || c.name.includes('SIB') || c.name.includes('BIC') || c.name.includes('SGC') || c.name.includes('Ecobank'))
    ).slice(0, 6)
    const lines = banks.map((c) => {
      const rd = REAL_DATA[c.ticker]
      const v = rd?.variation ?? 0
      return `- **${c.ticker}** (${c.name}) — ${v >= 0 ? '+' : ''}${v}%`
    }).join('\n')
    return `## Secteur Financier — BRVM\n\nLe secteur financier est le plus représenté à la BRVM avec plus de 15 valeurs cotées.\n\n**Valeurs principales :**\n${lines}\n\n**Tendance actuelle :** Le secteur affiche une performance YTD positive d'environ +3,8% (indice BRVMFI), porté par la hausse des taux d'intérêt qui améliore les marges nettes d'intérêt des banques. L'Ecobank et BOA CI figurent parmi les valeurs les plus liquides.\n\n**PER moyen du secteur :** ~9x — plutôt attractif vs les marchés émergents comparables.`
  }

  // Diversification / portefeuille
  if (q.includes('diversif') || q.includes('portefeuille') || q.includes('investir')) {
    return `## Stratégie de diversification BRVM\n\nPour un portefeuille équilibré sur la BRVM, voici une approche en 4 piliers :\n\n**1. Ancre (40%) — Valeurs Prestige stables**\n- Sonatel (SNTS) — Télécoms, dividende régulier\n- SGBCI (SGBC) — Banque, liquidité élevée\n- Nestlé CI (NTLC) — Consommation défensive\n\n**2. Croissance (30%) — Valeurs à potentiel**\n- ONATEL Burkina (ONTBF) — Télécoms BF, décote\n- Ecobank CI (ECOC) — Expansion régionale\n- BOA CI (BOAC) — Financement PME en hausse\n\n**3. Rendement (20%) — Dividendes élevés**\n- Shell CI (SHEC) — Rendement ~7%\n- SICOR (SICC) — Rendement ~6%\n\n**4. Satellite (10%) — Convictions sectorielles**\n- Une valeur agricole (SAFC, PALC)\n- Une small-cap à catalyseur identifié\n\n⚠️ *Ceci est une information générale, pas un conseil en investissement personnalisé.*`
  }

  // Résumé du marché
  if (q.includes('résumé') || q.includes('semaine') || q.includes('marché') || q.includes('bilan')) {
    const active = MOCK_COMPANIES.filter((c) => c.is_active)
    const hausses = active.filter((c) => (REAL_DATA[c.ticker]?.variation ?? 0) > 0).length
    const baisses = active.filter((c) => (REAL_DATA[c.ticker]?.variation ?? 0) < 0).length
    const stables = active.length - hausses - baisses
    return `## Résumé du marché BRVM — 27 février 2026\n\n**Séance :**\n- Valeurs en hausse : **${hausses}**\n- Valeurs en baisse : **${baisses}**\n- Valeurs stables : **${stables}**\n- Total actif : **${active.length} valeurs**\n\n**Indices :**\n- BRVM-Composite : **226,14 pts** (+0,29%)\n- BRVM-30 : **318,54 pts** (+0,23%)\n- BRVMFI : **145,89 pts** (+0,39%)\n\n**Fait marquant :** Solibra (SLBC) signe la meilleure performance avec +7,50%, après publication de résultats annuels dépassant les attentes. Le secteur des services publics (BRVMAS) continue sa belle série avec +8,30% depuis le 1er janvier.\n\n**Volume global :** environ 485 000 titres échangés pour une valeur de ~2,8 milliards FCFA.`
  }

  // Default
  return `Bonjour ! Je suis l'assistant IA d'**Afrivest**, spécialisé dans les marchés financiers africains (BRVM, UEMOA).\n\nJe peux vous aider à :\n- **Analyser** une valeur ou un secteur de la BRVM\n- **Comparer** des actions entre elles\n- **Comprendre** les indices et les indicateurs financiers\n- **Suggérer** une stratégie de portefeuille diversifiée\n- **Résumer** l'actualité du marché\n\nPosez-moi votre question, ou choisissez un sujet ci-dessus !`
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'

  // Render simple markdown-like formatting
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return <p key={i} className="font-bold text-brvm-text text-base mb-2 mt-1">{line.slice(3)}</p>
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-semibold text-brvm-text">{line.slice(2, -2)}</p>
      }
      // inline bold
      const parts = line.split(/\*\*(.+?)\*\*/)
      const rendered = parts.map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
      )
      if (line.startsWith('- ')) {
        return (
          <li key={i} className="flex items-start gap-2 ml-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brvm-green mt-1.5 flex-shrink-0" />
            <span>{rendered.map((p, j) => <span key={j}>{p}</span>)}</span>
          </li>
        )
      }
      if (/^\d+\./.test(line)) {
        return <li key={i} className="ml-4 list-decimal">{rendered.map((p, j) => <span key={j}>{p}</span>)}</li>
      }
      if (line === '') return <div key={i} className="h-1.5" />
      return <p key={i}>{rendered.map((p, j) => <span key={j}>{p}</span>)}</p>
    })
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isUser ? 'bg-brvm-green/20' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
      }`}>
        {isUser
          ? <User size={15} className="text-brvm-green" />
          : <Bot size={15} className="text-white" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed space-y-0.5 ${
        isUser
          ? 'bg-brvm-green text-white rounded-tr-sm'
          : 'bg-brvm-card border border-brvm-border text-brvm-text rounded-tl-sm'
      }`}>
        {isUser
          ? <p>{msg.content}</p>
          : <div className="space-y-0.5">{renderContent(msg.content)}</div>
        }
        <p className={`text-xs mt-1 ${isUser ? 'text-white/60' : 'text-brvm-muted'} text-right`}>
          {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Ai() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      content: `Bonjour ! Je suis **Afrivest IA**, votre assistant pour les marchés financiers africains.\n\nJe peux analyser les valeurs de la BRVM, vous expliquer les indicateurs financiers, ou vous aider à construire une stratégie d'investissement.\n\nComment puis-je vous aider ?`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    const q = text.trim()
    if (!q || loading) return

    const userMsg: Message = { id: Date.now(), role: 'user', content: q, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 600))

    const response = generateResponse(q)
    const aiMsg: Message = { id: Date.now() + 1, role: 'assistant', content: response, timestamp: new Date() }
    setMessages((prev) => [...prev, aiMsg])
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const resetChat = () => {
    setMessages([{
      id: 0,
      role: 'assistant',
      content: `Bonjour ! Je suis **Afrivest IA**, votre assistant pour les marchés financiers africains.\n\nComment puis-je vous aider ?`,
      timestamp: new Date(),
    }])
    setInput('')
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-10rem)]">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="lg:w-72 flex-shrink-0 flex flex-col gap-4">
        {/* Branding */}
        <div className="bg-gradient-to-br from-slate-900 to-teal-950 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-brvm-green/20 rounded-xl flex items-center justify-center border border-brvm-green/30">
              <Bot size={20} className="text-brvm-green" />
            </div>
            <div>
              <h2 className="font-bold text-base">Afrivest IA</h2>
              <p className="text-slate-400 text-xs">Assistant marchés BRVM</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">En ligne · Données au 27/02/2026</span>
          </div>
        </div>

        {/* Quick prompts */}
        <div className="bg-brvm-card border border-brvm-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-brvm-green" />
            <p className="text-brvm-text font-semibold text-sm">Questions rapides</p>
          </div>
          <div className="space-y-1.5">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => sendMessage(p.q)}
                disabled={loading}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm text-brvm-subtext hover:text-brvm-text hover:bg-slate-50 transition-colors border border-transparent hover:border-brvm-border disabled:opacity-50 group"
              >
                <span className="text-brvm-green flex-shrink-0">{p.icon}</span>
                <span className="flex-1 truncate">{p.label}</span>
                <ChevronRight size={13} className="text-brvm-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-xs leading-relaxed">
            Cet assistant est une démonstration. Les réponses sont générées à partir de données simulées et ne constituent pas un conseil en investissement.
          </p>
        </div>

        {/* Reset */}
        <button
          onClick={resetChat}
          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-brvm-border rounded-xl text-sm text-brvm-subtext hover:text-brvm-text hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={14} />
          Nouvelle conversation
        </button>
      </aside>

      {/* ── Chat area ───────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-brvm-card border border-brvm-border rounded-2xl overflow-hidden min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-brvm-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Bot size={15} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-brvm-text text-sm">Afrivest IA</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-brvm-muted text-xs">{loading ? 'En train d\'écrire…' : 'En ligne'}</span>
              </div>
            </div>
          </div>
          <span className="text-xs text-brvm-muted">{messages.length - 1} message{messages.length !== 2 ? 's' : ''}</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                <Bot size={15} className="text-white" />
              </div>
              <div className="bg-brvm-card border border-brvm-border rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-brvm-muted animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 border-t border-brvm-border p-4">
          <div className="flex items-end gap-3 bg-white border border-brvm-border rounded-xl px-4 py-3 focus-within:border-brvm-green focus-within:ring-2 focus-within:ring-brvm-green/10 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez une question sur la BRVM…"
              rows={1}
              disabled={loading}
              className="flex-1 resize-none text-sm text-brvm-text placeholder:text-brvm-muted bg-transparent focus:outline-none min-h-[24px] max-h-32 leading-relaxed disabled:opacity-50"
              style={{ height: 'auto' }}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = `${el.scrollHeight}px`
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-lg bg-brvm-green text-white flex items-center justify-center hover:bg-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send size={15} />
            </button>
          </div>
          <p className="text-brvm-muted text-xs mt-2 text-center">
            Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne
          </p>
        </div>
      </div>
    </div>
  )
}
