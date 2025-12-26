import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { format, differenceInSeconds } from 'date-fns';
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
    writeBatch,
    serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import {
    FaPaperPlane,
    FaImage,
    FaFile,
    FaSmile,
    FaCode,
    FaReply,
    FaEdit,
    FaTrash,
    FaTimes,
    FaEllipsisV,
    FaUser,
    FaPaperclip,

    FaSearch,
    FaBell,
    FaRegStar,
    FaStar
} from 'react-icons/fa';
import Picker from 'emoji-picker-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
    id: string;
    sessionId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    type: 'text' | 'image' | 'file' | 'code' | 'system' | 'announcement';
    metadata?: {
        language?: string;
        fileName?: string;
        fileSize?: number;
        fileUrl?: string;
        imageUrl?: string;
        imageDimensions?: { width: number; height: number };
        code?: string;
    };
    reactions: Reaction[];
    replyTo?: string;
    edited: boolean;
    deleted: boolean;
    pinned: boolean;
    starred: boolean;
    readBy: string[];
    mentions: string[];
    createdAt: Date;
    updatedAt: Date;
}

interface Reaction {
    emoji: string;
    userIds: string[];
}

interface ChatParticipant {
    id: string;
    name: string;
    avatar?: string;
    role: 'host' | 'participant' | 'observer' | 'moderator';
    online: boolean;
    lastSeen?: Date;
    typing: boolean;
}

interface ChatConfig {
    allowImages: boolean;
    allowFiles: boolean;
    allowCode: boolean;
    allowReactions: boolean;
    maxFileSize: number;
    allowedFileTypes: string[];
    slowMode: boolean;
    slowModeInterval: number;
    deleteMessages: boolean;
    pinMessages: boolean;
}

