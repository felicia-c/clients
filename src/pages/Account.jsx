import React, { useState } from "react";
import { useContext } from "react";
import { DataContext } from "../context/DataContext.jsx";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AccountPage() {

    const { account, updateAccount } = useContext(DataContext);

    const [editMode, setEditMode] = useState(false);
    const [draft, setDraft] = useState(account);

    const save = () => {
        updateAccount(draft);
        setEditMode(false);
    };

    const cancel = () => {
        setDraft(account);
        setEditMode(false);
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <Card>
                <CardHeader className="flex justify-between items-center">
                    <CardTitle className="text-lg">Informations de l'entreprise</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {editMode ? (
                        <>
                            <div>
                                <label className="block text-sm mb-1 font-medium">Logo de l'entreprise</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setDraft({ ...draft, logo: reader.result });
                                        };
                                        reader.readAsDataURL(file);
                                    }}
                                />
                                {draft.logo && (
                                    <img src={draft.logo} alt="Logo preview" className="h-16 mt-2" />
                                )}
                            </div>
                            <input
                                className="w-full border px-3 py-2 rounded text-sm"
                                value={draft.companyName}
                                onChange={(e) => setDraft({ ...draft, companyName: e.target.value })}
                                placeholder="Nom de l'entreprise"
                            />
                            <input
                                className="w-full border px-3 py-2 rounded text-sm"
                                value={draft.companyAddress}
                                onChange={(e) => setDraft({ ...draft, companyAddress: e.target.value })}
                                placeholder="Adresse"
                            />
                            <input
                                className="w-full border px-3 py-2 rounded text-sm"
                                value={draft.companyPostalCode}
                                onChange={(e) => setDraft({ ...draft, companyPostalCode: e.target.value })}
                                placeholder="Code postal"
                            />
                            <input
                                className="w-full border px-3 py-2 rounded text-sm"
                                value={draft.companyCity}
                                onChange={(e) => setDraft({ ...draft, companyCity: e.target.value })}
                                placeholder="Ville"
                            />
                            <input
                                className="w-full border px-3 py-2 rounded text-sm"
                                value={draft.companyPhone}
                                onChange={(e) => setDraft({ ...draft, companyPhone: e.target.value })}
                                placeholder="Téléphone"
                            />
                            <input
                                className="w-full border px-3 py-2 rounded text-sm"
                                value={draft.companyEmail}
                                onChange={(e) => setDraft({ ...draft, companyEmail: e.target.value })}
                                placeholder="Email"
                            />
                            <input
                                className="w-full border px-3 py-2 rounded text-sm"
                                value={draft.companySiret}
                                onChange={(e) => setDraft({ ...draft, companySiret: e.target.value })}
                                placeholder="SIRET"
                            />
                        </>
                    ) : (
                        <>
                            {account.logo && (
                                <img src={account.logo} alt="Logo" className="h-16 mb-4" />
                            )}
                            <p className="font-bold">{account.companyName}</p>
                            <address>
                                <p>{account.companyAddress}</p>
                                <p>{account.companyPostalCode} {account.companyCity}</p>
                            </address>

                            <p><strong>Téléphone :</strong> {account.companyPhone}</p>
                            <p><strong>Email :</strong> {account.companyEmail}</p>
                            <p><strong>SIRET :</strong> {account.companySiret}</p>
                        </>
                    )}
                    <hr />
                    {!editMode ? (
                        <Button variant="secondary" onClick={() => setEditMode(true)}>Modifier</Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button onClick={save}>Valider</Button>
                            <Button variant="outline" onClick={cancel}>Annuler</Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
