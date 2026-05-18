import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Sphere } from '@unicitylabs/sphere-sdk';
import { createBrowserProviders } from '@unicitylabs/sphere-sdk/impl/browser';

const SphereCtx = createContext(null);

const API = import.meta.env.VITE_API_URL || '/api';

export function SphereProvider({ children, network = 'testnet' }) {
  const [sphere, setSphere] = useState(null);
  const [connecting, setConnecting] = useState(true);
  const [wallet, setWallet] = useState(null); // null | { exists, nametag, pubkey }
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [messages, setMessages] = useState({});   // { channelId: [msgs] }
  const [conversations, setConversations] = useState([]);
  const [currentDM, setCurrentDM] = useState(null);
  const [dmMessages, setDmMessages] = useState([]);
  const [unread, setUnread] = useState({});        // { channelId/dmPubkey: count }
  const handlersRef = useRef([]);

  // Init SDK — checks IndexedDB for existing wallet
  const initSphere = useCallback(async () => {
    try {
      const providers = createBrowserProviders({ network, groupChat: true, market: true });
      const exists = await Sphere.exists(providers.storage);
      setWallet({ exists, nametag: null });
      if (exists) {
        const { sphere: s } = await Sphere.init({ ...providers });
        afterInit(s);
      }
    } catch (e) {
      console.error('Sphere init:', e);
    } finally {
      setConnecting(false);
    }
  }, [network]);

  useEffect(() => { initSphere(); }, [initSphere]);

  const afterInit = async (s) => {
    setSphere(s);
    const nametag = s.getNametag?.() || null;
    setWallet(w => ({ ...w, exists: true, nametag, pubkey: s.identity?.chainPubkey }));

    // Load group chat state
    const g = s.groupChat;
    if (g) {
      // Try to join known channels (fetched from API)
      try {
        const chRes = await fetch(`${API}/chat/channels`);
        const chData = await chRes.json();
        if (Array.isArray(chData)) {
          for (const ch of chData) {
            if (!g.getGroup(ch.id)) {
              await g.joinGroup(ch.id).catch(() => {});
            }
          }
          setChannels(chData);
        }
      } catch {}

      // If no channels from API, use local groups
      const local = g.getGroups();
      if (local.length > 0 && channels.length === 0) {
        setChannels(local.map(gd => ({ id: gd.id, name: gd.name, description: gd.description })));
      }

      // Listen for new messages
      const unsub = g.onMessage((msg) => {
        setMessages(prev => {
          const list = prev[msg.groupId] || [];
          return { ...prev, [msg.groupId]: [...list, msg] };
        });
        // Track unread
        if (currentChannel?.id !== msg.groupId) {
          setUnread(u => ({ ...u, [msg.groupId]: (u[msg.groupId] || 0) + 1 }));
        }
      });
      handlersRef.current.push(unsub);
    }

    // Listen for DMs
    if (s.communications) {
      const unsub = s.communications.onDirectMessage((msg) => {
        setDmMessages(prev => [...prev, msg]);
        const peer = msg.senderPubkey;
        if (currentDM?.pubkey !== peer) {
          setUnread(u => ({ ...u, ['dm:' + peer]: (u['dm:' + peer] || 0) + 1 }));
        }
        // Update conversations list
        refreshConversations(s);
      });
      handlersRef.current.push(unsub);
      refreshConversations(s);
    }
  };

  const refreshConversations = async (s) => {
    try {
      // Use sphere to get conversations — or fallback to tracking
      const convs = s.communications?.getConversations?.() || [];
      setConversations(convs);
    } catch {}
  };

  // Auto-create wallet
  const createWallet = useCallback(async (nametag) => {
    const providers = createBrowserProviders({ network, groupChat: true, market: true });
    const { sphere: s, generatedMnemonic } = await Sphere.init({
      ...providers, autoGenerate: true, nametag: nametag || undefined,
    });
    afterInit(s);
    return generatedMnemonic;
  }, [network]);

  // Import existing mnemonic
  const importWallet = useCallback(async (mnemonic, nametag) => {
    const providers = createBrowserProviders({ network, groupChat: true, market: true });
    const { sphere: s } = await Sphere.init({
      ...providers, mnemonic,
    });
    afterInit(s);
  }, [network]);

  // Switch channel
  const openChannel = useCallback((ch) => {
    setCurrentChannel(ch);
    setCurrentDM(null);
    setUnread(u => ({ ...u, [ch.id]: 0 }));
    // Fetch history if empty
    if (sphere?.groupChat && (!messages[ch.id] || messages[ch.id].length === 0)) {
      sphere.groupChat.fetchMessages(ch.id, undefined, 50).then(msgs => {
        setMessages(prev => ({ ...prev, [ch.id]: msgs.reverse() }));
      }).catch(() => {});
    }
  }, [sphere, messages]);

  // Open DM with a peer
  const openDM = useCallback(async (nametag) => {
    if (!sphere) return;
    try {
      const peer = await sphere.resolve(nametag);
      if (peer) {
        setCurrentDM({ nametag, pubkey: peer.transportPubkey || peer.chainPubkey });
        setCurrentChannel(null);
      }
    } catch {}
  }, [sphere]);

  // Send message to channel
  const sendMessage = useCallback(async (content) => {
    if (!sphere?.groupChat || !currentChannel) return;
    const msg = await sphere.groupChat.sendMessage(currentChannel.id, content);
    if (msg) {
      setMessages(prev => {
        const list = prev[currentChannel.id] || [];
        return { ...prev, [currentChannel.id]: [...list, msg] };
      });
    }
    return msg;
  }, [sphere, currentChannel]);

  // Send DM
  const sendDM = useCallback(async (content) => {
    if (!sphere?.communications || !currentDM) return;
    await sphere.communications.sendDM(currentDM.pubkey, content);
    setDmMessages(prev => [...prev, {
      id: Date.now().toString(),
      content,
      senderPubkey: sphere.identity.chainPubkey,
      timestamp: Math.floor(Date.now() / 1000),
      isMine: true,
    }]);
  }, [sphere, currentDM]);

  // Send payment request via DM context
  const sendPayment = useCallback(async (toNametag, amount, coin = 'UCT') => {
    if (!sphere) return;
    const r = await sphere.payments.sendPaymentRequest(toNametag, {
      amount: String(amount), coinId: coin, message: 'Marketplace payment',
    });
    return r;
  }, [sphere]);

  useEffect(() => {
    return () => handlersRef.current.forEach(fn => fn());
  }, []);

  const value = {
    sphere, connecting, wallet, channels, currentChannel, currentDM,
    messages, conversations, dmMessages, unread,
    createWallet, importWallet, openChannel, openDM,
    sendMessage, sendDM, sendPayment, refreshConversations,
    setCurrentDM: (v) => { setCurrentDM(v); setCurrentChannel(null); },
  };

  return <SphereCtx.Provider value={value}>{children}</SphereCtx.Provider>;
}

export const useSphere = () => useContext(SphereCtx);
