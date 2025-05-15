import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../context/DataContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { motion } from "framer-motion";

export default function AllDocuments() {
    const navigate = useNavigate();
    const { data: { docs, clients, account } } = useContext(DataContext);

    const getClientName = (id) => clients.find(c => c.id === id) ?.name || "Client inconnu";

    return (
        <motion.div
            initial={{ opacity: 0, y:10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-12 space-y-12 max-w-12xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Tous les documents</CardTitle>
                </CardHeader>
                <CardContent>
                    {docs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucun document enregistré.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>#</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Total TTC</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {docs.map((d) => (
                                    <TableRow key={d.id}>
                                        <TableCell>{d.type === "quote" ? "Devis" : "Facture"}</TableCell>
                                        <TableCell>{d.number ? d.number : ''}</TableCell>
                                        <TableCell>{getClientName(d.clientId)}</TableCell>
                                        <TableCell>{ d.date ? new Date(d.date).toLocaleDateString("fr-FR") : '—' }</TableCell>
                                        <TableCell>{d.totals.ttc.toFixed(2)} €</TableCell>
                                        <TableCell>{d.status}</TableCell>
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
        </motion.div>
    );
}