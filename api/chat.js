const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { system, messages } = req.body;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        system,
        messages,
      }),
    });

    const data = await response.json();
    console.log("STATUS:", response.status);
    console.log("DATA:", JSON.stringify(data).slice(0, 300));
    
    if (data.error) {
      return res.status(200).json({ reply: "Erro da API: " + data.error.message });
    }
    
    const reply = data.content?.[0]?.text || "Sem resposta";
    return res.status(200).json({ reply });
  } catch (error) {
    console.log("ERRO:", error.message);
    return res.status(200).json({ reply: "Erro: " + error.message });
  }
};

module.exports = handler;
