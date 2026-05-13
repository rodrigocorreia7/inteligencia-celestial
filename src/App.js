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

ESCRITOS DEVOCIONAIS (EGW): Incorpore o conteúdo naturalmente no texto, como sabedoria devocional, SEM mencionar o nome da autora. Coloque apenas a fonte numa nota numerada [NOTA: fonte aqui].
Exemplo: "Há uma perspectiva devocional muito reconfortante: os sentimentos não são uma prova segura. [NOTA: Testemunhos para a Igreja, vol. 1, p. 167]"

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
ESCRITOS DEVOCIONAIS (EGW): Incorpore como sabedoria devocional adventista, SEM mencionar o nome da autora. Use nota numerada apenas para a fonte.

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

// Temas de cores (Safe Space Design)
const THEMES = {
  conselho: {
    primary: "#10b981", // Verde esmeralda suave
    bgUser: "rgba(16, 185, 129, 0.15)",
    borderUser: "rgba(16, 185, 129, 0.3)",
    textHighlight: "#34d399",
  },
  estudo: {
    primary: "#6366f1", // Azul índigo
    bgUser: "rgba(99, 102, 241, 0.15)",
    borderUser: "rgba(99, 102, 241, 0.3)",
    textHighlight: "#818cf8",
  }
};

function parseResponse(text) {
  const notes = [];
  const followUps = [];

  const qRegex = /\[Q\d+:\s*([^\]]+)\]/g;
  let qMatch;
  while ((qMatch = qRegex.exec(text)) !== null) followUps.push(qMatch[1].trim());
  let clean = text.replace(/\[Q\d+:[^\]]+\]/g, "").trim();

  let noteIndex = 1;
  clean = clean.replace(/\[NOTA:\s*([^\]]+)\]/g, (_, source) => {
    notes.push({ num: noteIndex, source: source.trim() });
    return `[${noteIndex++}]`;
  });

  clean = clean.replace(/\[REF:\s*([^|]+)\|\s*([^\]]+)\]/g, (_, quote, source) => {
    notes.push({ num: noteIndex, source: source.trim(), quote: quote.trim() });
    return `[${noteIndex++}]`;
  });

  clean = clean.replace(/\[SEÇÃO:\s*([^\]]+)\]/g, "\n\n§§§$1§§§\n");
  return { clean, notes, followUps };
}

