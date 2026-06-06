import { useState, useEffect, useRef, useCallback } from "react";

// ─── WebSocket Hook ────────────────────────────────────────────────────────────
function useChat() {
    const [connected, setConnected] = useState(false);
    const [user, setUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [groups, setGroups] = useState([]);
    const wsRef = useRef(null);

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8080");
        wsRef.current = ws;

        ws.onopen = () => setConnected(true);
        ws.onclose = () => { setConnected(false); setUser(null); };

        ws.onmessage = (e) => {
            try {
                const msg = JSON.parse(e.data);
                if (msg.type === "ERROR") {
                    setMessages(prev => [...prev, { type: "error", text: msg.text, id: Date.now() }]);
                } else if (msg.type === "MSG_CONT") {
                    setMessages(prev => [...prev, {
                        type: "msg", from: msg.from, text: msg.text,
                        channel: msg.from, channelType: "contact", id: Date.now()
                    }]);
                } else if (msg.type === "MSG_GRUPO") {
                    setMessages(prev => [...prev, {
                        type: "msg", from: msg.from, text: msg.text,
                        channel: msg.group || "grupo", channelType: "group", id: Date.now()
                    }]);
                }
            } catch {}
        };

        return () => ws.close();
    }, []);

    const send = useCallback((obj) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(obj));
        }
    }, []);

    const register = (username) => {
        send({ type: "REGISTRAR", payload: { username } });
        setUser(username);
    };

    const login = (username) => {
        send({ type: "ENTRAR", payload: { username } });
        setUser(username);
    };

    const logout = () => {
        send({ type: "SAIR", payload: {} });
        setUser(null);
        setMessages([]);
        setContacts([]);
        setGroups([]);
    };

    const addContact = (contact) => {
        send({ type: "ADD_CONT", payload: { contact } });
        if (!contacts.includes(contact)) setContacts(prev => [...prev, contact]);
    };

    const removeContact = (contact) => {
        send({ type: "REM_CONT", payload: { contact } });
        setContacts(prev => prev.filter(c => c !== contact));
    };

    const msgContact = (to, text) => {
        send({ type: "MSG_CONT", payload: { to, text } });
        setMessages(prev => [...prev, {
            type: "msg", from: user, text, channel: to,
            channelType: "contact", id: Date.now()
        }]);
    };

    const createGroup = (group) => {
        send({ type: "CRIAR_GRUPO", payload: { group } });
        if (!groups.includes(group)) setGroups(prev => [...prev, group]);
    };

    const joinGroup = (group) => {
        send({ type: "ENTRAR_GRUPO", payload: { group } });
        if (!groups.includes(group)) setGroups(prev => [...prev, group]);
    };

    const leaveGroup = (group) => {
        send({ type: "SAIR_GRUPO", payload: { group } });
        setGroups(prev => prev.filter(g => g !== group));
    };

    const msgGroup = (group, text) => {
        send({ type: "MSG_GRUPO", payload: { group, text } });
        setMessages(prev => [...prev, {
            type: "msg", from: user, text, channel: group,
            channelType: "group", id: Date.now()
        }]);
    };

    return {
        connected, user, messages, contacts, groups,
        register, login, logout,
        addContact, removeContact, msgContact,
        createGroup, joinGroup, leaveGroup, msgGroup,
    };
}

