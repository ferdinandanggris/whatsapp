import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Save, Send, Info, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Mapping {
    parameter_position: number;
    source_key: string;
    component_type: 'HEADER' | 'BODY' | 'BUTTON' | 'FOOTER';
    format_type: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'URL';
    button_index: number;
}

const TemplateCreator: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [templateId, setTemplateId] = useState('');
    const [templateLanguage, setTemplateLanguage] = useState('id');
    const [templateButtons, setTemplateButtons] = useState<any[]>([]);
    const [category, setCategory] = useState('UTILITY');
    const [headerText, setHeaderText] = useState('');
    const [bodyText, setBodyText] = useState('');
    const [footerText, setFooterText] = useState('');
    const [mappings, setMappings] = useState<Mapping[]>([]);
    const [wabaId, setWabaId] = useState('');
    const [sourceFields, setSourceFields] = useState<Record<string, string>>({});
    const [timeExpiration, setTimeExpiration] = useState<number>(60);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch available source fields and template data if editing
    useEffect(() => {
        const loadInitialData = async () => {
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
            const editName = getParam('name');
            const editLang = getParam('language');
            const urlWabaId = getParam('waba_id') || '';
            
            setWabaId(urlWabaId);
            if (editLang) setTemplateLanguage(editLang);

            try {
                // Fetch Source Fields
                const sfResponse = await axios.get(`http://${serverIp}:${serverPort}/api/templates/source-fields`);
                if (sfResponse.data.status) {
                    setSourceFields(sfResponse.data.data);
                }

                // If editing, fetch template details
                if (editName && editLang) {
                    const tResponse = await axios.get(`http://${serverIp}:${serverPort}/api/templates/${editName}?waba_id=${urlWabaId}&language=${editLang}`);
                    if (tResponse.data.status) {
                        const { meta, mappings: savedMappings } = tResponse.data.data;
                        setName(meta.name);
                        setTemplateId(meta.id);
                        setTemplateLanguage(meta.language || 'id');
                        setCategory(meta.category);
                        setTimeExpiration(meta.time_expiration || 60);

                        // Extract component texts (using safe casing)
                        const headerComp = meta.components?.find((c: any) => c.type?.toUpperCase() === 'HEADER');
                        const bodyComp = meta.components?.find((c: any) => c.type?.toUpperCase() === 'BODY');
                        const footerComp = meta.components?.find((c: any) => c.type?.toUpperCase() === 'FOOTER');
                        const buttonComp = meta.components?.find((c: any) => c.type?.toUpperCase() === 'BUTTONS');

                        if (headerComp) setHeaderText(headerComp.text || '');
                        if (bodyComp) setBodyText(bodyComp.text || '');
                        if (footerComp) setFooterText(footerComp.text || '');
                        if (buttonComp) setTemplateButtons(buttonComp.buttons || []);

                        // Map saved mappings to state
                        if (savedMappings && savedMappings.length > 0) {
                            setMappings(savedMappings.map((m: any) => ({
                                parameter_position: m.parameter_position,
                                source_key: m.source_key,
                                component_type: m.component_type?.toUpperCase(),
                                format_type: m.format_type?.toUpperCase(),
                                button_index: m.button_index
                            })));
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to load initial data", error);
            }
        };
        loadInitialData();
    }, []);

    // Detect variables {{n}} per component
    const detectedVariables = useMemo(() => {
        const vars: Mapping[] = [];

        const detectIn = (text: string, type: 'HEADER' | 'BODY' | 'BUTTON' | 'FOOTER') => {
            const regex = /\{\{(\d+)\}\}/g;
            const matches = [...text.matchAll(regex)];
            matches.forEach(m => {
                const pos = parseInt(m[1]);
                if (!vars.find(v => v.parameter_position === pos && v.component_type === type)) {
                    vars.push({
                        parameter_position: pos,
                        source_key: '',
                        component_type: type,
                        format_type: 'TEXT',
                        button_index: 0
                    });
                }
            });
        };

        detectIn(headerText, 'HEADER');
        detectIn(bodyText, 'BODY');
        detectIn(footerText, 'FOOTER');

        return vars.sort((a, b) => {
            if (a.component_type !== b.component_type) return a.component_type.localeCompare(b.component_type);
            return a.parameter_position - b.parameter_position;
        });
    }, [headerText, bodyText, footerText]);

    // Update mappings when variables change
    useEffect(() => {
        setMappings(prev => {
            const next = detectedVariables.map(v => {
                const existing = prev.find(p => p.parameter_position === v.parameter_position && p.component_type === v.component_type);
                return existing || v;
            });
            return next;
        });
    }, [detectedVariables]);

    // Handle category change - Auto set body if Auth
    useEffect(() => {
        if (category === 'AUTHENTICATION' && !new URLSearchParams(window.location.search).get('name')) {
            setBodyText("*{{1}}* adalah kode verifikasi Anda. Demi keamanan, jangan bagikan kode ini.");
            setTemplateButtons([{ type: 'OTP', otp_type: 'COPY_CODE', text: 'Copy Code' }]);
            setFooterText(`Kedaluwarsa dalam ${timeExpiration} menit.`);
        }
    }, [category]);

    // Update footer automatically when timeExpiration changes for AUTHENTICATION
    useEffect(() => {
        if (category === 'AUTHENTICATION') {
            setFooterText(`Kedaluwarsa dalam ${timeExpiration} menit.`);
        }
    }, [timeExpiration, category]);

    const handleMappingChange = (pos: number, type: string, key: string) => {
        setMappings(prev => prev.map(m => (m.parameter_position === pos && m.component_type === type) ? { ...m, source_key: key } : m));
    };

    const handleSave = async () => {
        if (!name || !bodyText) {
            alert("Please fill name and body text");
            return;
        }

        setIsSaving(true);
        try {
            const params = new URLSearchParams(window.location.search);
            const serverIp = params.get('server_ip') || 'localhost';
            const serverPort = params.get('server_port') || '55555';
            const mode = params.get('mode');

            const payload = {
                template: mode === 'mapping' ? null : {
                    id: templateId,
                    name: name,
                    category: category,
                    language: templateLanguage,
                    header: headerText,
                    body: bodyText,
                    footer: footerText,
                    time_expiration: category === 'AUTHENTICATION' ? timeExpiration : null,
                    buttons: templateButtons
                },
                mappings: mappings.map(m => ({
                    waba_id: wabaId,
                    template_name: name,
                    language_code: templateLanguage,
                    component_type: m.component_type,
                    format_type: m.format_type,
                    parameter_position: m.parameter_position,
                    source_key: m.source_key,
                    button_index: m.button_index
                }))
            };

            const response = await axios.post(`http://${serverIp}:${serverPort}/api/templates/mapping?waba_id=${wabaId}&language=${templateLanguage}`, payload);
            if (response.data.status) {
                alert(mode === 'mapping' ? "Mappings saved locally!" : "Template and mappings saved successfully!");
                navigate('/templates');
            }
        } catch (error) {
            console.error("Failed to save", error);
            alert("Failed to save: " + (error as any).response?.data?.message || "Unknown error");
        } finally {
            setIsSaving(false);
        }
    };

    // Helper for highlighted preview
    const getHighlightedText = (rawText: string, type: 'HEADER' | 'BODY' | 'BUTTON' | 'FOOTER') => {
        let text = rawText;
        mappings.filter(m => m.component_type === type).forEach(m => {
            const placeholder = sourceFields[m.source_key] || `[${m.source_key || `${type} Var ${m.parameter_position}`}]`;
            text = text.replace(new RegExp(`\\{\\{${m.parameter_position}\\}\\}`, 'g'), `<span class="bg-blue-100 text-blue-700 font-bold px-1 rounded mx-0.5">${placeholder}</span>`);
        });
        return text;
    };

    const previewHeader = useMemo(() => getHighlightedText(headerText, 'HEADER'), [headerText, mappings, sourceFields]);
    const previewBody = useMemo(() => getHighlightedText(bodyText, 'BODY'), [bodyText, mappings, sourceFields]);
    const previewFooter = useMemo(() => getHighlightedText(footerText, 'FOOTER'), [footerText, mappings, sourceFields]);

    return (
        <div className="flex flex-col h-screen bg-[#f0f2f5] overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/templates?waba_id=${wabaId}`)} className="rounded-full">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-base font-bold text-slate-800">
                            {category === 'AUTHENTICATION' ? 'Setup Authentication Template' : (new URLSearchParams(window.location.search).get('name') ? 'Edit Template' : 'Create New Template')}
                        </h1>
                        <p className="text-[10px] text-slate-500">
                            {category === 'AUTHENTICATION' ? 'Configure verification code mapping' : 'Design and map WhatsApp message variables'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/templates?waba_id=${wabaId}`)}>Cancel</Button>
                    <Button
                        variant="default"
                        size="sm"
                        className="bg-[#00a884] hover:bg-[#06cf9c]"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        Save Mapping
                    </Button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Left Side: Form */}
                <div className="w-[450px] bg-white border-r flex flex-col shadow-inner">
                    <ScrollArea className="flex-1">
                        <div className="p-6 space-y-8">
                            {/* Section 1: Basic Info */}
                            <div className="space-y-4">
                                <h3 className="text-[13px] font-semibold text-slate-900 border-l-4 border-[#00a884] pl-3 flex items-center justify-between">
                                    Basic Information
                                    <Info className="h-3 w-3 text-slate-400" />
                                </h3>
                                <div className="space-y-3 pl-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Template Name</label>
                                        <Input
                                            placeholder="e.g. registration_otp"
                                            value={name}
                                            onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                                            disabled={category === 'AUTHENTICATION' && !!new URLSearchParams(window.location.search).get('name')}
                                            className="h-8 text-xs"
                                        />
                                        <p className="text-[9px] text-slate-400">Lower case, numbers, and underscores only</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Category</label>
                                        <Select
                                            value={category}
                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
                                            disabled={!!new URLSearchParams(window.location.search).get('name')}
                                            className="h-8 text-xs"
                                        >
                                            <option value="UTILITY">Utility</option>
                                            <option value="MARKETING">Marketing</option>
                                            <option value="AUTHENTICATION">Authentication</option>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Header */}
                            <div className="space-y-4">
                                <h3 className="text-[13px] font-semibold text-slate-900 border-l-4 border-slate-300 pl-3">
                                    Header (Optional)
                                </h3>
                                <div className="space-y-3 pl-4">
                                    <Input
                                        placeholder="e.g. Order Status Update"
                                        value={headerText}
                                        onChange={(e) => setHeaderText(e.target.value)}
                                        className="h-8 text-xs"
                                    />
                                </div>
                            </div>

                            {/* Section 3: Content */}
                            <div className="space-y-4">
                                <h3 className="text-[13px] font-semibold text-slate-900 border-l-4 border-[#00a884] pl-3">
                                    Message Content
                                </h3>
                                <div className="space-y-3 pl-4">
                                    <div className="space-y-1.5">
                                        <textarea
                                            className="w-full min-h-[80px] p-2 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 border-slate-200 resize-none font-sans bg-slate-50 disabled:opacity-80"
                                            placeholder="Type message here... Use {{1}} for variables."
                                            value={bodyText}
                                            onChange={(e) => setBodyText(e.target.value)}
                                            disabled={category === 'AUTHENTICATION'}
                                        />
                                        {category !== 'AUTHENTICATION' && (
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="h-7 text-[10px] px-2 bg-slate-100"
                                                    onClick={() => setBodyText(prev => prev + `{{${detectedVariables.length + 1}}}`)}
                                                >
                                                    Add Variable
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {category === 'AUTHENTICATION' && (
                                <div className="space-y-4">
                                    <h3 className="text-[13px] font-semibold text-slate-900 border-l-4 border-amber-500 pl-3">
                                        Authentication Settings
                                    </h3>
                                    <div className="space-y-3 pl-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Code Expiration (Minutes)</label>
                                            <Input
                                                type="number"
                                                value={timeExpiration}
                                                onChange={(e) => setTimeExpiration(parseInt(e.target.value))}
                                                className="h-8 text-xs"
                                                min={1}
                                                max={60}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Section 4: Footer & Buttons */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-900 border-l-4 border-slate-300 pl-3">
                                    Footer (Optional)
                                </h3>
                                <div className="space-y-3 pl-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-slate-400">Footer Text</label>
                                        <Input
                                            placeholder="e.g. Regards, Family Pulsa"
                                            value={footerText}
                                            onChange={(e) => setFooterText(e.target.value)}
                                            disabled={category === 'AUTHENTICATION'}
                                            className="h-8 text-xs bg-white disabled:bg-slate-50 disabled:opacity-80"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 5: Mapping */}
                            {mappings.length > 0 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <h3 className="text-[13px] font-semibold text-slate-900 border-l-4 border-blue-500 pl-3 flex items-center justify-between">
                                        Variable Mapping
                                        <Badge variant="outline" className="text-[9px] h-4 bg-blue-50 text-blue-600 border-blue-100">{mappings.length} Vars</Badge>
                                    </h3>
                                    <div className="space-y-3 pl-4">
                                        {mappings.map((m) => (
                                            <div key={`${m.component_type}-${m.parameter_position}`} className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                                    {m.parameter_position}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[10px] text-slate-400 uppercase mb-0.5">{m.component_type}</div>
                                                    <Select
                                                        value={m.source_key}
                                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleMappingChange(m.parameter_position, m.component_type, e.target.value)}
                                                        className="h-6 text-[10px] bg-white border-none shadow-none focus:ring-0"
                                                    >
                                                        <option value="">Select System Field...</option>
                                                        {Object.entries(sourceFields).map(([key, label]) => (
                                                            <option key={key} value={key}>{label}</option>
                                                        ))}
                                                    </Select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Bottom margin helper */}
                            <div className="h-10" />
                        </div>
                    </ScrollArea>
                </div>

                {/* Right Side: Preview (Matching the user image) */}
                <div className="flex-1 bg-slate-100 flex items-center justify-center p-8 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
                    <div className="w-full max-w-[480px] bg-white rounded-lg shadow-xl border overflow-hidden">
                        <div className="p-6 border-b flex items-center justify-between bg-white">
                            <h2 className="text-lg font-bold text-[#142e3e]">Pratinjau template</h2>
                            <div className="p-2 border rounded-md hover:bg-slate-50 cursor-pointer">
                                <Send className="h-5 w-5 fill-[#142e3e]" />
                            </div>
                        </div>

                        <div className="p-10 bg-[#e5ddd5] bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
                            {/* Message Bubble */}
                            <div className="bg-white rounded-xl shadow-md overflow-hidden relative max-w-[90%]">
                                <div className="absolute top-0 left-[-8px] w-0 h-0 border-t-[10px] border-t-white border-l-[10px] border-l-transparent"></div>

                                <div className="p-4 space-y-2">
                                    {headerText && (
                                        <h4
                                            className="font-bold text-[#111b21] text-base leading-tight break-words"
                                            dangerouslySetInnerHTML={{ __html: previewHeader }}
                                        />
                                    )}
                                    <div
                                        className="text-[#111b21] text-sm leading-relaxed whitespace-pre-wrap break-words"
                                        dangerouslySetInnerHTML={{ __html: previewBody || '<span class="text-slate-300 italic">Body message goes here...</span>' }}
                                    />

                                    <div className="flex items-end justify-between gap-4 mt-2">
                                        {footerText ? (
                                            <div
                                                className="text-[11px] text-[#667781] leading-tight flex-1"
                                                dangerouslySetInnerHTML={{ __html: previewFooter }}
                                            />
                                        ) : <div className="flex-1" />}
                                        <span className="text-[10px] text-[#667781]">05.17</span>
                                    </div>
                                </div>

                                {/* Buttons Preview in Creator */}
                                {templateButtons.length > 0 && (
                                    <div className="border-t border-[#f2f2f2] flex flex-col divide-y divide-[#f2f2f2]">
                                        {templateButtons.map((btn, bIdx) => (
                                            <div key={bIdx} className="py-2.5 px-3 text-[#00a8e6] font-medium text-center flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors cursor-default">
                                                {btn.otp_type === 'COPY_CODE' ? <Copy className="h-3 w-3" /> : <Info className="h-3 w-3" />}
                                                {btn.text}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TemplateCreator;
