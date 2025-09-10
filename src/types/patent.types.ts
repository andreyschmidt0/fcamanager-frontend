// Interface para as patentes do Combat Arms
export interface Patent {
  gradeLevel: number;
  name: string;
}

// Função helper para gerar o iconUrl baseado no gradeLevel
const getPatentIconUrl = (gradeLevel: number): string => {
  return `/imagens_patentes/patente_${gradeLevel + 1}.gif`;
};

// Mapeamento completo das patentes do Combat Arms com dados oficiais
export const COMBAT_ARMS_PATENTS: Patent[] = [
  {
    gradeLevel: 0,
    name: "CADETE",
  },
  {
    gradeLevel: 1,
    name: "RECRUTA",
  },
  {
    gradeLevel: 2,
    name: "SOLDADO RASO",
  },
  {
    gradeLevel: 3,
    name: "SOLDADO DE PRIMEIRA CLASSE",
  },
  {
    gradeLevel: 4,
    name: "CABO",
  },
  {
    gradeLevel: 5,
    name: "SARGENTO",
  },
  {
    gradeLevel: 6,
    name: "1º SARGENTO-AJUDANTE",
  },
  {
    gradeLevel: 7,
    name: "2º SARGENTO-AJUDANTE",
  },
  {
    gradeLevel: 8,
    name: "3º SARGENTO-AJUDANTE",
  },
  {
    gradeLevel: 9,
    name: "1º SARGENTO-CHEFE",
  },
  {
    gradeLevel: 10,
    name: "2º SARGENTO-CHEFE",
  },
  {
    gradeLevel: 11,
    name: "3º SARGENTO-CHEFE",
  },
  {
    gradeLevel: 12,
    name: "1º SARGENTO-MESTRE",
  },
  {
    gradeLevel: 13,
    name: "2º SARGENTO-MESTRE",
  },
  {
    gradeLevel: 14,
    name: "3º SARGENTO-MESTRE",
  },
  {
    gradeLevel: 15,
    name: "4º SARGENTO-MESTRE",
  },
  {
    gradeLevel: 16,
    name: "1º SARGENTO-MOR DO COMANDO",
  },
  {
    gradeLevel: 17,
    name: "2º SARGENTO-MOR DO COMANDO",
  },
  {
    gradeLevel: 18,
    name: "3º SARGENTO-MOR DO COMANDO",
  },
  {
    gradeLevel: 19,
    name: "4º SARGENTO-MOR DO COMANDO",
  },
  {
    gradeLevel: 20,
    name: "5º SARGENTO-MOR DO COMANDO",
  },
  {
    gradeLevel: 21,
    name: "1º SEGUNDO-TENENTE",
  },
  {
    gradeLevel: 22,
    name: "2º SEGUNDO-TENENTE",
  },
  {
    gradeLevel: 23,
    name: "3º SEGUNDO-TENENTE",
  },
  {
    gradeLevel: 24,
    name: "4º SEGUNDO-TENENTE",
  },
  {
    gradeLevel: 25,
    name: "5º SEGUNDO-TENENTE",
  },
  {
    gradeLevel: 26,
    name: "1º PRIMEIRO-TENENTE",
  },
  {
    gradeLevel: 27,
    name: "2º PRIMEIRO-TENENTE",
  },
  {
    gradeLevel: 28,
    name: "3º PRIMEIRO-TENENTE",
  },
  {
    gradeLevel: 29,
    name: "4º PRIMEIRO-TENENTE",
  },
  {
    gradeLevel: 30,
    name: "5º PRIMEIRO-TENENTE",
  },
  {
    gradeLevel: 31,
    name: "1º CAPITÃO",
  },
  {
    gradeLevel: 32,
    name: "2º CAPITÃO",
  },
  {
    gradeLevel: 33,
    name: "3º CAPITÃO",
  },
  {
    gradeLevel: 34,
    name: "4º CAPITÃO",
  },
  {
    gradeLevel: 35,
    name: "5º CAPITÃO",
  },
  {
    gradeLevel: 36,
    name: "1º MAJOR",
  },
  {
    gradeLevel: 37,
    name: "2º MAJOR",
  },
  {
    gradeLevel: 38,
    name: "3º MAJOR",
  },
  {
    gradeLevel: 39,
    name: "4º MAJOR",
  },
  {
    gradeLevel: 40,
    name: "5º MAJOR",
  },
  {
    gradeLevel: 41,
    name: "1º TENENTE-CORONEL",
  },
  {
    gradeLevel: 42,
    name: "2º TENENTE-CORONEL",
  },
  {
    gradeLevel: 43,
    name: "3º TENENTE-CORONEL",
  },
  {
    gradeLevel: 44,
    name: "4º TENENTE-CORONEL",
  },
  {
    gradeLevel: 45,
    name: "5º TENENTE-CORONEL",
  },
  {
    gradeLevel: 46,
    name: "1º CORONEL",
  },
  {
    gradeLevel: 47,
    name: "2º CORONEL",
  },
  {
    gradeLevel: 48,
    name: "3º CORONEL",
  },
  {
    gradeLevel: 49,
    name: "4º CORONEL",
  },
  {
    gradeLevel: 50,
    name: "5º CORONEL",
  },
  {
    gradeLevel: 51,
    name: "GENERAL DE BRIGADA",
  },
  {
    gradeLevel: 52,
    name: "GENERAL DE DIVISÃO",
  },
  {
    gradeLevel: 53,
    name: "TENENTE-GENERAL",
  },
  {
    gradeLevel: 54,
    name: "GENERAL",
  },
  {
    gradeLevel: 55,
    name: "GENERAL DO EXÉRCITO",
  }
];

// Função helper para buscar patente por gradeLevel
export const getPatentByGradeLevel = (gradeLevel: number): Patent | undefined => {
  return COMBAT_ARMS_PATENTS.find(patent => patent.gradeLevel === gradeLevel);
};

// Função helper para gerar URL do ícone da patente
export const getPatentIcon = (gradeLevel: number): string => {
  return getPatentIconUrl(gradeLevel);
};