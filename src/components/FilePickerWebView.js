import React, { useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

const FilePickerWebView = ({ visible, onFileSelected, onClose, acceptedTypes = ['application/x-pkcs12', 'application/pkcs12'] }) => {
  const webViewRef = useRef(null);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          margin: 0;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f5f5f5;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          max-width: 400px;
          width: 100%;
        }
        h2 {
          color: #333;
          margin-bottom: 20px;
          text-align: center;
        }
        .file-input-wrapper {
          position: relative;
          margin-bottom: 20px;
        }
        input[type="file"] {
          width: 100%;
          padding: 15px;
          border: 2px dashed #2196F3;
          border-radius: 8px;
          background: #E3F2FD;
          font-size: 16px;
          cursor: pointer;
        }
        .info {
          background: #FFF3CD;
          padding: 12px;
          border-radius: 8px;
          margin-top: 15px;
          font-size: 14px;
          color: #856404;
        }
        .selected-file {
          margin-top: 15px;
          padding: 12px;
          background: #E8F5E9;
          border-radius: 8px;
          font-size: 14px;
          color: #2E7D32;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Selecione o Certificado .pfx</h2>
        <div class="file-input-wrapper">
          <input 
            type="file" 
            id="fileInput" 
            accept="${acceptedTypes.join(',')}"
            style="display: none;"
          />
          <button 
            onclick="document.getElementById('fileInput').click()"
            style="
              width: 100%;
              padding: 20px;
              background: #2196F3;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 18px;
              font-weight: 600;
              cursor: pointer;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              transition: background 0.3s;
            "
            onmouseover="this.style.background='#1976D2'"
            onmouseout="this.style.background='#2196F3'"
          >
            📁 Escolher Arquivo .pfx
          </button>
        </div>
        <div id="fileInfo" class="info" style="display: none;">
          Arquivo selecionado: <span id="fileName"></span>
        </div>
        <div class="info" style="margin-top: 15px;">
          <strong>📋 Instruções:</strong><br>
          1. Clique no botão "Escolher Arquivo .pfx" acima<br>
          2. Selecione o arquivo do Google Drive, Dropbox ou dispositivo<br>
          3. <strong>NÃO clique diretamente no nome do arquivo no Google Drive</strong><br>
          4. Use o botão de download (ícone de setas) se necessário
        </div>
        <div class="info" style="background: #FFE0B2; border: 1px solid #FF9800; margin-top: 15px;">
          <strong>⚠️ Importante:</strong><br>
          Se você clicar diretamente no nome do arquivo no Google Drive, ele tentará abrir para visualização. Use sempre o botão "Escolher Arquivo .pfx" acima para selecionar o arquivo corretamente.
        </div>
      </div>
      <script>
        const fileInput = document.getElementById('fileInput');
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        
        fileInput.addEventListener('change', function(e) {
          const file = e.target.files[0];
          if (file) {
            // Validar extensão
            const fileName = file.name.toLowerCase();
            if (!fileName.endsWith('.pfx') && !fileName.endsWith('.p12')) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ERROR',
                error: 'Por favor, selecione um arquivo .pfx ou .p12 válido'
              }));
              // Limpar o input
              document.getElementById('fileInput').value = '';
              return;
            }
            
            document.getElementById('fileName').textContent = file.name;
            document.getElementById('fileInfo').style.display = 'block';
            
            // Ler o arquivo como base64
            const reader = new FileReader();
            reader.onload = function(event) {
              const base64 = event.target.result;
              const fileData = {
                name: file.name,
                type: file.type || 'application/x-pkcs12',
                size: file.size,
                base64: base64.split(',')[1], // Remover o prefixo data:application/x-pkcs12;base64,
                uri: base64
              };
              
              // Enviar para React Native
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'FILE_SELECTED',
                data: fileData
              }));
            };
            reader.onerror = function(error) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'ERROR',
                error: 'Erro ao ler arquivo: ' + error.message
              }));
            };
            reader.readAsDataURL(file);
          }
        });
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'FILE_SELECTED') {
        const fileData = message.data;
        
        // Converter base64 para URI que o React Native pode usar
        // O WebView já retorna como data URI, então podemos usar diretamente
        const file = {
          name: fileData.name,
          uri: fileData.uri,
          type: fileData.type,
          size: fileData.size,
        };
        
        onFileSelected(file);
      } else if (message.type === 'ERROR') {
        console.error('Erro no WebView:', message.error);
        onFileSelected(null, message.error);
      }
    } catch (error) {
      console.error('Erro ao processar mensagem do WebView:', error);
      onFileSelected(null, error.message);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default FilePickerWebView;

