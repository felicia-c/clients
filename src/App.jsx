import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import ClientList from "./pages/ClientList";
import ClientDetail from "./pages/ClientDetail";
import QuoteInvoiceForm from "./pages/QuoteInvoiceForm";
import QuoteInvoiceView from "./pages/QuoteInvoiceView";
import AllDocuments from "./pages/AllDocuments";
import AccountPage from "@/pages/Account.jsx";



function Navbar() {
    return (
        <nav className="fixed top-0 left-0 w-full bg-gray-100 border-b px-4 py-2 shadow-sm z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <a href="/" className="text-lg font-bold text-gray-800">CRM Client</a>
                <div className="flex space-x-4 text-sm">
                    <a href="/" className="text-gray-600 hover:text-black">Accueil</a>
                    <a href="/" className="text-gray-600 hover:text-black">Créer un client</a>
                    <a href="/documents" className="text-gray-600 hover:text-black">Tous les documents</a>
                    <a href="/account" className="text-gray-600 hover:text-black">Mon compte</a>
                </div>
            </div>
        </nav>
    );
}
export default function App() {
    return (
        <DataProvider>
            <Router>
                <Navbar />
                <main className="min-h-screen px-6 pt-20 pb-20">
                    <div className="w-full max-w-screen-2xl mx-auto">
                        <Routes>
                            <Route path="/" element={<ClientList />} />
                            <Route path="/clients/:id" element={<ClientDetail />} />
                            <Route path="/clients/:id/new-quote" element={<QuoteInvoiceForm type="quote" />} />
                            <Route path="/clients/:id/new-invoice" element={<QuoteInvoiceForm type="invoice" />} />
                            <Route path="/docs/:docId" element={<QuoteInvoiceView />} />
                            <Route path="/docs/:docId/edit" element={<QuoteInvoiceForm />} />
                            <Route path="/documents" element={<AllDocuments />} />
                            <Route path="/account" element={<AccountPage />} />
                        </Routes>
                    </div>
                </main>
            </Router>
        </DataProvider>
    );
}