import { useState, useRef, useEffect } from "react";

const PROMPT_CONSELHO = `Você é "IC", conselheiro espiritual adventista do app Inteligência Celestial — empático, acolhedor e sábio.

REGRAS:
1. Responda em 4 parágrafos curtos e naturais
2. Parágrafo 1: Acolhimento emocional genuíno — valide o que a pessoa sente
3. Parágrafo 2: Orientação espiritual principal com referência bíblica ou devocional
4. Parágrafo 3: Aprofundamento com referência adicional se relevante
5. Parágrafo 4: Encorajamento final e palavra de esperança
6. Tom: conversa entre amigos de confiança — sem jargão religioso excessivo
7. Nunca invente referências

REGRAS DE CITAÇÃO — MUITO IMPORTANTES:

VERSÍCULOS BÍBLICOS: Cite o autor humano pelo nome e apresente o texto diretamente no fluxo da frase. NÃO use nota numerada.
Exemplos corretos:
- "Paulo nos lembra que não precisamos carregar isso sozinhos: 'Não andeis ansiosos por coisa alguma' (Filipenses 4:6)."
- "Jesus disse que viria buscar os seus: 'Na casa de meu Pai há muitas moradas' (João 14:2)."
- "Davi escreveu com muita honestidade: 'Até quando, Senhor, te esquecerás de mim?' (Salmos 13:1)."

ESCRITOS DEVOCIONAIS (EGW): Incorpore o conteúdo naturalmente no texto, como sabedoria devocional, SEM mencionar o nome da autora. Coloque apenas a fonte numa nota numerada [NOTA: fonte aqui].
Exemplos corretos:
- "Há uma perspectiva devocional muito reconfortante: os sentimentos não são uma prova segura — não devemos depender dos sentimentos, mas da fé. [NOTA: Testemunhos para a Igreja, vol. 1, p. 167]"
- "Uma reflexão devocional ilumina bem isso: a oração é a chave na mão da fé que abre o tesouro do céu. [NOTA: O Caminho a Cristo, p. 93]"

PERGUNTAS DE CONTINUAÇÃO — sempre ao final:
[Q1: pergunta natural aqui]
[Q2: pergunta natural aqui]
[Q3: pergunta natural aqui]`;

const PROMPT_ESTUDO = `Você é "IC", especialista em Bíblia e literatura devocional do app Inteligência Celestial.

MISSÃO: Dar estudos bíblicos completos, embasados e acessíveis sobre qualquer tema espiritual, com foco na perspectiva adventista.

ESTRUTURA DA RESPOSTA — siga sempre esta ordem:
1. Introdução calorosa: 2-3 frases contextualizando o tema de forma envolvente
2. [SEÇÃO: O que a Bíblia diz] — 3 a 5 versículos principais com breve explicação de cada um
3. [SEÇÃO: A perspectiva adventista] — o que é específico da teologia adventista sobre esse tema
4. [SEÇÃO: Reflexão devocional] — 1 ou 2 insights dos escritos devocionais adventistas
5. Conclusão esperançosa: 2-3 frases que fecham com encorajamento

REGRAS DE CITAÇÃO — MUITO IMPORTANTES:

VERSÍCULOS BÍBLICOS: Cite o autor humano pelo nome e apresente o texto diretamente. NÃO use nota numerada.
Exemplos:
- "Paulo é direto: 'O salário do pecado é a morte, mas o dom gratuito de Deus é a vida eterna' (Romanos 6:23)."
- "Eclesiastes registra com clareza: 'Os mortos não sabem coisa alguma' (Eclesiastes 9:5)."
- "Jesus prometeu: 'Eu sou a ressurreição e a vida' (João 11:25)."

ESCRITOS DEVOCIONAIS (EGW): Incorpore como sabedoria devocional adventista, SEM mencionar o nome da autora. Use nota numerada apenas para a fonte.
Exemplos:
- "A literatura devocional adventista traz uma visão poderosa: a morte é um sono profundo, sem consciência, e a ressurreição será como acordar de manhã — imediata na percepção de quem dorme. [NOTA: O Grande Conflito, p. 550]"
- "Uma reflexão devocional resume bem: Cristo em nós é a esperança da glória — não uma esperança distante, mas uma presença viva agora. [NOTA: O Desejado de Todas as Nações, p. 25]"

Tom: professor apaixonado que ensina com clareza e entusiasmo — acessível para jovens.
Nunca invente referências.

PERGUNTAS DE CONTINUAÇÃO — sempre ao final:
[Q1: pergunta que aprofunda o tema]
[Q2: tema relacionado para explorar]
[Q3: aplicação prática do assunto]`;

