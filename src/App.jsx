import { useState } from 'react';

const SESSION_ID = 'user_' + Math.random().toString(36).substr(2, 9);
const SYSTEM_PROMPT = `You are Aria, a professional and empathetic customer support agent for a SaaS company called NexaSupport. You help with billing, accounts, and subscriptions. Always be concise, friendly, and end with a clear next step.`;

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm Aria, your support assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          sessionId: SESSION_ID,
          systemPrompt: SYSTEM_PROMPT,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    }

    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: '720px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>

      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#6c8cff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600' }}>A</div>
        <div>
          <div style={{ fontWeight: '600', fontSize: '15px' }}>Aria</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>NexaSupport · Online</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '75%',
              padding: '10px 14px',
              fontSize: '14px',
              lineHeight: '1.6',
              background: msg.role === 'user' ? '#6c8cff' : '#f3f4f6',
              color: msg.role === 'user' ? 'white' : '#111827',
              borderRadius: msg.role === 'user' ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: '#f3f4f6', padding: '10px 14px', borderRadius: '2px 12px 12px 12px', fontSize: '14px', color: '#6b7280' }}>
              Aria is typing...
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '10px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type your message..."
          style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{ padding: '10px 20px', background: '#6c8cff', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}
        >
          Send
        </button>
      </div>

    </div>
  );
}

export default App;