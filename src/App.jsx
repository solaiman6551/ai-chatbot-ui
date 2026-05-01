import { useState, useRef, useEffect } from 'react';
import './App.css';

const AGENTS = [
  {
    id: 'aria',
    name: 'Aria',
    role: 'Billing & Accounts',
    color: '#6c8cff',
    initial: 'A',
    systemPrompt: `You are Aria, a professional and empathetic customer support agent for a SaaS company called NexaSupport. You help with billing, accounts, and subscriptions. Always be concise, friendly, and end with a clear next step.`,
    greeting: "Hi! I'm Aria, your billing & accounts specialist. How can I help you today?"
  },
  {
    id: 'rex',
    name: 'Rex',
    role: 'Tech Support',
    color: '#10b981',
    initial: 'R',
    systemPrompt: `You are Rex, a friendly and knowledgeable tech support specialist for NexaSupport. You help with technical issues, bugs, integrations, and API questions. Be clear, patient, and always provide step-by-step solutions.`,
    greeting: "Hey! I'm Rex, your tech support specialist. What technical issue can I help you solve today?"
  },
  {
    id: 'mila',
    name: 'Mila',
    role: 'Orders & Returns',
    color: '#f472b6',
    initial: 'M',
    systemPrompt: `You are Mila, a warm and efficient orders & returns specialist for NexaSupport. You help with order tracking, returns, refunds, and shipping issues. Always be empathetic and provide clear timelines.`,
    greeting: "Hello! I'm Mila, your orders & returns specialist. How can I assist you today?"
  }
];

function App() {
  const [activeAgent, setActiveAgent] = useState(AGENTS[0]);
  const [allMessages, setAllMessages] = useState({
    aria: [{ role: 'assistant', content: AGENTS[0].greeting }],
    rex: [{ role: 'assistant', content: AGENTS[1].greeting }],
    mila: [{ role: 'assistant', content: AGENTS[2].greeting }],
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const messages = allMessages[activeAgent.id];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages, activeAgent]);

  const switchAgent = (agent) => {
    setActiveAgent(agent);
    setInput('');
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    const currentAgentId = activeAgent.id;
    setAllMessages(prev => ({
      ...prev,
      [currentAgentId]: [...prev[currentAgentId], userMessage]
    }));
    setInput('');
    setLoading(true);

    const aiMessage = { role: 'assistant', content: '' };
    setAllMessages(prev => ({
      ...prev,
      [currentAgentId]: [...prev[currentAgentId], aiMessage]
    }));

    try {
      const res = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          sessionId: currentAgentId,
          systemPrompt: activeAgent.systemPrompt,
        }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                aiMessage.content += parsed.text;
                setAllMessages(prev => ({
                  ...prev,
                  [currentAgentId]: [
                    ...prev[currentAgentId].slice(0, -1),
                    { ...aiMessage }
                  ]
                }));
              }
            } catch { }
          }
        }
      }
    } catch (err) {
      setAllMessages(prev => ({
        ...prev,
        [currentAgentId]: [
          ...prev[currentAgentId].slice(0, -1),
          { role: 'assistant', content: 'Something went wrong. Please try again.' }
        ]
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatMessage = (text) => {
    return text
      .replace(/^## (.*?)$/gm, '<strong>$1</strong>')
      .replace(/^### (.*?)$/gm, '<strong>$1</strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:13px">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '720px', maxWidth: '100%', margin: '0 auto', fontFamily: 'system-ui, sans-serif', background: '#ffffff', boxShadow: '0 0 40px rgba(0,0,0,0.1)' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px', background: '#ffffff' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: activeAgent.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '14px', flexShrink: 0 }}>{activeAgent.initial}</div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: '600', fontSize: '15px', color: '#111827', lineHeight: '1.2' }}>{activeAgent.name}</div>
          <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.2' }}>{activeAgent.role}</div>
        </div>
      </div>

      {/* Agent Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
        {AGENTS.map(agent => (
          <button
            key={agent.id}
            onClick={() => switchAgent(agent)}
            style={{
              flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
              background: activeAgent.id === agent.id ? '#ffffff' : 'transparent',
              color: activeAgent.id === agent.id ? agent.color : '#6b7280',
              borderBottom: activeAgent.id === agent.id ? `2px solid ${agent.color}` : '2px solid transparent',
              transition: 'all 0.15s'
            }}
          >
            {agent.name}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && msg.content === '' ? (
              <div className="typing-bubble" style={{ minHeight: '37px', minWidth: '60px' }}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            ) : (
              <div style={{
                maxWidth: '75%', padding: '10px 14px', fontSize: '14px', lineHeight: '1.6', textAlign: 'left',
                background: msg.role === 'user' ? activeAgent.color : '#f3f4f6',
                color: msg.role === 'user' ? 'white' : '#111827',
                borderRadius: msg.role === 'user' ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
              }}
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
              />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '10px', background: '#ffffff' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={`Message ${activeAgent.name}...`}
          style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none', background: '#f9fafb', color: '#111827' }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{ padding: '10px 20px', background: activeAgent.color, color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}
        >
          Send
        </button>
      </div>

    </div>
  );
}

export default App;