function renderTextWithRefs(clean, notes, onRefClick, mode) {
  const parts = [];
  const numRegex = /\[(\d+)\]/g;
  let last = 0, m;
  const theme = THEMES[mode];

  while ((m = numRegex.exec(clean)) !== null) {
    if (m.index > last) parts.push({ type: "text", value: clean.slice(last, m.index) });
    parts.push({ type: "note", num: parseInt(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < clean.length) parts.push({ type: "text", value: clean.slice(last) });

  return parts.map((p, i) => {
    if (p.type === "note") {
      return (
        <sup key={i} style={{ margin: "0 2px" }}>
          <button onClick={() => onRefClick(notes.find(n => n.num === p.num))} style={{
            background: `${theme.primary}22`, border: `1px solid ${theme.primary}44`,
            borderRadius: 6, padding: "2px 6px", fontSize: 11, color: theme.textHighlight,
            cursor: "pointer", fontFamily: "'Inter', sans-serif", fontWeight: 600,
            transition: "all 0.2s"
          }}
            onMouseEnter={e => e.currentTarget.style.background = `${theme.primary}44`}
            onMouseLeave={e => e.currentTarget.style.background = `${theme.primary}22`}
          >{p.num}</button>
        </sup>
      );
    }
    const sectionParts = p.value.split(/§§§([^§]+)§§§/);
    return sectionParts.map((sp, j) => {
      if (j % 2 === 1) {
        return (
          <div key={`${i}-${j}`} style={{
            fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700,
            color: theme.textHighlight, textTransform: "uppercase", letterSpacing: "0.05em",
            marginTop: 24, marginBottom: 8, paddingBottom: 4,
            borderBottom: `1px solid ${theme.primary}22`,
          }}>{sp}</div>
        );
      }
      return <span key={`${i}-${j}`} style={{ whiteSpace: "pre-wrap" }}>{sp}</span>;
    });
  });
}

function MessageBubble({ msg, onRefClick, onFollowUp, mode }) {
  const theme = THEMES[mode];

  if (msg.role === "user") {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "12px 0" }}>
        <div style={{
          maxWidth: "80%", background: theme.bgUser, border: `1px solid ${theme.borderUser}`,
          borderRadius: "18px 18px 4px 18px", padding: "14px 18px",
          fontFamily: "'Nunito', sans-serif", fontSize: 15, color: "#f8fafc", lineHeight: 1.6,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}>{msg.content}</div>
      </div>
    );
  }

  const { clean, notes, followUps } = parseResponse(msg.content);

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", margin: "16px 0" }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%", background: `${theme.primary}15`,
        border: `1px solid ${theme.primary}33`, display: "flex", alignItems: "center", 
        justifyContent: "center", flexShrink: 0, marginTop: 4
      }}>
        {mode === "estudo" ? (
          <span style={{ fontSize: 16 }}>📖</span>
        ) : (
          <span style={{ fontSize: 16 }}>🌱</span>
        )}
      </div>

      <div style={{ maxWidth: "85%", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{
          background: "#1e293b", border: "1px solid #334155",
          borderRadius: "18px 18px 18px 4px", padding: "16px 20px",
          fontFamily: "'Nunito', sans-serif", fontSize: 15, color: "#e2e8f0", lineHeight: 1.7,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}>
          {renderTextWithRefs(clean, notes, onRefClick, mode)}
        </div>

        {followUps.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {followUps.map((q, i) => (
              <button key={i} onClick={() => onFollowUp(q)} style={{
                background: "#0f172a", border: `1px solid #334155`,
                borderRadius: 20, padding: "8px 16px", color: "#94a3b8",
                fontFamily: "'Nunito', sans-serif", fontSize: 13, cursor: "pointer", 
                transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = theme.primary;
                  e.currentTarget.style.color = theme.textHighlight;
                  e.currentTarget.style.background = `${theme.primary}11`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "#334155";
                  e.currentTarget.style.color = "#94a3b8";
                  e.currentTarget.style.background = "#0f172a";
                }}
              >
                <span>↳</span> {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RefPanel({ activeRef, onClose, mode }) {
  if (!activeRef) return null;
  const theme = THEMES[mode];

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 40 }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, background: "#0f172a",
        borderTop: `1px solid ${theme.primary}33`, borderRadius: "24px 24px 0 0", 
        padding: "24px 24px 36px", zIndex: 50, animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        maxWidth: 600, margin: "0 auto", boxShadow: "0 -10px 40px rgba(0,0,0,0.5)"
      }}>
        <div style={{ width: 40, height: 4, background: "#334155", borderRadius: 2, margin: "0 auto 24px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", background: `${theme.primary}22`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Inter', sans-serif", fontSize: 12, color: theme.textHighlight, fontWeight: 700,
          }}>{activeRef.num}</div>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#64748b", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Fonte de Inspiração
          </span>
        </div>
        
        {activeRef.quote && (
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, fontStyle: "italic", color: "#f1f5f9", lineHeight: 1.6, marginBottom: 16, paddingLeft: 12, borderLeft: `3px solid ${theme.primary}` }}>
            "{activeRef.quote}"
          </p>
        )}
        
        <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, color: theme.textHighlight, fontWeight: 500 }}>
          📚 {activeRef.source}
        </p>
        
        <button onClick={onClose} style={{
          marginTop: 24, width: "100%", background: `${theme.primary}22`, 
          border: "none", borderRadius: 12, padding: "14px", color: theme.textHighlight,
          fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer",
          transition: "background 0.2s"
        }}
        onMouseEnter={e => e.currentTarget.style.background = `${theme.primary}44`}
        onMouseLeave={e => e.currentTarget.style.background = `${theme.primary}22`}
        >Entendido</button>
      </div>
    </>
  );
}

