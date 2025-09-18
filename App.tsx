import React, { useState, useCallback, useRef } from 'react';

// TypeScript declaration for the libraries loaded from CDN
declare global {
  interface Window {
    QRCode: {
      toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>;
    };
    JSZip: any;
  }
  interface QRCodeToDataURLOptions {
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
      margin?: number;
      scale?: number;
      width?: number;
      color?: {
          dark?: string;
          light?: string;
      };
  }
}

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const ClearIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const QRCodeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h18v18H3z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h3v3H7zM14 7h3v3h-3zM7 14h3v3H7zM14 14h3v3h-3z" />
    </svg>
);

const Spinner = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
);

const App: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [qrCodes, setQrCodes] = useState<{ text: string; url: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Gerando...');
  const [error, setError] = useState<string | null>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateSingleQRCode = useCallback(async () => {
    if (!text.trim()) {
      setError('Por favor, insira um texto ou URL para gerar o código QR.');
      setQrCodes([]);
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('Gerando QR Code...');
    setError(null);
    setQrCodes([]);

    try {
      const options: QRCodeToDataURLOptions = {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'H'
      };
      const url = await window.QRCode.toDataURL(text, options);
      setQrCodes([{ text, url }]);
      setTimeout(() => {
        qrCodeRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error(err);
      setError('Não foi possível gerar o código QR. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [text]);

  const generateQRCodesFromLines = useCallback(async (lines: string[]) => {
    if (lines.length === 0) {
        setError('O arquivo está vazio ou não contém texto válido.');
        return;
    }
    setIsLoading(true);
    setLoadingMessage(`Gerando ${lines.length} códigos QR...`);
    setError(null);
    setQrCodes([]);
    try {
        const options: QRCodeToDataURLOptions = {
            width: 200,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' },
            errorCorrectionLevel: 'H'
        };
        const qrCodePromises = lines.map(line =>
            window.QRCode.toDataURL(line, options).then(url => ({ text: line, url }))
        );
        const generatedCodes = await Promise.all(qrCodePromises);
        setQrCodes(generatedCodes);
        setTimeout(() => {
            qrCodeRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    } catch (err) {
        console.error(err);
        setError('Não foi possível gerar os códigos QR. Verifique o arquivo e tente novamente.');
    } finally {
        setIsLoading(false);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target?.result as string;
        const lines = content.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        generateQRCodesFromLines(lines);
    };
    reader.onerror = () => setError('Falha ao ler o arquivo.');
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadSingle = async () => {
    if (qrCodes.length !== 1) return;
    
    setIsLoading(true);
    setLoadingMessage('Preparando download em alta resolução...');
    setError(null);

    try {
      const options: QRCodeToDataURLOptions = {
        width: 700,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'H'
      };
      const highResUrl = await window.QRCode.toDataURL(qrCodes[0].text, options);
      const link = document.createElement('a');
      link.href = highResUrl;
      const safeText = qrCodes[0].text.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 20);
      link.download = `qrcode_${safeText}_700x700.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      setError('Falha ao gerar o QR Code em alta resolução.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownloadZip = async () => {
    if (qrCodes.length < 1) return;
    
    setIsLoading(true);
    setLoadingMessage(`Preparando ${qrCodes.length} QR Code${qrCodes.length > 1 ? 's' : ''} em alta resolução...`);
    setError(null);

    try {
        const zip = new window.JSZip();
        const highResOptions: QRCodeToDataURLOptions = {
            width: 700,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
            errorCorrectionLevel: 'H'
        };

        const highResPromises = qrCodes.map(qr => window.QRCode.toDataURL(qr.text, highResOptions));
        const highResUrls = await Promise.all(highResPromises);
        
        highResUrls.forEach((url, index) => {
            const qr = qrCodes[index];
            const base64Data = url.split(';base64,').pop();
            if (base64Data) {
                const safeText = qr.text.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 20);
                zip.file(`qrcode_${index + 1}_${safeText}_700x700.png`, base64Data, { base64: true });
            }
        });

        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'qrcodes_700x700.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (err) {
        console.error(err);
        setError('Falha ao gerar os QR Codes em alta resolução para o ZIP.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setQrCodes([]);
    setError(null);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') generateSingleQRCode();
  };

  return (
    <div className="bg-slate-900 min-h-screen flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 text-white font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
                Gerador de Código QR
            </h1>
            <p className="mt-3 text-lg text-slate-400">
                Crie e baixe códigos QR de alta qualidade, individualmente ou em lote.
            </p>
        </header>

        <main className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-sky-900/20 ring-1 ring-white/10 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text" value={text} onChange={(e) => setText(e.target.value)} onKeyPress={handleKeyPress}
              placeholder="Digite seu texto ou URL aqui..."
              className="flex-grow bg-slate-700/50 text-slate-100 placeholder-slate-400 px-4 py-3 rounded-lg border-2 border-transparent focus:border-sky-500 focus:ring-2 focus:ring-sky-500/50 focus:outline-none transition-all duration-300 ease-in-out text-lg"
              aria-label="Text or URL to encode"
            />
            <button onClick={generateSingleQRCode} disabled={isLoading}
              className="flex items-center justify-center bg-sky-500 hover:bg-sky-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/30 transform hover:-translate-y-0.5"
            >
                Gerar QR Code
            </button>
          </div>
          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-slate-700"></div><span className="flex-shrink mx-4 text-slate-500">OU</span><div className="flex-grow border-t border-slate-700"></div>
          </div>
          <div>
            <input type="file" accept=".txt" onChange={handleFileChange} ref={fileInputRef} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="w-full flex items-center justify-center bg-slate-600 hover:bg-slate-700 disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-lg transition-all duration-300 ease-in-out cursor-pointer">
              <UploadIcon />
              <span>Carregar Bloco de Notas (.txt) para Geração em Lote</span>
            </label>
          </div>
        </main>
        
        <div className="mt-10">
          {isLoading && (<div className="flex flex-col items-center justify-center text-center"><Spinner /><p className="mt-4 text-lg text-slate-300">{loadingMessage}</p></div>)}
          {error && !isLoading && <p className="text-red-400 mt-4 text-center animate-pulse">{error}</p>}
          {!isLoading && qrCodes.length > 0 && (
            <div ref={qrCodeRef} className="animate-fade-in-up">
              <div className="w-full flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                  <h2 className="text-2xl font-bold text-slate-200">{qrCodes.length} QR Code{qrCodes.length > 1 ? 's' : ''} Gerado{qrCodes.length > 1 ? 's' : ''}</h2>
                  <div className="flex gap-2 sm:gap-4">
                      {qrCodes.length === 1 && <button onClick={handleDownloadSingle} className="flex items-center justify-center bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-6 py-2 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-500/20 transform hover:-translate-y-0.5"><DownloadIcon />Baixar PNG</button>}
                      {qrCodes.length > 1 && <button onClick={handleDownloadZip} className="flex items-center justify-center bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-6 py-2 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-500/20 transform hover:-translate-y-0.5"><DownloadIcon />Baixar ZIP</button>}
                      <button onClick={handleClear} aria-label="Limpar resultados" className="p-2.5 bg-red-500/80 hover:bg-red-500 text-white font-bold rounded-lg transition-colors duration-300 shadow-lg shadow-red-500/20"><ClearIcon /></button>
                  </div>
              </div>
              {qrCodes.length === 1 ? (
                  <div className="flex justify-center"><div className="bg-white p-4 rounded-lg shadow-lg"><img src={qrCodes[0].url} alt={qrCodes[0].text} className="w-64 h-64 sm:w-72 sm:h-72" /></div></div>
              ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 w-full">
                      {qrCodes.map((qr, index) => (<div key={index} className="flex flex-col items-center text-center p-2 bg-slate-800/50 rounded-lg"><div className="bg-white p-1 rounded-md shadow-lg w-full"><img src={qr.url} alt={qr.text} className="w-full h-auto aspect-square" /></div><p className="mt-2 text-xs text-slate-400 break-all w-full px-1">{qr.text}</p></div>))}
                  </div>
              )}
            </div>
          )}
          {!isLoading && qrCodes.length === 0 && !error && (<div className="text-center mt-12 text-slate-500 p-8 border-2 border-dashed border-slate-700 rounded-2xl"><QRCodeIcon /><p className="mt-2 text-lg">Seu código QR aparecerá aqui</p></div>)}
        </div>
      </div>

      <footer className="text-center text-slate-500 mt-12 py-4">
        <p>Desenvolvido com React, TypeScript e Tailwind CSS.</p>
      </footer>
    </div>
  );
};

export default App;

const style = document.createElement('style');
style.textContent = `
  @keyframes fade-in-up {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
`;
document.head.append(style);