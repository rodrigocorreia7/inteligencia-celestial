const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { system, messages } = req.body;

  try {
    // 💰 ESTRATÉGIA DE ECONOMIA: 
    // Pega apenas as últimas 6 mensagens da conversa para não gastar 
    // milhares de tokens atoa enviando o histórico gigante a cada nova pergunta.
    const recentMessages = messages.slice(-6);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: system,
        messages: recentMessages,
      }),
    });

    const data = await response.json();
    
    // 🕵️‍♂️ CAPTURA DE ERRO MELHORADA:
    // Se a Anthropic rejeitar, vamos ver o motivo real, sem cortes.
    if (!response.ok || data.error) {
      console.log("Erro completo da Anthropic:", data.error);
      const errorMessage = data.error?.message || JSON.stringify(data.error) || "Erro não identificado";
      return res.status(200).json({ reply: `Erro da API: ${errorMessage}` });
    }
    
    const reply = data.content?.[0]?.text || "Desculpe, não consegui formular uma resposta.";
    return res.status(200).json({ reply });

  } catch (error) {
    console.log("Erro no servidor Vercel:", error.message);
    return res.status(200).json({ reply: "Erro interno: " + error.message });
  }
};

module.exports = handler;
