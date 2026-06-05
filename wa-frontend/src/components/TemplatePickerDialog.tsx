import React, { useState, useEffect } from 'react';
import type { Conversation } from '../types/chat';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search, Send, X, LayoutGrid, Phone, ExternalLink } from "lucide-react";

interface TemplateComponent {
  type: string;
  text?: string;
  format?: string;
  buttons?: { text: string; type: string; url?: string }[];
}

interface WaTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  status: string;
  components: TemplateComponent[];
}

interface TemplatePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: WaTemplate, params: { body: string[], buttons: string[], header: string[] }) => void;
  conversation?: Conversation | null;
}

function getBodyText(components: TemplateComponent[]): string {
  const body = components.find((c) => c.type === 'BODY');
  return body?.text || '';
}

function getComponentParamsCount(components: TemplateComponent[], type: string): number {
  const comp = components.find((c) => c.type === type);
  if (!comp?.text) return 0;
  const match = comp.text.match(/{{\d+}}/g);
  const count = match ? new Set(match).size : 0;
  
  // For BUTTONS, also check button texts
  if (type === 'BUTTONS' && comp.buttons) {
    let btnCount = 0;
    comp.buttons.forEach((btn) => {
      const btnMatch = btn.text.match(/{{\d+}}/g);
      if (btnMatch) btnCount += new Set(btnMatch).size;
    });
    return btnCount;
  }
  return count;
}