const TypingDots = ({ mode }) => {
  const theme = THEMES[mode];
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "16px 0" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${theme.primary}15`, border: `1px solid ${theme.primary}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 16, animation: "pulse 2s infinite" }}>{mode === "estudo" ? "📖" : "🌱"}</span>
      </div>
      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "18px 18px 18px 4px", padding: "16px 20px", display: "flex", gap: 6 }}>
        {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: theme.textHighlight, animation: "bounce 1.4s infinite ease-in-out", animationDelay: `${i * 0.16}s`, opacity: 0.7 }} />)}
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
  const theme = THEMES[mode];

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
      setMessages(m => ({ ...m, [mode]: [...newMsgs, { role: "assistant", content: "Houve um erro de conexão. Podemos tentar novamente?" }] }));
    }
    setLoading(false);
  };

  const initialQs = mode === "estudo" ? INITIAL_ESTUDO : INITIAL_CONSELHO;

  return (
    <div style={{ minHeight: "100vh", background: "#0b0f19", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Nunito:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
        .msg { animation: fadeUp 0.4s ease-out forwards; }
        textarea { outline: none !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        body { background-color: #0b0f19; }
      `}</style>

      {/* Header Fixo e Moderno */}
      <div style={{ 
        background: "rgba(11, 15, 25, 0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1e293b", padding: "14px 24px", 
        display: "flex", alignItems: "center", gap: 16, position: "sticky", top: 0, zIndex: 20 
      }}>
        <div style={{ 
          width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${theme.primary}44, ${theme.primary}11)`,
          border: `1px solid ${theme.primary}55`, display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 15px ${theme.primary}22`
        }}>
          <span style={{ fontSize: 20 }}>{mode === "estudo" ? "📖" : "🌱"}</span>
        </div>
        <div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, color: "#f8fafc", fontWeight: 700 }}>
            Inteligência Celestial
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: theme.textHighlight, fontWeight: 500, letterSpacing: "0.05em" }}>
            Apoio Espiritual Seguro
          </div>
        </div>

        {/* Toggle de Modos */}
        <div style={{ marginLeft: "auto", display: "flex", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 4, gap: 4 }}>
          {[
            { key: "conselho", label: "Conselho" },
            { key: "estudo", label: "Estudo" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setMode(key)} style={{
              background: mode === key ? THEMES[key].primary : "transparent",
              border: "none", borderRadius: 8, padding: "6px 14px",
              color: mode === key ? "#ffffff" : "#64748b",
              fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600,
              cursor: "pointer", transition: "all 0.3s ease",
              boxShadow: mode === key ? `0 2px 8px ${THEMES[key].primary}66` : "none"
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Área Principal */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: 800, margin: "0 auto", width: "100%", padding: "0 20px" }}>

        {!isStarted ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 32 }}>
            <div style={{ textAlign: "center", animation: "fadeUp 0.6s ease-out" }}>
              <div style={{
                display: "inline-block", background: `${theme.primary}15`, border: `1px solid ${theme.primary}33`,
                borderRadius: 20, padding: "6px 16px", marginBottom: 20,
                fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
                color: theme.textHighlight, letterSpacing: "0.05em", textTransform: "uppercase",
              }}>
                {mode === "estudo" ? "Modo de Estudo Bíblico" : "Espaço Seguro para Desabafar"}
              </div>
              <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: 42, color: "#f8fafc", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 12 }}>
                {mode === "estudo" ? "Qual tema vamos explorar?" : "Como você está se sentindo?"}
              </h1>
              <p style={{ fontFamily: "'Nunito', sans-serif", fontSize: 16, color: "#94a3b8", lineHeight: 1.6, maxWidth: 500, margin: "0 auto" }}>
                {mode === "estudo"
                  ? <>Mergulhe nas Escrituras e nos escritos de <span style={{ color: theme.textHighlight, fontWeight: 600 }}>Ellen G. White</span> com clareza e profundidade.</>
                  : <>Um ambiente livre de julgamentos, guiado pela <span style={{ color: theme.textHighlight, fontWeight: 600 }}>Bíblia</span> para te ouvir e orientar.</>
                }
              </p>
            </div>

            {/* Grid de Sugestões */}
            <div style={{ width: "100%", maxWidth: 600, animation: "fadeUp 0.8s ease-out" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {initialQs.map((q, i) => (
                  <button key={i} onClick={() => sendMessage(q)} style={{
                    background: "#1e293b", border: "1px solid #334155",
                    borderRadius: 16, padding: "16px 20px", color: "#e2e8f0",
                    fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 500, cursor: "pointer",
                    textAlign: "left", lineHeight: 1.4, transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}
                    onMouseEnter={e => { 
                      e.currentTarget.style.borderColor = theme.primary; 
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = `0 4px 12px ${theme.primary}15`;
                    }}
                    onMouseLeave={e => { 
                      e.currentTarget.style.borderColor = "#334155"; 
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <span>{q}</span>
                    <span style={{ color: theme.textHighlight, fontSize: 18 }}>→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 0", display: "flex", flexDirection: "column" }}>
            {currentMessages.map((msg, i) => (
              <div key={i} className="msg">
                <MessageBubble msg={msg} onRefClick={setActiveRef} onFollowUp={sendMessage} mode={mode} />
              </div>
            ))}
            {loading && <div className="msg"><TypingDots mode={mode} /></div>}
            <div ref={bottomRef} style={{ height: 20 }} />
          </div>
        )}

        {/* Input Area */}
        <div style={{ padding: "16px 0 24px", background: "#0b0f19", position: "sticky", bottom: 0 }}>
          <div style={{ 
            display: "flex", alignItems: "flex-end", background: "#1e293b", 
            border: "1px solid #334155", borderRadius: 24, padding: "10px 12px 10px 20px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)", transition: "border-color 0.3s"
          }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={mode === "estudo" ? "Qual tema da Bíblia você quer pesquisar?" : "Escreva o que está no seu coração..."}
              rows={1}
              style={{
                flex: 1, background: "transparent", border: "none",
                padding: "8px 0", color: "#f8fafc", fontFamily: "'Nunito', sans-serif", fontSize: 15,
                resize: "none", maxHeight: 150, lineHeight: 1.5,
              }}
              onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px"; }}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{
              width: 44, height: 44, borderRadius: 16, border: "none", marginLeft: 12,
              background: input.trim() && !loading ? theme.primary : "#334155",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              transition: "all 0.2s", opacity: input.trim() && !loading ? 1 : 0.5
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: "#64748b", textAlign: "center", marginTop: 12, fontWeight: 500 }}>
            A Inteligência Celestial é um apoio espiritual e não substitui o acompanhamento pastoral ou psicológico profissional.
          </p>
        </div>
      </div>

      <RefPanel activeRef={activeRef} onClose={() => setActiveRef(null)} mode={mode} />
    </div>
  );
}
