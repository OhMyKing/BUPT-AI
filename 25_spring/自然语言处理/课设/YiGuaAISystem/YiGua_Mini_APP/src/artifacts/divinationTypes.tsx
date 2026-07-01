// 卦象类型
export interface HexagramLine {
    base: string;
    changing: boolean;
  }
  
  // 占卜结果
  export interface DivinationResult {
    hexagramNumber: number;
    hexagramName: string;
    lines: HexagramLine[];
    question: string;
    questionType: string;
    timestamp: number;
  }
  
  // 硬币结果类型
  export interface CoinResult {
    coins: number[]; // 3枚硬币的结果，0代表正面，1代表反面
    sum: number;     // 硬币结果的总和
    lineType: number; // 爻的类型：0=少阳，1=老阳，2=老阴，3=少阴
  }
  
  // 问题类型
  export const questionTypes = [
    { id: 'lost', label: '寻找失物', placeholder: '例：我的钱包丢失，何时能找回？' },
    { id: 'love', label: '姻缘感情', placeholder: '例：我与TA的姻缘如何？' },
    { id: 'career', label: '事业学业', placeholder: '例：近期考试运势如何？' },
    { id: 'health', label: '健康平安', placeholder: '例：家人病情走向如何？' },
    { id: 'wealth', label: '财运投资', placeholder: '例：近期投资是否合适？' },
    { id: 'travel', label: '出行平安', placeholder: '例：此次出行是否平安顺利？' },
    { id: 'decision', label: '决策选择', placeholder: '例：面对两个选择，该如何决定？' },
    { id: 'future', label: '前程运势', placeholder: '例：未来三个月运势如何？' },
    { id: 'other', label: '其他问题', placeholder: '请详细描述您的问题' }
  ];
  
  // 根据问题类型获取标签
  export const getQuestionTypeLabel = (typeId: string): string => {
    const questionType = questionTypes.find(type => type.id === typeId);
    return questionType?.label || '其他问题';
  };