/**
 * Classificador de postura baseado em dados IMU (acelerômetro + giroscópio)
 * Usa thresholds e análise de padrões para classificar posturas
 */

class PostureClassifier {
  // Thresholds para classificação (em m/s²)
  static GRAVITY = 9.8;
  static FALL_THRESHOLD = 2.0 * this.GRAVITY; // 2g para detectar queda
  static LYING_THRESHOLD = 0.5 * this.GRAVITY; // 0.5g para detectar deitado
  static SITTING_THRESHOLD = 0.7; // Threshold para inclinação sentado

  /**
   * Calcular magnitude da aceleração
   */
  static calculateMagnitude(accelX, accelY, accelZ) {
    return Math.sqrt(accelX * accelX + accelY * accelY + accelZ * accelZ);
  }

  /**
   * Calcular inclinação baseada nos eixos
   */
  static calculateTilt(accelX, accelY, accelZ) {
    const magnitude = this.calculateMagnitude(accelX, accelY, accelZ);
    if (magnitude === 0) return { pitch: 0, roll: 0 };

    const pitch = Math.asin(-accelX / magnitude) * (180 / Math.PI);
    const roll = Math.atan2(accelY, accelZ) * (180 / Math.PI);

    return { pitch, roll };
  }

  /**
   * Detectar queda baseado em magnitude alta seguida de mudança brusca
   */
  static detectFall(accelX, accelY, accelZ, gyroX, gyroY, gyroZ, previousMagnitude = null) {
    const magnitude = this.calculateMagnitude(accelX, accelY, accelZ);
    const gyroMagnitude = Math.sqrt(gyroX * gyroX + gyroY * gyroY + gyroZ * gyroZ);

    // Detectar queda: magnitude alta (>2g) OU mudança brusca na magnitude
    const isHighAcceleration = magnitude > this.FALL_THRESHOLD;
    const isHighGyro = gyroMagnitude > 5.0; // Rotação rápida
    const isSuddenChange = previousMagnitude && Math.abs(magnitude - previousMagnitude) > 1.5 * this.GRAVITY;

    return isHighAcceleration || (isHighGyro && isSuddenChange);
  }

  /**
   * Classificar postura baseado em dados IMU
   */
  static classifyPosture(accelX, accelY, accelZ, gyroX, gyroY, gyroZ, previousMagnitude = null) {
    const magnitude = this.calculateMagnitude(accelX, accelY, accelZ);
    const { pitch, roll } = this.calculateTilt(accelX, accelY, accelZ);

    // Primeiro verificar se é queda
    if (this.detectFall(accelX, accelY, accelZ, gyroX, gyroY, gyroZ, previousMagnitude)) {
      return {
        posture: 'fall',
        confidence: 0.85,
        magnitude,
      };
    }

    // Verificar se está deitado (magnitude baixa, próximo de 0g ou 1g)
    const isLying = magnitude < this.LYING_THRESHOLD || (magnitude > 0.8 * this.GRAVITY && magnitude < 1.2 * this.GRAVITY);

    if (isLying) {
      // Classificar tipo de decúbito baseado em pitch e roll
      if (Math.abs(pitch) < 30 && Math.abs(roll) < 30) {
        // Decúbito dorsal (deitado de costas)
        if (accelZ > 0) {
          return {
            posture: 'lying_dorsal',
            confidence: 0.80,
            magnitude,
          };
        } else {
          // Decúbito ventral (deitado de bruços)
          return {
            posture: 'lying_ventral',
            confidence: 0.80,
            magnitude,
          };
        }
      } else if (Math.abs(roll) > 45) {
        // Decúbito lateral
        if (roll > 0) {
          return {
            posture: 'lying_lateral_right',
            confidence: 0.75,
            magnitude,
          };
        } else {
          return {
            posture: 'lying_lateral_left',
            confidence: 0.75,
            magnitude,
          };
        }
      } else {
        // Decúbito dorsal como padrão
        return {
          posture: 'lying_dorsal',
          confidence: 0.70,
          magnitude,
        };
      }
    }

    // Verificar se está sentado (inclinação média, magnitude ~1g)
    if (magnitude > 0.9 * this.GRAVITY && magnitude < 1.1 * this.GRAVITY) {
      if (Math.abs(pitch) > 20 && Math.abs(pitch) < 80) {
        return {
          posture: 'sitting',
          confidence: 0.75,
          magnitude,
        };
      }
    }

    // Em pé (magnitude ~1g, inclinação baixa)
    if (magnitude > 0.9 * this.GRAVITY && magnitude < 1.1 * this.GRAVITY) {
      if (Math.abs(pitch) < 20 && Math.abs(roll) < 20) {
        return {
          posture: 'standing',
          confidence: 0.80,
          magnitude,
        };
      }
    }

    // Fallback: tentar classificar baseado em inclinação
    if (Math.abs(pitch) < 30 && Math.abs(roll) < 30) {
      return {
        posture: 'standing',
        confidence: 0.60,
        magnitude,
      };
    } else if (Math.abs(pitch) > 60) {
      return {
        posture: 'sitting',
        confidence: 0.60,
        magnitude,
      };
    } else {
      return {
        posture: 'lying_dorsal',
        confidence: 0.50,
        magnitude,
      };
    }
  }

  /**
   * Obter nome da postura em português
   */
  static getPostureName(posture) {
    const names = {
      'standing': 'Em Pé',
      'sitting': 'Sentado',
      'lying_ventral': 'Deitado - Decúbito Ventral',
      'lying_dorsal': 'Deitado - Decúbito Dorsal',
      'lying_lateral_right': 'Deitado - Decúbito Lateral Direito',
      'lying_lateral_left': 'Deitado - Decúbito Lateral Esquerdo',
      'fall': 'Queda Detectada',
    };

    return names[posture] || posture;
  }
}

export default PostureClassifier;

