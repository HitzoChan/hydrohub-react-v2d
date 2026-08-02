import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

import ConversationList from "../components/messaging/ConversationList";
import ChatWindow from "../components/messaging/ChatWindow";
import ConversationDetails from "../components/messaging/ConversationDetails";

import { getConversations, archiveExpiredConversations, } from "../services/messaging.service";

import "../styles/pages/messaging.css";

export default function Messaging() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);

const [showDetails, setShowDetails] = useState(false);

const [activeTab, setActiveTab] = useState("active");
const [activeCount, setActiveCount] = useState(0);
const [archivedCount, setArchivedCount] = useState(0);

useEffect(() => {
  async function fetchConversations() {
    try {
      // Load selected tab
      const data = await getConversations(activeTab);

      // Load counts
      const active = await getConversations("active");
      const archived = await getConversations("archived");

      setActiveCount(active.length);
      setArchivedCount(archived.length);

      setConversations(data);

      setSelectedConversation((current) => {
        if (!current) {
          return data[0] || null;
        }

        const updated = data.find(
          (conversation) => conversation.id === current.id
        );

        return updated || data[0] || null;
      });
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Archive only once when this effect runs
  archiveExpiredConversations();

  // ✅ Load conversations immediately
  fetchConversations();

  // ✅ Refresh every 5 seconds
  const interval = setInterval(fetchConversations, 5000);

  return () => clearInterval(interval);

}, [activeTab]);

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

        <div className="main-content">

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

          <div className="messaging-layout">

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
                  onClick={() => setActiveTab("active")}
                >
                  🟢 Active ({activeCount})
                </button>

                <button
                  className={
                    activeTab === "archived"
                      ? "tab-btn active"
                      : "tab-btn"
                  }
                  onClick={() => setActiveTab("archived")}
                >
                  📦 Archived ({archivedCount})
                </button>

              </div>

              <ConversationList
                loading={loading}
                conversations={conversations}
                selectedConversation={selectedConversation}
                setSelectedConversation={setSelectedConversation}
              />

            </aside>

            {/* =====================================
                CHAT PANEL
            ===================================== */}

            <main className="chat-panel">

              <ChatWindow
                conversation={selectedConversation}
                onOpenDetails={() => setShowDetails(true)}
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

          <Footer />

        </div>

      </div>
    </div>
  );
}