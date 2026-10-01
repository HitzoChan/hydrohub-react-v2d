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

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleDateString([], {
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
            filteredConversations.map((conversation) => {
              const isSupportThread =
                conversation?.conversationType === "support" ||
                conversation?.conversation_type === "support";

              const latestSenderType = String(
                conversation?.latestSenderType || ""
              )
                .toLowerCase()
                .trim();

              const customerIdentity =
                conversation?.customerName ||
                conversation?.customer?.full_name ||
                conversation?.customer?.name;

              const driverIdentity =
                conversation?.driverName ||
                conversation?.driver?.name ||
                conversation?.driver?.full_name;

              const isDriverThread =
                latestSenderType === "driver" ||
                (!isSupportThread && Boolean(driverIdentity) && !customerIdentity);

              const threadName = isDriverThread
                ? driverIdentity || "Driver"
                : isSupportThread
                ? customerIdentity || driverIdentity || "Station Support"
                : customerIdentity || "Customer";
              const profileImageUrl = isDriverThread
                ? conversation?.driver?.profile_image_url
                : conversation?.customer?.avatar_url;

              const threadRoleLabel = isDriverThread
                ? "Driver"
                : isSupportThread
                ? "Support"
                : "Driver";

              return (
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

                    {threadName
                      ?.charAt(0)
                      ?.toUpperCase()}

                    {profileImageUrl && (
                      <img
                        className="messaging-profile-image"
                        src={profileImageUrl}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    )}

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

                      <div className="conversation-name-wrap">
                        <h6 className="conversation-name">
                          {threadName}
                        </h6>

                        {threadRoleLabel === "Support" && (
                          <span className="conversation-role-tag support">Support</span>
                        )}

                        {threadRoleLabel === "Driver" && (
                          <span className="conversation-role-tag driver">Driver</span>
                        )}
                      </div>

                      <span className="conversation-date">
                        {formatTime(
                          conversation.last_message_at
                        )}
                      </span>

                    </div>

                    {/* Driver */}

                    {!isSupportThread && (
                      <div className="conversation-driver">

                        🚚 {conversation.driverName || "Unassigned"}

                      </div>
                    )}

                    {/* Last Message */}

                    <div className="conversation-last-message">

                      {conversation.last_message ||
                        "No messages yet"}

                    </div>

                    {/* Bottom */}

                    <div className="conversation-footer">

                      <div className="conversation-right">

                        {!isSupportThread && (
                          <span className="conversation-price">

                            ₱
                            {Number(
                              conversation.totalPrice ?? 0
                            ).toLocaleString()}

                          </span>
                        )}

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
              );
            })
          )}

        </div>

      )}

    </>
  );
}