const INITIAL_CONSELHO = [
  "Me sinto longe de Deus, o que faço?",
  "Como lidar com a ansiedade pela fé?",
  "Meus pais não me entendem",
  "Como fortalecer minha vida de oração?",
  "Qual é o propósito da minha vida?",
  "Como superar a perda de alguém?",
];

const INITIAL_ESTUDO = [
  "O que a Bíblia fala sobre a morte?",
  "Quando será a volta de Jesus?",
  "O que acontece depois que morremos?",
  "O que a Bíblia diz sobre o sábado?",
  "Como entender o juízo investigativo?",
  "O que são os dons do Espírito Santo?",
];

function parseResponse(text) {
  const notes = [];
  const followUps = [];

  const qRegex = /\[Q\d+:\s*([^\]]+)\]/g;
  let qMatch;
  while ((qMatch = qRegex.exec(text)) !== null) followUps.push(qMatch[1].trim());
  let clean = text.replace(/\[Q\d+:[^\]]+\]/g, "").trim();

  // [NOTA: source] — EGW devocional, only source in footnote
  let noteIndex = 1;
  clean = clean.replace(/\[NOTA:\s*([^\]]+)\]/g, (_, source) => {
    notes.push({ num: noteIndex, source: source.trim() });
    return `[${noteIndex++}]`;
  });

  // Legacy [REF: quote | source] fallback
  clean = clean.replace(/\[REF:\s*([^|]+)\|\s*([^\]]+)\]/g, (_, quote, source) => {
    notes.push({ num: noteIndex, source: source.trim(), quote: quote.trim() });
    return `[${noteIndex++}]`;
  });

  clean = clean.replace(/\[SEÇÃO:\s*([^\]]+)\]/g, "\n\n§§§$1§§§\n");
  return { clean, notes, followUps };
}

