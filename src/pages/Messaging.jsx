import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);

  // Controls the customer details drawer
  const [showDetails, setShowDetails] = useState(false);

useEffect(() => {
  async function fetchConversations() {
    try {
      const data = await getConversations();

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

  fetchConversations();

  // Refresh every 5 seconds
  const interval = setInterval(fetchConversations, 5000);

  return () => clearInterval(interval);
}, []);

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
                {conversations.length}
              </span>

              <span className="counter-label">
                Conversation{conversations.length !== 1 ? "s" : ""}
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

                  <h5>All Messages</h5>

                  <small>
                    Open customer conversations
                  </small>

                </div>

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