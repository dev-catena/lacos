import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Svg, { G, Path, Circle, Ellipse, Polygon } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');

const OPACITY = 0.07;
const COLOR = '#16a34a';

// ----- silhuetas -----

const Duck = ({ x, y, size = 1, rotate = 0 }) => (
  <G transform={`translate(${x},${y}) rotate(${rotate}) scale(${size})`}>
    {/* corpo */}
    <Ellipse cx={0} cy={0} rx={32} ry={22} fill={COLOR} />
    {/* cabeça */}
    <Circle cx={28} cy={-24} r={16} fill={COLOR} />
    {/* bico */}
    <Ellipse cx={43} cy={-22} rx={11} ry={6} fill={COLOR} />
    {/* asa */}
    <Ellipse cx={-6} cy={-6} rx={16} ry={10} fill={COLOR} opacity={0.5} transform="rotate(-20)" />
  </G>
);

const Rabbit = ({ x, y, size = 1, rotate = 0 }) => (
  <G transform={`translate(${x},${y}) rotate(${rotate}) scale(${size})`}>
    {/* orelha esquerda */}
    <Ellipse cx={-12} cy={-62} rx={8} ry={22} fill={COLOR} />
    {/* orelha direita */}
    <Ellipse cx={12} cy={-62} rx={8} ry={22} fill={COLOR} />
    {/* cabeça */}
    <Circle cx={0} cy={-38} r={20} fill={COLOR} />
    {/* corpo */}
    <Ellipse cx={0} cy={-6} rx={24} ry={28} fill={COLOR} />
    {/* rabinho */}
    <Circle cx={22} cy={4} r={8} fill={COLOR} />
  </G>
);

const Star = ({ x, y, size = 1, rotate = 0 }) => {
  const pts = (n, outer, inner) => {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (Math.PI / n) * i - Math.PI / 2;
      pts.push(`${r * Math.cos(a)},${r * Math.sin(a)}`);
    }
    return pts.join(' ');
  };
  return (
    <G transform={`translate(${x},${y}) rotate(${rotate}) scale(${size})`}>
      <Polygon points={pts(5, 36, 15)} fill={COLOR} />
    </G>
  );
};

const Heart = ({ x, y, size = 1, rotate = 0 }) => (
  <G transform={`translate(${x},${y}) rotate(${rotate}) scale(${size})`}>
    <Path
      d="M0,28 C-36,8 -36,-22 -18,-30 C-8,-34 0,-26 0,-20 C0,-26 8,-34 18,-30 C36,-22 36,8 0,28 Z"
      fill={COLOR}
    />
  </G>
);

const Bottle = ({ x, y, size = 1, rotate = 0 }) => (
  <G transform={`translate(${x},${y}) rotate(${rotate}) scale(${size})`}>
    {/* corpo */}
    <Path d="M-14,0 Q-18,30 -16,55 L16,55 Q18,30 14,0 Z" fill={COLOR} />
    {/* pescoço */}
    <Path d="M-10,-18 L10,-18 L14,0 L-14,0 Z" fill={COLOR} />
    {/* bico */}
    <Ellipse cx={0} cy={-24} rx={8} ry={7} fill={COLOR} />
    {/* tampa */}
    <Path d="M-12,-18 Q-12,-38 0,-38 Q12,-38 12,-18 Z" fill={COLOR} />
  </G>
);

const Onesie = ({ x, y, size = 1, rotate = 0 }) => (
  <G transform={`translate(${x},${y}) rotate(${rotate}) scale(${size})`}>
    {/* corpo */}
    <Path d="M-22,0 L-22,48 Q-22,56 0,56 Q22,56 22,48 L22,0 Z" fill={COLOR} />
    {/* alças */}
    <Path d="M-22,0 L-34,-20 Q-38,-30 -26,-30 L-14,-10 Z" fill={COLOR} />
    <Path d="M22,0 L34,-20 Q38,-30 26,-30 L14,-10 Z" fill={COLOR} />
    {/* botão */}
    <Ellipse cx={0} cy={52} rx={6} ry={4} fill={COLOR} opacity={0.6} />
  </G>
);

const Bear = ({ x, y, size = 1, rotate = 0 }) => (
  <G transform={`translate(${x},${y}) rotate(${rotate}) scale(${size})`}>
    {/* orelha esquerda */}
    <Circle cx={-22} cy={-38} r={12} fill={COLOR} />
    {/* orelha direita */}
    <Circle cx={22} cy={-38} r={12} fill={COLOR} />
    {/* cabeça */}
    <Circle cx={0} cy={-24} r={26} fill={COLOR} />
    {/* focinho */}
    <Ellipse cx={0} cy={-14} rx={12} ry={8} fill={COLOR} opacity={0.5} />
    {/* corpo */}
    <Ellipse cx={0} cy={18} rx={28} ry={32} fill={COLOR} />
    {/* braço esq */}
    <Ellipse cx={-34} cy={10} rx={10} ry={20} fill={COLOR} transform="rotate(-20,-34,10)" />
    {/* braço dir */}
    <Ellipse cx={34} cy={10} rx={10} ry={20} fill={COLOR} transform="rotate(20,34,10)" />
  </G>
);

// ----- layout fixo de elementos espalhados pela tela -----
const ELEMENTS = [
  { type: 'duck',    x: W * 0.08,  y: H * 0.06,  size: 0.65, rotate: -15 },
  { type: 'star',    x: W * 0.82,  y: H * 0.04,  size: 0.9,  rotate: 20  },
  { type: 'rabbit',  x: W * 0.88,  y: H * 0.22,  size: 0.55, rotate: 10  },
  { type: 'heart',   x: W * 0.12,  y: H * 0.35,  size: 0.7,  rotate: -8  },
  { type: 'bottle',  x: W * 0.76,  y: H * 0.45,  size: 0.6,  rotate: 15  },
  { type: 'onesie',  x: W * 0.15,  y: H * 0.62,  size: 0.6,  rotate: -10 },
  { type: 'star',    x: W * 0.55,  y: H * 0.70,  size: 0.55, rotate: -25 },
  { type: 'bear',    x: W * 0.82,  y: H * 0.73,  size: 0.5,  rotate: 8   },
  { type: 'duck',    x: W * 0.42,  y: H * 0.88,  size: 0.5,  rotate: 12  },
  { type: 'heart',   x: W * 0.06,  y: H * 0.88,  size: 0.5,  rotate: 5   },
];

const renderEl = (el, i) => {
  const props = { key: i, x: el.x, y: el.y, size: el.size, rotate: el.rotate };
  switch (el.type) {
    case 'duck':   return <Duck   {...props} />;
    case 'rabbit': return <Rabbit {...props} />;
    case 'star':   return <Star   {...props} />;
    case 'heart':  return <Heart  {...props} />;
    case 'bottle': return <Bottle {...props} />;
    case 'onesie': return <Onesie {...props} />;
    case 'bear':   return <Bear   {...props} />;
    default:       return null;
  }
};

const KidsBackground = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width={W} height={H} opacity={OPACITY}>
      {ELEMENTS.map(renderEl)}
    </Svg>
  </View>
);

export default KidsBackground;
