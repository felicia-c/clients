import React, { createContext, useState, useEffect } from "react";

export const DataContext = createContext(null);

const loadData = () => {
    const raw = localStorage.getItem("crm-data-v1");
    if (!raw) return { clients: [], docs: [] };
    try {
        return JSON.parse(raw);
    } catch {
        return { clients: [], docs: [] };
    }
};

const saveData = (data) => localStorage.setItem("crm-data-v1", JSON.stringify(data));

export function DataProvider({ children }) {
    const [data, setData] = useState(loadData());
    useEffect(() => saveData(data), [data]);

    /* Compte entreprise */
    const [account, setAccount] = useState(() => {
        const saved = localStorage.getItem("account");
        return saved
            ? JSON.parse(saved)
            : {
                companyName: "",
                companyAddress: "",
                companyPostalCode: "",
                companyCity: "",
                companyPhone: "",
                companyEmail: "",
                companySiret: "",
                logo: "",
            };
    });

    const updateAccount = (newValues) => {
        const updated = { ...account, ...newValues };
        setAccount(updated);
        localStorage.setItem("account", JSON.stringify(updated));
    };
    /* Clients */
    const addClient = (client) =>
        setData((d) => ({ ...d, clients: [...d.clients, { ...client, id: Date.now() }] }));

    const updateClient = (id, patch) =>
        setData((d) => ({
            ...d,
            clients: d.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }));

    /* Documents (devis/factures) */
    const addDoc = (doc) => setData((d) => ({ ...d, docs: [...d.docs, doc] }));
    const updateDoc = (id, patch) =>
        setData((d) => ({
            ...d,
            docs: d.docs.map((dd) => (dd.id === id ? { ...dd, ...patch } : dd)),
        }));
    const deleteDoc = (id) => setData((d) => ({ ...d, docs: d.docs.filter((dd) => dd.id !== id) }));

    const value = { data, account, addClient, updateClient, addDoc, updateDoc, deleteDoc, updateAccount };
    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}