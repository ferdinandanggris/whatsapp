import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "./ui/badge";
import { Search, RotateCw, Plus, Pencil, Trash2, Eye, X, Settings, Copy, Phone } from "lucide-react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface WaTemplate {
    template_name: string;
    language_code: string;
    status: string;
    category: string;
    body_content: string;
    last_sync: string;
    has_mapping?: boolean;
}

interface Waba {
    waba_id: string;
    name: string;
}

interface MetaTemplate {
    name: string;
    language: string;
    status: string;
    category: string;
    components: any[];
}

const TemplateManagement: React.FC = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<WaTemplate[]>([]);
    const [wabas, setWabas] = useState<Waba[]>([]);
    const [selectedWabaId, setSelectedWabaId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<MetaTemplate | null>(null);

    const fetchTemplates = async () => {
        if (!selectedWabaId) return;

        setIsLoading(true);
        try {
            const getParam = (key: string) => {
                const searchParams = new URLSearchParams(window.location.search);
                if (searchParams.has(key)) return searchParams.get(key);

                const hashParts = window.location.hash.split('?');
                if (hashParts.length > 1) {
                    const hashParams = new URLSearchParams(hashParts[1]);
                    return hashParams.get(key);
                }
                return null;
            };

            const serverIp = getParam('server_ip') || 'localhost';
            const serverPort = getParam('server_port') || '55555';

            const url = `http://${serverIp}:${serverPort}/api/templates?waba_id=${selectedWabaId}`;
            const response = await axios.get(url);
            if (response.data.status) {
                const fetchedTemplates = response.data.data || [];

                // For each template, check if it needs mapping
                const templatesWithMappingStatus = await Promise.all(fetchedTemplates.map(async (t: WaTemplate) => {
                    // Check if has {{1}} etc
                    const hasParams = /{{\d+}}/.test(t.body_content);
                    if (!hasParams) return { ...t, has_mapping: true };

                    // Fetch mapping count
                    try {
                        const mRes = await axios.get(`http://${serverIp}:${serverPort}/api/templates/${t.template_name}/mapping?waba_id=${selectedWabaId}&language=${t.language_code}`);
                        return { ...t, has_mapping: mRes.data.data?.length > 0 };
                    } catch {
                        return { ...t, has_mapping: false };
                    }
                }));

                setTemplates(templatesWithMappingStatus);
            }
        } catch (error) {
            console.error("Failed to fetch templates", error);
        } finally {
            setIsLoading(false);
        }
    };

    const syncWithMeta = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams(window.location.search);
            const serverIp = params.get('server_ip') || 'localhost';
            const serverPort = params.get('server_port') || '55555';

            if (!selectedWabaId) {
                alert("Please select a WABA first");
                return;
            }

            await axios.post(`http://${serverIp}:${serverPort}/api/templates/sync?waba_id=${selectedWabaId}`);
            await fetchTemplates();
            alert("Sync completed successfully.");
        } catch (error) {
            console.error("Sync failed", error);
            alert("Sync failed. Check console for details.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        await fetchWabas();
        if (selectedWabaId) {
            await fetchTemplates();
        }
    };

    const fetchWabas = async () => {
        try {
            const params = new URLSearchParams(window.location.search);
            const serverIp = params.get('server_ip') || 'localhost';
            const serverPort = params.get('server_port') || '55555';

            const response = await axios.get(`http://${serverIp}:${serverPort}/api/wabas`);
            if (response.data.status) {
                const fetchedWabas = response.data.data || [];
                setWabas(fetchedWabas);
                if (fetchedWabas.length > 0 && !selectedWabaId) {
                    setSelectedWabaId(fetchedWabas[0].waba_id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch WABAs", error);
        }
    };

    useEffect(() => {
        fetchWabas();
    }, []);

    useEffect(() => {
        if (selectedWabaId) {
            fetchTemplates();
        }
    }, [selectedWabaId]);

    const handleDelete = async (name: string, language: string) => {
        if (!window.confirm(`Are you sure you want to delete template "${name}" (${language})? This action cannot be undone.`)) return;

        try {
            const params = new URLSearchParams(window.location.search);
            const serverIp = params.get('server_ip') || 'localhost';
            const serverPort = params.get('server_port') || '55555';

            const response = await axios.delete(`http://${serverIp}:${serverPort}/api/templates/${name}?waba_id=${selectedWabaId}&language=${language}`);
            if (response.data.status) {
                alert("Template deleted successfully.");
                fetchTemplates();
            } else {
                alert("Failed to delete template: " + response.data.message);
            }
        } catch (error: any) {
            console.error("Failed to delete template", error);
            alert("Error: " + (error.response?.data?.message || error.message));
        }
    };

    const filteredTemplates = templates.filter(t =>
        t.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
            case 'INACTIVE': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#f0f2f5] p-3 gap-3 overflow-hidden">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold text-slate-800">Message Templates</h1>
                    <p className="text-[11px] text-slate-500">Manage and sync your Meta WhatsApp templates</p>
                </div>

            </div>
            <div className="flex items-center justify-end">
                <div className="flex gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Business Account (WABA)</label>
                        <select
                            className="bg-white border rounded px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 border-slate-200"
                            value={selectedWabaId}
                            onChange={(e) => setSelectedWabaId(e.target.value)}
                        >
                            {wabas.map(w => (
                                <option key={w.waba_id} value={w.waba_id}>{w.name} ({w.waba_id})</option>
                            ))}
                            {wabas.length === 0 && <option value="">No WABA Found</option>}
                        </select>
                    </div>
                    <div className="flex gap-2 items-end">
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => navigate(`/templates/new?waba_id=${selectedWabaId}`)}
                            className="bg-[#00a884] hover:bg-[#06cf9c] h-8 text-xs"
                            disabled={!selectedWabaId}
                        >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Create New
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 h-8 text-xs"
                            title="Refresh Data"
                        >
                            <RotateCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={syncWithMeta}
                            disabled={isLoading || !selectedWabaId}
                            className="bg-white border-[#00a884] text-[#00a884] hover:bg-[#00a884]/5 h-8 text-xs"
                        >
                            <RotateCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                            Sync Meta
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
                <div className="p-3 border-b bg-slate-50 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            className="w-full pl-9 pr-4 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 border-slate-200 text-xs"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1 p-0">
                    <div className="min-w-full inline-block align-middle">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-2 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Template Name</th>
                                    <th className="px-4 py-2 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Category</th>
                                    <th className="px-4 py-2 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-2 text-left text-[9px] font-bold text-slate-500 uppercase tracking-wider">Language</th>
                                    <th className="px-4 py-2 text-right text-[9px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {isLoading && templates.length === 0 ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-100 rounded w-32" /></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-100 rounded w-20" /></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-100 rounded w-16" /></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-100 rounded w-12" /></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right"><div className="h-8 bg-slate-100 rounded w-24 ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : filteredTemplates.length > 0 ? (
                                    filteredTemplates.map((template) => (
                                        <tr key={`${template.template_name}_${template.language_code}`} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-900 group-hover:text-[#00a884] transition-colors">{template.template_name}</span>
                                                        {template.status === 'INACTIVE' && (
                                                            <Badge variant="outline" className="text-[9px] px-1 h-4 bg-red-50 text-red-600 border-red-100">
                                                                Deleted from Meta
                                                            </Badge>
                                                        )}
                                                        {template.has_mapping === false && /{{\d+}}/.test(template.body_content) && template.status !== 'INACTIVE' && template.category !== 'AUTHENTICATION' && (
                                                            <Badge variant="outline" className="text-[9px] px-1 h-4 bg-orange-50 text-orange-600 border-orange-200">
                                                                Mapping Required
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] text-slate-400 line-clamp-1 max-w-[250px]">
                                                        {template.body_content || "No body content cached"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-600 uppercase tracking-tighter">
                                                    {template.category?.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant="outline" className={`text-[9px] px-1 py-0 h-4 border-none shadow-none ${getStatusColor(template.status)}`}>
                                                    {template.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-[11px] text-slate-500">
                                                {template.language_code}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-medium">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        title="Set Mapping"
                                                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => navigate(`/templates/new?name=${template.template_name}&language=${template.language_code}&mode=mapping&waba_id=${selectedWabaId}`)}
                                                    >
                                                        <Settings className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        title="Preview Detail"
                                                        className="h-8 w-8 p-0 text-slate-600 hover:text-slate-700 hover:bg-slate-100"
                                                        onClick={async () => {
                                                            try {
                                                                const params = new URLSearchParams(window.location.search);
                                                                const serverIp = params.get('server_ip') || 'localhost';
                                                                const serverPort = params.get('server_port') || '55554';
                                                                const res = await axios.get(`http://${serverIp}:${serverPort}/api/templates/${template.template_name}?waba_id=${selectedWabaId}&language=${template.language_code}`);
                                                                if (res.data.status) {
                                                                    setSelectedTemplate(res.data.data.meta);
                                                                }
                                                            } catch (err: any) {
                                                                console.error("Failed to load preview", err);
                                                                if (err.response?.status === 404) {
                                                                    alert("Template tidak ditemukan di Meta. Mungkin sudah dihapus atau statusnya INACTIVE.");
                                                                } else {
                                                                    alert("Gagal memuat pratinjau: " + (err.response?.data?.message || err.message));
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        title="Edit Template"
                                                        className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                        onClick={() => navigate(`/templates/new?name=${template.template_name}&language=${template.language_code}&mode=edit&waba_id=${selectedWabaId}`)}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        title="Delete Template"
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDelete(template.template_name, template.language_code)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-slate-400">
                                            <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                            <p className="text-sm">No templates found matching your search</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </ScrollArea>
            </div>

            {/* Custom Detail Modal */}
            {selectedTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedTemplate(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b flex items-center justify-between bg-white shrink-0">
                            <div className="flex flex-col">
                                <h3 className="text-lg font-bold text-slate-800">Pratinjau Template</h3>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-tighter shadow-none border-none py-0 ${getStatusColor(selectedTemplate.status)}`}>
                                        {selectedTemplate.status}
                                    </Badge>
                                    <span className="text-[10px] text-slate-400 uppercase font-medium tracking-wider">{selectedTemplate.category?.replace(/_/g, ' ')}</span>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedTemplate(null)} className="rounded-full hover:bg-slate-100">
                                <X className="h-5 w-5 text-slate-500" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-hidden bg-[#e5ddd5] bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat p-6 flex flex-col items-center">
                            {/* Message Bubble Container */}
                            <div className="w-full max-w-xs animate-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white rounded-lg shadow-sm overflow-hidden relative text-[13px] leading-relaxed self-start w-full">
                                    {/* Bubble Tail */}
                                    <div className="absolute top-0 left-[-8px] w-0 h-0 border-t-[10px] border-t-white border-l-[10px] border-l-transparent"></div>

                                    <div className="p-3">
                                        {/* Header */}
                                        {selectedTemplate.components?.find((c: any) => c.type?.toUpperCase() === 'HEADER') && (
                                            <div className="font-bold text-slate-900 mb-1">
                                                {selectedTemplate.components?.find((c: any) => c.type?.toUpperCase() === 'HEADER')?.text || `[${selectedTemplate.components?.find((c: any) => c.type?.toUpperCase() === 'HEADER')?.format}]`}
                                            </div>
                                        )}

                                        {/* Body */}
                                        <div className="text-[#111b21] break-words whitespace-pre-wrap">
                                            {selectedTemplate.components?.find((c: any) => c.type?.toUpperCase() === 'BODY')?.text || "No body content"}
                                        </div>

                                        {/* Footer & Time */}
                                        <div className="mt-1 flex items-end justify-between gap-2">
                                            {selectedTemplate.components?.find((c: any) => c.type?.toUpperCase() === 'FOOTER') ? (
                                                <div className="text-[11px] text-[#667781] italic">
                                                    {selectedTemplate.components?.find((c: any) => c.type?.toUpperCase() === 'FOOTER')?.text}
                                                </div>
                                            ) : <div />}
                                            <div className="text-[10px] text-[#667781] shrink-0">
                                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Buttons - Inside Bubble style like in screenshot */}
                                    {selectedTemplate.components?.find((c: any) => c.type?.toUpperCase() === 'BUTTONS') && (
                                        <div className="border-t border-[#f2f2f2] flex flex-col divide-y divide-[#f2f2f2]">
                                            {selectedTemplate.components?.find((c: any) => c.type?.toUpperCase() === 'BUTTONS')?.buttons?.map((btn: any, bIdx: number) => (
                                                <div key={bIdx} className="py-3 px-3 text-[#00a8e6] font-medium text-center flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer">
                                                    {btn.type === 'PHONE_NUMBER' ? (
                                                        <Phone className="h-4 w-4 fill-current" />
                                                    ) : (btn.type === 'URL' || btn.type?.includes('COPY') ? (
                                                        <Copy className="h-4 w-4" />
                                                    ) : (
                                                        <RotateCw className="h-4 w-4" />
                                                    ))}
                                                    {btn.text}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer - Simplified */}
                        <div className="px-6 py-4 border-t bg-white flex items-center justify-between shrink-0">
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">ID: {selectedTemplate.language} • {selectedTemplate.status}</span>
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" onClick={() => setSelectedTemplate(null)} className="text-slate-500">Tutup</Button>
                                <Button
                                    size="sm"
                                    className="bg-[#00a884] hover:bg-[#06cf9c] font-bold"
                                    onClick={() => navigate(`/templates/new?name=${selectedTemplate.name}&language=${selectedTemplate.language}&mode=mapping&waba_id=${selectedWabaId}`)}
                                >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Atur Mapping
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplateManagement;