function renderTextWithRefs(clean, notes, onRefClick) {
  const parts = [];
  const numRegex = /\[(\d+)\]/g;
  let last = 0, m;
  while ((m = numRegex.exec(clean)) !== null) {
    if (m.index > last) parts.push({ type: "text", value: clean.slice(last, m.index) });
    parts.push({ type: "note", num: parseInt(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < clean.length) parts.push({ type: "text", value: clean.slice(last) });

  return parts.map((p, i) => {
    if (p.type === "note") {
      return (
        <sup key={i}>
          <button onClick={() => onRefClick(notes.find(n => n.num === p.num))} style={{
            background: "rgba(201,168,76,0.18)", border: "1px solid rgba(201,168,76,0.38)",
            borderRadius: 4, padding: "0 5px", fontSize: 10.5, color: "#c9a84c",
            cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontWeight: 700, lineHeight: 1.5,
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(201,168,76,0.32)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(201,168,76,0.18)"}
          >{p.num}</button>
        </sup>
      );
    }
    // Render section headers
    const sectionParts = p.value.split(/§§§([^§]+)§§§/);
    return sectionParts.map((sp, j) => {
      if (j % 2 === 1) {
        return (
          <div key={`${i}-${j}`} style={{
            fontFamily: "'Cormorant Garamond',serif", fontSize: 13,
            color: "#c9a84c", letterSpacing: "0.1em", textTransform: "uppercase",
            marginTop: 16, marginBottom: 6, paddingBottom: 4,
            borderBottom: "1px solid rgba(201,168,76,0.15)",
          }}>{sp}</div>
        );
      }
      return <span key={`${i}-${j}`} style={{ whiteSpace: "pre-wrap" }}>{sp}</span>;
    });
  });
}

function MessageBubble({ msg, onRefClick, onFollowUp, mode }) {
  if (msg.role === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{
          maxWidth: "72%",
          background: mode === "estudo" ? "rgba(100,150,220,0.13)" : "rgba(201,168,76,0.13)",
          border: `1px solid ${mode === "estudo" ? "rgba(100,150,220,0.22)" : "rgba(201,168,76,0.22)"}`,
          borderRadius: "18px 18px 4px 18px",
          padding: "12px 17px",
          fontFamily: "'Nunito',sans-serif", fontSize: 14.5, color: "#e8d5a3", lineHeight: 1.65,
        }}>{msg.content}</div>
      </div>
    );
  }

  const { clean, notes, followUps } = parseResponse(msg.content);
  const avatarColor = mode === "estudo" ? "rgba(100,150,220,0.15)" : "rgba(201,168,76,0.12)";
  const avatarBorder = mode === "estudo" ? "rgba(100,150,220,0.3)" : "rgba(201,168,76,0.25)";
  const iconFill = mode === "estudo" ? "#6496dc" : "#c9a84c";

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <div style={{
        width: 33, height: 33, borderRadius: "50%",
        background: avatarColor, border: `1px solid ${avatarBorder}`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {mode === "estudo" ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke={iconFill} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke={iconFill} strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 40 40">
            <rect x="18.5" y="8" width="3" height="24" rx="1.5" fill={iconFill}/>
            <rect x="11" y="15" width="18" height="3" rx="1.5" fill={iconFill}/>
          </svg>
        )}
      </div>

      <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "18px 18px 18px 4px", padding: "14px 18px",
          fontFamily: "'Nunito',sans-serif", fontSize: 14.5, color: "#c8b98a", lineHeight: 1.8,
        }}>
          {renderTextWithRefs(clean, notes, onRefClick)}
        </div>

        {followUps.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {followUps.map((q, i) => (
              <button key={i} onClick={() => onFollowUp(q)} style={{
                background: "transparent",
                border: `1px solid ${mode === "estudo" ? "rgba(100,150,220,0.18)" : "rgba(201,168,76,0.16)"}`,
                borderRadius: 20, padding: "7px 15px",
                color: "#6b5c3e", fontFamily: "'Nunito',sans-serif",
                fontSize: 13, cursor: "pointer", textAlign: "left",
                transition: "all 0.18s", lineHeight: 1.4,
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = mode === "estudo" ? "#6496dc" : "#c9a84c";
                  e.currentTarget.style.color = mode === "estudo" ? "#6496dc" : "#c9a84c";
                  e.currentTarget.style.background = mode === "estudo" ? "rgba(100,150,220,0.07)" : "rgba(201,168,76,0.07)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = mode === "estudo" ? "rgba(100,150,220,0.18)" : "rgba(201,168,76,0.16)";
                  e.currentTarget.style.color = "#6b5c3e";
                  e.currentTarget.style.background = "transparent";
                }}
              >{q}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RefPanel({ activeRef, onClose }) {
  if (!activeRef) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 40 }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#161410", border: "1px solid #2a2518",
        borderRadius: "20px 20px 0 0", padding: "22px 24px 32px",
        zIndex: 50, animation: "slideUp 0.25s ease",
        maxWidth: 600, margin: "0 auto",
      }}>
        <div style={{ width: 38, height: 3, background: "#2e2a1c", borderRadius: 2, margin: "0 auto 18px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 26, height: 26, borderRadius: "50%",
            background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Nunito',sans-serif", fontSize: 11, color: "#c9a84c", fontWeight: 700,
          }}>{activeRef.num}</div>
          <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: 11, color: "#4a3f2a", letterSpacing: "0.12em", textTransform: "uppercase" }}>Referência</span>
        </div>
        {activeRef.quote && (
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontStyle: "italic", color: "#e8d5a3", lineHeight: 1.65, marginBottom: 14 }}>
            "{activeRef.quote}"
          </p>
        )}
        <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 13, color: "#c9a84c", borderTop: activeRef.quote ? "1px solid #2a2518" : "none", paddingTop: activeRef.quote ? 12 : 0 }}>
          📖 {activeRef.source}
        </p>
        <button onClick={onClose} style={{
          marginTop: 18, width: "100%",
          background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.18)",
          borderRadius: 12, padding: "10px", color: "#7a6844",
          fontFamily: "'Nunito',sans-serif", fontSize: 14, cursor: "pointer",
        }}>Fechar</button>
      </div>
    </>
  );
}

