import React, { useContext, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DataContext } from "../context/DataContext.jsx";
import { motion } from "framer-motion";
import { PlusCircle, Trash } from "lucide-react";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";

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
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";

export default function QuoteInvoiceForm({ type }) {
    const {
        data: { clients, docs },
        addDoc,
        updateDoc,
    } = useContext(DataContext);
    const { id } = useParams();
    const { docId } = useParams();
    const isEdit = Boolean(docId);
    const editingDoc = isEdit ? docs.find((d) => d.id === Number(docId)) : null;
    const trueType = type || editingDoc?.type || "quote";
    const navigate = useNavigate();
    const originalStatus = editingDoc?.status || "en cours";

    const client = isEdit
        ? clients.find((c) => c.id === editingDoc?.clientId)
        : clients.find((c) => c.id === Number(id));

    /*
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [longDescription, setLongDescription] = useState("");
    const [lines, setLines] = useState([{ id: 1, product: "", qty: 1, price: 0, tva: 20 }]);
    */
    const statusLocksNumber = ["envoyé", "envoyée", "accepté", "payée", "à modifier", "refusé", "annulée"];

    const lastQuote = docs.filter(d => d.type === "quote").map(d => d.number || 0);
    const lastInvoice = docs.filter(d => d.type === "invoice").map(d => d.number || 0);
    const nextQuoteNumber = lastQuote.length > 0 ? Math.max(...lastQuote) + 1 : 1;
    const nextInvoiceNumber = lastInvoice.length > 0 ? Math.max(...lastInvoice) + 1 : 1;

    const shouldDuplicate = isEdit && statusLocksNumber.includes(originalStatus);
    const newNumber = trueType === "quote" ? nextQuoteNumber : nextInvoiceNumber;

    const [title, setTitle] = useState(editingDoc?.title || "");
    const [description, setDescription] = useState(editingDoc?.description || "");
    const [longDescription, setLongDescription] = useState(editingDoc?.longDescription || "");
    const [lines, setLines] = useState(editingDoc?.lines || []);
    //const [number, setNumber] = useState(editingDoc?.number || nextNumber);




    const addLine = () => setLines((l) => [...l, { id: Date.now(), product: "", qty: 1, price: 0, tva: 0 }]);
    const removeLine = (lineId) => setLines((l) => l.filter((x) => x.id !== lineId));

    const totals = lines
        .filter((l) => l.type !== "text")
        .reduce((acc, l) => {
            const ht = l.qty * l.price;
            const tva = (ht * l.tva) / 100;
            acc.ht += ht;
            acc.tva += tva;
            acc.ttc += ht + tva;
            return acc;
        },
        { ht: 0, tva: 0, ttc: 0 }
    );

    if (isEdit && !editingDoc) return <div className="p-6">Document introuvable</div>;

    const saveDoc = () => {
        const doc = {
            id: shouldDuplicate ? Date.now() : editingDoc?.id || Date.now(),
            number: shouldDuplicate ? newNumber : editingDoc?.number || newNumber,
            clientId: client.id,
            type: trueType,
            status: shouldDuplicate ? "en cours" : originalStatus,
            createdAt: new Date().toISOString(),
            title,
            description,
            longDescription,
            lines,
            totals,
            clientAddress: client.address,
            clientPostalCode: client.postalCode,
            clientCity: client.city,
            clientPhone: client.phone,
        };

        if (shouldDuplicate) {
            addDoc(doc);
        } else if (isEdit) {
            updateDoc(doc.id, doc);
        } else {
            addDoc(doc);
        }

        navigate(`/docs/${doc.id}`);
    };

    const addText = () =>
        setLines((l) => [...l, { id: Date.now(), type: "text", content: "" }]);

    if (!client) return <div className="p-6">Client introuvable</div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 space-y-6 max-w-5xl mx-auto"
        >
            <Card>
                <CardHeader>
                    <CardTitle>{trueType === "quote" ? "Nouveau devis" : "Nouvelle facture"} – {client.name}</CardTitle>
                    <p>{client.address}</p>
                    <p>{client.postalCode} {client.city}</p>
                    <p>{client.phone}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input
                        placeholder="Titre"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <Input
                        placeholder="Description courte"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <SunEditor
                        setContents={longDescription}
                        onChange={setLongDescription}
                        height="200px"
                        setOptions={{
                            buttonList: [["undo", "redo", "bold", "italic", "underline", "list", "align", "fontColor"]],
                        }}
                    />
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produit</TableHead>
                                <TableHead>Qté</TableHead>
                                <TableHead>Prix HT</TableHead>
                                <TableHead>TVA %</TableHead>
                                <TableHead>Prix TTC</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lines.map((l, idx) => (
                                l.type === "text" ? (
                                    <TableRow key={l.id}>
                                        <TableCell colSpan={5}>
                                            <Input
                                                placeholder="Texte libre"
                                                value={l.content}
                                                onChange={(e) =>
                                                    setLines((prev) => {
                                                        const copy = [...prev];
                                                        copy[idx].content = e.target.value;
                                                        return copy;
                                                    })
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeLine(l.id)}
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                <TableRow key={l.id}>
                                    <TableCell>
                                        <Input
                                            value={l.product}
                                            onChange={(e) =>
                                                setLines((prev) => {
                                                    const copy = [...prev];
                                                    copy[idx].product = e.target.value;
                                                    return copy;
                                                })
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={l.qty}
                                            onChange={(e) =>
                                                setLines((prev) => {
                                                    const copy = [...prev];
                                                    copy[idx].qty = Number(e.target.value);
                                                    return copy;
                                                })
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={l.price}
                                            onChange={(e) =>
                                                setLines((prev) => {
                                                    const copy = [...prev];
                                                    copy[idx].price = Number(e.target.value);
                                                    return copy;
                                                })
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            value={l.tva}
                                            onChange={(e) =>
                                                setLines((prev) => {
                                                    const copy = [...prev];
                                                    copy[idx].tva = Number(e.target.value);
                                                    return copy;
                                                })
                                            }
                                        />
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {((l.qty * l.price * (1 + l.tva / 100))).toFixed(2)} €
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => removeLine(l.id)}>
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                )
                            ))}
                        </TableBody>
                    </Table>

                    <div className="flex justify-between items-center pt-4">
                        <Button variant="secondary" onClick={addLine}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Ajouter une ligne
                        </Button>
                        <Button variant="secondary" onClick={addText}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Ajouter du texte
                        </Button>
                        <div className="text-right space-y-1 text-sm">
                            <p>Sous‑total HT : {totals.ht.toFixed(2)} €</p>
                            <p>Total TVA : {totals.tva.toFixed(2)} €</p>
                            <p className="font-semibold">Total TTC : {totals.ttc.toFixed(2)} €</p>
                        </div>
                    </div>

                    <div className="pt-6 flex gap-2">
                        <Button onClick={saveDoc}>Enregistrer</Button>
                        <Button variant="secondary" onClick={() => navigate(-1)}>Annuler</Button>
                        <Button variant="outline" onClick={() => navigate(`/clients/${client.id}`)}>
                            Fiche client
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
