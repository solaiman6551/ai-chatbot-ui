import { useState, useRef, useEffect } from 'react';
import './App.css';

const AGENTS = [
  {
    id: 'aria',
    name: 'Aria',
    role: 'Client Communication',
    color: '#6c8cff',
    initial: 'A',
    greeting: "Hi! I'm Aria, your client communication specialist. Need to send a professional email or manage a client relationship? I'm here to help!"
  },
  {
    id: 'rex',
    name: 'Rex',
    role: 'Tech Support',
    color: '#10b981',
    initial: 'R',
    greeting: "Hey! I'm Rex, your tech support specialist. What technical issue can I help you solve today?"
  },
  {
    id: 'mila',
    name: 'Mila',
    role: 'Invoice Generator',
    color: '#f472b6',
    initial: 'M',
    greeting: "Hello! I'm Mila, your invoice generator. Just tell me the details and I'll create a professional PDF invoice instantly!\n\nExample:\n\"Invoice for Ahmed, React dashboard $150, SEO setup $50, due in 7 days, my name is Solaiman\""
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

    setAllMessages(prev => ({
      ...prev,
      [currentAgentId]: [...prev[currentAgentId], { role: 'assistant', content: '' }]
    }));

    try {
      const history = allMessages[currentAgentId]
        .filter(m => m.content !== AGENTS.find(a => a.id === currentAgentId).greeting)
        .map(({ role, content }) => ({ role, content })) // strip downloadUrl
        .concat(userMessage);

      const res = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: currentAgentId, messages: history }),
      });

      const data = await res.json();

      // Check if Mila generated an invoice
      const invoiceTool = data.toolsUsed?.find(t => t.tool === 'generate_invoice');
      const downloadUrl = invoiceTool?.result?.success ? invoiceTool.result.download_url : null;

      setAllMessages(prev => ({
        ...prev,
        [currentAgentId]: [
          ...prev[currentAgentId].slice(0, -1),
          { role: 'assistant', content: data.reply, downloadUrl }
        ]
      }));

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
    if (!text) return '';
    return text
      .replace(/```(\w+)?\n?([\s\S]*?)```/g, '<pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:8px;overflow-x:auto;font-size:13px;margin:8px 0"><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:13px;color:#e83e8c">$1</code>')
      .replace(/^## (.*?)$/gm, '<strong style="font-size:15px">$1</strong>')
      .replace(/^### (.*?)$/gm, '<strong>$1</strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
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
          <div key={i}>
            {/* Rex web search badge */}
            {msg.role === 'assistant' && activeAgent.id === 'rex' && msg.content && i > 0 && (
              <div style={{ fontSize: '11px', color: '#10b981', marginBottom: '4px', paddingLeft: '4px' }}>
                🔍 Searched the web
              </div>
            )}
            {/* Mila invoice badge */}
            {msg.role === 'assistant' && activeAgent.id === 'mila' && msg.downloadUrl && (
              <div style={{ fontSize: '11px', color: '#f472b6', marginBottom: '4px', paddingLeft: '4px' }}>
                🧾 Invoice generated
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.role === 'assistant' && msg.content === '' ? (
                <div className="typing-bubble" style={{ minHeight: '37px', minWidth: '60px' }}>
                  <span></span><span></span><span></span>
                </div>
              ) : (
                <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{
                    padding: '10px 14px', fontSize: '14px', lineHeight: '1.6', textAlign: 'left',
                    background: msg.role === 'user' ? activeAgent.color : '#f3f4f6',
                    color: msg.role === 'user' ? 'white' : '#111827',
                    borderRadius: msg.role === 'user' ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                  }}
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                  />
                  {/* Download button for Mila's invoices */}
                  {msg.downloadUrl && (
                    <a
                      href={msg.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '8px 16px', background: '#f472b6', color: 'white',
                        borderRadius: '8px', textDecoration: 'none', fontSize: '13px',
                        fontWeight: '600', width: 'fit-content',
                        boxShadow: '0 2px 8px rgba(244,114,182,0.4)',
                      }}
                    >
                      📄 Download Invoice PDF
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && activeAgent.id === 'rex' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280', paddingLeft: '4px' }}>
            <span>🔍</span><span>Rex is searching the web...</span>
          </div>
        )}
        {loading && activeAgent.id === 'mila' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280', paddingLeft: '4px' }}>
            <span>🧾</span><span>Mila is generating your invoice...</span>
          </div>
        )}
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
          style={{ padding: '10px 20px', background: activeAgent.color, color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '500', opacity: loading ? 0.6 : 1 }}
        >
          Send
        </button>
      </div>

    </div>
  );
}

export default App;