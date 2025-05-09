import React, { useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DataContext } from "../context/DataContext.jsx";
import { motion } from "framer-motion";
import { FileText, Trash } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { htmlToText } from "html-to-text";
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

export default function QuoteInvoiceView() {
    const { docId } = useParams();
    const navigate = useNavigate();
    const {
        data: { clients, docs },
        deleteDoc,
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


    const generatePdfContent = (pdf, doc, client, account) => {

        // Bloc client à gauche
        pdf.setDrawColor(0);
        pdf.setLineWidth(0.1);
        pdf.rect(14, 20, 80, 45);


        pdf.setFontSize(12);
        pdf.text(client.name, 16, 28);
        pdf.setFontSize(10);
        if (client.address) pdf.text(client.address, 16, 34);
        if (client.postalCode && client.city) pdf.text(`${client.postalCode} ${client.city}`, 16, 40);
        if (client.phone) pdf.text(`Tél : ${client.phone}`, 16, 52);
        if (client.email) pdf.text(`Email : ${client.email}`, 16, 57);
        if (client.siret) pdf.text(`SIRET : ${client.siret}`, 16, 63);

        let y = 100;

        // Cadre entreprise à droite
        pdf.setDrawColor(0);
        pdf.setLineWidth(0.1);

        /*pdf.text("TEST ENTREPRISE", 125, 40);*/

        pdf.rect(120, 20, 80, 45); // x décalé à droite

// Logo (optionnel)
        const logo = account.logo;
        if (logo) {
            pdf.addImage(logo, "PNG", 125, 22, 50, 15); // petit logo dans le cadre
        }

// Texte entreprise dans le cadre
        let yEnt = 45;
        pdf.setFontSize(12);
        pdf.text(account.companyName || "AUCUNE DONNÉE", 125, yEnt);
        pdf.setFontSize(10);
        yEnt += 5;
        pdf.text(account.companyAddress, 125, yEnt);
        yEnt += 5;
        pdf.text(`${account.companyPostalCode} ${account.companyCity}`, 125, yEnt);
        yEnt += 5;
        if (account.companySiret) {
            pdf.text(`SIRET : ${account.companySiret}`, 125, yEnt);
        }

        // Titre
        pdf.setFontSize(14);
        pdf.text(`${doc.type === "quote" ? "Devis" : "Facture"} #${doc.number} - ${doc.title}`, 14, 75);

        pdf.setFontSize(10);
        const docDate = doc.date || doc.createdAt;
        const formattedDate = new Date(docDate).toLocaleDateString("fr-FR");
        pdf.setFont(undefined, "bold");
        pdf.text(`Date d'émission: ${formattedDate}`, 14, 90);

        const fileNameFormattedDate = new Date(docDate).toISOString().split("T")[0]; // format AAAA-MM-JJ
        const filename = `${doc.type === "quote" ? "devis" : "facture"}_${doc.number}_${fileNameFormattedDate}.pdf`;


        // Tableau

        if (doc.description) {
            pdf.setFont(undefined, "italic");
            //const descriptionLines = pdf.splitTextToSize(doc.longDescription, 180);
            pdf.text(doc.description, 14, 100);
            pdf.setFont(undefined, "normal");
            y = 100 + doc.description.length * 6 + 4;
        }
        if (doc.longDescription) {
            pdf.setFont(undefined, "italic");
            const cleanText = htmlToText(doc.longDescription, {
                wordwrap: false,
                selectors: [
                    { selector: "a", format: "inline" },
                    { selector: "img", format: "skip" },
                ],
            });
            const lines = pdf.splitTextToSize(cleanText, 180);
            pdf.text(lines, 14, 110);
            pdf.setFont(undefined, "normal");
            y = 110 + lines.length * 6;
        }

        //const startY = 84 + descriptionLines.length * 6; // calcul de la position suivante

        autoTable(pdf, {
            head: [["Produit", "Qté", "Prix HT", "TVA %", "Prix TTC"]],
            headStyles: { fillColor: [122, 191, 126] },
            body: doc.lines.map((line) => {
                if (line.type === "text") {
                    return [
                        {
                            content: line.content,
                            colSpan: 5,
                            styles: { fontStyle: "italic", textColor: "#666666" },
                        },
                    ];
                } else {
                    const ttc = (line.qty * line.price * (1 + line.tva / 100)).toFixed(2);
                    return [
                        line.product,
                        String(line.qty),
                        `${line.price.toFixed(2)} €`,
                        `${line.tva.toFixed(2)} %`,
                        `${ttc} €`,
                    ];
                }
            }),
            startY: y, // commence après les infos
            styles: { fontSize: 10 },
            theme: "grid",
        });


        const totals = doc.lines
            .filter((l) => l.type !== "text")
            .reduce(
                (acc, l) => {
                    const ht = l.qty * l.price;
                    const tva = (ht * l.tva) / 100;
                    acc.ht += ht;
                    acc.tva += tva;
                    acc.ttc += ht + tva;
                    return acc;
                },
                { ht: 0, tva: 0, ttc: 0 }
            );

        // Totaux
        y = pdf.lastAutoTable.finalY + 10;
        if (y > 270) {
            pdf.addPage();
            y = 20;
        }
        pdf.text(`Sous-total HT : ${totals.ht.toFixed(2)} €`, 120, y);
        y += 6;
        pdf.text(`Total TVA : ${totals.tva.toFixed(2)} €`, 120, y);
        y += 6;
        pdf.setFontSize(12);
        pdf.text(`Total TTC : ${totals.ttc.toFixed(2)} €`, 120, y);


        /* MENTIONS LÉGALES */
        y += 30;
        pdf.setFontSize(8);
        pdf.text("TVA non applicable, article 293B du CGI", 14, y);

        y += 5;
        pdf.text("La date des travaux sera convenue d'un accord commun", 14, y);

        /* Signatures */

        y += 30;
        pdf.setFontSize(10);
        pdf.text("Signature client :", 14, y);
        pdf.line(50, y + 1, 110, y + 1); // ligne horizontale

        pdf.text("Signature entreprise :", 120, y);
        pdf.line(165, y + 1, 200, y + 1); // ligne horizontale

        const docTopDate = new Date(doc.date || doc.createdAt).toLocaleDateString("fr-FR");
        const headerText = `${doc.type === "quote" ? "Devis" : "Facture"} #${doc.number} — Émis le ${docTopDate}`;


        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            if(i != 1) {
                pdf.text(headerText, 14, 15);
            }
            pdf.text(`Page ${i} / ${pageCount}`, 100, 290); // centré bas de page
        }

        return pdf;
    };
    const previewPDF = () => {
        const pdf = new jsPDF();
        generatePdfContent(pdf, doc, client, account);
        pdf.output("dataurlnewwindow");
    };

    const exportPDF = () => {
        const pdf = new jsPDF();
        generatePdfContent(pdf, doc, client, account);

        const docDate = doc.date || doc.createdAt;
        const formattedDate = new Date(docDate).toISOString().split("T")[0];
        const filename = `${doc.type === "quote" ? "devis" : "facture"}_${doc.number}_${formattedDate}.pdf`;

        pdf.save(filename);
    };
    const exportExcel = () => {
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
            ...doc.lines.map((l) => [
                l.product,
                l.qty,
                l.price,
                l.tva,
                (l.qty * l.price * (1 + l.tva / 100)).toFixed(2),
            ]),
            [],
            ["", "", "Sous‑total HT", doc.totals.ht.toFixed(2)],
            ["", "", "Total TVA", doc.totals.tva.toFixed(2)],
            ["", "", "Total TTC", doc.totals.ttc.toFixed(2)],
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, doc.type);
        XLSX.writeFile(wb, `${doc.type}-${doc.id}.xlsx`);
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
                        {doc.type === "quote" ? "Devis" : "Facture"} #{doc.number} – {client.name}
                        <p>{client.address}</p>
                        <p>{client.postalCode} {client.city}</p>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {doc.title && (
                        <p className="font-semibold text-lg">{doc.title}</p>
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
                    <Button onClick={previewPDF} variant="outline">
                        Aperçu PDF
                    </Button>
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