const AdvancedChatSystem: React.FC<{
    sessionId: string;
    userId: string;
    onUserClick?: (userId: string) => void;
}> = ({
    sessionId,
    userId,
    onUserClick
}) => {
        // Hooks
        const { userProfile } = useAuth(); // Assuming useAuth exposes userProfile

        // State
        const [messages, setMessages] = useState<Message[]>([]);
        const [newMessage, setNewMessage] = useState('');
        const [participants, setParticipants] = useState<ChatParticipant[]>([]);
        const [typingUsers, setTypingUsers] = useState<string[]>([]);
        const [showEmojiPicker, setShowEmojiPicker] = useState(false);
        const [replyingTo, setReplyingTo] = useState<Message | null>(null);
        const [editingMessage, setEditingMessage] = useState<Message | null>(null);
        const [showContextMenu, setShowContextMenu] = useState<{ x: number; y: number; messageId: string } | null>(null);
        const [showParticipants, setShowParticipants] = useState(true);

        // Config
        const [config, setConfig] = useState<ChatConfig>({
            allowImages: true,
            allowFiles: true,
            allowCode: true,
            allowReactions: true,
            maxFileSize: 10 * 1024 * 1024,
            allowedFileTypes: ['.pdf', '.doc', '.docx', '.txt', '.zip', '.jpg', '.png', '.gif'],
            slowMode: false,
            slowModeInterval: 5,
            deleteMessages: true,
            pinMessages: true
        });

        // Refs
        const messagesEndRef = useRef<HTMLDivElement>(null);
        const fileInputRef = useRef<HTMLInputElement>(null);
        const imageInputRef = useRef<HTMLInputElement>(null);
        const typingTimeoutRef = useRef<NodeJS.Timeout>();
        const lastMessageTimeRef = useRef<Date>(new Date());

        // Load messages with correct ordering
        useEffect(() => {
            if (!sessionId) {
                console.error("Chat: No sessionId provided");
                return;
            }
            console.log("Chat: Initializing with sessionId:", sessionId, "userId:", userId);

            // Removing orderBy temporarily to fix potential missing index issues
            // const q = query(
            //     collection(db, 'sessions', sessionId, 'messages'),
            //     orderBy('createdAt', 'desc'),
            //     limit(100)
            // );

            // Simpler query to test basic connectivity
            const q = query(
                collection(db, 'sessions', sessionId, 'messages'),
                limit(100)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const loadedMessages = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
                        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now())
                    } as Message;
                });

                // Manual sort since we removed orderBy
                loadedMessages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

                console.log(`Chat: Loaded ${loadedMessages.length} messages for session ${sessionId}`);
                setMessages(loadedMessages);
            }, (error) => {
                console.error("Chat sync error:", error);
            });

            return () => unsubscribe();
        }, [sessionId]);

        // ... (rest of listeners remain similar, removed for brevity in replacement if not changing) ...
        // Note: To minimize code replacement complexity, I will keep other listeners if possible but I selected a large block.
        // Actually, I should just replace the necessary parts. 
        // But `useAuth` needs to be defined at top. 

        // Let's re-implement `load participants`, `typing` and `sendMessage` to include the hook variable.

        // Load participants
        useEffect(() => {
            const q = query(collection(db, 'sessions', sessionId, 'participants'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const participantsList: ChatParticipant[] = [];
                snapshot.forEach((doc) => {
                    participantsList.push({ id: doc.id, ...doc.data() } as ChatParticipant);
                });
                setParticipants(participantsList);
            });
            return () => unsubscribe();
        }, [sessionId]);

        // Typing indicator
        const handleTyping = useCallback(() => {
            if (!typingTimeoutRef.current) {
                updateDoc(doc(db, 'sessions', sessionId, 'participants', userId), {
                    typing: true,
                    lastTyping: new Date()
                }).catch(() => { });
            }
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                updateDoc(doc(db, 'sessions', sessionId, 'participants', userId), {
                    typing: false
                }).catch(() => { });
            }, 1000);
        }, [sessionId, userId]);

        // Send Message
        const sendMessage = async (content: string, type: Message['type'] = 'text', metadata?: any) => {
            if (!content.trim()) return;

            if (!userId) {
                console.error("SendMessage failed: Missing userId");
                toast.error("Authentication error: No User ID");
                return;
            }

            // Slow mode check
            if (config.slowMode) {
                const diff = differenceInSeconds(new Date(), lastMessageTimeRef.current);
                if (diff < config.slowModeInterval) {
                    toast.error(`Wait ${config.slowModeInterval - diff}s`);
                    return;
                }
            }

            if (!sessionId) {
                console.error("SendMessage failed: Missing sessionId");
                toast.error("Session Error");
                return;
            }

            try {
                const messageData: any = {
                    sessionId,
                    userId,
                    userName: userProfile?.name || 'User',
                    userAvatar: userProfile?.avatar || '',
                    content,
                    type,
                    metadata: metadata || {},
                    reactions: [],
                    edited: false,
                    deleted: false,
                    pinned: false,
                    starred: false,
                    readBy: [userId],
                    mentions: [], // extractMentions(content) if needed
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };

                if (replyingTo) messageData.replyTo = replyingTo.id;

                await addDoc(collection(db, 'sessions', sessionId, 'messages'), messageData);

                setNewMessage('');
                setReplyingTo(null);
                lastMessageTimeRef.current = new Date();

                // Clear typing
                updateDoc(doc(db, 'sessions', sessionId, 'participants', userId), { typing: false }).catch(() => { });

            } catch (error) {
                console.error('Error sending message:', error);
                toast.error('Failed to send message');
            }
        };

        const handleFileUpload = async (file: File) => {
            if (file.size > config.maxFileSize) {
                toast.error(`File size exceeds ${config.maxFileSize / (1024 * 1024)}MB limit`);
                return;
            }

            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            if (!config.allowedFileTypes.includes(`.${fileExtension}`)) {
                toast.error('File type not allowed');
                return;
            }

            try {
                const fileRef = ref(storage, `sessions/${sessionId}/files/${Date.now()}_${file.name}`);
                await uploadBytes(fileRef, file);
                const downloadURL = await getDownloadURL(fileRef);

                const messageContent = file.type.startsWith('image/')
                    ? '📸 Image shared'
                    : `📎 ${file.name}`;

                await sendMessage(messageContent, file.type.startsWith('image/') ? 'image' : 'file', {
                    fileName: file.name,
                    fileSize: file.size,
                    fileUrl: downloadURL,
                    ...(file.type.startsWith('image/') && { imageUrl: downloadURL })
                });
            } catch (error) {
                console.error('Error uploading file:', error);
                toast.error('Failed to upload file');
            }
        };

        const handleEditMessage = async (messageId: string, newContent: string) => {
            try {
                await updateDoc(doc(db, 'sessions', sessionId, 'messages', messageId), {
                    content: newContent,
                    edited: true,
                    updatedAt: new Date()
                });
                setEditingMessage(null);
                toast.success('Message updated');
            } catch (error) {
                console.error('Error editing message:', error);
                toast.error('Failed to edit message');
            }
        };

        const handleDeleteMessage = async (messageId: string, permanent = false) => {
            try {
                if (permanent) {
                    await deleteDoc(doc(db, 'sessions', sessionId, 'messages', messageId));
                    toast.success('Message deleted permanently');
                } else {
                    await updateDoc(doc(db, 'sessions', sessionId, 'messages', messageId), {
                        deleted: true,
                        content: 'This message has been deleted',
                        updatedAt: new Date()
                    });
                    toast.success('Message deleted');
                }
            } catch (error) {
                console.error('Error deleting message:', error);
                toast.error('Failed to delete message');
            }
        };

        const handleReaction = async (messageId: string, emoji: string) => {
            try {
                const messageRef = doc(db, 'sessions', sessionId, 'messages', messageId);
                const message = messages.find(m => m.id === messageId);

                if (!message) return;

                const existingReaction = message.reactions?.find(r => r.emoji === emoji);

                // Ensure reactions is initialized
                const currentReactions = message.reactions || [];

                let updatedReactions;

                if (existingReaction) {
                    if (existingReaction.userIds.includes(userId)) {
                        // Remove reaction
                        updatedReactions = currentReactions.map(r =>
                            r.emoji === emoji
                                ? { ...r, userIds: r.userIds.filter(id => id !== userId) }
                                : r
                        ).filter(r => r.userIds.length > 0);
                    } else {
                        // Add reaction
                        updatedReactions = currentReactions.map(r =>
                            r.emoji === emoji
                                ? { ...r, userIds: [...r.userIds, userId] }
                                : r
                        );
                    }
                } else {
                    // Add new reaction
                    updatedReactions = [...currentReactions, { emoji, userIds: [userId] }];
                }
                await updateDoc(messageRef, { reactions: updatedReactions });
            } catch (error) {
                console.error('Error adding reaction:', error);
            }
        };

        const handlePinMessage = async (messageId: string, pin: boolean) => {
            try {
                await updateDoc(doc(db, 'sessions', sessionId, 'messages', messageId), {
                    pinned: pin,
                    updatedAt: new Date()
                });
                toast.success(pin ? 'Message pinned' : 'Message unpinned');
            } catch (error) {
                console.error('Error pinning message:', error);
                toast.error('Failed to pin message');
            }
        };

        const extractMentions = (content: string): string[] => {
            const mentionRegex = /@(\w+)/g;
            const mentions = [];
            let match;
            while ((match = mentionRegex.exec(content)) !== null) {
                mentions.push(match[1]);
            }
            return mentions;
        };

        const scrollToBottom = () => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        };

        useEffect(() => {
            scrollToBottom();
        }, [messages]);

        const renderMessageContent = (message: Message) => {
            if (message.deleted) {
                return (
                    <div className="text-gray-500 italic">
                        This message has been deleted
                    </div>
                );
            }

            switch (message.type) {
                case 'image':
                    return (
                        <div className="space-y-2">
                            <img
                                src={message.metadata?.imageUrl}
                                alt="Shared image"
                                className="max-w-full max-h-96 rounded-lg cursor-pointer hover:opacity-90"
                                onClick={() => window.open(message.metadata?.imageUrl, '_blank')}
                            />
                            <p className="text-sm text-gray-600">{message.content}</p>
                        </div>
                    );

                case 'file':
                    return (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-3">
                                <FaFile className="text-2xl text-blue-500" />
                                <div className="flex-1">
                                    <a
                                        href={message.metadata?.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-blue-600 hover:text-blue-800"
                                    >
                                        {message.metadata?.fileName}
                                    </a>
                                    <div className="text-sm text-gray-500">
                                        {((message.metadata?.fileSize || 0) / 1024).toFixed(2)} KB
                                    </div>
                                </div>
                                <a
                                    href={message.metadata?.fileUrl}
                                    download
                                    className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 text-sm"
                                >
                                    Download
                                </a>
                            </div>
                        </div>
                    );

                case 'code':
                    return (
                        <div className="space-y-2">
                            <div className="bg-gray-900 rounded-lg overflow-hidden">
                                <div className="px-4 py-2 bg-gray-800 text-gray-300 text-sm flex justify-between items-center">
                                    <span>{message.metadata?.language || 'code'}</span>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(message.metadata?.code || '')}
                                        className="px-2 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <SyntaxHighlighter
                                    language={message.metadata?.language}
                                    style={vscDarkPlus}
                                    customStyle={{ margin: 0, padding: '1rem', fontSize: '0.875rem' }}
                                >
                                    {message.metadata?.code || ''}
                                </SyntaxHighlighter>
                            </div>
                            <p className="text-sm text-gray-600">{message.content}</p>
                        </div>
                    );

                case 'system':
                    return (
                        <div className="text-center">
                            <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm">
                                {message.content}
                            </div>
                        </div>
                    );

                case 'announcement':
                    return (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                            <div className="flex items-center space-x-2 mb-2">
                                <FaBell className="text-yellow-600" />
                                <span className="font-semibold text-yellow-800">Announcement</span>
                            </div>
                            <p className="text-gray-800">{message.content}</p>
                        </div>
                    );

                default:
                    return (
                        <div className="prose prose-sm max-w-none">
                            <ReactMarkdown
                                components={{
                                    code({ node, inline, className, children, ...props }: any) {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                            <SyntaxHighlighter
                                                style={vscDarkPlus}
                                                language={match[1]}
                                                PreTag="div"
                                                {...props}
                                            >
                                                {String(children).replace(/\n$/, '')}
                                            </SyntaxHighlighter>
                                        ) : (
                                            <code className="bg-gray-200 px-1 py-0.5 rounded text-sm" {...props}>
                                                {children}
                                            </code>
                                        );
                                    }
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    );
            }
        };

        const renderMessage = (message: Message) => {
            const isOwnMessage = message.userId === userId;
            const repliedMessage = message.replyTo
                ? messages.find(m => m.id === message.replyTo)
                : null;

            return (
                <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
                >
                    <div
                        className={`max-w-[70%] relative ${isOwnMessage
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl rounded-br-none'
                            : 'bg-white text-gray-800 rounded-2xl rounded-bl-none border border-gray-200'
                            }`}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setShowContextMenu({
                                x: e.clientX,
                                y: e.clientY,
                                messageId: message.id
                            });
                        }}
                    >
                        {/* Reply indicator */}
                        {repliedMessage && (
                            <div className={`p-3 border-l-4 ${isOwnMessage ? 'border-blue-400' : 'border-gray-300'
                                } bg-white/10 rounded-l-lg mb-2`}>
                                <div className="flex items-center space-x-2 text-sm">
                                    <FaReply className="opacity-60" />
                                    <span className="font-medium">{repliedMessage.userName}</span>
                                </div>
                                <div className="text-sm truncate mt-1">
                                    {repliedMessage.content.substring(0, 100)}
                                    {repliedMessage.content.length > 100 && '...'}
                                </div>
                            </div>
                        )}

                        {/* Message header */}
                        <div className="p-4 pb-2">
                            {!isOwnMessage && (
                                <div
                                    className="flex items-center space-x-2 mb-2 cursor-pointer group/user"
                                    onClick={() => onUserClick && onUserClick(message.userId)}
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center transition-transform group-hover/user:scale-105">
                                        {message.userAvatar ? (
                                            <img src={message.userAvatar} alt="" className="w-full h-full rounded-full" />
                                        ) : (
                                            <FaUser className="text-white text-sm" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-semibold group-hover/user:text-blue-600 transition-colors">{message.userName}</div>
                                        <div className="text-xs opacity-75">
                                            {message.createdAt instanceof Date
                                                ? format(message.createdAt, 'h:mm a')
                                                : 'Now'}
                                            {message.edited && ' • Edited'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Message content */}
                            <div className={isOwnMessage ? 'text-white' : 'text-gray-800'}>
                                {editingMessage?.id === message.id ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={editingMessage.content}
                                            onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                                            className="w-full p-2 bg-white/10 rounded-lg text-white"
                                            rows={3}
                                            autoFocus
                                        />
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleEditMessage(message.id, editingMessage.content)}
                                                className="px-3 py-1 bg-white text-blue-600 rounded-lg text-sm"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingMessage(null)}
                                                className="px-3 py-1 bg-white/20 text-white rounded-lg text-sm"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    renderMessageContent(message)
                                )}
                            </div>

                            {/* Reactions */}
                            {message.reactions && message.reactions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {message.reactions.map((reaction, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleReaction(message.id, reaction.emoji)}
                                            className={`px-2 py-1 rounded-full text-xs flex items-center space-x-1 ${reaction.userIds.includes(userId)
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-200 text-gray-700'
                                                }`}
                                        >
                                            <span>{reaction.emoji}</span>
                                            <span>{reaction.userIds.length}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Read receipts */}
                            {isOwnMessage && message.readBy && message.readBy.length > 1 && (
                                <div className="text-right text-xs opacity-75 mt-1">
                                    Read by {message.readBy.length - 1}
                                </div>
                            )}
                        </div>

                        {/* Message actions (hover) */}
                        <div className="absolute right-2 -top-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex space-x-1 bg-white rounded-lg shadow-lg p-1">
                                {config.allowReactions && (
                                    <button
                                        onClick={() => handleReaction(message.id, '👍')}
                                        className="p-2 hover:bg-gray-100 rounded"
                                    >
                                        👍
                                    </button>
                                )}
                                <button
                                    onClick={() => setReplyingTo(message)}
                                    className="p-2 hover:bg-gray-100 rounded"
                                >
                                    <FaReply />
                                </button>
                                {isOwnMessage && (
                                    <>
                                        <button
                                            onClick={() => setEditingMessage(message)}
                                            className="p-2 hover:bg-gray-100 rounded"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteMessage(message.id, false)}
                                            className="p-2 hover:bg-gray-100 rounded text-red-600"
                                        >
                                            <FaTrash />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Pinned indicator */}
                        {message.pinned && (
                            <div className="absolute -left-2 -top-2">
                                <FaStar className="text-yellow-500" />
                            </div>
                        )}
                    </div>
                </div>
            );
        };

        return (
            <div className="h-full flex flex-col">
                {/* Chat header */}
                <div className="bg-white border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold">💬</span>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Session Chat</h3>
                                <div className="text-sm text-gray-600 flex items-center space-x-2">
                                    <span>{participants.length} participants</span>
                                    {typingUsers.length > 0 && (
                                        <span className="text-blue-600 animate-pulse">
                                            {typingUsers.slice(0, 2).join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">

                            <button className="p-2 hover:bg-gray-100 rounded-lg">
                                <FaSearch />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg">
                                <FaEllipsisV />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Messages panel */}
                    <div className="flex-1 flex flex-col">
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">💬</div>
                                    <h4 className="text-xl font-medium text-gray-600 mb-2">
                                        No messages yet
                                    </h4>
                                    <p className="text-gray-500">
                                        Start the conversation by sending a message
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {messages.map(renderMessage)}
                                    <div ref={messagesEndRef} />
                                </>
                            )}

                            {/* Replying indicator */}
                            {replyingTo && (
                                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <FaReply className="text-gray-400" />
                                            <div>
                                                <div className="text-sm font-medium">Replying to {replyingTo.userName}</div>
                                                <div className="text-sm text-gray-500 truncate max-w-md">
                                                    {replyingTo.content.substring(0, 100)}
                                                    {replyingTo.content.length > 100 && '...'}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setReplyingTo(null)}
                                            className="p-2 hover:bg-gray-100 rounded-lg"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input area */}
                        <div className="border-t border-gray-200 p-4">
                            <div className="flex items-end space-x-3">
                                {/* Attachments */}
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => imageInputRef.current?.click()}
                                        className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                        title="Upload image"
                                    >
                                        <FaImage />
                                    </button>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-3 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg"
                                        title="Upload file"
                                    >
                                        <FaFile />
                                    </button>
                                    <button
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className="p-3 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg"
                                        title="Emoji"
                                    >
                                        <FaSmile />
                                    </button>
                                    <button
                                        onClick={() => {
                                            const code = prompt('Enter code:');
                                            if (code) {
                                                const language = prompt('Enter language (js, python, etc):') || 'javascript';
                                                sendMessage('Code shared', 'code', { code, language });
                                            }
                                        }}
                                        className="p-3 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                                        title="Code block"
                                    >
                                        <FaCode />
                                    </button>
                                </div>

                                {/* Text input */}
                                <div className="flex-1 relative">
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => {
                                            setNewMessage(e.target.value);
                                            handleTyping();
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                sendMessage(newMessage);
                                            }
                                        }}
                                        placeholder="Type your message..."
                                        className="w-full px-4 py-3 pr-24 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                        rows={1}
                                    />
                                    <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                                        <button
                                            onClick={() => sendMessage(newMessage)}
                                            disabled={!newMessage.trim()}
                                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <FaPaperPlane />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Emoji picker */}
                            <AnimatePresence>
                                {showEmojiPicker && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        className="absolute bottom-20 left-4 z-20"
                                    >
                                        <Picker
                                            onEmojiClick={(emojiData) => {
                                                setNewMessage(prev => prev + emojiData.emoji);
                                                setShowEmojiPicker(false);
                                            }}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Participants panel */}
                    <AnimatePresence>
                        {showParticipants && (
                            <motion.div
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 300, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                className="border-l border-gray-200 bg-white overflow-hidden"
                            >
                                <div className="p-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-gray-900">Participants</h4>
                                        <button
                                            onClick={() => setShowParticipants(false)}
                                            className="p-2 hover:bg-gray-100 rounded-lg"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3 overflow-y-auto h-[calc(100%-80px)]">
                                    {participants.map((participant) => (
                                        <div
                                            key={participant.id}
                                            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="relative">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                                        {participant.avatar ? (
                                                            <img src={participant.avatar} alt="" className="w-full h-full rounded-full" />
                                                        ) : (
                                                            <FaUser className="text-white text-sm" />
                                                        )}
                                                    </div>
                                                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${participant.online ? 'bg-green-500' : 'bg-gray-400'
                                                        }`}></div>
                                                </div>
                                                <div>
                                                    <div className="font-medium flex items-center space-x-2">
                                                        <span>{participant.name}</span>
                                                        {participant.typing && (
                                                            <span className="text-xs text-blue-600 animate-pulse">
                                                                typing...
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {participant.role}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {participant.role === 'host' && (
                                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                                        Host
                                                    </span>
                                                )}
                                                {participant.role === 'moderator' && (
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                        Mod
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Context menu */}
                <AnimatePresence>
                    {showContextMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowContextMenu(null)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="fixed bg-white rounded-lg shadow-xl border border-gray-200 z-50"
                                style={{
                                    left: showContextMenu.x,
                                    top: showContextMenu.y,
                                    transform: 'translate(-50%, -100%)'
                                }}
                            >
                                <div className="py-1 min-w-[200px]">
                                    <button
                                        onClick={() => {
                                            const message = messages.find(m => m.id === showContextMenu.messageId);
                                            if (message) setReplyingTo(message);
                                            setShowContextMenu(null);
                                        }}
                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                                    >
                                        <FaReply />
                                        <span>Reply</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            const message = messages.find(m => m.id === showContextMenu.messageId);
                                            if (message) {
                                                navigator.clipboard.writeText(message.content);
                                                toast.success('Copied to clipboard');
                                            }
                                            setShowContextMenu(null);
                                        }}
                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                                    >
                                        <FaPaperclip />
                                        <span>Copy text</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            const message = messages.find(m => m.id === showContextMenu.messageId);
                                            if (message) handlePinMessage(message.id, !message.pinned);
                                            setShowContextMenu(null);
                                        }}
                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                                    >
                                        <FaRegStar />
                                        <span>Pin message</span>
                                    </button>
                                    <div className="border-t border-gray-200 my-1"></div>
                                    <button
                                        onClick={() => {
                                            const message = messages.find(m => m.id === showContextMenu.messageId);
                                            if (message && message.userId === userId) {
                                                setEditingMessage(message);
                                            }
                                            setShowContextMenu(null);
                                        }}
                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                                    >
                                        <FaEdit />
                                        <span>Edit</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleDeleteMessage(showContextMenu.messageId, false);
                                            setShowContextMenu(null);
                                        }}
                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600 flex items-center space-x-2"
                                    >
                                        <FaTrash />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Hidden file inputs */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept={config.allowedFileTypes.join(',')}
                    onChange={(e) => {
                        if (e.target.files?.[0]) {
                            handleFileUpload(e.target.files[0]);
                        }
                    }}
                />
                <input
                    type="file"
                    ref={imageInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                        if (e.target.files?.[0]) {
                            handleFileUpload(e.target.files[0]);
                        }
                    }}
                />
            </div>
        );
    };

export default AdvancedChatSystem;
