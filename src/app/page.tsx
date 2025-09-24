"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableColumnsSplit } from "lucide-react";
import OriginalCyclic from "@/components/OriginalCyclic";
import EnhancedCyclic from "@/components/EnhancedCyclic";

export default function Home() {
    const [activeTab, setActiveTab] = useState("original");

    return (
        <div className={`flex min-h-screen flex-col  text-neutral-100 ${activeTab === "original" ? "bg-[#333]" : "bg-neutral-900"}`}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <header className="z-20 w-full border-b border-neutral-800 bg-neutral-900/70 p-4 backdrop-blur">
                    <div className="mx-auto flex max-w-7xl items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="text-2xl font-semibold">Cyclic Table</div>
                        </div>

                        <div className="ml-auto">
                            <TabsList className="grid grid-cols-2 gap-2">
                                <TabsTrigger value="original" className="flex items-center gap-2">
                                    <Table className="h-4 w-4" />
                                    Original
                                </TabsTrigger>
                                <TabsTrigger value="enhanced" className="flex items-center gap-2">
                                    <TableColumnsSplit className="h-4 w-4" />
                                    Enhanced
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {activeTab === "enhanced" && (
                            <div className="hidden sm:flex ml-6 items-center gap-3 text-xs text-neutral-400">
                                <div className="flex items-center gap-2">
                                    <kbd className="rounded border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-xs font-medium">Space</kbd>
                                    <span>Play / Pause</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <kbd className="rounded border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-xs font-medium">←</kbd>
                                    <span>Prev</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <kbd className="rounded border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-xs font-medium">→</kbd>
                                    <span>Next</span>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6">
                    <div className="mx-auto max-w-7xl">
                        <TabsContent value="original">
                            <OriginalCyclic />
                        </TabsContent>

                        <TabsContent value="enhanced">
                            <EnhancedCyclic />
                        </TabsContent>
                    </div>
                </main>
            </Tabs>
        </div>
    );
}