const TemplatePickerDialog: React.FC<TemplatePickerDialogProps> = ({ isOpen, onClose, onSelect, conversation }) => {
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<WaTemplate | null>(null);
  const [params, setParams] = useState<{ body: string[], buttons: string[], header: string[] }>({ body: [], buttons: [], header: [] });

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/templates', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await response.json();
      if (response.ok) {
        const data: WaTemplate[] = json.data || [];
        // Filter only APPROVED templates with parsed components
        setTemplates(data.filter((t: WaTemplate) => {
          if (t.status !== 'APPROVED') return false;
          // Ensure components is an array
          if (!Array.isArray(t.components)) return false;
          return true;
        }));
      } else {
        console.error("Failed to fetch templates", json);
      }
    } catch (error) {
      console.error("Failed to fetch templates", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = (template: WaTemplate) => {
    setSelectedTemplate(template);
    setParams({
      body: Array(getComponentParamsCount(template.components, 'BODY')).fill(''),
      buttons: Array(getComponentParamsCount(template.components, 'BUTTONS')).fill(''),
      header: Array(getComponentParamsCount(template.components, 'HEADER')).fill(''),
    });
  };

  const handleConfirm = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate, params);
      setSelectedTemplate(null);
      onClose();
    }
  };

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getBodyText(t.components).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 gap-0 overflow-hidden bg-white">
        <DialogHeader className="p-4 border-b shrink-0 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-[#00a884]" />
            Pilih Template WhatsApp
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {!selectedTemplate ? (
          <>
            <div className="p-4 border-b bg-slate-50 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari template..."
                  className="pl-9 h-10 bg-white border-slate-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="flex-1 p-2">
              <div className="grid gap-2">
                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a884]"></div>
                  </div>
                ) : filteredTemplates.length > 0 ? (
                  filteredTemplates.map((t) => (
                    <div
                      key={t.id || t.name}
                      className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
                      onClick={() => handleSelectTemplate(t)}
                    >
                      <div className="font-bold text-sm text-slate-800 group-hover:text-[#00a884]">{t.name}</div>
                      <div className="text-xs text-slate-500 line-clamp-2 mt-1">{getBodyText(t.components)}</div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mt-2 tracking-wider">{t.category} • {t.language}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-12 text-slate-400 text-sm">
                    Tidak ada template yang disetujui
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-50 border-b flex items-center justify-between shrink-0">
              <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)} className="h-8">
                <X className="h-4 w-4 mr-1" /> Kembali
              </Button>
              <span className="text-xs font-bold text-slate-600">{selectedTemplate.name}</span>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {/* Preview area */}
                <div className="bg-[#e5ddd5] p-4 rounded-xl relative">
                  <div className="bg-white rounded-lg shadow-sm text-sm max-w-[90%] relative overflow-hidden">
                    <div className="absolute top-0 left-[-8px] w-0 h-0 border-t-[10px] border-t-white border-l-[10px] border-l-transparent"></div>

                    {(() => {
                      const header = selectedTemplate.components.find((c) => c.type === 'HEADER');
                      const body = selectedTemplate.components.find((c) => c.type === 'BODY');
                      const footer = selectedTemplate.components.find((c) => c.type === 'FOOTER');
                      const buttonsComp = selectedTemplate.components.find((c) => c.type === 'BUTTONS');

                      const replaceParams = (text: string, idxOffset: number = 0) => {
                        if (!text) return "";
                        return text.replace(/{{\d+}}/g, (match) => {
                          const idx = parseInt(match.match(/\d+/)?.[0] || "1") - 1 - idxOffset;
                          const allParams = [...params.header, ...params.body];
                          return allParams[idx] || match;
                        });
                      };

                      return (
                        <>
                          {header && (
                            <div className="p-3 font-bold border-b border-slate-50 text-slate-900">
                              {header.format === 'TEXT' ? replaceParams(header.text || '', 0) : `[${header.format} Header]`}
                            </div>
                          )}
                          <div className="p-3">
                            <div className="whitespace-pre-wrap text-slate-800">
                              {replaceParams(body?.text || '', params.header.length)}
                            </div>
                            {footer && (
                              <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                                {footer.text}
                              </div>
                            )}
                            <div className="text-[10px] text-right text-slate-400 mt-1">
                              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          {buttonsComp && buttonsComp.buttons && (
                            <div className="flex flex-col border-t border-slate-50">
                              {buttonsComp.buttons.map((btn, idx) => (
                                <div key={idx} className="p-2 text-center text-[#00a884] font-semibold border-b border-slate-50 last:border-0 flex items-center justify-center gap-2">
                                  {btn.text}
                                  {btn.type === 'URL' && <ExternalLink className="h-3 w-3 opacity-50" />}
                                  {btn.type === 'PHONE_NUMBER' && <Phone className="h-3 w-3 opacity-50" />}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {params.header.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Header Parameter</h4>
                    {params.header.map((val, idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Variabel {"{{"}{idx + 1}{"}}"}</label>
                        <Input
                          value={val}
                          onChange={(e) => {
                            const newHeader = [...params.header];
                            newHeader[idx] = e.target.value;
                            setParams({ ...params, header: newHeader });
                          }}
                          placeholder={`Masukkan nilai untuk header {{${idx + 1}}}`}
                          className="h-10"
                        />
                        {conversation && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <span className="text-[9px] text-slate-400 self-center mr-1 uppercase">Rekomendasi:</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-[10px] bg-slate-50 border-slate-200 text-slate-600 hover:bg-[#00a884] hover:text-white hover:border-[#00a884] rounded-full transition-all"
                              onClick={() => {
                                const newHeader = [...params.header];
                                newHeader[idx] = conversation.customer_name;
                                setParams({ ...params, header: newHeader });
                              }}
                            >
                              Nama Customer
                            </Button>
                            {conversation.app_name && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-[10px] bg-slate-50 border-slate-200 text-slate-600 hover:bg-[#00a884] hover:text-white hover:border-[#00a884] rounded-full transition-all"
                                onClick={() => {
                                  const newHeader = [...params.header];
                                  newHeader[idx] = conversation.app_name || '';
                                  setParams({ ...params, header: newHeader });
                                }}
                              >
                                Nama Aplikasi
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {params.body.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Isi Parameter</h4>
                    {params.body.map((val, idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Variabel {"{{"}{idx + 1 + params.header.length}{"}}"}</label>
                        <Input
                          value={val}
                          onChange={(e) => {
                            const newBody = [...params.body];
                            newBody[idx] = e.target.value;
                            setParams({ ...params, body: newBody });
                          }}
                          placeholder={`Masukkan nilai untuk body {{${idx + 1}}}`}
                          className="h-10"
                        />
                        {conversation && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <span className="text-[9px] text-slate-400 self-center mr-1 uppercase">Rekomendasi:</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-[10px] bg-slate-50 border-slate-200 text-slate-600 hover:bg-[#00a884] hover:text-white hover:border-[#00a884] rounded-full transition-all"
                              onClick={() => {
                                const newBody = [...params.body];
                                newBody[idx] = conversation.customer_name;
                                setParams({ ...params, body: newBody });
                              }}
                            >
                              Nama Customer
                            </Button>
                            {conversation.app_name && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-[10px] bg-slate-50 border-slate-200 text-slate-600 hover:bg-[#00a884] hover:text-white hover:border-[#00a884] rounded-full transition-all"
                                onClick={() => {
                                  const newBody = [...params.body];
                                  newBody[idx] = conversation.app_name || '';
                                  setParams({ ...params, body: newBody });
                                }}
                              >
                                Nama Aplikasi
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="p-4 border-t bg-slate-50 shrink-0">
              <Button variant="ghost" onClick={onClose} className="h-10">Batal</Button>
              <Button
                onClick={handleConfirm}
                className="h-10 bg-[#00a884] hover:bg-[#06cf9c] font-bold"
              >
                <Send className="h-4 w-4 mr-2" />
                Kirim Template
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TemplatePickerDialog;