// ─── Auth Screen ───────────────────────────────────────────────────────────────
function AuthScreen({ onRegister, onLogin, connected }) {
    const [mode, setMode] = useState("login");
    const [username, setUsername] = useState("");

    const handle = () => {
        if (!username.trim()) return;
        mode === "login" ? onLogin(username.trim()) : onRegister(username.trim());
    };

    return (
        <div style={styles.authWrap}>
            <div style={styles.authCard}>
                <div style={styles.authLogo}>
                    <span style={styles.logoIcon}>◈</span>
                    <span style={styles.logoText}>nexus</span>
                </div>
                <p style={styles.authSub}>chat minimalista · TCP/WS</p>

                <div style={styles.connDot(connected)} />

                <div style={styles.tabRow}>
                    {["login", "registrar"].map(m => (
                        <button key={m} style={styles.tab(mode === m)} onClick={() => setMode(m)}>
                            {m}
                        </button>
                    ))}
                </div>

                <input
                    style={styles.authInput}
                    placeholder="seu username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handle()}
                    autoFocus
                />

                <button style={styles.authBtn} onClick={handle} disabled={!connected}>
                    {mode === "login" ? "entrar →" : "criar conta →"}
                </button>

                {!connected && (
                    <p style={styles.warnText}>⚠ WebSocket desconectado (porta 8080)</p>
                )}
            </div>
        </div>
    );
}

