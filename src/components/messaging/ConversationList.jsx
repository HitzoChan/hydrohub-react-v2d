import { useMemo, useState } from "react";

export default function ConversationList({
  loading,
  conversations,
  selectedConversation,
  setSelectedConversation,
}) {
  const [search, setSearch] = useState("");

  const filteredConversations = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return conversations.filter((conversation) => {
      return (
        conversation.customerName
          ?.toLowerCase()
          .includes(keyword) ||
        conversation.driverName
          ?.toLowerCase()
          .includes(keyword) ||
        conversation.customerPhone
          ?.toLowerCase()
          .includes(keyword) ||
        conversation.orderStatus
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }, [conversations, search]);

  const formatTime = (date) => {
    if (!date) return "";

    const d = new Date(date);

    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      {/* ===========================
          SEARCH BAR
      ============================ */}

      <div className="conversation-search-wrapper">

        <div className="conversation-search">

          <i className="bi bi-search"></i>

          <input
            type="text"
            placeholder="Search customer or driver..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

      </div>

      {/* ===========================
          LOADING
      ============================ */}

      {loading ? (

        <div className="conversation-loading">

          <div
            className="spinner-border text-primary"
            role="status"
          />

          <p className="mt-3 mb-0">
            Loading conversations...
          </p>

        </div>

      ) : (

        <div className="conversation-list">

          {filteredConversations.length === 0 ? (

            <div className="conversation-empty">

              <i className="bi bi-chat-dots"></i>

              <h6>No conversations found</h6>

              <small>
                Try another search keyword.
              </small>

            </div>

          ) : (

            filteredConversations.map((conversation) => (

              <div
                key={conversation.id}
                className={`conversation-card ${
                  selectedConversation?.id === conversation.id
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setSelectedConversation(conversation)
                }
              >

                {/* Avatar */}

                <div className="conversation-avatar">

                  {conversation.customerName
                    ?.charAt(0)
                    ?.toUpperCase()}

                  <span
                    className={
                      conversation.driverStatus ===
                      "available"
                        ? "online-indicator"
                        : "offline-indicator"
                    }
                  />

                </div>

                {/* Content */}

                <div className="conversation-content">

                  {/* Top Row */}

                  <div className="conversation-top">

                    <h6 className="conversation-name">

                      {conversation.customerName}

                    </h6>

                    <span className="conversation-date">

                      {formatTime(
                        conversation.last_message_at
                      )}

                    </span>

                  </div>

                  {/* Driver */}

                  <div className="conversation-driver">

                    🚚 {conversation.driverName}

                  </div>

                  {/* Last Message */}

                  <div className="conversation-last-message">

                    {conversation.last_message ||
                      "No messages yet"}

                  </div>

                  {/* Bottom */}

                  <div className="conversation-footer">

                    <div className="conversation-right">

                      <span className="conversation-price">

                        ₱
                        {Number(
                          conversation.totalPrice ?? 0
                        ).toLocaleString()}

                      </span>

                      {(conversation.unreadCount ?? 0) >
                        0 && (

                        <span className="conversation-unread">

                          {conversation.unreadCount}

                        </span>

                      )}

                    </div>

                  </div>

                </div>

              </div>

            ))

          )}

        </div>

      )}

    </>
  );
}