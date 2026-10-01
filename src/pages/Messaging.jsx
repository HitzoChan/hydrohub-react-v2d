import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

import ConversationList from "../components/messaging/ConversationList";
import ChatWindow from "../components/messaging/ChatWindow";
import ConversationDetails from "../components/messaging/ConversationDetails";

import { getConversations } from "../services/messaging.service";

import "../styles/pages/messaging.css";

export default function Messaging() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

const [showDetails, setShowDetails] = useState(false);

const [activeTab, setActiveTab] = useState("active");
const [activeCount, setActiveCount] = useState(0);
const [archivedCount, setArchivedCount] = useState(0);
const refreshInFlight = useRef(false);

const CONVERSATION_REFRESH_INTERVAL = 5000;

useEffect(() => {
  let mounted = true;

  async function fetchConversations(showLoading = false) {
    if (refreshInFlight.current) {
      return;
    }

    refreshInFlight.current = true;

    try {
      if (showLoading) {
        setLoading(true);
      }

      const requestedConversationId =
        location.state?.conversationId;

      // Load selected tab
      const data = await getConversations(
        activeTab,
        requestedConversationId
      );

      // Load counts
      const active = await getConversations("active");
      const archived = await getConversations("archived");

      if (!mounted) {
        return;
      }

      setActiveCount(active.length);
      setArchivedCount(archived.length);

      setConversations(data);

      if (requestedConversationId) {
        setMobileChatOpen(
          data.some(
            (conversation) =>
              String(conversation.id) ===
              String(requestedConversationId)
          )
        );
      }

      setSelectedConversation((current) => {
        if (requestedConversationId) {
          return (
            data.find(
              (conversation) =>
                String(conversation.id) ===
                String(requestedConversationId)
            ) || data[0] || null
          );
        }

        if (!current) {
          return data[0] || null;
        }

        const updated = data.find(
          (conversation) => conversation.id === current.id
        );

        return updated || data[0] || null;
      });
    } catch (error) {
      console.error("Failed to refresh conversations:", error);
    } finally {
      if (mounted) {
        setLoading(false);
      }

      refreshInFlight.current = false;
    }
  }

  fetchConversations(true);

  const interval = setInterval(
    () => fetchConversations(),
    CONVERSATION_REFRESH_INTERVAL
  );

  return () => {
    mounted = false;
    clearInterval(interval);
  };

}, [activeTab, location.state?.conversationId]);

  /* =====================================
      QUICK ACTION HANDLERS
  ===================================== */

  const handleViewMap = () => {
    setShowDetails(false);
    navigate("/map");
  };

  const handleViewOrder = () => {
    setShowDetails(false);
    navigate("/orders");
  };

  return (
    <div className="dashboard-page">
      <div className="d-flex">

        {/* Sidebar */}
        <Sidebar />

        <div className="main-content messaging-main-content">

          {/* Header */}
          <Header />

          {/* ==========================
              PAGE HEADER
          ========================== */}

          <div className="messaging-page-header">

            <div>

              <h2 className="messaging-page-title">
                💬 Messaging
              </h2>

              <p className="messaging-page-description">
                Manage customer conversations and delivery communication in real
                time.
              </p>

            </div>

            <div className="conversation-counter">

                <span className="counter-number">
                  {activeTab === "active"
                    ? activeCount
                    : archivedCount}
                </span>

                <span className="counter-label">
                  {activeTab === "active"
                    ? "Active Conversation"
                    : "Archived Conversation"}
                  {conversations.length !== 1 ? "s" : ""}
                </span>

            </div>

          </div>

          {/* ==========================
              MAIN LAYOUT
          ========================== */}

          <div
            className={`messaging-layout${
              mobileChatOpen ? " mobile-chat-open" : ""
            }`}
          >

            {/* =====================================
                CONVERSATION LIST
            ===================================== */}

            <aside className="conversation-sidebar">

              <div className="panel-header">

                <div>

                  <h5>
                    {activeTab === "active"
                      ? "Active Messages"
                      : "Archived Messages"}
                  </h5><h5>Messages</h5>

                    <small>
                      {activeTab === "active"
                        ? "Manage active customer conversations."
                        : "Completed delivery conversations."}
                    </small>

                </div>

              </div>

              <div className="conversation-tabs">

                <button
                  className={
                    activeTab === "active"
                      ? "tab-btn active"
                      : "tab-btn"
                  }
                  onClick={() => {
                    setMobileChatOpen(false);
                    setActiveTab("active");
                  }}
                >
                  🟢 Active ({activeCount})
                </button>

                <button
                  className={
                    activeTab === "archived"
                      ? "tab-btn active"
                      : "tab-btn"
                  }
                  onClick={() => {
                    setMobileChatOpen(false);
                    setActiveTab("archived");
                  }}
                >
                  📦 Archived ({archivedCount})
                </button>

              </div>

              <ConversationList
                loading={loading}
                conversations={conversations}
                selectedConversation={selectedConversation}
                setSelectedConversation={(conversation) => {
                  setSelectedConversation(conversation);
                  setMobileChatOpen(true);
                }}
              />

            </aside>

            {/* =====================================
                CHAT PANEL
            ===================================== */}

            <main className="chat-panel">

              <ChatWindow
                conversation={selectedConversation}
                onOpenDetails={() => setShowDetails(true)}
                onBackToConversations={() => setMobileChatOpen(false)}
              />

            </main>

          </div>

          {/* =====================================
              CUSTOMER DETAILS DRAWER
          ===================================== */}

          {showDetails && (
            <>
              {/* Overlay */}

              <div
                className="drawer-overlay"
                onClick={() => setShowDetails(false)}
              />

              {/* Drawer */}

              <ConversationDetails
                conversation={selectedConversation}
                onClose={() => setShowDetails(false)}
                onViewMap={handleViewMap}
                onViewOrder={handleViewOrder}
              />
            </>
          )}

          {/* Footer */}

          <div className="messaging-footer">
            <Footer />
          </div>

        </div>

      </div>
    </div>
  );
}