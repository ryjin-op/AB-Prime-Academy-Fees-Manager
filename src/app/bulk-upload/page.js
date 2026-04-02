'use client';

import { useState, useRef } from 'react';
import { 
  FileUp, FileSpreadsheet, AlertCircle, CheckCircle2, 
  Trash2, Upload, Download, Info 
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function BulkUpload() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const parsedData = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        // Convert array of arrays to array of objects using first row as header
        const headers = parsedData[0];
        const rows = parsedData.slice(1).map(row => {
          let obj = {};
          headers.forEach((header, index) => {
            obj[header.toLowerCase()] = row[index];
          });
          return obj;
        });
        
        validateData(rows);
        setData(rows);
      };
      reader.readAsBinaryString(selectedFile);
    }
  };

  const validateData = (rows) => {
    const newErrors = [];
    rows.forEach((row, index) => {
      if (!row.name) newErrors.push(`Row ${index + 2}: Name is missing`);
      if (!row.fees || isNaN(row.fees)) newErrors.push(`Row ${index + 2}: Invalid fees`);
    });
    setErrors(newErrors);
  };

  const handleImport = () => {
    if (errors.length > 0) {
      alert("Please fix layout errors before importing.");
      return;
    }
    setImporting(true);
    // Mock import logic
    setTimeout(() => {
      setImporting(false);
      alert(`Imported ${data.length} students successfully!`);
      setData([]);
      setFile(null);
    }, 2000);
  };

  return (
    <div className="animate-in">
      <header style={{ marginBottom: '32px' }}>
        <h1 className="text-gradient">Bulk Registration 🚀</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Upload Excel or CSV files to register students in bulk</p>
      </header>

      <div className="grid-main" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Upload Area */}
          <div 
            className="ios-card glass" 
            style={{ 
              border: '3px dashed var(--border)', 
              textAlign: 'center', 
              padding: '60px 20px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onClick={() => fileInputRef.current.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".csv, .xlsx, .xls"
              onChange={handleFileChange}
            />
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '30px', 
              background: 'var(--secondary)', color: 'var(--primary)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              margin: '0 auto 20px' 
            }}>
              <Upload size={32} />
            </div>
            {file ? (
              <div>
                <p style={{ fontWeight: '700', fontSize: '1.1rem' }}>{file.name}</p>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>Click to change file</p>
              </div>
            ) : (
              <div>
                <p style={{ fontWeight: '700', fontSize: '1.1rem' }}>Click to upload file</p>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>Support CSV, Microsoft Excel (.xlsx, .xls)</p>
              </div>
            )}
          </div>

          {/* Preview Table */}
          {data.length > 0 && (
            <div className="ios-card glass" style={{ overflowX: 'auto', padding: '0' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1.1rem' }}>Sheet Preview ({data.length} rows)</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '16px 24px' }}>Name</th>
                    <th style={{ padding: '16px' }}>Phone</th>
                    <th style={{ padding: '16px' }}>Fees</th>
                    <th style={{ padding: '16px' }}>Class</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.9rem' }}>
                  {data.slice(0, 10).map((row, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 24px', fontWeight: '600' }}>{row.name || '-'}</td>
                      <td style={{ padding: '16px' }}>{row.phone || '-'}</td>
                      <td style={{ padding: '16px' }}>₹{row.fees || '0'}</td>
                      <td style={{ padding: '16px' }}>{row.class || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 10 && (
                <div style={{ padding: '16px 24px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted-foreground)', background: 'var(--muted)' }}>
                  And {data.length - 10} more rows...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar: Validation & Template */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="ios-card glass">
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} color="var(--primary)" />
              Import Instructions
            </h3>
            <ul style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>Columns must be in the first row.</li>
              <li>Required columns: <b>Name, Phone, Fees</b>.</li>
              <li>Optional: Father, Mother, Class, DOB.</li>
              <li>Avoid duplicate phone numbers.</li>
            </ul>
            <button className="ios-button" style={{ 
              width: '100%', marginTop: '24px', background: 'var(--secondary)', 
              color: 'var(--secondary-foreground)', padding: '14px' 
            }}>
              <Download size={18} />
              Download Template
            </button>
          </div>

          <div className="ios-card glass">
            <h3 style={{ marginBottom: '16px' }}>Import Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Total Rows:</span>
                <span style={{ fontWeight: '700' }}>{data.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Errors Found:</span>
                <span style={{ fontWeight: '700', color: errors.length > 0 ? 'var(--danger)' : 'var(--success)' }}>{errors.length}</span>
              </div>
            </div>

            {errors.length > 0 && (
              <div style={{ 
                marginTop: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', 
                borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' 
              }}>
                 {errors.slice(0, 3).map((err, i) => (
                   <p key={i} style={{ color: 'var(--danger)', fontSize: '0.75rem', marginBottom: '4px' }}>• {err}</p>
                 ))}
                 {errors.length > 3 && <p style={{ fontSize: '0.7rem', opacity: 0.7 }}>+ {errors.length - 3} more errors</p>}
              </div>
            )}

            <button 
              className="ios-button ios-button-primary" 
              style={{ width: '100%', marginTop: '24px', padding: '18px' }}
              disabled={data.length === 0 || errors.length > 0 || importing}
              onClick={handleImport}
            >
              {importing ? 'Importing...' : 'Start Bulk Import'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
