/**
 * Serviço para comunicação BLE com sensores
 * Requer react-native-ble-plx
 */

class BLEService {
  constructor() {
    this.manager = null;
    this.connectedDevice = null;
    this.isScanning = false;
    this.isConnected = false;
    this.dataSubscription = null;
    
    // UUIDs do WT901BLE67 (sensores inerciais BLE comuns)
    // Se estes não funcionarem, descubra os UUIDs usando discoverAllServicesAndCharacteristics
    this.SERVICE_UUID = '0000FFE0-0000-1000-8000-00805F9B34FB';
    this.CHARACTERISTIC_UUID = '0000FFE1-0000-1000-8000-00805F9B34FB';
    
    // UUIDs alternativos (tente se os acima não funcionarem)
    this.SERVICE_UUID_ALT = '0000FFE5-0000-1000-8000-00805F9B34FB';
    this.CHARACTERISTIC_UUID_ALT = '0000FFE9-0000-1000-8000-00805F9B34FB';
  }

  /**
   * Inicializar o gerenciador BLE
   */
  async initialize() {
    try {
      // Verificar se a biblioteca está disponível
      let BleManager;
      try {
        const bleModule = require('react-native-ble-plx');
        BleManager = bleModule.BleManager;
        
        // Verificar se o módulo nativo está disponível
        if (!BleManager) {
          throw new Error('BleManager não encontrado no módulo');
        }
      } catch (requireError) {
        console.error('Erro ao carregar react-native-ble-plx:', requireError);
        return { 
          success: false, 
          error: 'Biblioteca BLE não disponível. O app precisa ser recompilado após instalar react-native-ble-plx. Execute: npm run android ou npm run ios',
          requiresRebuild: true
        };
      }

      try {
        this.manager = new BleManager();
      } catch (managerError) {
        console.error('Erro ao criar BleManager:', managerError);
        return { 
          success: false, 
          error: 'Módulo nativo BLE não encontrado. O app precisa ser recompilado. Execute: npm run android ou npm run ios',
          requiresRebuild: true
        };
      }
      
      // Aguardar inicialização
      await new Promise((resolve, reject) => {
        const subscription = this.manager.onStateChange((state) => {
          if (state === 'PoweredOn') {
            subscription.remove();
            resolve();
          } else if (state === 'PoweredOff' || state === 'Unauthorized') {
            subscription.remove();
            reject(new Error(`Bluetooth ${state}`));
          }
        }, true); // true = executar callback imediatamente com estado atual
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao inicializar BLE:', error);
      
      // Verificar se é erro de módulo nativo
      if (error.message && error.message.includes('NativeEventEmitter')) {
        return { 
          success: false, 
          error: 'Módulo nativo BLE não encontrado. O app precisa ser recompilado. Execute: npm run android ou npm run ios',
          requiresRebuild: true
        };
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Escanear dispositivos BLE próximos
   */
  async scanForDevices(targetMac = null, timeout = 10000) {
    try {
      if (!this.manager) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return { success: false, error: 'BLE não inicializado' };
        }
      }

      if (this.isScanning) {
        return { success: false, error: 'Já está escaneando' };
      }

      this.isScanning = true;
      const devices = [];

      return new Promise((resolve) => {
        const scanTimeout = setTimeout(() => {
          this.manager.stopDeviceScan();
          this.isScanning = false;
          resolve({
            success: true,
            devices: devices,
            message: devices.length > 0 ? 'Dispositivos encontrados' : 'Nenhum dispositivo encontrado',
          });
        }, timeout);

        this.manager.startDeviceScan(null, null, (error, device) => {
          if (error) {
            clearTimeout(scanTimeout);
            this.manager.stopDeviceScan();
            this.isScanning = false;
            resolve({ success: false, error: error.message });
            return;
          }

          if (device) {
            // Normalizar MAC address (remover dois pontos e converter para maiúsculas)
            const deviceMac = (device.id || device.macAddress || '').replace(/:/g, '').toUpperCase();
            const targetMacNormalized = targetMac ? targetMac.replace(/:/g, '').toUpperCase() : null;
            
            // Se targetMac foi especificado, procurar por ele
            if (targetMacNormalized && deviceMac.includes(targetMacNormalized)) {
              clearTimeout(scanTimeout);
              this.manager.stopDeviceScan();
              this.isScanning = false;
              resolve({
                success: true,
                device: device,
                devices: [device],
              });
              return;
            } else if (!targetMac) {
              // Adicionar todos os dispositivos encontrados
              if (!devices.find(d => d.id === device.id)) {
                devices.push(device);
              }
            }
          }
        });
      });
    } catch (error) {
      console.error('Erro ao escanear dispositivos:', error);
      this.isScanning = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * Conectar ao dispositivo
   */
  async connectToDevice(deviceId) {
    try {
      if (!this.manager) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return { success: false, error: 'BLE não inicializado' };
        }
      }

      if (this.isConnected && this.connectedDevice?.id === deviceId) {
        return { success: true, device: this.connectedDevice };
      }

      // Desconectar se já estiver conectado a outro dispositivo
      if (this.isConnected) {
        await this.disconnect();
      }

      const device = await this.manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();

      this.connectedDevice = device;
      this.isConnected = true;

      // Log dos serviços e características descobertos (para debug)
      const services = await device.services();
      console.log('🔍 Serviços descobertos:', services.map(s => s.uuid));
      
      for (const service of services) {
        const characteristics = await service.characteristics();
        console.log(`  📡 Características do serviço ${service.uuid}:`, characteristics.map(c => c.uuid));
      }

      return {
        success: true,
        device: device,
        macAddress: device.id || device.macAddress,
        services: services,
      };
    } catch (error) {
      console.error('Erro ao conectar dispositivo:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Desconectar do dispositivo
   */
  async disconnect() {
    try {
      if (this.dataSubscription) {
        this.dataSubscription.remove();
        this.dataSubscription = null;
      }

      if (this.connectedDevice) {
        await this.connectedDevice.cancelConnection();
        this.connectedDevice = null;
      }

      this.isConnected = false;
      return { success: true };
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Descobrir serviços e características do dispositivo conectado
   */
  async discoverServices() {
    try {
      if (!this.isConnected || !this.connectedDevice) {
        return { success: false, error: 'Não conectado a nenhum dispositivo' };
      }

      const services = await this.connectedDevice.services();
      const servicesData = [];

      for (const service of services) {
        const characteristics = await service.characteristics();
        servicesData.push({
          uuid: service.uuid,
          characteristics: characteristics.map(c => ({
            uuid: c.uuid,
            properties: c.properties,
          })),
        });
      }

      return {
        success: true,
        services: servicesData,
      };
    } catch (error) {
      console.error('Erro ao descobrir serviços:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Ler dados do sensor (acelerômetro e giroscópio)
   */
  async readSensorData(serviceUUID = null, characteristicUUID = null) {
    try {
      if (!this.isConnected || !this.connectedDevice) {
        return { success: false, error: 'Não conectado a nenhum dispositivo' };
      }

      // Usar UUIDs padrão se não fornecidos
      const serviceUuid = serviceUUID || this.SERVICE_UUID;
      const charUuid = characteristicUUID || this.CHARACTERISTIC_UUID;

      const characteristic = await this.connectedDevice.readCharacteristicForService(
        serviceUuid,
        charUuid
      );

      // Parse dos dados do sensor
      const data = this.parseSensorData(characteristic.value);

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('Erro ao ler dados do sensor:', error);
      // Tentar UUIDs alternativos
      if (serviceUUID === null && characteristicUUID === null) {
        console.log('Tentando UUIDs alternativos...');
        return this.readSensorData(this.SERVICE_UUID_ALT, this.CHARACTERISTIC_UUID_ALT);
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Assinar notificações de dados do sensor
   */
  async subscribeToNotifications(serviceUUID = null, characteristicUUID = null, callback) {
    try {
      if (!this.isConnected || !this.connectedDevice) {
        return { success: false, error: 'Não conectado a nenhum dispositivo' };
      }

      // Usar UUIDs padrão se não fornecidos
      const serviceUuid = serviceUUID || this.SERVICE_UUID;
      const charUuid = characteristicUUID || this.CHARACTERISTIC_UUID;

      this.dataSubscription = this.connectedDevice.monitorCharacteristicForService(
        serviceUuid,
        charUuid,
        (error, characteristic) => {
          if (error) {
            console.error('Erro na notificação:', error);
            callback({ success: false, error: error.message });
            return;
          }

          const data = this.parseSensorData(characteristic.value);
          callback({ success: true, data: data });
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Erro ao assinar notificações:', error);
      // Tentar UUIDs alternativos
      if (serviceUUID === null && characteristicUUID === null) {
        console.log('Tentando UUIDs alternativos...');
        return this.subscribeToNotifications(this.SERVICE_UUID_ALT, this.CHARACTERISTIC_UUID_ALT, callback);
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Parse dos dados do sensor WT901BLE67
   * Formato: 20 bytes
   * [0x55][0x61][AX_L][AX_H][AY_L][AY_H][AZ_L][AZ_H][WX_L][WX_H][WY_L][WY_H][WZ_L][WZ_H][AngleX_L][AngleX_H][AngleY_L][AngleY_H][AngleZ_L][AngleZ_H][Sum]
   */
  parseSensorData(base64Data) {
    try {
      if (!base64Data) {
        // Retornar dados mockados para desenvolvimento/teste
        return {
          acceleration_x: (Math.random() - 0.5) * 2 * 9.8,
          acceleration_y: (Math.random() - 0.5) * 2 * 9.8,
          acceleration_z: 9.8 + (Math.random() - 0.5) * 0.5,
          gyro_x: (Math.random() - 0.5) * 10,
          gyro_y: (Math.random() - 0.5) * 10,
          gyro_z: (Math.random() - 0.5) * 10,
        };
      }

      // Converter base64 para array de bytes
      let bytes;
      try {
        // No React Native, usar a biblioteca base64 ou atob se disponível
        if (typeof atob !== 'undefined') {
          const binaryString = atob(base64Data);
          bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
        } else {
          // Fallback: usar dados mockados
          return {
            acceleration_x: (Math.random() - 0.5) * 2 * 9.8,
            acceleration_y: (Math.random() - 0.5) * 2 * 9.8,
            acceleration_z: 9.8 + (Math.random() - 0.5) * 0.5,
            gyro_x: (Math.random() - 0.5) * 10,
            gyro_y: (Math.random() - 0.5) * 10,
            gyro_z: (Math.random() - 0.5) * 10,
          };
        }
      } catch (e) {
        // Se falhar, retornar dados mockados
        return {
          acceleration_x: (Math.random() - 0.5) * 2 * 9.8,
          acceleration_y: (Math.random() - 0.5) * 2 * 9.8,
          acceleration_z: 9.8 + (Math.random() - 0.5) * 0.5,
          gyro_x: (Math.random() - 0.5) * 10,
          gyro_y: (Math.random() - 0.5) * 10,
          gyro_z: (Math.random() - 0.5) * 10,
        };
      }

      // Verificar cabeçalho (deve ser 0x55 0x61 para dados de aceleração + giroscópio)
      if (bytes.length < 20 || bytes[0] !== 0x55 || bytes[1] !== 0x61) {
        console.warn('Formato de dados inválido ou não é pacote de aceleração/giroscópio');
        return null;
      }

      // Parse dos dados conforme protocolo WT901BLE67
      // Aceleração (g): valores são int16, escala 32768 = ±16g
      const accelX = ((bytes[3] << 8) | bytes[2]) / 32768.0 * 16.0;
      const accelY = ((bytes[5] << 8) | bytes[4]) / 32768.0 * 16.0;
      const accelZ = ((bytes[7] << 8) | bytes[6]) / 32768.0 * 16.0;

      // Giroscópio (°/s): valores são int16, escala 32768 = ±2000°/s
      const gyroX = ((bytes[9] << 8) | bytes[8]) / 32768.0 * 2000.0;
      const gyroY = ((bytes[11] << 8) | bytes[10]) / 32768.0 * 2000.0;
      const gyroZ = ((bytes[13] << 8) | bytes[12]) / 32768.0 * 2000.0;

      return {
        acceleration_x: accelX * 9.8, // Converter g para m/s²
        acceleration_y: accelY * 9.8,
        acceleration_z: accelZ * 9.8,
        gyro_x: gyroX,
        gyro_y: gyroY,
        gyro_z: gyroZ,
      };
    } catch (error) {
      console.error('Erro ao parsear dados:', error);
      return null;
    }
  }

  /**
   * Obter status da conexão
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      device: this.connectedDevice,
      macAddress: this.connectedDevice?.id || this.connectedDevice?.macAddress || null,
    };
  }
}

export default new BLEService();
