import { useState, useRef, useEffect } from "react";

const TIMEFRAMES = ["Today", "This Week", "This Month", "This Year", "Someday"];

const initialTasks = [
  {
    id: 1,
    text: "Work out — Mon through Fri at 7:30 AM",
    timeframe: "This Week",
    added: new Date().toISOString(),
    done: false
  }
];

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function VIDA() {
  const [tasks, setTasks] = useState(initialTasks);
  const [input, setInput] = useState("");
  const [timeframe, setTimeframe] = useState("Today");
  const [activeTab, setActiveTab] = useState("log");
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", text: "Hey Marco! I'm VIDA, your personal executive assistant. Tell me what's on your mind — goals, tasks, reminders, anything. I'll keep track of it all." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  function addTask() {
    if (!input.trim()) return;
    const newTask = {
      id: Date.now(),
      text: input.trim(),
      timeframe,
      added: new Date().toISOString(),
      done: false
    };
    setTasks(prev => [newTask, ...prev]);
    setInput("");
  }

  function toggleDone(id) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  async function sendChat() {
    if (!chatInput.trim() || loading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    const taskSummary = tasks.length
      ? tasks.map(t => `- [${t.timeframe}] ${t.text}${t.done ? " (done)" : ""}`).join("\n")
      : "No tasks logged yet.";

    const systemPrompt = `You are VIDA, Marco's personal executive assistant. You are warm, proactive, concise, and smart. You help Marco track goals and tasks across different timeframes (Today, This Week, This Month, This Year, Someday). You proactively surface relevant tasks based on context. When Marco mentions something he wants to do or remember, acknowledge it and suggest he logs it. Keep responses short and conversational — this is a mobile app. Here are Marco's current tasks:\n${taskSummary}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [
            ...chatMessages.filter((m, idx) => idx > 0).map(m => ({
              role: m.role,
              content: m.text
            })),
            { role: "user", content: userMsg }
          ]
        })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "I didn't catch that. Try again?";
      setChatMessages(prev => [...prev, { role: "assistant", text: reply }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", text: "Something went wrong. Try again in a moment." }]);
    }
    setLoading(false);
  }

  const grouped = TIMEFRAMES.reduce((acc, tf) => {
    acc[tf] = tasks.filter(t => t.timeframe === tf);
    return acc;
  }, {});

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#f0f0f0", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ padding: "32px 24px 16px", borderBottom: "1px solid #1a1a1a" }}>
        <div style={{ fontSize: 11, color: "#555", letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>VIDA</div>
        <div style={{ fontSize: 22, fontWeight: 300, color: "#e0e0e0" }}>{getGreeting()}, Marco.</div>
        <div style={{ fontSize: 13, color: "#444", marginTop: 4 }}>
          {tasks.filter(t => !t.done && t.timeframe === "Today").length} things on your plate today.
        </div>
      </div>
      <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a" }}>
        {[{ id: "log", label: "Log" }, { id: "tasks", label: "Tasks" }, { id: "chat", label: "Chat" }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, padding: "14px 0", background: "none", border: "none", cursor: "pointer",
            color: activeTab === tab.id ? "#fff" : "#444",
            borderBottom: activeTab === tab.id ? "1px solid #fff" : "1px solid transparent",
            fontSize: 13, letterSpacing: 1, textTransform: "uppercase", transition: "color 0.2s"
          }}>{tab.label}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
        {activeTab === "log" && (
          <div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 16, letterSpacing: 1, textTransform: "uppercase" }}>Add something to track</div>
            <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="e.g. Update the backyard landscaping..." onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), addTask())} style={{ width: "100%", background: "#111", border: "1px solid #222", borderRadius: 8, color: "#e0e0e0", padding: "14px", fontSize: 14, resize: "none", height: 90, outline: "none", boxSizing: "border-box", lineHeight: 1.5 }} />
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              {TIMEFRAMES.map(tf => (
                <button key={tf} onClick={() => setTimeframe(tf)} style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid", borderColor: timeframe === tf ? "#fff" : "#2a2a2a", background: timeframe === tf ? "#fff" : "transparent", color: timeframe === tf ? "#000" : "#555", fontSize: 12, cursor: "pointer", transition: "all 0.15s" }}>{tf}</button>
              ))}
            </div>
            <button onClick={addTask} style={{ marginTop: 16, width: "100%", padding: "14px", background: "#fff", color: "#000", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", letterSpacing: 0.5 }}>Add to VIDA</button>
          </div>
        )}
        {activeTab === "tasks" && (
          <div>
            {TIMEFRAMES.map(tf => grouped[tf].length > 0 && (
              <div key={tf} style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>{tf}</div>
                {grouped[tf].map(task => (
                  <div key={task.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: "1px solid #141414", opacity: task.done ? 0.35 : 1 }}>
                    <button onClick={() => toggleDone(task.id)} style={{ width: 18, height: 18, borderRadius: "50%", border: "1px solid #333", background: task.done ? "#fff" : "transparent", cursor: "pointer", flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: "#ddd", textDecoration: task.done ? "line-through" : "none" }}>{task.text}</div>
                      <div style={{ fontSize: 11, color: "#444", marginTop: 3 }}>Added {formatDate(task.added)}</div>
                    </div>
                    <button onClick={() => deleteTask(task.id)} style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
                  </div>
                ))}
              </div>
            ))}
            {tasks.length === 0 && (
              <div style={{ textAlign: "center", color: "#333", marginTop: 60, fontSize: 14 }}>Nothing tracked yet.<br />Head to Log to add your first item.</div>
            )}
          </div>
        )}
        {activeTab === "chat" && (
          <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 220px)" }}>
            <div style={{ flex: 1, overflowY: "auto", paddingBottom: 16 }}>
              {chatMessages.map((m, i) => (
                <div key={i} style={{ marginBottom: 16, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "80%", padding: "12px 16px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.role === "user" ? "#fff" : "#161616", color: m.role === "user" ? "#000" : "#ddd", fontSize: 14, lineHeight: 1.5 }}>{m.text}</div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", gap: 4, padding: "12px 16px", background: "#161616", borderRadius: "18px 18px 18px 4px", width: "fit-content" }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#444", animation: `pulse 1s ${i*0.2}s infinite` }} />)}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid #1a1a1a" }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} placeholder="Talk to VIDA..." style={{ flex: 1, background: "#111", border: "1px solid #222", borderRadius: 24, color: "#e0e0e0", padding: "12px 16px", fontSize: 14, outline: "none" }} />
              <button onClick={sendChat} disabled={loading} style={{ background: "#fff", border: "none", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>↑</button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }`}</style>
    </div>
  );
}
