import React, { useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DataContext } from "../context/DataContext.jsx";
import { motion } from "framer-motion";
import { FileText, Trash } from "lucide-react";
import * as XLSX from "xlsx";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import { generatePdfFromDoc } from "../utils/pdfGenerator";

export default function QuoteInvoiceView() {
    const { docId } = useParams();
    const navigate = useNavigate();
    const {
        data: { clients, docs },
        deleteDoc,
        updateDoc,
        account,
    } = useContext(DataContext);
    const doc = docs.find((d) => d.id === Number(docId));
    const client = clients.find((c) => c.id === doc?.clientId);


    const stripHtml = (html) => {
        const tmp = document.createElement("div");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    if (!doc || !client) return <div className="p-6">Document introuvable</div>;

    console.log("DOC PASSED TO PDF GENERATOR", doc);
    const previewPDF = async () => {
        if (!doc || !doc.lines) {
            return alert("Ce document est introuvable ou incomplet.");
        }

        const pdf = await generatePdfFromDoc(doc, client, account, docs, updateDoc, false);
        pdf.output("dataurlnewwindow");
    };

    const exportPDF = async () => {
        const pdf = await generatePdfFromDoc(doc, client, account, docs, updateDoc);
        const date = new Date(doc.date || new Date()).toISOString().split("T")[0];
        const filename = `${doc.type === "quote" ? "devis" : "facture"}_${doc.number ?? "XXX"}_${date}.pdf`;
        pdf.save(filename);
    };

    const exportExcel = () => {
        const clonedDoc = { ...doc };

        if (!clonedDoc.number) {
            const sameTypeDocs = docs.filter(d => d.type === doc.type && d.number);
            const next = sameTypeDocs.length > 0 ? Math.max(...sameTypeDocs.map(d => d.number)) + 1 : 1;
            clonedDoc.number = next;
            updateDoc(clonedDoc.id, { ...clonedDoc });
        }

        if (!clonedDoc.date) {
            const today = new Date().toISOString();
            clonedDoc.date = today;
            updateDoc(clonedDoc.id, { ...clonedDoc });
        }

        const wsData = [
            ["Client :", client.name],
            client.address ? ["Adresse :", client.address] : [],
            client.postalCode && client.city ? ["", `${client.postalCode} ${client.city}`] : [],
            client.phone ? ["Téléphone :", client.phone] : [],
            client.email ? ["Email :", client.email] : [],
            [],
            ["Entreprise :", account.companyName],
            account.companyAddress ? ["Adresse :", account.companyAddress] : [],
            account.companyPostalCode && account.companyCity ? ["", `${account.companyPostalCode} ${account.companyCity}`] : [],
            account.companySiret ? ["SIRET :", account.companySiret] : [],
            [],
            ["Produit", "Qté", "Prix HT", "TVA %", "Prix TTC"],
            ...clonedDoc.lines.map((l) => [
                l.product,
                l.qty,
                l.price,
                l.tva,
                (l.qty * l.price * (1 + l.tva / 100)).toFixed(2),
            ]),
            [],
            ["", "", "Sous‑total HT", clonedDoc.totals.ht.toFixed(2)],
            ["", "", "Total TVA", clonedDoc.totals.tva.toFixed(2)],
            ["", "", "Total TTC", clonedDoc.totals.ttc.toFixed(2)],
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, clonedDoc.type);
        XLSX.writeFile(wb, `${doc.type}-${clonedDoc.id}.xlsx`);
        ws['A1'].s = { font: { bold: true } };
    };

    const handleDelete = () => {
        if (!window.confirm("Supprimer ce document ?")) return;
        deleteDoc(doc.id);
        navigate(`/clients/${client.id}`);
    };


    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 space-y-6 max-w-3xl mx-auto"
        >
            <Card>
                <CardHeader>
                    <CardTitle>
                        {doc.type === 'quote' ? 'Devis' : "Facture"} {doc.number ?? 'XXX'} – {client.name}
                        <p>{client.address}</p>
                        <p>{client.postalCode} {client.city}</p>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {doc.title && (
                        <p className="font-semibold text-lg">{doc.title}</p>
                    )}

                    {doc.description && (
                        <div
                            className="prose prose-sm max-w-none text-muted-foreground text-md font-semibold"
                            dangerouslySetInnerHTML={{ __html: doc.description }}
                        />
                    )}

                    {doc.longDescription && (
                        <div
                            className="prose prose-sm max-w-none text-muted-foreground"
                            dangerouslySetInnerHTML={{ __html: doc.longDescription }}
                        />
                    )}

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produit</TableHead>
                                <TableHead>Qté</TableHead>
                                <TableHead>Prix HT</TableHead>
                                <TableHead>TVA %</TableHead>
                                <TableHead>Prix TTC</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {doc.lines.map((l) => (
                                l.type === "text" ? (
                                    <TableRow key={l.id}>
                                        <TableCell colSpan={5} className="italic text-muted-foreground">
                                            {l.content}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <TableRow key={l.id}>
                                        <TableCell>{l.product}</TableCell>
                                        <TableCell>{l.qty}</TableCell>
                                        <TableCell>{l.price} €</TableCell>
                                        <TableCell>{l.tva} %</TableCell>
                                        <TableCell>{((l.qty * l.price * (1 + l.tva / 100))).toFixed(2)} €</TableCell>
                                    </TableRow>
                                )
                            ))}
                        </TableBody>
                    </Table>

                    <div className="text-right space-y-1 text-sm pt-4">
                        <p>Sous‑total HT : {doc.totals.ht.toFixed(2)} €</p>
                        <p>Total TVA : {doc.totals.tva.toFixed(2)} €</p>
                        <p className="font-semibold">Total TTC : {doc.totals.ttc.toFixed(2)} €</p>
                    </div>
                    <div className="pt-6 flex gap-2">
                        <Button onClick={previewPDF} variant="outline">
                            Aperçu PDF
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/docs/${doc.id}/edit`)}
                        >
                            Modifier
                        </Button>
                        {doc.type === "quote" && (
                            <Button
                                variant="default"
                                onClick={() => navigate(`/docs/${doc.id}/edit`, { state: { convertTo: "invoice" } })}
                            >
                                Transformer en facture
                            </Button>
                        )}
                    </div>
                    <div className="pt-6 flex gap-2">
                        <Button onClick={exportPDF}>
                            <FileText className="mr-2 h-4 w-4" /> Exporter PDF
                        </Button>
                        <Button variant="secondary" onClick={exportExcel}>
                            <FileText className="mr-2 h-4 w-4" /> Exporter Excel
                        </Button>
                        <Button variant="outline" onClick={() => navigate(`/clients/${client.id}`)}>
                            Fiche client
                        </Button>

                        <Button variant="outline" onClick={() => navigate(-1)}>Retour</Button>

                    </div>
                    <Button variant="destructive" onClick={handleDelete}>
                        <Trash className="mr-2 h-4 w-4" /> Supprimer
                    </Button>

                </CardContent>
            </Card>
        </motion.div>
    );
}