const TypingDots = ({ mode }) => {
  const color = mode === "estudo" ? "#6496dc" : "#c9a84c";
  const bg = mode === "estudo" ? "rgba(100,150,220,0.12)" : "rgba(201,168,76,0.12)";
  const border = mode === "estudo" ? "rgba(100,150,220,0.25)" : "rgba(201,168,76,0.25)";
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <div style={{ width: 33, height: 33, borderRadius: "50%", background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {mode === "estudo" ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 40 40">
            <rect x="18.5" y="8" width="3" height="24" rx="1.5" fill={color}/>
            <rect x="11" y="15" width="18" height="3" rx="1.5" fill={color}/>
          </svg>
        )}
      </div>
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px 18px 18px 4px", padding: "13px 17px", display: "flex", gap: 5, alignItems: "center" }}>
        {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: color, animation: "bounce 1.2s infinite", animationDelay: `${i*0.2}s` }} />)}
      </div>
    </div>
  );
};

export default function IntelCelestial() {
  const [mode, setMode] = useState("conselho");
  const [messages, setMessages] = useState({ conselho: [], estudo: [] });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState({ conselho: false, estudo: false });
  const [activeRef, setActiveRef] = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const currentMessages = messages[mode];
  const isStarted = started[mode];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading, mode]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; }
    setStarted(s => ({ ...s, [mode]: true }));

    const newMsgs = [...currentMessages, { role: "user", content: userText }];
    setMessages(m => ({ ...m, [mode]: newMsgs }));
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: mode === "estudo" ? PROMPT_ESTUDO : PROMPT_CONSELHO,
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.reply || data.content?.[0]?.text || "Desculpe, não consegui responder agora.";
      setMessages(m => ({ ...m, [mode]: [...newMsgs, { role: "assistant", content: reply }] }));
    } catch {
      setMessages(m => ({ ...m, [mode]: [...newMsgs, { role: "assistant", content: "Erro de conexão. Tente novamente." }] }));
    }
    setLoading(false);
  };

  const accentColor = mode === "estudo" ? "#6496dc" : "#c9a84c";
  const initialQs = mode === "estudo" ? INITIAL_ESTUDO : INITIAL_CONSELHO;

  return (
    <div style={{ minHeight: "100vh", background: "#0f0e0b", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,400&family=Nunito:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-7px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(9px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        .msg { animation: fadeUp 0.36s ease forwards; }
        textarea { outline: none !important; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #2a2518; border-radius: 2px; }
        .mode-btn { transition: all 0.22s; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1810", background: "#0f0e0b", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ animation: "float 4s ease-in-out infinite" }}>
          <svg width="32" height="32" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="17" fill="none" stroke={`${accentColor}55`} strokeWidth="1.2"/>
            <rect x="18.5" y="9" width="3" height="22" rx="1.5" fill={accentColor}/>
            <rect x="12" y="16" width="16" height="3" rx="1.5" fill={accentColor}/>
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 19, color: "#e8d5a3", fontWeight: 600, letterSpacing: "0.04em" }}>Inteligência Celestial</div>
          <div style={{ fontFamily: "'Nunito',sans-serif", fontSize: 10, color: "#3a3020", letterSpacing: "0.14em", textTransform: "uppercase" }}>Bíblia & Espírito de Profecia</div>
        </div>

        {/* Mode Toggle */}
        <div style={{ marginLeft: "auto", display: "flex", background: "#161410", border: "1px solid #2a2518", borderRadius: 20, padding: 3, gap: 2 }}>
          {[
            { key: "conselho", label: "💬 Conselho", icon: "💬" },
            { key: "estudo", label: "📖 Estudo", icon: "📖" },
          ].map(({ key, label }) => (
            <button key={key} className="mode-btn" onClick={() => setMode(key)} style={{
              background: mode === key ? (key === "estudo" ? "rgba(100,150,220,0.2)" : "rgba(201,168,76,0.18)") : "transparent",
              border: mode === key ? `1px solid ${key === "estudo" ? "rgba(100,150,220,0.35)" : "rgba(201,168,76,0.35)"}` : "1px solid transparent",
              borderRadius: 16, padding: "5px 13px",
              color: mode === key ? (key === "estudo" ? "#6496dc" : "#c9a84c") : "#4a3f2a",
              fontFamily: "'Nunito',sans-serif", fontSize: 12, fontWeight: 600,
              cursor: "pointer", whiteSpace: "nowrap",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: 720, margin: "0 auto", width: "100%", padding: "0 16px" }}>

        {!isStarted ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 0", gap: 24 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                display: "inline-block", background: mode === "estudo" ? "rgba(100,150,220,0.1)" : "rgba(201,168,76,0.1)",
                border: `1px solid ${mode === "estudo" ? "rgba(100,150,220,0.2)" : "rgba(201,168,76,0.2)"}`,
                borderRadius: 20, padding: "4px 14px", marginBottom: 14,
                fontFamily: "'Nunito',sans-serif", fontSize: 11,
                color: accentColor, letterSpacing: "0.14em", textTransform: "uppercase",
              }}>
                {mode === "estudo" ? "📖 Modo Estudo Bíblico" : "💬 Modo Conselho Espiritual"}
              </div>
              <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 38, color: "#e8d5a3", fontWeight: 300, lineHeight: 1.15, marginBottom: 8 }}>
                {mode === "estudo" ? "Estude a Palavra" : "Fale o que sente"}
              </h1>
              <div style={{ width: 44, height: 1, background: `linear-gradient(90deg,transparent,${accentColor},transparent)`, margin: "10px auto" }} />
              <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 14, color: "#5a4c33", lineHeight: 1.7, maxWidth: 380 }}>
                {mode === "estudo"
                  ? <>Explore qualquer tema bíblico com <em style={{ color: accentColor }}>versículos, contexto teológico</em> e <em style={{ color: accentColor }}>escritos de Ellen White</em></>
                  : <>Um espaço seguro para buscar orientação na <em style={{ color: accentColor }}>Bíblia</em> e nos escritos de <em style={{ color: accentColor }}>Ellen G. White</em></>
                }
              </p>
            </div>

            <div style={{ background: `rgba(${mode === "estudo" ? "100,150,220" : "201,168,76"},0.05)`, border: `1px solid rgba(${mode === "estudo" ? "100,150,220" : "201,168,76"},0.12)`, borderRadius: 14, padding: "15px 20px", maxWidth: 440, width: "100%" }}>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16.5, color: accentColor, fontStyle: "italic", textAlign: "center", lineHeight: 1.65 }}>
                {mode === "estudo"
                  ? '"Toda a Escritura é divinamente inspirada e proveitosa para ensinar, para redarguir, para corrigir."'
                  : '"A tua palavra é lâmpada para os meus pés e luz para o meu caminho."'}
              </p>
              <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 11, color: "#3a3020", textAlign: "right", marginTop: 7 }}>
                {mode === "estudo" ? "— 2 Timóteo 3:16" : "— Salmos 119:105"}
              </p>
            </div>

            <div style={{ width: "100%", maxWidth: 500 }}>
              <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 10.5, color: "#3a3020", textAlign: "center", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
                {mode === "estudo" ? "Temas para explorar" : "Por onde começar?"}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {initialQs.map((q, i) => (
                  <button key={i} onClick={() => sendMessage(q)} style={{
                    background: `rgba(${mode === "estudo" ? "100,150,220" : "201,168,76"},0.04)`,
                    border: `1px solid rgba(${mode === "estudo" ? "100,150,220" : "201,168,76"},0.14)`,
                    borderRadius: 10, padding: "10px 13px", color: "#6b5c3e",
                    fontFamily: "'Nunito',sans-serif", fontSize: 13, cursor: "pointer",
                    textAlign: "left", lineHeight: 1.4, transition: "all 0.18s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor; e.currentTarget.style.background = `rgba(${mode === "estudo" ? "100,150,220" : "201,168,76"},0.09)`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = `rgba(${mode === "estudo" ? "100,150,220" : "201,168,76"},0.14)`; e.currentTarget.style.color = "#6b5c3e"; e.currentTarget.style.background = `rgba(${mode === "estudo" ? "100,150,220" : "201,168,76"},0.04)`; }}
                  >{q}</button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 0", display: "flex", flexDirection: "column", gap: 20 }}>
            {currentMessages.map((msg, i) => (
              <div key={i} className="msg">
                <MessageBubble msg={msg} onRefClick={setActiveRef} onFollowUp={sendMessage} mode={mode} />
              </div>
            ))}
            {loading && <div className="msg"><TypingDots mode={mode} /></div>}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Input */}
        <div style={{ padding: "12px 0 16px", borderTop: isStarted ? "1px solid #1a1810" : "none" }}>
          {isStarted && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {initialQs.slice(0, 3).map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)} style={{
                  background: "transparent", border: `1px solid rgba(${mode === "estudo" ? "100,150,220" : "201,168,76"},0.14)`,
                  borderRadius: 16, padding: "4px 11px", color: "#4a3f2a",
                  fontFamily: "'Nunito',sans-serif", fontSize: 11.5, cursor: "pointer", transition: "all 0.18s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = `rgba(${mode === "estudo" ? "100,150,220" : "201,168,76"},0.14)`; e.currentTarget.style.color = "#4a3f2a"; }}
                >{q}</button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", background: "rgba(255,255,255,0.03)", border: "1px solid #201e18", borderRadius: 16, padding: "8px 8px 8px 15px" }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={mode === "estudo" ? "Qual tema você quer estudar?" : "Escreva sua dúvida espiritual..."}
              rows={1}
              style={{
                flex: 1, background: "transparent", border: "none",
                padding: "5px 2px", color: "#e8d5a3",
                fontFamily: "'Nunito',sans-serif", fontSize: 14.5,
                resize: "none", maxHeight: 120, lineHeight: 1.62,
              }}
              onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{
              width: 38, height: 38, borderRadius: 11, border: "none",
              background: input.trim() && !loading ? accentColor : "#1a1810",
              cursor: input.trim() && !loading ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.18s",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke={input.trim() && !loading ? "#0f0e0b" : "#2e2a1c"} strokeWidth="2.2" strokeLinecap="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={input.trim() && !loading ? "#0f0e0b" : "#2e2a1c"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <p style={{ fontFamily: "'Nunito',sans-serif", fontSize: 10, color: "#272318", textAlign: "center", marginTop: 8 }}>
            ✝ Não substitui aconselhamento pastoral profissional
          </p>
        </div>
      </div>

      <RefPanel activeRef={activeRef} onClose={() => setActiveRef(null)} />
    </div>
  );
}