// ─── Message Bubble ────────────────────────────────────────────────────────────
function Bubble({ msg, me }) {
    const isMine = msg.from === me;
    if (msg.type === "error") {
        return <div style={styles.errBubble}>{msg.text}</div>;
    }
    return (
        <div style={styles.bubbleRow(isMine)}>
            {!isMine && <span style={styles.bubbleName}>{msg.from}</span>}
            <div style={styles.bubble(isMine)}>{msg.text}</div>
        </div>
    );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
    return (
        <div style={styles.modalOverlay} onClick={onClose}>
            <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
                <div style={styles.modalHead}>
                    <span style={styles.modalTitle}>{title}</span>
                    <button style={styles.modalClose} onClick={onClose}>✕</button>
                </div>
                {children}
            </div>
        </div>
    );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
    const chat = useChat();
    const [activeChannel, setActiveChannel] = useState(null); // { type, name }
    const [input, setInput] = useState("");
    const [modal, setModal] = useState(null); // 'addContact'|'addGroup'|'joinGroup'
    const [modalInput, setModalInput] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat.messages]);

    if (!chat.user) {
        return (
            <AuthScreen
                onRegister={chat.register}
                onLogin={chat.login}
                connected={chat.connected}
            />
        );
    }

    const channelMessages = activeChannel
        ? chat.messages.filter(
            m => m.channel === activeChannel.name && m.channelType === activeChannel.type
        )
        : [];

    const sendMessage = () => {
        if (!input.trim() || !activeChannel) return;
        if (activeChannel.type === "contact") chat.msgContact(activeChannel.name, input.trim());
        else chat.msgGroup(activeChannel.name, input.trim());
        setInput("");
    };

    const handleModal = () => {
        if (!modalInput.trim()) return;
        if (modal === "addContact") chat.addContact(modalInput.trim());
        if (modal === "addGroup") chat.createGroup(modalInput.trim());
        if (modal === "joinGroup") chat.joinGroup(modalInput.trim());
        setModal(null);
        setModalInput("");
    };

    return (
        <div style={styles.appWrap}>
            {/* ── Sidebar ── */}
            <aside style={styles.sidebar}>
                <div style={styles.sideTop}>
                    <span style={styles.logoIcon2}>◈</span>
                    <span style={styles.sideUser}>{chat.user}</span>
                </div>

                <section style={styles.sideSection}>
                    <div style={styles.secHeader}>
                        <span>Contatos</span>
                        <button style={styles.addBtn} onClick={() => setModal("addContact")}>+</button>
                    </div>
                    {chat.contacts.length === 0 && (
                        <p style={styles.emptyHint}>nenhum contato</p>
                    )}
                    {chat.contacts.map(c => (
                        <div
                            key={c}
                            style={styles.sideItem(activeChannel?.name === c && activeChannel?.type === "contact")}
                            onClick={() => setActiveChannel({ type: "contact", name: c })}
                        >
                            <span style={styles.avatar}>{c[0].toUpperCase()}</span>
                            <span style={styles.itemLabel}>{c}</span>
                            <button
                                style={styles.removeBtn}
                                onClick={e => { e.stopPropagation(); chat.removeContact(c); }}
                            >✕</button>
                        </div>
                    ))}
                </section>

                <section style={styles.sideSection}>
                    <div style={styles.secHeader}>
                        <span>Grupos</span>
                        <div style={{ display: "flex", gap: 4 }}>
                            <button style={styles.addBtn} onClick={() => setModal("addGroup")} title="Criar grupo">+</button>
                            <button style={styles.addBtn} onClick={() => setModal("joinGroup")} title="Entrar em grupo">→</button>
                        </div>
                    </div>
                    {chat.groups.length === 0 && (
                        <p style={styles.emptyHint}>nenhum grupo</p>
                    )}
                    {chat.groups.map(g => (
                        <div
                            key={g}
                            style={styles.sideItem(activeChannel?.name === g && activeChannel?.type === "group")}
                            onClick={() => setActiveChannel({ type: "group", name: g })}
                        >
                            <span style={styles.avatarGroup}>#</span>
                            <span style={styles.itemLabel}>{g}</span>
                            <button
                                style={styles.removeBtn}
                                onClick={e => { e.stopPropagation(); chat.leaveGroup(g); }}
                            >✕</button>
                        </div>
                    ))}
                </section>

                <button style={styles.logoutBtn} onClick={chat.logout}>sair</button>
            </aside>

            {/* ── Chat Area ── */}
            <main style={styles.chatArea}>
                {activeChannel ? (
                    <>
                        <div style={styles.chatHeader}>
              <span style={styles.chatHeaderIcon}>
                {activeChannel.type === "group" ? "#" : activeChannel.name[0].toUpperCase()}
              </span>
                            <span style={styles.chatHeaderName}>{activeChannel.name}</span>
                            <span style={styles.chatHeaderType}>
                {activeChannel.type === "group" ? "grupo" : "contato"}
              </span>
                        </div>

                        <div style={styles.messages}>
                            {channelMessages.length === 0 && (
                                <div style={styles.emptyChat}>
                                    <span style={styles.emptyChatIcon}>◎</span>
                                    <p>nenhuma mensagem ainda</p>
                                </div>
                            )}
                            {channelMessages.map(m => (
                                <Bubble key={m.id} msg={m} me={chat.user} />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div style={styles.inputRow}>
                            <input
                                style={styles.msgInput}
                                placeholder={`mensagem para ${activeChannel.name}...`}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && sendMessage()}
                            />
                            <button style={styles.sendBtn} onClick={sendMessage}>↑</button>
                        </div>
                    </>
                ) : (
                    <div style={styles.noChatSelected}>
                        <span style={styles.ncIcon}>◈</span>
                        <p style={styles.ncText}>selecione um contato ou grupo</p>
                        <p style={styles.ncSub}>para começar a conversar</p>
                    </div>
                )}
            </main>

            {/* ── Modal ── */}
            {modal && (
                <Modal
                    title={
                        modal === "addContact" ? "Adicionar contato"
                            : modal === "addGroup" ? "Criar grupo"
                                : "Entrar em grupo"
                    }
                    onClose={() => { setModal(null); setModalInput(""); }}
                >
                    <input
                        style={styles.modalInput}
                        placeholder={modal === "addContact" ? "username do contato" : "nome do grupo"}
                        value={modalInput}
                        onChange={e => setModalInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleModal()}
                        autoFocus
                    />
                    <button style={styles.modalBtn} onClick={handleModal}>
                        {modal === "addContact" ? "adicionar"
                            : modal === "addGroup" ? "criar"
                                : "entrar"}
                    </button>
                </Modal>
            )}
        </div>
    );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const C = {
    bg: "#0d0d0f",
    surface: "#141418",
    border: "#222228",
    accent: "#c8ff00",
    accentDim: "#8aad00",
    text: "#e8e8e8",
    muted: "#555",
    danger: "#ff4455",
    groupAvatar: "#1a1a2e",
};

const styles = {
    authWrap: {
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", background: C.bg,
        fontFamily: "'Courier New', monospace",
    },
    authCard: {
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 2, padding: "48px 40px", minWidth: 340,
        display: "flex", flexDirection: "column", gap: 16,
    },
    authLogo: { display: "flex", alignItems: "baseline", gap: 10 },
    logoIcon: { fontSize: 28, color: C.accent },
    logoText: { fontSize: 28, color: C.text, fontWeight: 700, letterSpacing: 4 },
    authSub: { color: C.muted, fontSize: 11, margin: 0, letterSpacing: 2 },
    connDot: (ok) => ({
        width: 8, height: 8, borderRadius: "50%",
        background: ok ? C.accent : C.danger,
        boxShadow: ok ? `0 0 8px ${C.accent}` : `0 0 8px ${C.danger}`,
    }),
    tabRow: { display: "flex", gap: 0, borderBottom: `1px solid ${C.border}` },
    tab: (active) => ({
        flex: 1, padding: "8px 0", background: "none",
        border: "none", borderBottom: active ? `2px solid ${C.accent}` : "2px solid transparent",
        color: active ? C.accent : C.muted,
        cursor: "pointer", fontFamily: "'Courier New', monospace",
        fontSize: 12, letterSpacing: 1, marginBottom: -1,
    }),
    authInput: {
        background: C.bg, border: `1px solid ${C.border}`,
        borderRadius: 2, padding: "12px 14px", color: C.text,
        fontFamily: "'Courier New', monospace", fontSize: 14,
        outline: "none", width: "100%", boxSizing: "border-box",
    },
    authBtn: {
        background: C.accent, color: C.bg, border: "none",
        padding: "12px", cursor: "pointer", fontWeight: 700,
        fontFamily: "'Courier New', monospace", fontSize: 13,
        letterSpacing: 1, borderRadius: 2,
    },
    warnText: { color: C.danger, fontSize: 11, margin: 0, textAlign: "center" },

    appWrap: {
        display: "flex", height: "100vh", background: C.bg,
        fontFamily: "'Courier New', monospace", overflow: "hidden",
    },
    sidebar: {
        width: 240, background: C.surface, borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", overflow: "hidden",
    },
    sideTop: {
        padding: "20px 16px", borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", gap: 10,
    },
    logoIcon2: { color: C.accent, fontSize: 18 },
    sideUser: { color: C.text, fontSize: 13, fontWeight: 700, letterSpacing: 1 },
    sideSection: {
        padding: "12px 0", borderBottom: `1px solid ${C.border}`,
        flex: "0 0 auto",
    },
    secHeader: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 16px 8px", color: C.muted, fontSize: 10, letterSpacing: 2,
    },
    addBtn: {
        background: "none", border: `1px solid ${C.border}`,
        color: C.accent, cursor: "pointer", width: 22, height: 22,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14, borderRadius: 2, padding: 0,
    },
    emptyHint: { color: C.muted, fontSize: 11, margin: "0 16px", letterSpacing: 1 },
    sideItem: (active) => ({
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 16px", cursor: "pointer",
        background: active ? `${C.accent}18` : "transparent",
        borderLeft: active ? `2px solid ${C.accent}` : "2px solid transparent",
        transition: "all 0.15s",
    }),
    avatar: {
        width: 24, height: 24, borderRadius: "50%",
        background: C.accentDim, color: C.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, flexShrink: 0,
    },
    avatarGroup: {
        width: 24, height: 24, borderRadius: 2,
        background: "#1a2a00", color: C.accent,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700, flexShrink: 0,
    },
    itemLabel: { color: C.text, fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis" },
    removeBtn: {
        background: "none", border: "none", color: C.muted,
        cursor: "pointer", fontSize: 10, padding: 2, opacity: 0.5,
        "&:hover": { opacity: 1, color: C.danger },
    },
    logoutBtn: {
        margin: "auto 16px 16px",
        background: "none", border: `1px solid ${C.border}`,
        color: C.muted, padding: "8px", cursor: "pointer",
        fontFamily: "'Courier New', monospace", fontSize: 11,
        letterSpacing: 1, borderRadius: 2,
    },
    chatArea: {
        flex: 1, display: "flex", flexDirection: "column", overflow: "hidden",
    },
    chatHeader: {
        padding: "16px 24px", borderBottom: `1px solid ${C.border}`,
        display: "flex", alignItems: "center", gap: 12, background: C.surface,
    },
    chatHeaderIcon: {
        width: 32, height: 32, background: C.accentDim,
        borderRadius: "50%", display: "flex", alignItems: "center",
        justifyContent: "center", color: C.bg, fontWeight: 700, fontSize: 13,
    },
    chatHeaderName: { color: C.text, fontSize: 15, fontWeight: 700 },
    chatHeaderType: {
        color: C.muted, fontSize: 10, letterSpacing: 2, marginLeft: "auto",
    },
    messages: {
        flex: 1, overflowY: "auto", padding: "20px 24px",
        display: "flex", flexDirection: "column", gap: 8,
    },
    emptyChat: {
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        color: C.muted, gap: 8, marginTop: 60,
    },
    emptyChatIcon: { fontSize: 32, color: `${C.muted}55` },
    bubbleRow: (mine) => ({
        display: "flex", flexDirection: "column",
        alignItems: mine ? "flex-end" : "flex-start",
        gap: 2,
    }),
    bubbleName: { color: C.muted, fontSize: 10, paddingLeft: 12, letterSpacing: 1 },
    bubble: (mine) => ({
        maxWidth: "65%", padding: "10px 14px",
        background: mine ? C.accent : C.surface,
        color: mine ? C.bg : C.text,
        border: mine ? "none" : `1px solid ${C.border}`,
        borderRadius: mine ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
        fontSize: 13, lineHeight: 1.5,
    }),
    errBubble: {
        background: "#1a0008", border: `1px solid ${C.danger}55`,
        color: C.danger, padding: "8px 14px", borderRadius: 4,
        fontSize: 12, alignSelf: "center",
    },
    inputRow: {
        padding: "16px 24px", borderTop: `1px solid ${C.border}`,
        display: "flex", gap: 8, background: C.surface,
    },
    msgInput: {
        flex: 1, background: C.bg, border: `1px solid ${C.border}`,
        borderRadius: 2, padding: "12px 16px", color: C.text,
        fontFamily: "'Courier New', monospace", fontSize: 13,
        outline: "none",
    },
    sendBtn: {
        background: C.accent, color: C.bg, border: "none",
        width: 44, borderRadius: 2, cursor: "pointer",
        fontSize: 18, fontWeight: 700,
    },
    noChatSelected: {
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 8,
    },
    ncIcon: { fontSize: 48, color: `${C.accent}33` },
    ncText: { color: C.muted, fontSize: 14, letterSpacing: 2, margin: 0 },
    ncSub: { color: `${C.muted}77`, fontSize: 11, letterSpacing: 1, margin: 0 },

    modalOverlay: {
        position: "fixed", inset: 0, background: "#000000aa",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
    },
    modalCard: {
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 4, padding: "24px", minWidth: 300,
        display: "flex", flexDirection: "column", gap: 14,
    },
    modalHead: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
    },
    modalTitle: { color: C.text, fontWeight: 700, fontSize: 14, letterSpacing: 1 },
    modalClose: {
        background: "none", border: "none", color: C.muted,
        cursor: "pointer", fontSize: 14,
    },
    modalInput: {
        background: C.bg, border: `1px solid ${C.border}`,
        borderRadius: 2, padding: "10px 14px", color: C.text,
        fontFamily: "'Courier New', monospace", fontSize: 13,
        outline: "none",
    },
    modalBtn: {
        background: C.accent, color: C.bg, border: "none",
        padding: "10px", cursor: "pointer", fontWeight: 700,
        fontFamily: "'Courier New', monospace", fontSize: 13,
        letterSpacing: 1, borderRadius: 2,
    },
};