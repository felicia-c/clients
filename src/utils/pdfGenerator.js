import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { htmlToText } from "html-to-text";

export async function generatePdfFromDoc(doc, client, account, docs, updateDoc, assignNumberAndDate = true) {
    if (!Array.isArray(docs)) throw new Error("docs must be an array");

    const clonedDoc = { ...doc };
    let updated = false;
    console.log("doc.lines", doc.lines);

    // Assigner numéro si manquant
    if (assignNumberAndDate && !clonedDoc.number) {
        const sameTypeDocs = docs.filter(d => d.type === doc.type && d.number);
        const next = sameTypeDocs.length > 0 ? Math.max(...sameTypeDocs.map(d => d.number)) + 1 : 1;
        clonedDoc.number = next;
        updated = true;
    }

        // Assigner date si manquante
    if (assignNumberAndDate && !clonedDoc.date) {
        clonedDoc.date = new Date().toISOString();
        updated = true;
    }

    // Enregistrer si modifié
    if (updated) {
        updateDoc(clonedDoc.id, clonedDoc);
    }

    const pdf = new jsPDF();
    //const docDate = new Date(clonedDoc.date).toLocaleDateString("fr-FR");
    const docDate = clonedDoc.date
        ? new Date(clonedDoc.date).toLocaleDateString("fr-FR")
        : "—";


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
    const title = `${clonedDoc.type === "quote" ? "Devis" : "Facture"} n°${clonedDoc.number ?? "—"} - ${clonedDoc.title}`;

    pdf.text(title, 14, 75);
    pdf.setFontSize(10);
    pdf.text(`Date d'émission: ${docDate}`, 14, 85);

    // Tableau
    if (doc.description) {
        pdf.setFontSize(12);
        pdf.setFont(undefined, "italic");
        //const descriptionLines = pdf.splitTextToSize(doc.longDescription, 180);
        pdf.text(doc.description, 14, 100);
        pdf.setFont(undefined, "normal");
        y = 100 + doc.description.length * 6 + 4;
    }
    if (doc.longDescription) {
        pdf.setFontSize(10);
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
        y = 110 + lines.length * 5;
    }

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

    // Forcer saut de page si pas assez de place pour mentions + signatures
    const minSpaceNeeded = 50;
    const pageHeight = pdf.internal.pageSize.height;
    if (y + minSpaceNeeded > pageHeight - 20) {
        pdf.addPage();
        y = 20;
    }

    pdf.setFontSize(10);
    pdf.text(`Sous-total HT : ${totals.ht.toFixed(2)} €`, 120, y);
    y += 6;
    pdf.text(`Total TVA : ${totals.tva.toFixed(2)} €`, 120, y);
    y += 6;
    pdf.setFontSize(12);
    pdf.text(`Total TTC : ${totals.ttc.toFixed(2)} €`, 120, y);

    /* Signatures */

    y += 30;
    pdf.setFontSize(10);
    pdf.text("Signature client :", 14, y);
    pdf.line(50, y + 1, 110, y + 1); // ligne horizontale

    pdf.text("Signature entreprise :", 120, y);
    pdf.line(165, y + 1, 200, y + 1); // ligne horizontale

    /* MENTIONS LÉGALES */
    y += 25;
    pdf.setFontSize(8);
    pdf.text("TVA non applicable, article 293B du CGI", 14, y);

    y += 5;
    pdf.text("La date des travaux sera convenue d'un accord commun", 14, y);


    //const docDate = doc.date ? doc.date.toLocaleDateString("fr-FR") : '—';
    const headerText = `${clonedDoc.type === "quote" ? "Devis" : "Facture"} #${clonedDoc.number ?? 'XXX'} — Émis le ${docDate}`;
    const pageCount = pdf.internal.getNumberOfPages();
    y += 10;
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        if(i > 1) {
            pdf.text(headerText, 14, 10);
        }
        pdf.text(`Page ${i} / ${pageCount}`, 100, 290); // centré bas de page
    }

    return pdf;
}
