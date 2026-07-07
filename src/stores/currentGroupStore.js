/**
 * Mini-store que guarda o tipo do grupo atualmente aberto.
 * Setado pelo GroupDetailScreen ao carregar; lido por qualquer tela de módulo.
 */
let _groupType = 'care';

export const setCurrentGroupType = (type) => {
  _groupType = type || 'care';
};

export const getCurrentGroupType = () => _groupType;

export const isKidsGroup = () => _groupType === 'kids';
