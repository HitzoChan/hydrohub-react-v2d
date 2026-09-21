import EmojiPicker from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";

import {
  archiveConversation,
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
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);

  const conversationId = conversation?.id;

  // =========================================================
  // CONVERSATION TYPE
  // =========================================================

  const isSupport =
    conversation?.conversation_type === "support" ||
    conversation?.conversationType === "support";

  const isArchived =
    conversation?.conversationStatus === "archived" ||
    conversation?.status === "archived";

  // =========================================================
  // SUPPORT INFORMATION
  // =========================================================

  const supportName =
    conversation?.supportName ||
    conversation?.stationName ||
    "Aqua in Lavada";

  const supportLabel = "Station Support";

  // =========================================================
  // CUSTOMER / DRIVER INFORMATION
  // =========================================================

  const customerIdentity =
    conversation?.customerName ||
    conversation?.customer?.full_name ||
    conversation?.customer?.name;

  const customerName =
    customerIdentity || "Customer";

  const driverIdentity =
    conversation?.driverName ||
    conversation?.driver?.name ||
    conversation?.driver?.full_name;

  const driverName =
    driverIdentity || "Driver";

  const latestSenderType = String(
    conversation?.latestSenderType || ""
  )
    .toLowerCase()
    .trim();

  const hasDriverIdentity =
    latestSenderType === "driver" ||
    (!isSupport && Boolean(driverIdentity) && !customerIdentity);

  const displayName = hasDriverIdentity
    ? driverName
    : isSupport
    ? customerIdentity || driverIdentity || supportName
    : customerName;

  // =========================================================
  // DRIVER STATUS
  // =========================================================

  const driverStatus = (
    conversation?.driverStatus || "offline"
  ).toLowerCase();

  // =========================================================
  // TIME FORMAT
  // =========================================================

  function formatMessageTime(messageItem) {
    if (!messageItem) return "";

    if (messageItem.sent_local_time) {
      return messageItem.sent_local_time;
    }

    const rawDate =
      messageItem.created_at || messageItem;

    if (!rawDate) return "";

    const parsedDate = new Date(rawDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleTimeString();
  }

  // =========================================================
  // LOAD MESSAGES
  // =========================================================

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    let mounted = true;

    async function loadMessages() {
      try {
        setLoading(true);

        const data = await getMessages(conversationId);

        if (mounted) {
          setMessages(data || []);
        }
      } catch (error) {
        console.error(
          "Failed to load messages:",
          error
        );

        if (mounted) {
          setMessages([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadMessages();

    // =======================================================
    // REALTIME
    // =======================================================

    const subscription = subscribeMessages(
      conversationId,
      async () => {
        try {
          const data =
            await getMessages(conversationId);

          if (mounted) {
            setMessages(data || []);
          }
        } catch (error) {
          console.error(
            "Realtime message update failed:",
            error
          );
        }
      }
    );

    return () => {
      mounted = false;

      try {
        subscription?.unsubscribe?.();
      } catch (error) {
        console.error(
          "Failed to unsubscribe:",
          error
        );
      }
    };
  }, [conversationId]);

  // =========================================================
  // AUTO SCROLL
  // =========================================================

  useEffect(() => {
    if (!bottomRef.current) return;

    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  }, [messages]);

  // =========================================================
  // EMOJI
  // =========================================================

  function handleEmojiClick(emojiData) {
    setMessage(
      (prev) => prev + emojiData.emoji
    );

    setShowEmojiPicker(false);
  }

  // =========================================================
  // SEND MESSAGE
  // =========================================================

  async function handleSend(e) {
    e.preventDefault();

    if (!conversationId) return;

    if (isArchived) return;

    const trimmedMessage =
      message.trim();

    if (!trimmedMessage) return;

    try {
      await sendMessage({
        conversationId,
        senderType: "admin",
        senderId: "admin",
        message: trimmedMessage,
      });

      setMessage("");

      // Reload immediately after sending.
      const updatedMessages =
        await getMessages(conversationId);

      setMessages(
        updatedMessages || []
      );
    } catch (error) {
      console.error(
        "Failed to send message:",
        error
      );
    }
  }

  async function handleArchive() {
    if (!conversationId || isArchived) {
      return;
    }

    try {
      await archiveConversation(conversationId);
    } catch (error) {
      console.error(
        "Failed to archive conversation:",
        error
      );
    }
  }

  // =========================================================
  // EMPTY CONVERSATION
  // =========================================================

  if (!conversation) {
    return (
      <div className="empty-state">
        <i className="bi bi-chat-square-text"></i>

        <h5>Select a conversation</h5>

        <p>
          Choose a customer, driver, or
          station support conversation.
        </p>
      </div>
    );
  }

  // =========================================================
  // HEADER STATUS
  // =========================================================

  function getStatusText() {
    if (isSupport) {
      return "General Station Support";
    }

    if (driverStatus === "available") {
      return "Available";
    }

    if (driverStatus === "delivering") {
      return "Delivering";
    }

    if (driverStatus === "break") {
      return "On Break";
    }

    return "Offline";
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="chat-window">

      {/* =====================================================
          CHAT HEADER
      ====================================================== */}

      <div className="chat-header">

        <div className="chat-header-left">

          <button
            type="button"
            className="chat-profile-button"
            onClick={onOpenDetails}
            title={
              isSupport
                ? "Station Support"
                : "View Customer Details"
            }
          >
            <div
              className={`chat-avatar ${
                isSupport
                  ? "support-avatar"
                  : ""
              }`}
            >
              {isSupport ? (
                <i className="bi bi-headset"></i>
              ) : (
                customerName
                  ?.charAt(0)
                  ?.toUpperCase()
              )}

              {!isSupport && (
                <span
                  className={
                    driverStatus === "available"
                      ? "online-indicator"
                      : driverStatus ===
                        "delivering"
                      ? "busy-indicator"
                      : "offline-indicator"
                  }
                />
              )}
            </div>
          </button>

          <div
            className="chat-user-info clickable"
            onClick={onOpenDetails}
          >

            <h5 className="chat-customer-name">
              {displayName}
            </h5>

            <div className="chat-meta">

              {isSupport ? (
                <>
                  <span className="support-label">
                    <i className="bi bi-headset me-1"></i>
                    {supportLabel}
                  </span>

                  <span className="driver-status support">
                    General Assistance
                  </span>
                </>
              ) : (
                <>
                  <span className="driver-name">
                    {driverName}
                  </span>

                  <span
                    className={`driver-status ${driverStatus}`}
                  >
                    {getStatusText()}
                  </span>
                </>
              )}

            </div>

          </div>

        </div>

        {!isArchived && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={handleArchive}
          >
            <i className="bi bi-archive me-1"></i>
            Archive
          </button>
        )}

      </div>

      {/* =====================================================
          ARCHIVED BANNER
      ====================================================== */}

      {isArchived && (
        <div className="archived-banner">

          <div className="archived-icon">
            <i className="bi bi-archive"></i>
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

      {/* =====================================================
          CHAT BODY
      ====================================================== */}

      <div className="chat-body">

        {loading ? (
          <div className="chat-empty-state">
            <div className="spinner-border text-primary mb-3" />
            <h5>Loading messages...</h5>
          </div>
        ) : messages.length === 0 ? (

          <div className="chat-empty-state">

            <i
              className={
                isSupport
                  ? "bi bi-headset"
                  : "bi bi-chat-heart"
              }
            ></i>

            <h5>
              {isSupport
                ? "Start Station Support"
                : "No messages yet"}
            </h5>

            <p>
              {isSupport
                ? "Send a message to contact the station."
                : "Start the conversation by sending your first message."}
            </p>

          </div>

        ) : (

          messages.map((msg) => {

            const isAdmin =
              msg.sender_type === "admin";

            const isDriver =
              msg.sender_type === "driver";

            const isCustomer =
              msg.sender_type === "customer";

            return (
              <div
                key={msg.id}
                className={`message-row ${
                  isAdmin
                    ? "admin"
                    : isDriver
                    ? "driver"
                    : "customer"
                }`}
              >

                {/* =================================================
                    INCOMING AVATAR
                ================================================== */}

                {!isAdmin && (
                  <div
                    className={`message-avatar ${
                      isDriver
                        ? "driver-message-avatar"
                        : "customer-message-avatar"
                    }`}
                  >

                    {isDriver ? (
                      <i className="bi bi-truck"></i>
                    ) : (
                      customerName
                        ?.charAt(0)
                        ?.toUpperCase()
                    )}

                  </div>
                )}

                {/* =================================================
                    MESSAGE CONTENT
                ================================================== */}

                <div
                  className={`message-content ${
                    isAdmin
                      ? "admin-content"
                      : "incoming-content"
                  }`}
                >

                  {/* SENDER NAME */}

                  <div className="message-sender">

                    {isAdmin ? (
                      <>
                        <i className="bi bi-headset me-1"></i>
                        You
                      </>
                    ) : (
                      <>
                        <span
                          className={`message-sender-tag ${
                            isDriver ? "driver" : "customer"
                          }`}
                        >
                          <i
                            className={`bi ${
                              isDriver
                                ? "bi-truck"
                                : "bi-person"
                            } me-1`}
                          ></i>
                          {isDriver ? "Driver" : "Customer"}
                        </span>
                        <span className="message-sender-name">
                          {isDriver ? driverName : customerName}
                        </span>
                      </>
                    )}

                  </div>

                  {/* MESSAGE */}

                  <div
                    className={`message-bubble ${
                      isAdmin
                        ? "admin"
                        : isDriver
                        ? "driver"
                        : "customer"
                    }`}
                  >

                    <div className="message-text">
                      {msg.message}
                    </div>

                    <div className="message-footer">

                      <span className="message-time">
                        {formatMessageTime(msg)}
                      </span>

                      {isDriver && (
                        <span
                          className="sender-type-icon driver"
                          title="Message from driver"
                        >
                          <i className="bi bi-truck"></i>
                        </span>
                      )}

                      {isCustomer && (
                        <span
                          className="sender-type-icon customer"
                          title="Message from customer"
                        >
                          <i className="bi bi-person"></i>
                        </span>
                      )}

                      {isAdmin && (
                        <span className="message-status">
                          <i className="bi bi-check2-all"></i>
                        </span>
                      )}

                    </div>

                  </div>

                </div>

              </div>
            );
          })

        )}

        <div ref={bottomRef} />

      </div>

      {/* =====================================================
          MESSAGE COMPOSER
      ====================================================== */}

      {!isArchived ? (

        <form
          className="chat-footer"
          onSubmit={handleSend}
        >

          <div className="chat-composer">

            {/* EMOJI */}

            <div className="emoji-picker-wrapper">

              <button
                type="button"
                className="composer-icon-btn"
                title="Emoji"
                onClick={() =>
                  setShowEmojiPicker(
                    !showEmojiPicker
                  )
                }
              >
                <i className="bi bi-emoji-smile"></i>
              </button>

              {showEmojiPicker && (
                <div className="emoji-picker-popup">

                  <EmojiPicker
                    onEmojiClick={
                      handleEmojiClick
                    }
                  />

                </div>
              )}

            </div>

            {/* INPUT */}

            <input
              type="text"
              className="composer-input"
              placeholder={
                isSupport
                  ? "Message station support..."
                  : "Type a message..."
              }
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
            />

            {/* SEND */}

            <button
              type="submit"
              className="composer-send-btn"
              disabled={!message.trim()}
              title="Send message"
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

    </div>
  );
}