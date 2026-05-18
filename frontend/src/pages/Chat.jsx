import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSphere } from '../sphere/SphereContext';
import WalletConnect from '../components/WalletConnect';

export default function Chat() {
  const { sphere, connecting, wallet, channels, currentChannel, currentDM,
    messages, conversations, dmMessages, unread, initError, createWallet, importWallet,
    openChannel, openDM, sendMessage, sendDM, setCurrentDM } = useSphere();
  const [searchParams] = useSearchParams();

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [dmTarget, setDmTarget] = useState('');

  // Auto-open DM from query param
  useEffect(() => {
    const dm = searchParams.get('dm');
    if (dm && sphere) openDM(dm);
  }, [searchParams, sphere]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      if (currentChannel) await sendMessage(input.trim());
      if (currentDM) await sendDM(input.trim());
      setInput('');
    } catch (e) { console.error('Send failed:', e); }
    setSending(false);
  };

  const handleStartDM = async () => {
    if (!dmTarget.trim()) return;
    await openDM(dmTarget.trim());
    setDmTarget('');
  };

  if (connecting) return <div className="loading">Connecting wallet...</div>;
  if (initError) return (
    <div className="empty" style={{ marginTop: '2rem' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
      <h3>Connection failed</h3>
      <div className="meta" style={{ justifyContent: 'center', marginBottom: '1rem', fontSize: '0.8rem' }}>
        {initError}
      </div>
      <button className="btn" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );
  if (!wallet?.exists) return <WalletConnect onCreate={createWallet} onImport={importWallet} />;

  const channelMsgs = currentChannel ? (messages[currentChannel.id] || []) : [];
  const activeMsgs = currentChannel ? channelMsgs : dmMessages;
  const hasUnread = (id) => unread[id] > 0;

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar-section">
          <h4>Channels</h4>
          {channels.map(ch => (
            <div key={ch.id}
              className={`chat-item ${currentChannel?.id === ch.id ? 'active' : ''}`}
              onClick={() => openChannel(ch)}>
              <span># {ch.name}</span>
              {hasUnread(ch.id) && <span className="chat-badge">{unread[ch.id]}</span>}
            </div>
          ))}
        </div>

        <div className="chat-sidebar-section">
          <h4>Direct Messages</h4>
          <div className="chat-start-dm">
            <input value={dmTarget} onChange={e => setDmTarget(e.target.value)}
              placeholder="@nametag" onKeyDown={e => e.key === 'Enter' && handleStartDM()}
              className="chat-dm-input" />
            <button className="btn btn-sm" onClick={handleStartDM}>Go</button>
          </div>
          {currentDM && (
            <div className={`chat-item active`} onClick={() => setCurrentDM(currentDM)}>
              @{currentDM.nametag}
            </div>
          )}
          {conversations.map(c => (
            <div key={c.peerPubkey || c.pubkey} className="chat-item"
              onClick={() => openDM(c.nametag || c.peerPubkey)}>
              @{c.nametag || c.peerPubkey?.slice(0, 8)}
              {hasUnread('dm:' + (c.peerPubkey || c.pubkey)) &&
                <span className="chat-badge">{unread['dm:' + (c.peerPubkey || c.pubkey)]}</span>}
            </div>
          ))}
        </div>
      </aside>

      {/* Main chat area */}
      <main className="chat-main">
        {currentChannel ? (
          <>
            <div className="chat-header"># {currentChannel.name}</div>
            <div className="chat-messages">
              {channelMsgs.length === 0 && <div className="empty">No messages yet</div>}
              {channelMsgs.map((m, i) => (
                <div key={m.id || i} className="msg-bubble">
                  <span className="msg-author">{m.senderNametag || m.senderPubkey?.slice(0, 8)}</span>
                  <span className="msg-text">{m.content}</span>
                  <span className="msg-time">{new Date(m.timestamp * 1000).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input value={input} onChange={e => setInput(e.target.value)}
                placeholder="Type a message..." onKeyDown={e => e.key === 'Enter' && handleSend()}
                disabled={sending} />
              <button className="btn" onClick={handleSend} disabled={!input.trim() || sending}>
                {sending ? '...' : 'Send'}
              </button>
            </div>
          </>
        ) : currentDM ? (
          <>
            <div className="chat-header">DM with @{currentDM.nametag}</div>
            <div className="chat-messages">
              {dmMessages.filter(m => m.senderPubkey === currentDM.pubkey || m.isMine).map((m, i) => (
                <div key={m.id || i} className={`msg-bubble ${m.isMine ? 'mine' : ''}`}>
                  <span className="msg-author">{m.isMine ? 'You' : (m.senderNametag || m.senderPubkey?.slice(0, 8))}</span>
                  <span className="msg-text">{m.content}</span>
                  <span className="msg-time">{new Date(m.timestamp * 1000).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input value={input} onChange={e => setInput(e.target.value)}
                placeholder="Type a message..." onKeyDown={e => e.key === 'Enter' && handleSend()}
                disabled={sending} />
              <button className="btn" onClick={handleSend} disabled={!input.trim() || sending}>
                {sending ? '...' : 'Send'}
              </button>
            </div>
          </>
        ) : (
          <div className="empty">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
            Select a channel or start a DM
          </div>
        )}
      </main>
    </div>
  );
}
