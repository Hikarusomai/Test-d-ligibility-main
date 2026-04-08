import { useState, useEffect, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
};

type ChatbotWidgetProps = {
    isDark?: boolean;
};

function ChatbotWidget({ isDark = false }: ChatbotWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'text' | 'voice'>('text');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: '👋 Bonjour ! Je suis votre assistant virtuel pour le questionnaire d\'éligibilité VISA Étudiant. Comment puis-je vous aider ?',
            timestamp: new Date(),
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
    const [mascotExpression, setMascotExpression] = useState<'idle' | 'talking' | 'listening'>('idle');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const conversation = useConversation({
        onConnect: () => {
            console.log('Chatbot vocal connecté');
            setIsConnected(true);
            setStatus('connected');
            setMascotExpression('listening');
        },
        onDisconnect: () => {
            console.log('Chatbot vocal déconnecté');
            setIsConnected(false);
            setStatus('idle');
            setMascotExpression('idle');
        },
        onError: (error) => {
            console.error('Erreur chatbot:', error);
            setStatus('error');
        },
        onMessage: (message) => {
            console.log('Message vocal reçu:', message);
            if (message.message) {
                addMessage('assistant', message.message);
                setMascotExpression('talking');
                setTimeout(() => setMascotExpression('listening'), 2000);
            }
        },
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && mode === 'text' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen, mode]);

    const toggleWidget = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setMascotExpression('idle');
        }
    };

    const switchMode = (newMode: 'text' | 'voice') => {
        if (newMode === 'voice' && mode === 'text') {
            setMode(newMode);
        } else if (newMode === 'text' && mode === 'voice') {
            if (isConnected) {
                stopVoiceConversation();
            }
            setMode(newMode);
        }
    };

    const addMessage = (role: 'user' | 'assistant', content: string) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            role,
            content,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage = inputText.trim();
        setInputText('');
        addMessage('user', userMessage);
        setIsTyping(true);
        setMascotExpression('talking');

        try {
            const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversation?agent_id=${import.meta.env.VITE_ELEVENLABS_AGENT_ID}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': import.meta.env.VITE_ELEVENLABS_API_KEY || '',
                },
                body: JSON.stringify({
                    text: userMessage,
                    mode: 'text',
                }),
            });

            if (response.ok) {
                const data = await response.json();
                addMessage('assistant', data.response || data.text || 'Je suis désolé, je n\'ai pas compris.');
            } else {
                await simulateResponse(userMessage);
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi:', error);
            await simulateResponse(userMessage);
        } finally {
            setIsTyping(false);
            setTimeout(() => setMascotExpression('idle'), 2000);
        }
    };

    const simulateResponse = async (userMessage: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const lowerMessage = userMessage.toLowerCase();
        let response = '';

        if (lowerMessage.includes('document') || lowerMessage.includes('papier')) {
            response = 'Pour votre demande de VISA étudiant, vous aurez généralement besoin de : votre passeport valide, une lettre d\'admission de l\'université, une preuve de fonds suffisants, et une assurance santé. Avez-vous d\'autres questions sur les documents ?';
        } else if (lowerMessage.includes('temps') || lowerMessage.includes('durée') || lowerMessage.includes('délai')) {
            response = 'Le processus de demande de VISA étudiant prend généralement entre 2 et 8 semaines, selon le pays de destination. Il est recommandé de commencer votre demande au moins 3 mois avant votre départ prévu.';
        } else if (lowerMessage.includes('preuve de fonds') || lowerMessage.includes('argent') || lowerMessage.includes('finance')) {
            response = 'La preuve de fonds est un document bancaire qui montre que vous disposez de ressources financières suffisantes pour couvrir vos frais de scolarité et de subsistance. Le montant exact varie selon le pays, mais comptez généralement entre 10 000 et 20 000 € pour une année.';
        } else if (lowerMessage.includes('académique') || lowerMessage.includes('études') || lowerMessage.includes('diplôme')) {
            response = 'Pour la section académique, vous devez fournir vos relevés de notes officiels, vos diplômes précédents, et votre lettre d\'admission. Assurez-vous que tous les documents sont traduits si nécessaire.';
        } else if (lowerMessage.includes('aide') || lowerMessage.includes('help')) {
            response = 'Je peux vous aider avec : les documents requis, les délais de traitement, les preuves de fonds, les questions académiques, et la compréhension du questionnaire. Que souhaitez-vous savoir ?';
        } else {
            response = 'Merci pour votre question ! Pour vous donner la meilleure réponse possible, pourriez-vous préciser votre question sur l\'éligibilité au VISA étudiant ? Je peux vous aider avec les documents, les délais, ou toute autre partie du processus.';
        }

        addMessage('assistant', response);
    };

    const startVoiceConversation = async () => {
        try {
            setStatus('connecting');
            await conversation.startSession({
                conversationToken: 'votre_token_ici',
                connectionType: 'webrtc', // optionnel selon doc
            });
            addMessage('assistant', '🎤 Mode vocal activé. Vous pouvez maintenant parler.');
        } catch (error) {
            console.error('Erreur lors du démarrage:', error);
            setStatus('error');
            alert('Erreur: Veuillez autoriser l\'accès au microphone');
        }
    };


    const stopVoiceConversation = async () => {
        await conversation.endSession();
        setStatus('idle');
        addMessage('assistant', '⚪ Mode vocal désactivé.');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    useEffect(() => {
        return () => {
            if (isConnected) {
                conversation.endSession();
            }
        };
    }, []);

    return (
        <>
            {/* Widget ouvert */}
            {isOpen && (
                <div
                    className={`fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] rounded-2xl shadow-2xl border-2 overflow-hidden z-50 transition-all ${
                        isDark
                            ? 'bg-neutral-900 border-neutral-700'
                            : 'bg-white border-neutral-200'
                    }`}
                >
                    {/* Header avec Mascotte */}
                    <div className="bg-gradient-to-r from-brand-primary to-blue-600 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                {/* Mascotte animée - Image complète sans rognage */}
                                <div className="relative flex-shrink-0">
                                    <img
                                        src="/assets/mascot-assistant.png"
                                        alt="Assistant mascot"
                                        className={`w-16 h-16 object-contain transition-transform duration-300 ${
                                            mascotExpression === 'talking' ? 'scale-110 animate-bounce' :
                                                mascotExpression === 'listening' ? 'animate-pulse' :
                                                    ''
                                        }`}
                                    />
                                    {/* Indicateur d'état */}
                                    {mascotExpression === 'talking' && (
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                                    )}
                                    {mascotExpression === 'listening' && (
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white animate-ping" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg">Assistant VISA</h3>
                                    <p className="text-white/90 text-xs font-medium">
                                        {mode === 'voice' ? (
                                            status === 'connected' ? '🎤 En écoute' :
                                                status === 'connecting' ? '⏳ Connexion...' :
                                                    '💤 Vocal inactif'
                                        ) : mascotExpression === 'talking' ? '💬 En train d\'écrire...' : '💬 Mode texte'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={toggleWidget}
                                className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                                aria-label="Fermer le chatbot"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Mode Toggle */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => switchMode('text')}
                                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                                    mode === 'text'
                                        ? 'bg-white text-brand-primary shadow-lg'
                                        : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                            >
                                💬 Texte
                            </button>
                            <button
                                onClick={() => switchMode('voice')}
                                className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                                    mode === 'voice'
                                        ? 'bg-white text-brand-primary shadow-lg'
                                        : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                            >
                                🎤 Vocal
                            </button>
                        </div>
                    </div>

                    {/* Body - Messages */}
                    <div className={`h-96 overflow-y-auto p-4 space-y-3 ${isDark ? 'bg-neutral-800' : 'bg-neutral-50'}`}>
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex items-end gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {/* Avatar de la mascotte - Image avec ordinateur */}
                                {message.role === 'assistant' && (
                                    <img
                                        src="/assets/mascot-pc.png"
                                        alt="Assistant"
                                        className="w-12 h-12 object-contain flex-shrink-0 mb-1"
                                    />
                                )}

                                <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                                        message.role === 'user'
                                            ? 'bg-brand-primary text-white rounded-br-sm'
                                            : isDark
                                                ? 'bg-neutral-700 text-neutral-200 rounded-bl-sm'
                                                : 'bg-white text-neutral-800 border-2 border-neutral-200 rounded-bl-sm shadow-sm'
                                    }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                    <p className={`text-xs mt-1.5 ${
                                        message.role === 'user'
                                            ? 'text-white/70 text-right'
                                            : isDark ? 'text-neutral-400' : 'text-neutral-500'
                                    }`}>
                                        {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex items-end gap-2">
                                <img
                                    src="/assets/mascot-pc.png"
                                    alt="Assistant"
                                    className="w-12 h-12 object-contain flex-shrink-0 mb-1 animate-bounce"
                                />
                                <div className={`rounded-2xl rounded-bl-sm px-5 py-4 ${isDark ? 'bg-neutral-700' : 'bg-white border-2 border-neutral-200 shadow-sm'}`}>
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2.5 h-2.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2.5 h-2.5 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Footer - Input ou Voice Controls */}
                    <div className={`p-4 border-t-2 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'}`}>
                        {mode === 'text' ? (
                            <div className="flex gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Tapez votre message..."
                                    className={`flex-1 px-4 py-3 rounded-xl border-2 focus:outline-none focus:border-brand-primary transition-colors ${
                                        isDark
                                            ? 'bg-neutral-700 border-neutral-600 text-white placeholder-neutral-400'
                                            : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-500'
                                    }`}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!inputText.trim() || isTyping}
                                    className="bg-brand-primary hover:bg-brand-primary-dark text-white p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {!isConnected ? (
                                    <>
                                        <button
                                            onClick={startVoiceConversation}
                                            disabled={status === 'connecting'}
                                            className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-3.5 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                                                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                                            </svg>
                                            {status === 'connecting' ? 'Connexion...' : 'Démarrer la conversation vocale'}
                                        </button>
                                        <p className={`text-xs text-center ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                            💡 Cliquez pour activer le microphone
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-center gap-3 py-3">
                                            <img
                                                src="/assets/mascot-assistant.png"
                                                alt="Listening"
                                                className="w-20 h-20 object-contain animate-pulse"
                                            />
                                            <div className="text-green-600 dark:text-green-400">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                                                    <span className="text-sm font-bold">En écoute...</span>
                                                </div>
                                                <p className="text-xs mt-1">Parlez maintenant</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={stopVoiceConversation}
                                            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                            </svg>
                                            Arrêter
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Bouton flottant avec mascotte - Animation bounce sur le cercle */}
            <button
                onClick={toggleWidget}
                className={`fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 z-50 ${
                    isOpen
                        ? 'bg-neutral-500 hover:bg-neutral-600'
                        : 'bg-gradient-to-br from-brand-primary to-blue-600 animate-bounce'
                }`}
                aria-label={isOpen ? "Fermer l'assistant" : "Ouvrir l'assistant"}
            >
                {isOpen ? (
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                ) : (
                    <div className="relative">
                        <img
                            src="/assets/mascot-assistant.png"
                            alt="Assistant"
                            className="w-14 h-14 object-contain"
                        />
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse border-2 border-white">
                            ?
                        </span>
                    </div>
                )}
            </button>
        </>
    );
}

export default ChatbotWidget;
