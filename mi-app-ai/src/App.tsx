// ... (mismos imports anteriores)
import { extractProductsFromList } from './services/geminiService';

function App() {
  // ... (mismos estados anteriores)
  const [isScanning, setIsScanning] = useState(false);

  const handleIA = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsScanning(true);
    addLog("Iniciando Escaneo IA...");
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const textFound = await extractProductsFromList(reader.result as string);
        setSkus(textFound);
        addLog("Escaneo completado con éxito");
      } catch (err) {
        addLog("Error en el escaneo");
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Sidebar (Igual al anterior) */}
      <aside style={{ width: '300px', padding: '20px', borderRight: '1px solid #eee' }}>
        {/* ... contenido del sidebar ... */}
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}>
        {/* Cabecera con Botones Studio IA */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }}>
          <label style={{ 
            backgroundColor: 'white', color: '#555', border: '1px solid #ddd', 
            padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center' 
          }}>
            <input type="file" hidden accept="image/*" onChange={handleIA} />
            📷 {isScanning ? "PROCESANDO..." : "ESCANEO IA"}
          </label>
          
          <button style={{ 
            backgroundColor: '#d90429', color: 'white', border: 'none', 
            padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' 
          }}>
            EXPORTAR ({skus.split('\n').filter(s => s.trim() !== "").length})
          </button>
        </div>

        {/* El resto del renderCard y textarea (Igual al anterior) */}
        <textarea 
          value={skus}
          onChange={(e) => setSkus(e.target.value)}
          placeholder="Los SKUs detectados aparecerán aquí..."
          style={{ width: '100%', maxWidth: '500px', height: '100px', marginBottom: '20px', borderRadius: '15px', padding: '15px' }}
        />
        
        <div style={{ overflowY: 'auto', width: '100%' }}>
          {skus.split('\n').filter(s => s.trim() !== "").map(linea => renderCard(linea))}
        </div>
      </main>
    </div>
  );
}
