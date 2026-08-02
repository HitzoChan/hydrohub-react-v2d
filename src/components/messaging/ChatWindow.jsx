import EmojiPicker from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";

import {
  getMessages,
  sendMessage,
  subscribeMessages,
} from "../../services/messaging.service";

export default function ChatWindow({
  conversation,
  onOpenDetails,
}) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const bottomRef = useRef(null);

    const conversationId = conversation?.id;

    const driverStatus = (
    conversation?.driverStatus || "offline"
    ).toLowerCase();
    const isArchived =
    conversation?.conversationStatus === "archived";

    console.log("Driver Status:", driverStatus);

  function formatMessageTime(date) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  }

  useEffect(() => {
    if (!conversationId) return;

    async function loadMessages() {
    try {
        const data = await getMessages(conversationId);

        console.log("Messages from DB:", data);

        setMessages(data);
    } catch (error) {
        console.error(error);
    }
    }

    loadMessages();

    const subscription = subscribeMessages(
      conversationId,
      async () => {
        try {
          const data = await getMessages(conversationId);
          setMessages(data);
        } catch (error) {
          console.error("Realtime update failed:", error);
        }
      }
    );

    return () => {
      subscription?.unsubscribe?.();
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);



function handleEmojiClick(emojiData) {

  setMessage((prev) => prev + emojiData.emoji);

  setShowEmojiPicker(false);

}
    async function handleSend(e) {
    e.preventDefault();

    console.log("1. handleSend called");

    if (!conversationId) {
        console.log("No conversationId");
        return;
    }

    if (!message.trim()) {
        console.log("Message is empty");
        return;
    }

    console.log("Sending:", {
        conversationId,
        senderType: "admin",
        senderId: "admin",
        message,
    });

    try {
        await sendMessage({
        conversationId,
        senderType: "admin",
        senderId: "admin",
        message,
        });

        // Immediately reload the messages
        const updatedMessages = await getMessages(conversationId);
        setMessages(updatedMessages);

        setMessage("");
    } catch (error) {
        console.error("Failed to send message:", error);
    }
    }

  if (!conversation) {
    return (
      <div className="empty-state">
        <i className="bi bi-chat-square-text"></i>

        <h5>Select a conversation</h5>

        <p>Choose a customer on the left to begin chatting.</p>
      </div>
    );
  }

  return (
    <>

{/* ==========================
    Modern Chat Header
========================== */}

<div className="chat-header">

  <div className="chat-header-left">

    {/* Clickable Avatar */}

    <button
      type="button"
      className="chat-profile-button"
      onClick={onOpenDetails}
      title="View Customer Details"
    >

      <div className="chat-avatar">

        {conversation.customerName?.charAt(0)?.toUpperCase()}

        <span
        className={
            driverStatus === "available"
            ? "online-indicator"
            : driverStatus === "delivering"
            ? "busy-indicator"
            : "offline-indicator"
        }
        />

      </div>

    </button>

    {/* Clickable Name */}

    <div
      className="chat-user-info clickable"
      onClick={onOpenDetails}
    >

      <h5 className="chat-customer-name">
        {conversation.customerName}
      </h5>

      <div className="chat-meta">

        <span className="driver-name">
          🚚 {conversation.driverName}
        </span>

        <span className={`driver-status ${driverStatus}`}>

        {driverStatus === "available" && "🟢 Available"}

        {driverStatus === "delivering" && "🟡 Delivering"}

        {driverStatus === "break" && "🟠 On Break"}

        {driverStatus === "offline" && "⚪ Offline"}

        </span>

      </div>

    </div>

  </div>



</div>

    {/* ==========================
        Messages
    ========================== */}
    {isArchived && (
      <div className="archived-banner">

        <div className="archived-icon">
          📦
        </div>

        <div className="archived-content">

          <strong>
            Archived Conversation
            <span className="archived-badge">
              Read-only
            </span>
          </strong>

          {conversation.archivedAt && (
            <p>
              Archived on{" "}
              {new Date(
                conversation.archivedAt
              ).toLocaleString([], {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}

        </div>

      </div>
    )}

    <div className="chat-body">

    {messages.length === 0 ? (

        <div className="chat-empty-state">

        <i className="bi bi-chat-heart"></i>

        <h5>No messages yet</h5>

        <p>
            Start the conversation by sending your first message.
        </p>

        </div>

    ) : (

        messages.map((msg) => {

        const isAdmin = msg.sender_type === "admin";
        const isDriver = msg.sender_type === "driver";

        return (

            <div
            key={msg.id}
            className={`message-row ${
                isAdmin ? "admin" : "customer"
            }`}
            >

            {/* Avatar (Customer / Driver Only) */}

            {!isAdmin && (

                <div className="message-avatar">

                {isDriver ? (
                    <i className="bi bi-truck"></i>
                ) : (
                    conversation.customerName
                    ?.charAt(0)
                    ?.toUpperCase()
                )}

                </div>

            )}

            {/* Bubble */}

            <div
                className={`message-bubble ${
                isAdmin
                    ? "admin"
                    : isDriver
                    ? "driver"
                    : "customer"
                }`}
            >

                {/* Sender */}

                <div className="message-sender">

                {isAdmin
                    ? "You"
                    : isDriver
                    ? conversation.driverName
                    : conversation.customerName}

                </div>

                {/* Message */}

                <div className="message-text">

                {msg.message}

                </div>

                {/* Footer */}

                <div className="message-footer">

                <span className="message-time">

                    {formatMessageTime(msg.created_at)}

                </span>

                {isAdmin && (

                    <span className="message-status">

                    <i className="bi bi-check2-all"></i>

                    </span>

                )}

                </div>

            </div>

            </div>

        );

        })

    )}

    <div ref={bottomRef} />

    </div>

    {/* ==========================
        Modern Message Composer
    ========================== */}

    {!isArchived ? (

    <form
      className="chat-footer"
      onSubmit={handleSend}
    >

        <div className="chat-composer">

            <div className="emoji-picker-wrapper">

                <button
                    type="button"
                    className="composer-icon-btn"
                    title="Emoji"
                    onClick={() =>
                        setShowEmojiPicker(!showEmojiPicker)
                    }
                >
                    <i className="bi bi-emoji-smile"></i>
                </button>

                {showEmojiPicker && (
                    <div className="emoji-picker-popup">
                        <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                        />
                    </div>
                )}

            </div>

            <input
                type="text"
                className="composer-input"
                placeholder="Type a message..."
                value={message}
                onChange={(e) =>
                    setMessage(e.target.value)
                }
            />

            <button
                type="submit"
                className="composer-send-btn"
                disabled={!message.trim()}
            >
                <i className="bi bi-send-fill"></i>
            </button>

        </div>

    </form>

    ) : (

    <div className="chat-footer archived-footer">

        <i className="bi bi-lock-fill"></i>

        <span>
            This conversation has been archived.
            Sending new messages is disabled.
        </span>

    </div>

    )}
    </>
  );
}