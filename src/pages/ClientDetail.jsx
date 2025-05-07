import React, {useContext, useEffect, useState} from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { DataContext } from "../context/DataContext";
import { motion } from "framer-motion";
import { FileText, FilePlus, Trash, Eye, Pencil } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";

export default function ClientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const {
        data: { clients, docs },
        updateClient,
        updateDoc,
        deleteDoc,
        account,
    } = useContext(DataContext);
    const client = clients.find((c) => c.id === Number(id));
    const [files, setFiles] = useState(client?.files || []);
    const [isEditing, setIsEditing] = useState(false);
    const [editClient, setEditClient] = useState({ ...client });

    useEffect(() => {
        setEditClient({ ...client });
    }, [client]);

    if (!client) return <div className="p-6">Client introuvable</div>;

    const handleFile = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const item = { name: f.name, data: evt.target.result };
            const newFiles = [...files, item];
            setFiles(newFiles);
            updateClient(client.id, { files: newFiles });
        };
        reader.readAsDataURL(f);
    };

    /* documents du client */
    const clientDocs = (docs || []).filter((d) => d.clientId === client.id);

    const handleDelete = (docId) => {
        if (!window.confirm("Supprimer ce document ?")) return;
        deleteDoc(docId);
    };



    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Fiche */}
            <div className="flex gap-6 max-w-8xl items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Informations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="w-full space-y-3">
                            {isEditing ? (
                                <>
                                    <input
                                        className="w-full border px-3 py-2 rounded text-sm"
                                        placeholder="Nom"
                                        value={editClient.name}
                                        onChange={(e) => setEditClient({ ...editClient, name: e.target.value })}
                                    />
                                    <input
                                        className="w-full border px-3 py-2 rounded text-sm"
                                        placeholder="Adresse"
                                        value={editClient.address}
                                        onChange={(e) => setEditClient({ ...editClient, address: e.target.value })}
                                    />
                                    <div className="flex gap-4">
                                        <input
                                            className="w-full border px-3 py-2 rounded text-sm"
                                            placeholder="Code postal"
                                            value={editClient.postalCode}
                                            onChange={(e) => setEditClient({ ...editClient, postalCode: e.target.value })}
                                        />
                                        <input
                                            className="w-full border px-3 py-2 rounded text-sm"
                                            placeholder="Ville"
                                            value={editClient.city}
                                            onChange={(e) => setEditClient({ ...editClient, city: e.target.value })}
                                        />
                                    </div>
                                    <input
                                        className="w-full border px-3 py-2 rounded text-sm"
                                        placeholder="SIRET"
                                        value={editClient.siret}
                                        onChange={(e) => setEditClient({ ...editClient, siret: e.target.value })}
                                    />
                                    <input
                                        className="w-full border px-3 py-2 rounded text-sm"
                                        placeholder="Email"
                                        value={editClient.email}
                                        onChange={(e) => setEditClient({ ...editClient, email: e.target.value })}
                                    />
                                    <input
                                        className="w-full border px-3 py-2 rounded text-sm"
                                        placeholder="Téléphone"
                                        value={editClient.phone}
                                        onChange={(e) => setEditClient({ ...editClient, phone: e.target.value })}
                                    />
                                </>
                            ) : (
                                <>
                                    <p className="text-xl font-bold">{client.name}</p>
                                    <address>
                                    <p className="text-sm">{client.address}</p>
                                    <p className="text-sm">{client.postalCode} {client.city}</p>
                                    </address>
                                    <p className="text-sm">{client.siret ? 'SIRET: ' + client.siret : ''}</p>
                                    <p className="text-md font-medium">{client.email}</p>
                                    <p className="text-md font-medium">{client.phone}</p>
                                </>
                            )}
                            {!isEditing ? (
                                <Button variant="secondary" onClick={() => setIsEditing(true)} size="sm"> <Pencil className="w-4 h-4 mr-2" /> Modifier</Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button onClick={() => { updateClient(client.id, editClient); setIsEditing(false); }}>Valider</Button>
                                    <Button variant="outline" onClick={() => { setEditClient(client); setIsEditing(false); }}>Annuler</Button>
                                </div>
                            )}
                        </div>


                        <hr />
                        <div className="pt-2.5">
                            <p className="font-bold text-sm">
                                Dernière intervention :
                                <input
                                    type="date"
                                    value={client.lastVisit || ""}
                                    onChange={(e) => updateClient(client.id, { lastVisit: e.target.value })}
                                    className="ml-2 border rounded px-2 py-1 text-sm"
                                />
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-4">
                            <Button onClick={() => navigate(`/clients/${id}/new-quote`)}>
                                <FilePlus className="mr-2 h-4 w-4" /> Nouveau devis
                            </Button>
                            <Button variant="secondary" onClick={() => navigate(`/clients/${id}/new-invoice`)}>
                                <FilePlus className="mr-2 h-4 w-4" /> Nouvelle facture
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                {/* Fichiers joints */}
                <Card>
                    <CardHeader>
                        <CardTitle>Fichiers joints</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <input type="file" onChange={handleFile} className="mb-4" />
                        <ul className="space-y-1 text-sm">
                            {files.map((f, i) => (
                                <li key={i} className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    <Link to={f.data} target="_blank" rel="noopener noreferrer" className="underline">
                                        {f.name}
                                    </Link>
                                    <Button size="icon" variant="ghost" onClick={() => {
                                        const newFiles = files.filter((_, idx) => idx !== i);
                                        setFiles(newFiles);
                                        updateClient(client.id, { files: newFiles });
                                    }}>
                                        <Trash className="h-4 w-4 text-red-400" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
            <div className="w-full max-w-80 flex gap-6 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Documents</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-6 text-center text-4xl font-bold text-primary">
                        <div className="text-blue-600">
                            {clientDocs.filter(d => d.type === "quote").length}
                            <div className="text-sm font-medium text-muted-foreground">Devis</div>
                        </div>
                        <div className="text-green-600">
                            {clientDocs.filter(d => d.type === "invoice" && d.status === "payée").length}
                            <div className="text-sm font-medium text-muted-foreground">Factures</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {/* Devis & factures */}
            <div className="flex gap-6 ">
                <Card>
                    <CardHeader>
                        <CardTitle>Devis & Factures</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {clientDocs.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Aucun document pour l’instant.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>#</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Total TTC</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead></TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clientDocs.map((d) => (
                                        <TableRow key={d.number} className="hover:bg-muted">
                                            <TableCell>{d.type === "quote" ? "Devis" : "Facture"}</TableCell>
                                            <TableCell>{d.id}</TableCell>
                                            <TableCell>{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>{d.totals.ttc.toFixed(2)} €</TableCell>
                                            <TableCell className="flex items-center gap-2 border-none">
                                            <span
                                                className={`w-2.5 h-2.5 rounded-full ${
                                                    d.status === "payée" || d.status === "accepté" ? "bg-green-500" :
                                                        d.status === "envoyé" || d.status === "envoyée" ? "bg-blue-500" :
                                                            d.status === "refusé" || d.status === "annulée" ? "bg-red-500" :
                                                                d.status === "à modifier" ? "bg-yellow-500" :
                                                                    "bg-gray-400"
                                                }`}
                                            ></span>
                                                <select
                                                    value={d.status}
                                                    onChange={(e) => updateDoc(d.id, { status: e.target.value })}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                                >
                                                    {(d.type === "quote"
                                                            ? ["en cours", "envoyé", "à modifier", "accepté", "refusé"]
                                                            : ["en cours", "envoyée", "payée", "annulée"]
                                                    ).map((s) => (
                                                        <option key={s} value={s}>
                                                            {s}
                                                        </option>
                                                    ))}
                                                </select>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(d.id)}
                                                >
                                                    <Trash className="h-4 w-4 text-red-400" />
                                                </Button>
                                            </TableCell>
                                            <TableCell>
                                                <Button size="icon" variant="ghost" onClick={() => navigate(`/docs/${d.id}`)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

            </div>

            <Button variant="outline" onClick={() => navigate(`/`)}>
                Retour à la liste
            </Button>
        </motion.div>
    );
}