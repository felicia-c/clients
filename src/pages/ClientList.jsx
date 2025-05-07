import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../context/DataContext.jsx";
import { motion } from "framer-motion";
import { PlusCircle } from "lucide-react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";

export default function ClientList() {
    const {
        data: { clients, docs },
        addClient,
    } = useContext(DataContext);

    const getTotalFor = (clientId, type, status) =>
        docs.filter(d => d.clientId === clientId && d.type === type && d.status === status)
            .reduce((sum, d) => sum + d.totals.ttc, 0);

    const getUnpaidTotal = (clientId) =>
        docs.filter(d => d.clientId === clientId && d.type === 'invoice' && d.status !== 'payée')
            .reduce((sum, d) => sum + d.totals.ttc, 0);
    const navigate = useNavigate();
    const [draft, setDraft] = useState({ name: "", email: "", address: "", postalCode: "", city: "", phone: "", siret: "" });


    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 space-y-6 max-w-4xl mx-auto"
        >

            {/* Répertoire clients */}
            <Card>
                <CardHeader>
                    <CardTitle>Répertoire clients</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Ville</TableHead>
                                <TableHead className="text-blue-600">Devis envoyés</TableHead>
                                <TableHead className="text-green-600">Factures payées</TableHead>
                                <TableHead className="text-red-600">Factures impayées</TableHead>
                                <TableHead>Dernière intervention</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.map((c) => (
                                <TableRow
                                    key={c.id}
                                    className="hover:bg-muted cursor-pointer"
                                    onClick={() => navigate(`/clients/${c.id}`)}
                                >
                                    <TableCell>{c.name}</TableCell>
                                    <TableCell>{c.city}</TableCell>
                                    <TableCell className="text-blue-600">
                                        {docs.filter(d => d.clientId === c.id && d.type === "quote" && d.status === "envoyé").length}
                                    </TableCell>
                                    <TableCell className="text-green-600">
                                        {docs.filter(d => d.clientId === c.id && d.type === "invoice" && d.status === "payée").length}
                                    </TableCell>
                                    <TableCell className="text-red-600">
                                        {docs.filter(d => d.clientId === c.id && d.type === "invoice" && d.status === "envoyée").length}
                                    </TableCell>
                                    <TableCell>{c.lastVisit || "—"}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Formulaire nouveau client */}
            <Card>
                <CardHeader>
                    <CardTitle>Nouveau client</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 md:flex-row">
                    <Input
                        placeholder="Nom"
                        value={draft.name}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    />
                    <Input
                        placeholder="E‑mail"
                        value={draft.email}
                        onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                    />

                    <Input
                        placeholder="Téléphone"
                        value={draft.phone}
                        onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                    />
                    <Input
                        placeholder="SIRET"
                        value={draft.siret}
                        onChange={(e) => setDraft({ ...draft, siret: e.target.value })}
                    />

                </CardContent>
                <CardContent className="flex flex-col gap-4 md:flex-row">
                    <Input
                        placeholder="Adresse postale"
                        value={draft.address}
                        onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                    />
                    <Input
                        placeholder="Code Postal"
                        value={draft.postalCode}
                        onChange={(e) => setDraft({ ...draft, postalCode: e.target.value })}
                    />
                    <Input
                        placeholder="Ville"
                        value={draft.city}
                        onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                    />

                    <Button
                        onClick={() => {
                            if (!draft.name) return;
                            addClient(draft);
                            setDraft({ name: "", email: "", address: "", postalCode: "", city: "", phone: "", siret: "" });
                        }}
                        className="shrink-0"
                    >
                        <PlusCircle className="mr-2 h-4 w-4" /> Ajouter
                    </Button>
                </CardContent>
            </Card>

        </motion.div>
    );
}