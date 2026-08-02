import { useEffect, useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

import SettingsMenu from "../components/settings/SettingsMenu";

import OverviewSettings from "../components/settings/OverviewSettings";
import ProductsSettings from "../components/settings/ProductsSettings";
import DeliverySettings from "../components/settings/DeliverySettings";
import PaymentSettings from "../components/settings/PaymentSettings";
import EmployeeSettings from "../components/settings/EmployeeSettings";
import AccountSettings from "../components/settings/AccountSettings";

import {
    getSettings,
    saveSettings,
    updatePassword,
    logout
} from "../services/settings.service";

import "../styles/pages/settings.css";

export default function Settings() {

    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(true);

    const [settings, setSettings] = useState({

        id: null,

        // Delivery
        maxDeliveries: 0,
        deliveryDuration: 0,

        // Payment
        codEnabled: false,
        codVerification: false,

        // Employee
        autoCode: true,
        codeLength: 6,

        // Account
        adminPassword: ""

    });

    useEffect(() => {

        async function fetchSettings() {

            try {

                setLoading(true);

                const data = await getSettings();

                if (data) {

                    setSettings({

                        id: data.id,

                        // Delivery
                        maxDeliveries:
                            data.max_deliveries_per_driver ?? 0,

                        // Database column is still named delivery_duratioan
                        deliveryDuration:
                            data.delivery_duratioan ?? 0,

                        // Payment
                        codEnabled:
                            data.cod_enabled ?? false,

                        codVerification:
                            data.cod_verification ?? false,

                        // Employee
                        autoCode:
                            data.auto_generate_code ?? true,

                        codeLength:
                            data.code_length ?? 6,

                        // Account
                        adminPassword: ""

                    });

                }

            } catch (error) {

                console.error(error);
                alert(error.message);

            } finally {

                setLoading(false);

            }

        }

        fetchSettings();

    }, []);

    async function handleSave() {

        try {

            await saveSettings(settings);

            if (settings.adminPassword.trim()) {

                await updatePassword(settings.adminPassword);

            }

            setSettings(prev => ({

                ...prev,

                adminPassword: ""

            }));

            alert("Settings saved successfully!");

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Failed to save settings."
            );

        }

    }

    async function handleLogout() {

        try {

            await logout();

            window.location.href = "/login";

        } catch (error) {

            console.error(error);

            alert("Logout failed.");

        }

    }

    if (loading) {

        return (

            <div className="d-flex vh-100">

                <Sidebar />

                <div className="main-content grow">

                    <Header />

                    <div className="container-fluid py-5 text-center">

                        <div className="spinner-border text-primary" />

                        <p className="mt-3">

                            Loading Settings...

                        </p>

                    </div>

                </div>

            </div>

        );

    }

return (

    <div className="d-flex vh-100">

        <Sidebar />

        <div className="main-content bg-light grow overflow-auto">

            <Header />

            <div className="container-fluid px-4 py-4">

                {/* ===================== */}
                {/* PAGE HEADER */}
                {/* ===================== */}

                <div className="mb-4">

                    <h2 className="fw-bold mb-1">
                        System Settings
                    </h2>

                    <p className="text-muted mb-0">
                        Manage products, delivery, payment, employee, and account settings.
                    </p>

                </div>

                {/* ===================== */}
                {/* SETTINGS LAYOUT */}
                {/* ===================== */}

                <div className="row g-4 align-items-start">

                    {/* LEFT MENU */}

                    <div className="col-auto">

                        <SettingsMenu
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                        />

                    </div>

                    {/* RIGHT CONTENT */}

                    <div className="col">

                        {activeTab === "overview" && (

                            <OverviewSettings
                                settings={settings}
                            />

                        )}

                        {activeTab === "products" && (

                            <ProductsSettings />

                        )}

                        {activeTab === "delivery" && (

                            <>
                                <DeliverySettings
                                    settings={settings}
                                    setSettings={setSettings}
                                />

                                <div className="card border-0 shadow-sm mt-4">

                                    <div className="card-body d-flex justify-content-between align-items-center">

                                        <div>

                                            <h6 className="mb-1">
                                                Save Delivery Settings
                                            </h6>

                                            <small className="text-muted">
                                                Changes will immediately affect new delivery schedules.
                                            </small>

                                        </div>

                                        <button
                                            className="btn btn-primary btn-lg px-5"
                                            onClick={handleSave}
                                        >
                                            Save Changes
                                        </button>

                                    </div>

                                </div>

                            </>

                        )}

                        {activeTab === "payment" && (

                            <>
                                <PaymentSettings
                                    settings={settings}
                                    setSettings={setSettings}
                                />

                                <div className="settings-actions mt-4 text-end">

                                    <button
                                        className="btn btn-primary px-4"
                                        onClick={handleSave}
                                    >
                                        Save Changes
                                    </button>

                                </div>

                            </>

                        )}

                        {activeTab === "employee" && (

                            <>
                                <EmployeeSettings
                                    settings={settings}
                                    setSettings={setSettings}
                                />

                                <div className="settings-actions mt-4 text-end">

                                    <button
                                        className="btn btn-primary px-4"
                                        onClick={handleSave}
                                    >
                                        Save Changes
                                    </button>

                                </div>

                            </>

                        )}

                        {activeTab === "account" && (

                            <AccountSettings
                                settings={settings}
                                setSettings={setSettings}
                                logout={handleLogout}
                            />

                        )}

                    </div>

                </div>

                <Footer />

            </div>

        </div>

    </div>

);

}