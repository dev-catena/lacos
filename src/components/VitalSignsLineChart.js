import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Polyline, Circle, Text as SvgText, G } from 'react-native-svg';
import colors from '../constants/colors';
import moment from 'moment';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Ajustar largura do gráfico para deixar espaço para os valores em destaque
// Considerando padding da tela (40) + espaço para valores (140) = 180
const CHART_WIDTH = SCREEN_WIDTH - 180; // Mais espaço para valores em destaque
const CHART_HEIGHT = 180;
const PADDING = 20;

const VitalSignsLineChart = ({ 
  data = [], 
  basalValue = null, 
  unit = '', 
  color = colors.primary,
  label = '' 
}) => {
  if (!data || data.length === 0) {
    console.log('📈 VitalSignsLineChart - Sem dados para renderizar');
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyText}>Nenhum dado disponível</Text>
      </View>
    );
  }

  console.log(`📈 VitalSignsLineChart - Renderizando ${data.length} pontos de dados para ${label}`);
  
  // Pegar apenas as últimas 20 medidas
  const recentData = data.slice(-20);
  
  // Calcular valores min e max para escala
  const values = recentData.map(d => {
    let rawValue = d.value;
    
    // Se value é array (formato do banco), pegar primeiro elemento
    if (Array.isArray(rawValue) && rawValue.length > 0) {
      rawValue = rawValue[0];
    }
    
    if (typeof rawValue === 'object' && rawValue !== null && !Array.isArray(rawValue)) {
      // Para pressão arterial, usar média de sistólica e diastólica
      if (rawValue.systolic && rawValue.diastolic) {
        return (rawValue.systolic + rawValue.diastolic) / 2;
      }
      // Se for array dentro do objeto, pegar primeiro
      if (Array.isArray(rawValue) && rawValue.length > 0) {
        return parseFloat(rawValue[0]) || 0;
      }
    }
    return parseFloat(rawValue) || 0;
  });

  const minValue = Math.min(...values, basalValue || 0) * 0.9;
  const maxValue = Math.max(...values, basalValue || 0) * 1.1;
  const valueRange = maxValue - minValue || 1;

  // Calcular posições dos pontos
  const points = recentData.map((item, index) => {
    let value;
    let rawValue = item.value;
    
    // Se value é array (formato do banco), pegar primeiro elemento
    if (Array.isArray(rawValue) && rawValue.length > 0) {
      rawValue = rawValue[0];
    }
    
    if (typeof rawValue === 'object' && rawValue !== null && !Array.isArray(rawValue)) {
      // Objeto com systolic/diastolic
      if (rawValue.systolic && rawValue.diastolic) {
        value = (rawValue.systolic + rawValue.diastolic) / 2;
      } else if (Array.isArray(rawValue) && rawValue.length > 0) {
        value = parseFloat(rawValue[0]) || 0;
      } else {
        value = parseFloat(rawValue) || 0;
      }
    } else {
      value = parseFloat(rawValue) || 0;
    }

    const x = PADDING + (index / (recentData.length - 1 || 1)) * (CHART_WIDTH - PADDING * 2);
    const y = CHART_HEIGHT - PADDING - ((value - minValue) / valueRange) * (CHART_HEIGHT - PADDING * 2);
    
    return { x, y, value, item };
  });

  // Último valor (último da lista, pois está ordenado do mais antigo para o mais recente)
  const lastValue = recentData[recentData.length - 1];
  let lastValueDisplay = '';
  if (lastValue) {
    let rawValue = lastValue.value;
    
    // Se value é array, pegar primeiro elemento
    if (Array.isArray(rawValue) && rawValue.length > 0) {
      rawValue = rawValue[0];
    }
    
    if (typeof rawValue === 'object' && rawValue !== null && !Array.isArray(rawValue)) {
      if (rawValue.systolic && rawValue.diastolic) {
        lastValueDisplay = `${rawValue.systolic}/${rawValue.diastolic}`;
      } else {
        lastValueDisplay = parseFloat(rawValue || 0).toFixed(1);
      }
    } else {
      lastValueDisplay = parseFloat(rawValue || 0).toFixed(1);
    }
  }

  // Calcular basal (média de todas as medidas)
  const calculatedBasal = basalValue || (values.reduce((a, b) => a + b, 0) / values.length);
  const basalY = CHART_HEIGHT - PADDING - ((calculatedBasal - minValue) / valueRange) * (CHART_HEIGHT - PADDING * 2);

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 40} style={styles.svg}>
        {/* Linha de basal */}
        {basalValue !== null && (
          <G>
            <Line
              x1={PADDING}
              y1={basalY}
              x2={CHART_WIDTH - PADDING - 50}
              y2={basalY}
              stroke={colors.warning}
              strokeWidth={2}
              strokeDasharray="5,5"
            />
            <SvgText
              x={CHART_WIDTH - PADDING - 45}
              y={basalY + 5}
              fontSize="11"
              fill={colors.warning}
              fontWeight="600"
            >
              Basal
            </SvgText>
          </G>
        )}

        {/* Linha do gráfico */}
        {points.length > 1 && (
          <Polyline
            points={points.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={color}
            strokeWidth={2}
          />
        )}

        {/* Pontos */}
        {points.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={color}
            stroke={colors.white}
            strokeWidth={2}
          />
        ))}

        {/* Eixos */}
        <Line
          x1={PADDING}
          y1={PADDING}
          x2={PADDING}
          y2={CHART_HEIGHT - PADDING}
          stroke={colors.border}
          strokeWidth={1}
        />
        <Line
          x1={PADDING}
          y1={CHART_HEIGHT - PADDING}
          x2={CHART_WIDTH - PADDING}
          y2={CHART_HEIGHT - PADDING}
          stroke={colors.border}
          strokeWidth={1}
        />
      </Svg>
      </View>

      {/* Valores em destaque ao lado direito */}
      <View style={styles.valuesContainer}>
        <View style={[styles.valueCard, { borderLeftColor: colors.warning }]}>
          <Text style={styles.valueCardLabel}>Basal</Text>
          <Text style={[styles.valueCardValue, { color: colors.warning }]}>
            {typeof calculatedBasal === 'number' ? calculatedBasal.toFixed(1) : calculatedBasal}
          </Text>
          <Text style={styles.valueCardUnit}>{unit}</Text>
        </View>
        <View style={[styles.valueCard, { borderLeftColor: color }]}>
          <Text style={styles.valueCardLabel}>Último</Text>
          <Text style={[styles.valueCardValue, { color: color }]}>
            {lastValueDisplay}
          </Text>
          <Text style={styles.valueCardUnit}>{unit}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  chartWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  svg: {
    maxWidth: '100%',
  },
  emptyChart: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
  },
  valuesContainer: {
    marginLeft: 12,
    gap: 12,
    width: 120,
    flexShrink: 0,
  },
  valueCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    minWidth: 100,
  },
  valueCardLabel: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  valueCardValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  valueCardUnit: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: '500',
  },
});

export default VitalSignsLineChart;

